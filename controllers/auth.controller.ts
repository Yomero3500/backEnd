import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sanitizeHtml from 'sanitize-html';
import User from '../models/Users.model';
import { TOKEN_SECRET } from '../config';
import { createAccessToken } from '../libs/jwt';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, telefono } = req.body;

    // Buscar si ya existe un usuario con el mismo email
    const userFound = await User.findOne({ email });

    // Si se encuentra un usuario con el mismo email, devuelve un mensaje de error
    if (userFound) {
      res.status(400).json({
        message: ["El email ya está en uso"],
      });
      return;
    }

    const isAdmin = email === "admin@example.com" && password === "adminPassword";

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear un nuevo usuario
    const newUser = new User({
      email: sanitizeHtml(email.toLowerCase()),
      password: passwordHash,
      telefono: sanitizeHtml(telefono),
      isAdmin: isAdmin,
    });

    // Guardar el nuevo usuario en la base de datos
    const userSaved = await newUser.save();

    // Devolver la información del usuario creado
    res.json({
      id: userSaved._id,
      telefono: userSaved.telefono,
      email: userSaved.email,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Manejar el error
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error' });
    }
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const userFound = await User.findOne({ email });

    if (!userFound || !(await bcrypt.compare(password, userFound.password))) {
      res.status(400).json({
        message: ["El email o la contraseña son incorrectos"],
      });
      return;
    }

    const token = await createAccessToken({
      id: userFound._id,
      email: userFound.email,
      isAdmin: userFound.isAdmin,
    });

    res.cookie("token", token).json({
      token,
      isAdmin: userFound.isAdmin,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Unknown error' });
    }
  }
};

export const verifyToken = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.cookies;
  if (!token) {
    res.send(false);
    return;
  }

  jwt.verify(token, TOKEN_SECRET, async (error: unknown, user: any) => {
    if (error) {
      res.sendStatus(401);
      return;
    }

    const userFound = await User.findById(user.id);
    if (!userFound) {
      res.sendStatus(401);
      return;
    }

    res.json({
      id: userFound._id,
      email: userFound.email,
    });
  });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: true,
    expires: new Date(0),
  });
  res.sendStatus(200);
};

export const profile = async (req: Request, res: Response): Promise<void> => {
  const userFound = await User.findById(req.body.user.id);

  if (!userFound) {
    res.status(400).json({ message: "Usuario no encontrado" });
    return;
  }

  res.json({
    email: userFound.email,
    telefono: userFound.telefono,
  });
};
