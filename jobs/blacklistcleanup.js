import nodeCron from "node-cron";
import db from "../config/db.js";
db;

const cleanBlackListTOken = async () => {
  try {
    const [result] = await db.query(`
      DELETE FROM token_blacklist
      WHERE expires_at < NOW()
    `);

    console.log("Deleted rows:", result.affectedRows);
  } catch (error) {
    console.error("Blacklist cleanup error:", error);
  }
};
nodeCron.schedule("0 * * * *", cleanBlackListTOken);
