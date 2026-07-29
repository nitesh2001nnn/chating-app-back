import { Router } from "express";
import {
  login,
  sendLoginOtp,
  userSignup,
  verifyOtp,
  resendOtp,
  PasswordResetToken,
  ResetPassword,
} from "../controllers/auth.controller.js";
import {
  addContact,
  deleteUserContact,
  fetchContactsData,
  updateContact,
} from "../controllers/add-contact/add-contact.js";
import authMiddleWare from "../middleware/auth.middleware.js";
import {
  checkMsgSeen,
  getOrCreateChat,
  getUpdatedChatList,
  getUpdatedMessages,
  sendMessage,
} from "../controllers/chat-controllers/chat-controller.js";

import { ProfilePhotoImport } from "../controllers/profile-photo/profile-photo.js";
import { upload } from "../uploads/upload.js";
import { saveProfileUserData } from "../models/profile-data-models.js";
import { profileUserData } from "../controllers/profile-photo/profile-photo.js";

const router = Router();

router.post("/login", login);
router.post("/signup", userSignup);
router.post("/verify-otp", verifyOtp);
router.post("/send-message", authMiddleWare, sendMessage);
router.post("/get-or-create-chat", authMiddleWare, getOrCreateChat);
router.get("/get-update-list", authMiddleWare, getUpdatedChatList);
router.get("/updated-messages/:chat_id", authMiddleWare, getUpdatedMessages);
router.patch("/seen-check/:id", authMiddleWare, checkMsgSeen);
router.post("/profile-data", authMiddleWare, profileUserData);
router.post("/add-contact", authMiddleWare, addContact);
router.patch("/update-contact/:contactId", authMiddleWare, updateContact);
router.delete("/delete-contact/:contactId", authMiddleWare, deleteUserContact);
router.get("/fetch-contacts", authMiddleWare, fetchContactsData);
router.post("/resend-otp", resendOtp);
router.post("/forgot-password-token", PasswordResetToken);
router.post("/reset-password", ResetPassword);
router.post(
  "/profile-photo",
  authMiddleWare,
  upload.single("profile"),
  ProfilePhotoImport,
);

export default router;
