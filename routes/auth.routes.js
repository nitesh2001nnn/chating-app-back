import { Router } from "express";
import {
  sendLoginOtp,
  sendOtpSignupEMail,
  verifyOtp,
} from "../controllers/auth.controller.js";
import {
  addContact,
  deleteUserContact,
  updateContact,
} from "../controllers/add-contact/add-contact.js";
import authMiddleWare from "../middleware/auth.middleware.js";
import {
  checkMsgSeen,
  getUpdatedChatList,
  getUpdatedMessages,
  sendMessage,
} from "../controllers/chat-controllers/chat-controller.js";

const router = Router();

router.post("/login", sendLoginOtp);
router.post("/signup", sendOtpSignupEMail);
router.post("/verify-otp", verifyOtp);
router.post("/send-message", authMiddleWare, sendMessage);
router.get("/get-update-list", authMiddleWare, getUpdatedChatList);
router.get("/updated-messages/:chat_id", authMiddleWare, getUpdatedMessages);
router.patch("/seen-check/:id", authMiddleWare, checkMsgSeen);
router.post("/add-contact", authMiddleWare, addContact);
router.patch("/update-contact/:contactId", authMiddleWare, updateContact);
router.delete("/delete-contact/:contactId", authMiddleWare, deleteUserContact);

export default router;
