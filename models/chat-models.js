import db from "../config/db.js";

const findChats = async (u1, u2) => {
  const [rows] = await db.query(
    "select * from chats where (user1_id = ? AND user2_id = ?) or (user1_id = ? AND user2_id = ?)",
    [u1, u2, u2, u1],
  );
  return rows[0];
};

const insertChats = async (u1, u2) => {
  const small = Math.min(u1, u2);
  const large = Math.max(u1, u2);

  const [res] = await db.query(
    "insert into chats (user1_id,user2_id) values (?,?)",
    [small, large],
  );
  return { id: res.insertId };
};

const insertMessage = async (
  chatId,
  senderID,
  text,
  type = "text",
  mediaUrl = null,
) => {
  const [res] = await db.query(
    "insert into messages (chat_id,sender_id,message_type,message_text,media_url) values(?,?,?,?,?)",
    [chatId, senderID, type, text, mediaUrl],
  );
  return { id: res.insertId };
};

const getChatList = async (userId) => {
  const [rows] = await db.query(
    "select c.id as chat_id, if(c.user1_id =?,c.user2_id,c.user1_id) as other_user_id,COALESCE(uc.contact_name, u.phone_number) AS display_name,m.message_text,m.created_at as last_message_time , (select COUNT(*) from messages where chat_id = c.id AND sender_id != ? AND isSeen = 0) as unread_count  from chats c left join users u on u.id = IF (c.user1_id=?,c.user2_id,c.user1_id) LEFT JOIN usercontacts uc ON uc.linked_user_id = u.id AND uc.owner_user_id=? LEFT JOIN messages m ON m.id = ( SELECT id FROM messages WHERE chat_id = c.id ORDER BY created_at DESC LIMIT 1 ) WHERE c.user1_id = ? OR c.user2_id = ? ORDER BY last_message_time DESC",
    [userId, userId, userId, userId, userId, userId],
  );

  return rows;
};

const getMessages = async (chat_id) => {
  const [rows] = await db.query(
    "select id,sender_id,message_text,message_type,media_url,status,isSeen,created_at from messages where chat_id = ? order by created_at asc",
    [chat_id],
  );

  return rows;
};

const updateDeleiveryStatus = async (msg_id) => {
  await db.query("update messages set status = 'delivered'  where id = ? ", [
    msg_id,
  ]);
};

const updateSeenStatus = async (chatId, senderID) => {
  const [rows] = await db.query(
    "update messages set isSeen = 1,status = 'seen'  where chat_id = ? and sender_id != ? ",
    [chatId, senderID],
  );
};

export {
  findChats,
  insertChats,
  insertMessage,
  getChatList,
  getMessages,
  updateDeleiveryStatus,
  updateSeenStatus,
};
