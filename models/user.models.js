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

const updateUser = async (email, fields) => {
  const keys = Object.keys(fields);

  const setClause = keys.map((key) => `${key} = ?`).join(", ");
  const values = keys.map((key) => fields[key]);

  const query = `
    UPDATE users 
    SET ${setClause} 
    WHERE email = ?
  `;

  await db.execute(query, [...values, email]);
};

export { createUsers, insertOtp, findUser, updateUser };
