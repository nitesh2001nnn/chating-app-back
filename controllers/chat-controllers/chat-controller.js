import {
  findChats,
  getChatList,
  getMessages,
  insertChats,
  insertMessage,
  updateSeenStatus,
} from "../../models/chat-models.js";

import { io } from "../../server.js";

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { recieverId, txt } = req.body;

    let chatId = await findChats(senderId, recieverId);

    if (!chatId) {
      chatId = await insertChats(senderId, recieverId);
    }

    const message = await insertMessage(chatId.id, senderId, txt);

    const payload = {
      id: message.id,
      chatId: chatId.id,
      senderId,
      text: txt,
      createdAt: new Date(),
    };


    io.to(`users_${recieverId}`).emit("new_message", payload);
    io.to(`users_${senderId}`).emit("new_message", payload);

    res.json({
      success: true,
      chatId: chatId.id,
      message: message.id,
    });
  } catch (err) {
    console.log("Error of socket", err);
    res.status(500).json({ success: false });
  }
};

const getUpdatedChatList = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await getChatList(userId);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to find chat list",
    });
  }
};

const getUpdatedMessages = async (req, res) => {
  try {
    const { chat_id } = req.params;
    const result = await getMessages(chat_id);
    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "failed to find msges list",
    });
  }
};

const checkMsgSeen = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await updateSeenStatus(id, userId);
    res.status(200).json({
      success: true,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      result: error,
    });
  }
};

export { sendMessage, getUpdatedChatList, getUpdatedMessages, checkMsgSeen };
