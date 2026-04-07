import mysql from "mysql2/promise";

const db = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "Nitesh@19",
  database: "chatApp",
});

export default db;
