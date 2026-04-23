import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();
export const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

const sendOtp = async (to, subject, text) => {
  if (!to) {
    throw new Error("Recipient email is missing");
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.USER_EMAIL,
      to,
      subject,
      text,
    });

    return info;
  } catch (err) {
    console.log("Hi");
    console.error(err);
  }
};

export default sendOtp;
