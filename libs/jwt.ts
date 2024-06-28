import jwt from "jsonwebtoken";
import { TOKEN_SECRET } from "../config";

export async function createAccessToken(payload: any): Promise<string> {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, TOKEN_SECRET, { expiresIn: "1d" }, (err: Error | null, token: string | undefined) => {
      if (err) return reject(err);
      if (!token) return reject(new Error("Token generation failed"));
      resolve(token);
    });
  });
}
