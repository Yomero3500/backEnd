import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { TOKEN_SECRET } from '../config';

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies.token;

  console.log("midd");

  if (!token) {
    res.sendStatus(401);
    return;
  }

  jwt.verify(token, TOKEN_SECRET, (err: any, decoded: any) => {
    if (err) {
      res.sendStatus(401);
      return;
    }

    req.body.user = decoded;
    next();
  });
};
