import { Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import axios from 'axios'; // Importar Axios para enviar notificaciones
import Product from '../models/Products.models';
import Webhook from '../models/Webhook.model'; // Asegúrate de crear un modelo para almacenar las URLs de los webhooks

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Crear una ruta para registrar las URLs del webhook
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

export const crearProducto = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  upload.single('img')(req, res, async (err: any) => {
    if (err instanceof MulterError) {
      console.error(err);
      res.status(500).json({ message: 'Error al cargar la imagen.' });
      return;
    } else if (err) {
      return next(err);
    }

    try {
      const { title, desc, price, quantity } = req.body;

      if (!title || !price || !quantity) {
        res.status(400).json({ message: 'Por favor, proporcione todos los campos obligatorios.' });
        return;
      }

      const imgBuffer = req.file?.buffer;
      const product = new Product({ title, desc, price, quantity, img: imgBuffer });

      const productoGuardado = await product.save();

      // Obtener todas las URLs de los webhooks y enviar notificaciones
      const webhooks = await Webhook.find();
      webhooks.forEach(async (webhook) => {
        try {
          await axios.post(webhook.url, { producto: productoGuardado });
        } catch (error) {
          console.error(`Error al notificar el webhook ${webhook.url}:`, error);
        }
      });

      res.status(201).json(productoGuardado);
    } catch (error) {
      console.error('Error al crear el producto:', error);
      res.status(500).json({ message: 'Error al crear el producto.' });
    }
  });
};


export const obtener = async (_req: Request, res: Response): Promise<void> => {
  try {
    const productos = await Product.find();

    const productosConImagen = productos.map(producto => {
      return {
        _id: producto._id,
        title: producto.title,
        desc: producto.desc,
        img: producto.img ? `data:image/jpeg;base64,${producto.img.toString('base64')}` : '', 
        price: producto.price,
        quantity: producto.quantity,
        createdAt: producto.createdAt,
      };
    });

    res.json(productosConImagen);
  } catch (error) {
    console.error('Error al recuperar los productos:', error);
    res.status(500).json({ message: 'Error al recuperar los productos.' });
  }
};

export const borrarProducto = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const productoEliminado = await Product.findByIdAndDelete(id);

    if (!productoEliminado) {
      res.status(404).json({ message: 'Producto no encontrado.' });
      return;
    }

    res.json({ message: 'Producto eliminado exitosamente.' });
  } catch (error) {
    console.error('Error al borrar el producto:', error);
    res.status(500).json({ message: 'Error al borrar el producto.' });
  }
};
