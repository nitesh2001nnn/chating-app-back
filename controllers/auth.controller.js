import sendOtp from "../config/mailer.js";
import { createUsers, findUser, insertOtp } from "../models/user.models.js";
import generateToken from "../services/token.services.js";
import { generateOtp } from "../utils/generate-otp.js";
import { hashCompare, hash } from "../utils/hash.js";
import db from "../config/db.js";
import bcrypt from "bcrypt";

const userSignup = async (req, res) => {
  const { email, phoneNumber, password } = req.body;
  console.log("pass", password);
  const genSalt = await bcrypt.genSalt(10);
  const bcryptPass = await bcrypt.hash(password, genSalt);

  const insertion = createUsers(email, false, phoneNumber, bcryptPass);
  if (insertion) {
    const result = await sendLoginOtp(email);
  }

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
};

const login = async (req, res) => {
  const { email, password } = req.body;

  const [users] = await db.query("select * from users where email = ?", [
    email,
  ]);

  if (!users.length) {
    return res.status(404).json({ message: "User not registered" });
  }

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
        },
      });
    }
  } catch (err) {
    res.status(400).json({ message: result.message });
  }
};

const sendLoginOtp = async (email) => {
  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await db.query("select * from users where email = ?", [
      email,
    ]);

    if (!users.length) {
      return res.status(404).json({ message: "User not registered" });
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

    const [rows] = await db.query(
      "select * from  email_otps where email = ? order by created_at desc limit 1",
      [email],
    );

    if (!rows.length) {
      res.status(401).json({ message: "User not found" });
    }

    const otpRecord = rows[0];

    if (new Date() > new Date(otpRecord.expire_at)) {
      await db.query("delete from email_otps where id = ?", [otpRecord.id]);
      res.status(401).json({ message: "OTP is Expired" });
    }

    const isValid = await hashCompare(otp.toString(), otpRecord.otp_hash);

    if (!isValid) {
      res.status(400).json({ message: "OTP is Invalid" });
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
    await res.json({
      success: true,
      status: 200,
      token,
      userID: user.id,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export { userSignup, verifyOtp, sendLoginOtp, login };
