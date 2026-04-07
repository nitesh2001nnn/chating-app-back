import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateToken = (user) => {
  console.log("email is wht", user);
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    process.env.jwt_secretKey,
    { expiresIn: "2hr" },
  );
};

export default generateToken;
