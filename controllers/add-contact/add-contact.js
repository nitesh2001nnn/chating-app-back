import {
  insertContact,
  updateContactModel,
  deleteUser,
  fetchContacts,
} from "../../models/add-contact-models.js";
import db from "../../config/db.js";
import { CONTACT_FIELDS } from "../../schemas/contact-schema.js";

const addContact = async (req, res) => {
  try {
    const ownerUserID = req.user.id;

    const { name, email, phoneNumber } = req.body;

    const [users] = await db.query("select * from users where email = ?", [
      email,
    ]);

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
    if (req.body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(req.body[field]);
    }
  }
  if (!updates.length) {
    return res.status(400).json({ message: "No valid fields " });
  }

  // values.push(contactId, owner_user_id);

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

const fetchContactsData = async (req, res) => {
  const owner_user_id = req.user.id;
  const result = await fetchContacts(owner_user_id);
  console.log("fetchcontacts", result);
  res.json({
    success: true,
    data: result,
  });
};

export { addContact, updateContact, deleteUserContact, fetchContactsData };
