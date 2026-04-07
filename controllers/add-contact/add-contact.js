import {
  insertContact,
  updateContactModel,
  deleteUser,
} from "../../models/add-contact-models.js";
import db from "../../config/db.js";
import { CONTACT_FIELDS } from "../../schemas/contact-schema.js";
const addContact = async (req, res) => {
  try {
    const ownerUserID = req.user.id;
    console.log("owner", ownerUserID);
    const { name, email, phoneNumber } = req.body;
    console.log("name email ph", name, email, phoneNumber);

    const [users] = await db.query("select * from users where email = ?", [
      email,
    ]);
    console.log("users aftrr searching ", users);
    let isRegistered = false;
    let linked_Users = null;
    if (users.length > 0) {
      isRegistered = true;
      linked_Users = users[0].id;
    }

    const data = await insertContact(
      ownerUserID,
      name,
      email,
      phoneNumber,
      linked_Users,
      isRegistered,
    );
    console.log("data", data);
    res.status(200).json({ message: "user saved successfully !!" });
  } catch (err) {
    res.status(400).json({ message: "SOmething went wrong", err });
  }
};

const updateContact = async (req, res) => {
  const { contactId } = req.params;
  const owner_user_id = req.user.id;
  const updates = [];
  const values = [];

  for (const field of Object.keys(CONTACT_FIELDS)) {
    console.log("filed", field);
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }
  if (!updates.length) {
    return res.status(400).json({ message: "No valid fields " });
  }

  // values.push(contactId, owner_user_id);
  console.log("update id", contactId, updates, values, owner_user_id);

  const affectedRows = await updateContactModel(
    contactId,
    owner_user_id,
    updates,
    values,
  );

  if (!affectedRows) {
    return res.status(404).json({ error: "Contact not found" });
  }

  res.json({ success: true });
};

const deleteUserContact = async (req, res) => {
  const ownerId = req.user.id;
  let ids = [];

  if (req.params.contactId) {
    ids = [Number(req.params.contactId)];
  } else if (Array.isArray(req.body.ids)) {
    ids = req.body.ids.map(Number);
  }
  if (!ids.length) {
    return res.status(400).json({ error: "No contact IDs provided" });
  }

  const deletedCount = await deleteUser(ids, ownerId);

  res.json({
    success: true,
    deletedCount,
  });
};

export { addContact, updateContact, deleteUserContact };
