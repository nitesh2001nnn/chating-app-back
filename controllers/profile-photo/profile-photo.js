import { SaveProfilePhoto } from "../../models/profile-data-models.js";

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

export { ProfilePhotoImport };
