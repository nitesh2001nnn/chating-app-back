import bcrypt from "bcrypt";

export const hashCompare = (otp, hash) => bcrypt.compare(otp, hash);
export const hash = (otp) => bcrypt.hash(otp, 10);
