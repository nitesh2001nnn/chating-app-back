import dotenv from "dotenv";
dotenv.config();
import db from "./config/db.js";
import http from "http";
import app from "./app.js";
import { Server } from "socket.io";
import {
  insertMessage,
  updateDeleiveryStatus,
  updateSeenStatus,
} from "./models/chat-models.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const startServer = async () => {
  try {
    await db.query("SELECT 1");
    console.log("my sql conencted");

    server.listen(PORT, () => {
      console.log(`server connect at ${PORT} 5000`);
    });
  } catch (err) {
    console.log(err);
  }
};

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

const onlineUser = new Map();

io.on("connection", (socket) => {
  // Common function to broadcast the current online list to everyone
  const broadcastOnlineUsers = () => {
    const onlineIds = Array.from(onlineUser.keys());
    console.log("📢 Broadcasting online users list:", onlineIds);
    io.emit("online_users", onlineIds);
  };

  socket.on("join", (userid) => {
    socket.userId = userid;
    socket.join(`user ${userid}`);
    onlineUser.set(userid, socket.id);
    console.log(`👤 User joined: ${userid}`);

    // Broadcast updated list to everyone
    broadcastOnlineUsers();
  });

  socket.on("get_online_users", () => {
    // Respond to individual requests with the current list
    socket.emit("online_users", Array.from(onlineUser.keys()));
  });

  socket.on("disconnect", () => {
    if (socket.userId) {
      console.log(`🔌 User disconnected: ${socket.userId}`);
      onlineUser.delete(socket.userId);
      // Broadcast updated list to everyone
      broadcastOnlineUsers();
    } else {
      console.log(`🔌 Unknown user disconnected: ${socket.id}`);
    }
  });

  socket.on("send_message", async (data) => {
    try {
      const { chatId, recieverId, message } = data;
      console.log(
        "recieverid",
        recieverId,
        "type of reciever id",
        typeof recieverId,
      );
      const senderID = socket.userId;
      const messageId = await insertMessage(chatId, senderID, message);
      const payload = {
        chatId,
        sender_id: senderID,
        message_text: message,
        status: "sent",
        id: messageId.id,
        isSeen: 0,
      };
      const receiverSocketId = onlineUser.get(recieverId);

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("reciever_message", payload);
        io.to(receiverSocketId).emit("chat_list_update", payload);
        await updateDeleiveryStatus(messageId.id);
        payload.status = "delivered";
      } else {
        console.log("offline user");
      }

      socket.emit("reciever_message", payload);
      socket.emit("chat_list_update", payload);
    } catch (err) {
      console.log("err", err);
    }
  });

  socket.on("seen_msg", async ({ chatId, senderId }) => {
    console.log("seenmsg", chatId);
    const userID = socket.userId;
    await updateSeenStatus(chatId, userID);

    const senderSocketId = onlineUser.get(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit("msg_seen", { chatId });
    }
  });

  socket.on("typing", ({ chatId, senderId, recieverId }) => {
    console.log("datas here", chatId, senderId, recieverId);
    socket.to(`user ${recieverId}`).emit("typing", {
      chatId,
      senderId,
    });
  });

  socket.on("stop_typing", ({ chatId, senderId, recieverId }) => {
    socket.to(`user ${recieverId}`).emit("stop_typing", {
      chatId,
      senderId,
    });
  });

  socket.on("disconnected", () => {
    console.log("user disconnected", socket.id);
  });
});

startServer();
