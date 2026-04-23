import db from "../config/db.js";

const createUsers = async (email, isVerified, phoneNumber, password) => {
  const [result] = await db.query(
    "insert into users (email,isVerified,phone_number,password) values (?,?,?,?)",
    [email, isVerified, phoneNumber, password],
  );

  return result.insertId;
};

const insertOtp = async (email, otp_hash, expires_at) => {
  const [result] = await db.query(
    "insert into email_otps (email,otp_hash,expires_at) values(?,?,?)",
    [email, otp_hash, expires_at],
  );

  return result.insertId;
};

const findUser = async (email) => {
  const [result] = await db.query("select * from users where email = ?", [
    email,
  ]);

  return result;
};

export { createUsers, insertOtp, findUser };
