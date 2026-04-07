import sendOtp from "../config/mailer.js";
import { createUsers, findUser, insertOtp } from "../models/user.models.js";
import generateToken from "../services/token.services.js";
import { generateOtp } from "../utils/generate-otp.js";
import { hashCompare, hash } from "../utils/hash.js";
import db from "../config/db.js";

const userSignup = (req, res) => {
  const { email, phoneNumber } = req.body;

  const insertion = createUsers(email, phoneNumber);
  if (insertion) {
    res.json({ message: "hello i m activated" });
  }
};

const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const [users] = await db.query("select * from users where email = ?", [
      email,
    ]);
    console.log("users are what", users);

    if (!users.length) {
      return res.status(404).json({ message: "User not registered" });
    }

    const otp = generateOtp();
    console.log("otp generated", otp);
    const otpHash = await hash(otp);
    const expireAt = new Date(Date.now() + 5 * 60 * 1000);

    await insertOtp(email, otpHash, expireAt);
    await sendOtp(email, "Login OTP", otp);

    return res.status(200).json({
      success: true,
      status: 200,
      message: "OTP sent successfully",
      data: {
        expiresIn: 300,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

const sendOtpSignupEMail = async (req, res) => {
  const { email } = req.body;
  const [users] = await findUser(email);
  if (users?.length) {
    res.status(400).json({ message: "User is already registered" });
  }
  const otpGen = generateOtp();
  console.log("otpgen", otpGen);
  const otpHash = await hash(otpGen);

  const expireAt = new Date(Date.now() + 5 * 60 * 1000);
  const data = await insertOtp(email, otpHash, expireAt);
  if (data) {
    sendOtp(email, "Your code is", otpGen);
    res.status(200).json({ message: "mail has been sended" });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, phoneNumber } = req.body;
    console.log("ejmail is", email);
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
    console.log("isvalid or not", isValid);

    if (!isValid) {
      res.status(400).json({ message: "OTP is Invalid" });
    }

    const [usersData] = await db.query("select * from users where email = ?", [
      email,
    ]);
    let user;
    if (!usersData.length) {
      const [result] = await db.query(
        "insert into users (email,isVerified,phone_number) values(?,?,?)",
        [email, true, phoneNumber],
      );
      user = {
        id: result.insertId,
        email,
      };
    } else {
      user = usersData[0];
    }

    await db.query("delete from email_otps where id = ?", [otpRecord.id]);

    console.log("rows are waht", rows);
    console.log("user generate what", user);

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

export { userSignup, verifyOtp, sendOtpSignupEMail, sendLoginOtp };
