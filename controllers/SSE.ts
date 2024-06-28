import Producto from '../models/Products.models';
import express, { Request, Response } from 'express';
import cors from 'cors';

const sseRouter = express();
const sseClients: Response[] = [];

sseRouter.use(cors());

const notifySSEClients = (data: any) => {
  sseClients.forEach(client => client.write(`data: ${JSON.stringify(data)}\n\n`));
};

sseRouter.get('/wait', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  sseClients.push(res);

  req.on('close', () => {
    const index = sseClients.indexOf(res);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});


sseRouter.get('/checkAvailability', async (_req: Request, res: Response) => {
  try {
    const productos = await Producto.find();
    const productosAgotados = productos.filter((producto: any) => producto.quantity === 0).map((producto: any) => producto.title);

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); 

    sseClients.push(res);

    _req.on('close', () => {
      const index = sseClients.indexOf(res);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });

    res.write(`data: ${JSON.stringify({ productosAgotados })}\n\n`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al verificar la disponibilidad de productos.' });
  }
});


export { sseRouter, notifySSEClients };
