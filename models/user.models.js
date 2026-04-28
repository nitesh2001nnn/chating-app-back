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

const getAuthAttempt = async (user_id, attempt_type) => {
  console.log("userId:", user_id);
  console.log("type:", attempt_type);
  const [rows] = await db.execute(
    "select * from auth_attempts where user_id =? and attempt_type = ?",
    [user_id, attempt_type],
  );
  console.log("rows", rows);
  return rows[0];
};

const upsertAuthAttempt = async (
  user_id,
  attempt_type,
  attempts,
  last_attempt,
  lock_until,
) => {
  await db.execute(
    `
    INSERT INTO auth_attempts
    (user_id, attempt_type, attempts, last_attempt, lock_until)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      attempts = VALUES(attempts),
      last_attempt = VALUES(last_attempt),
      lock_until = VALUES(lock_until)
    `,
    [user_id, attempt_type, attempts, last_attempt, lock_until],
  );
};

const resetAuthAttempts = async (user_id, type) => {
  await db.execute(
    `update auth_attempts set attempts= 0 ,last_attempt = null, lock_until = null where user_id = ? and attempt_type = ?`,
    [user_id, type],
  );
};

export {
  createUsers,
  insertOtp,
  findUser,
  updateUser,
  getAuthAttempt,
  upsertAuthAttempt,
  resetAuthAttempts,
};
