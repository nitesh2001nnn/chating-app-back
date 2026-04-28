import sendOtp from "../config/mailer.js";
import {
  createUsers,
  findUser,
  getAuthAttempt,
  insertOtp,
  resetAuthAttempts,
  updateUser,
  upsertAuthAttempt,
} from "../models/user.models.js";
import generateToken from "../services/token.services.js";
import { generateOtp } from "../utils/generate-otp.js";
import { hashCompare, hash } from "../utils/hash.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";

let window_time = 6 * 60 * 1000;
let Max_Attempts = 3;

const userSignup = async (req, res) => {
  const { email, phoneNumber, password } = req.body;
  const genSalt = await bcrypt.genSalt(10);
  const bcryptPass = await bcrypt.hash(password, genSalt);

  const insertion = createUsers(email, false, phoneNumber, bcryptPass);
  if (insertion) {
    const result = await sendLoginOtp(email);
    try {
      if (result.expiresIn) {
        res.status(200).json({
          success: true,
          status: 200,
          message: "OTP sent successfully",
          data: {
            expiresIn: result.expiresIn,
          },
        });
      }
    } catch (err) {
      res.status(400).json({ message: result.message });
    }
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
    email,
  ]);

  if (!users.length) {
    return res.status(404).json({
      message: "User not registered",
    });
  }

  const user = users[0];
  const id = user.id;

  const now = new Date();

  const auth = await getAuthAttempt(id, "login");

  let attempt = auth?.attempts || 0;

  if (auth?.lock_until && now < new Date(auth.lock_until)) {
    return res.status(429).json({
      message: `Too many attempts. Account locked`,
      time_left: auth.lock_until,
      isLocked: true,
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    let lastAttempt = auth?.last_attempt ? new Date(auth.last_attempt) : null;

    if (!lastAttempt || now - lastAttempt > window_time) {
      attempt = 0;
    }

    attempt++;

    let lockUntil = null;

    if (attempt >= Max_Attempts) {
      lockUntil = new Date(now.getTime() + 5 * 60 * 1000);
      attempt = 0;
    }

    await upsertAuthAttempt(id, "login", attempt, now, lockUntil);

    return res.status(400).json({
      message: lockUntil
        ? "Too many attempts. Locked for 5 minutes"
        : `Invalid password. ${Max_Attempts - attempt} attempts left`,
    });
  }

  await resetAuthAttempts(id, "login");

  const result = await sendLoginOtp(email);

  return res.status(200).json({
    success: true,
    message: "OTP sent successfully",
    data: {
      expiresIn: result.expiresIn,
      limit_remaining: Max_Attempts - attempt,
    },
  });
};

const sendLoginOtp = async (email) => {
  try {
    const now = new Date();
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const otp = generateOtp();
    console.log("otp generated", otp);
    const otpHash = await hash(otp);
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);

    await insertOtp(email, otpHash, expireAt);
    await sendOtp(email, "Login OTP", otp);

    return { expiresIn: 300 };
  } catch (err) {
    console.error(err);
    return { message: "failed to send" };
  }
};

const resendOtp = async (req, res) => {
  try {
    const now = new Date();
    const { email } = req.body;
    const users = await findUser(email);
    const user = users[0];
    const auth = await getAuthAttempt(user.id, "send_otp");
    let attempt = auth?.attempts || 0;

    if (auth?.lock_until && now < new Date(auth.lock_until)) {
      return res.status(429).json({
        message: `Too many attempts locked until ${auth.lock_until}`,
        time_left: auth.lock_until,
        isLocked: true,
      });
    }

    let lastAttempt = auth?.last_attempt ? new Date(auth.last_attempt) : null;

    if (!lastAttempt || now - lastAttempt > window_time) {
      attempt = 0;
    }

    attempt++;

    let lockUntil = null;

    if (attempt >= Max_Attempts) {
      lockUntil = new Date(now.getTime() + 5 * 60 * 1000);

      attempt = 0;

      await upsertAuthAttempt(user.id, "send_otp", attempt, now, lockUntil);

      return res.status(429).json({
        message: "Too many resend attempts. Locked for 5 mins",
        time_left: lockUntil,
        isLocked: true,
      });
    }

    await upsertAuthAttempt(user.id, "send_otp", attempt, now, null);

    const result = await sendLoginOtp(email);

    return res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      expiresIn: result.expiresIn,
      attempts_left: Max_Attempts - attempt,
    });
  } catch (err) {
    console.error(err);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const users = await findUser(email);

    if (!users.length) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const user = users[0];

    const now = new Date();

    let auth = await getAuthAttempt(user.id, "verify_otp");

    let attempt = auth?.attempts || 0;

    if (auth?.lock_until && now < new Date(auth.lock_until)) {
      return res.status(429).json({
        message: `Too many attempts locked until ${auth.lock_until}`,
        time_left: auth.lock_until,
        isLocked: true,
      });
    }

    const [rows] = await db.query(
      `SELECT * FROM email_otps 
       WHERE email = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [email],
    );

    if (!rows.length) {
      return res.status(401).json({
        message: "OTP not found",
      });
    }

    const otpRecord = rows[0];

    if (now > new Date(otpRecord.expire_at)) {
      await db.query("DELETE FROM email_otps WHERE id = ?", [otpRecord.id]);

      return res.status(401).json({
        message: "OTP expired",
      });
    }

    const isValid = await hashCompare(otp.toString(), otpRecord.otp_hash);

    if (!isValid) {
      let lastAttempt = auth?.last_attempt ? new Date(auth.last_attempt) : null;

      if (!lastAttempt || now - lastAttempt > window_time) {
        attempt = 0;
      }

      attempt++;

      let lockUntil = null;

      if (attempt >= Max_Attempts) {
        lockUntil = new Date(now.getTime() + 5 * 60 * 1000);

        attempt = 0;
      }

      await upsertAuthAttempt(user.id, "verify_otp", attempt, now, lockUntil);

      return res.status(400).json({
        message: lockUntil
          ? "Too many attempts. Locked for 5 mins"
          : `Invalid OTP. ${Max_Attempts - attempt} attempts left`,
      });
    }

    await resetAuthAttempts(user.id, "verify_otp");

    if (!user.isVerified) {
      await db.query(
        `UPDATE users 
         SET isVerified = true 
         WHERE email = ?`,
        [email],
      );
    }

    await db.query("DELETE FROM email_otps WHERE id = ?", [otpRecord.id]);

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      token,
      userID: user.id,
      verify_attempts_remaining: Max_Attempts - attempt,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export { userSignup, verifyOtp, sendLoginOtp, login, resendOtp };
