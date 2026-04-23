import jwt from "jsonwebtoken";
import { findUser } from "../models/user.models.js";

const authMiddleWare = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "unauthorized" });
    }
    const token = authHeader.split(" ")[1];

    const decode = jwt.verify(token, process.env.jwt_secretKey);

    const users = await findUser(decode.email);

    if (!users.length) {
      return res.status(402).json({ message: "user not found" });
    }

    req.user = users[0];
    next();
  } catch (err) {
    res.status(400).json({ message: "invalid token", res: err });
  }
};

export default authMiddleWare;
