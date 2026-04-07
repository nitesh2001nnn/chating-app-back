import db from "../config/db.js";

const insertContact = async (
  owner_user_id,
  contact_name,
  contact_email,
  contact_phoneNumber,
  linked_user_id,
  isRegistered,
) => {
  console.log(
    "values are",
    owner_user_id,
    contact_name,
    contact_email,
    contact_phoneNumber,
    linked_user_id,
    isRegistered,
  );

  const [result] = await db.query(
    "insert into userContacts (owner_user_id,contact_name,contact_email,contact_phoneNumber,linked_user_id,isRegistered) values(?,?,?,?,?,?)",
    [
      owner_user_id,
      contact_name,
      contact_email,
      contact_phoneNumber,
      linked_user_id,
      isRegistered,
    ],
  );
  console.log("result after insert", result);

  return result.insertId;
};

const updateContactModel = async (id, owner_user_id, updates, values) => {
  try {
    if (!updates?.length) {
      console.log("here it is not ");

      return 0;
    }

    console.log(updates, values, "updates and avalues");

    const sql = `
      UPDATE userContacts
      SET ${updates.join(", ")}
      WHERE id = ? AND owner_user_id = ?
    `;

    const [result] = await db.query(sql, [...values, id, owner_user_id]);
    return result.affectedRows;
  } catch (err) {
    console.error("Update contact error:", err);
    throw err;
  }
};

const deleteUser = async (id, owner_user_id) => {
  const placeholder = id.map(() => "?").join(",");
  const sql = `Delete from userContacts where id in (${placeholder}) AND owner_user_id = ?`;

  const [result] = await db.query(sql, [...id, owner_user_id]);
  return result.affectedRows;
};

export { insertContact, updateContactModel, deleteUser };
