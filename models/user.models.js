import db from "../config/db.js";

const createUsers = async (email, isVerified, phoneNumber) => {
  const [result] = await db.query(
    "insert into users (email,isVerified,phoneNumber) values (?,?,?)",
    [email, isVerified, phoneNumber],
  );

  return result.insertId;
};

const insertOtp = async (email, otp_hash, expires_at) => {
  const [result] = await db.query(
    "insert into email_otps (email,otp_hash,expires_at) values(?,?,?)",
    [email, otp_hash, expires_at],
  );
  console.log("result is wht", result);
  return result.insertId;
};

const findUser = async (email) => {
  const [result] = await db.query("select * from users where email = ?", [
    email,
  ]);
  console.log("result", result, email);
  return result;
};



export { createUsers, insertOtp, findUser };
