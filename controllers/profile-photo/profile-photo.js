import db from "../../config/db.js";
import {
  saveProfileData,
  SaveProfilePhoto,
  saveProfileUserData,
  userDetails,
} from "../../models/profile-data-models.js";

const ProfilePhotoImport = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const imagePath = req.file.path.replace(/\\/g, "/");
    await SaveProfilePhoto(req.user.id, imagePath);
    res.json({
      success: true,
      image: imagePath,
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// const profileUserData = async (req, res) => {
//   const connection = await db.getConnection();

//   try {
//     const { name, email, bio } = req.body;
//     const userId = req.user.id;

//     await connection.beginTransaction();

//     const userFields = ["id"];
//     const userValues = [req.user.id];
//     const userUpdate = [];
//     console.log("userfields", userFields);

//     if (name !== undefined) {
//       userFields.push("fullName");
//       userValues.push(name);
//       userUpdate.push("fullName=values(fullName)");
//     }
//     if (email !== undefined) {
//       userFields.push("email");
//       userValues.push(email);
//       userUpdate.push("email=values(email)");
//     }

//     if (userUpdate.length > 0) {
//       const placeholder = userFields.map(() => "?").join(",");
//       await saveProfileUserData(
//         connection,
//         userFields,
//         placeholder,
//         userUpdate,
//         userValues,
//       );
//     }

//     //userprofilefields
//     const profileFields = ["user_id"];
//     const profileUpdates = [];
//     const profileValues = [req.user.id];

//     if (bio !== undefined) {
//       profileFields.push("bio");
//       profileValues.push(bio);
//       profileUpdates.push("bio=values(bio)");
//     }

//     if (profileUpdates.length > 0) {
//       const placeholders = profileFields.map(() => "?").join(",");

//       await saveProfileData(
//         connection,
//         profileFields,
//         placeholders,
//         profileUpdates,
//         profileValues,
//       );
//     }

//     await connection.commit();
//   } catch (err) {
//     console.error("err in profike data uploading", err);
//   }
// };

const profileUserData = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { name, email, bio } = req.body;
    const userId = req.user.id;

    await connection.beginTransaction();

    // =========================
    // USERS TABLE
    // =========================

    const userFields = [];
    const userValues = [];

    if (name !== undefined) {
      userFields.push("fullName");
      userValues.push(name);
    }

    if (email !== undefined) {
      userFields.push("email");
      userValues.push(email);
    }

    if (userFields.length > 0) {
      const setQuery = userFields
        .map((field) => `${field} = ?`)
        .join(", ");

      await connection.query(
        `UPDATE users SET ${setQuery} WHERE id = ?`,
        [...userValues, userId]
      );
    }

    // =========================
    // USER PROFILES TABLE
    // =========================

    const profileFields = [];
    const profileValues = [];

    if (bio !== undefined) {
      profileFields.push("bio");
      profileValues.push(bio);
    }

    if (profileFields.length > 0) {
      const setQuery = profileFields
        .map((field) => `${field} = ?`)
        .join(", ");

      await connection.query(
        `UPDATE user_profiles SET ${setQuery} WHERE user_id = ?`,
        [...profileValues, userId]
      );
    }

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
    });

  } catch (err) {
    await connection.rollback();

    console.error("err in profile data uploading", err);

    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  } finally {
    connection.release();
  }
};

const fetchUserData = async (req, res) => {
  const userid = req.user.id;
  console.log("req", req.body);

  try {
    const data = await userDetails(userid);
    if (data.length) {
      return res.status(200).json({ success: 200, data: data });
    }

    return res
      .status(400)
      .json({ success: 400, message: "user details are not found" });
  } catch (err) {
    console.error("err in profike data uploading", err);
  }
};

export { ProfilePhotoImport, profileUserData, fetchUserData };
