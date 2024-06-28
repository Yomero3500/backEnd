// webhook.controller.ts

import { Request, Response } from 'express';
import Webhook from '../models/Webhook.model'; 

export const registrarWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { url } = req.body;
    if (!url) {
      res.status(400).json({ message: 'Por favor, proporcione una URL para el webhook.' });
      return;
    }

    const webhook = new Webhook({ url });
    await webhook.save();

    res.status(201).json({ message: 'Webhook registrado exitosamente.' });
  } catch (error) {
    console.error('Error al registrar el webhook:', error);
    res.status(500).json({ message: 'Error al registrar el webhook.' });
  }
};
