import db from "../config/db.js";
const InsertProfileImport = async (user_id, profile_photo) => {
  const [result] = await db.query(
    "insert into user_profiles(user_id,profile_photo)values(?,?) ",
    [user_id, profile_photo],
  );
  return result.insertId;
};

const UpdateProfileImport = async (user_id, profile_photo) => {
  const [result] = await db.query(
    "UPDATE user_profiles SET profile_photo = ? WHERE user_id = ?",
    [profile_photo, user_id],
  );

  return result;
};

const InsertProfileData = async (user_id, about) => {
  const [result] = await db.query(
    "insert into user_profiles(user_id,about)values(?,?)",
  );

  return result;
};

const UpdateProfileData = async (user_id, name, email) => {
  const [result] = await db.query(
    "update users set fullName =?,email=? where id = ?",
    [name, email, user_id],
  );
};

const checkUserFound = async (user_id) => {
  const [result] = await db.execute(
    "select * from user_profiles where user_id = ?",
    [user_id],
  );
  return result;
};

const SaveProfilePhoto = async (user_id, profile_photo) => {
  console.log("userid what", user_id, profile_photo);
  const [result] = await db.query(
    `
        INSERT INTO user_profiles(user_id, profile_photo)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE
        profile_photo = VALUES(profile_photo)
        `,
    [user_id, profile_photo],
  );

  return result;
};

const saveProfileUserData = async (
  connection,
  userFields,
  placeholders,
  userUpdates,
  userValues,
) => {
  const [updateUsers] = await connection.query(
    `insert into users(${userFields.join(",")}) values(${placeholders}) on duplicate key update ${userUpdates.join(",")}`,
    userValues,
  );

  return updateUsers;
};

const saveProfileData = async (
  connection,
  profileFields,
  placeholders,
  profileUpdates,
  profileValues,
) => {
  const [updateUsers] = await connection.query(
    `insert into user_profiles(${profileFields.join(",")}) values(${placeholders}) on duplicate key update ${profileUpdates.join(",")}`,
    profileValues,
  );
  return updateUsers;
};

const userDetails = async (userId) => {
  console.log("userid", userId);
  const [userData] = await db.execute(
    "select u.fullName,u.email,u.phone_number,up.profile_photo,up.bio from users u left join user_profiles up on u.id =up.user_id where u.id=?",
    [userId],
  );
  return userData;
};

export {
  InsertProfileData,
  InsertProfileImport,
  UpdateProfileData,
  UpdateProfileImport,
  checkUserFound,
  SaveProfilePhoto,
  saveProfileData,
  saveProfileUserData,
  userDetails,
};
