import sendOtp from "../config/mailer.js";
import {
  createUsers,
  findUser,
  insertOtp,
  updateUser,
} from "../models/user.models.js";
import generateToken from "../services/token.services.js";
import { generateOtp } from "../utils/generate-otp.js";
import { hashCompare, hash } from "../utils/hash.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";

let window_time = 6 * 60 * 1000;
const userSignup = async (req, res) => {
  const { email, phoneNumber, password } = req.body;
  console.log("pass", password);
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

  const [users] = await db.query("select * from users where email = ?", [
    email,
  ]);

  if (!users.length) {
    return res.status(404).json({ message: "User not registered" });
  }

  console.log("user getitng wh", users);

  //user is locked
  if (users.otp_lock_until && now < new Date(users.otp_lock_until)) {
    res.status(500).json({
      message: `Too Many attempts locked for ${users.otp_lock_until}`,
      time_left: users.otp_lock_until,
      isLocked: true,
    });
  }

  let lastAttempts = users.otp_last_attempt
    ? new Date(users.otp_last_attempts)
    : null;
  let attempts = users.otp_attempts;

  if (!lastAttempts || now - lastAttempts > window_time) {
    attempts = 0;
  }

  attempts += 1;

  let lockUntill = null;

  if (attempts > 3) {
    lockUntill = new Date(now.getTime + 5 * 60 * 1000);
  }

  await updateUser(users.email, {
    otp_attempts: attempts,
    otp_last_attempt: now,
    otp_lock_untill: lockUntill,
  });

  const isMatch = await bcrypt.compare(password, users[0].password);

  if (!isMatch) {
    return res.status(400).json({ message: "Invalid Password!!" });
  }
  const result = await sendLoginOtp(email);

  try {
    if (result.expiresIn) {
      res.status(200).json({
        success: true,
        status: 200,
        message: "OTP sent successfully",
        data: {
          expiresIn: result.expiresIn,
          limit_remaining: 3 - attempts,
        },
      });
    }
  } catch (err) {
    res.status(400).json({ message: result.message });
  }
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

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const [users] = await findUser(email);
    console.log("users", users);
    const now = new Date();

    if (users.verify_lock_until && now < new Date(users.verify_lock_until)) {
      return res.status(500).json({
        message: `Too Many attempts locked for ${users.verify_lock_until}`,
        time_left: users.verify_lock_until,
        isLocked: true,
      });
    }

    let attempts = users.verify_attempts;
    let lastAttempts = users.verify_last_attempt
      ? new Date(users.verify_last_attempt)
      : null;

    if (!lastAttempts || now - lastAttempts > window_time) {
      attempts = 0;
    }
    attempts += 1;

    let lockUntill = null;

    if (attempts > 3) {
      lockUntill = new Date(now.getTime + 5 * 60 * 1000);
    }

    await updateUser(users.email, {
      verify_attempts: attempts,
      verify_last_attempt: now,
      verify_lock_until: lockUntill,
    });

    const [rows] = await db.query(
      "select * from  email_otps where email = ? order by created_at desc limit 1",
      [email],
    );

    if (!rows.length) {
      return res.status(401).json({ message: "User not found" });
    }

    const otpRecord = rows[0];

    if (new Date() > new Date(otpRecord.expire_at)) {
      await db.query("delete from email_otps where id = ?", [otpRecord.id]);
      return res.status(401).json({ message: "OTP is Expired" });
    }

    const isValid = await hashCompare(otp.toString(), otpRecord.otp_hash);

    if (!isValid) {
      return res.status(400).json({ message: "OTP is Invalid" });
    }

    const [usersData] = await db.query("select * from users where email = ?", [
      email,
    ]);
    let user;
    if (!usersData.isVerified) {
      const [result] = await db.query(
        "update users set isVerified = true where email =? ",
        [email],
      );
      user = {
        id: result.insertId,
        email,
      };
    } else {
      user = usersData[0];
    }

    await db.query("delete from email_otps where id = ?", [otpRecord.id]);
    const token = generateToken(user);
    return res.json({
      success: true,
      status: 200,
      token,
      userID: user.id,
      verify_attempts: 3 - attempts,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { userSignup, verifyOtp, sendLoginOtp, login };
