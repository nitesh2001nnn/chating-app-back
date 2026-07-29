import db from "../../config/db.js";
import {
  saveProfileData,
  SaveProfilePhoto,
  saveProfileUserData,
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

const profileUserData = async (req, res) => {
  console.log("req", req.body, "res", res);
  const connection = await db.getConnection();
  const { name, email, bio } = req.body;

  try {
    await connection.beginTransaction();

    const userFields = ["id"];
    const userValues = [req.user.id];
    const userUpdate = [];

    if (name !== undefined) {
      userFields.push("fullName");
      userValues.push(name);
      userUpdate.push("fullName=values(fullName)");
    }
    if (email !== undefined) {
      userFields.push("email");
      userValues.push(email);
      userUpdate.push("email=values(email)");
    }

    if (userUpdate.length > 0) {
      const placeholder = userFields.map(() => "?").join(",");
      await saveProfileUserData(
        userFields,
        placeholder,
        userUpdate,
        userValues,
      );
    }

    //userprofilefields
    const profileFields = ["user_id"];
    const profileUpdates = [];
    const profileValues = [req.user.id];

    if (bio !== undefined) {
      profileFields.push("bio");
      profileValues.push(bio);
      profileUpdates.push("bio=values(bio)");
    }

    if (profileUpdates.length > 0) {
      const placeholders = profileFields.map(() => "?").join(",");

      await saveProfileData(
        profileFields,
        placeholders,
        profileUpdates,
        profileValues,
      );
    }

    await connection.commit();
  } catch (err) {
    console.error("err in profike data uploading", err);
  }
};

export { ProfilePhotoImport, profileUserData };
