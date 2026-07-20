import multer from "multer";

const storage = multer.diskStorage({
  destination: "uploads/profile",
  filename(req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

export const upload = multer({ storage });
