import { Request, Response } from 'express';
import Pedidos from '../models/Pedidos.model';
import Usuario from '../models/Users.model';
import Producto from '../models/Products.models';
import { notifySSEClients } from './SSE';
import { ObjectId } from 'mongodb';

let numeroPedidoActual = 0;

interface DetallesVenta {
  name: string;
  quantity: number;
}

export const crearPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userEmail, detallesVenta }: { userEmail: string; detallesVenta: DetallesVenta[] } = req.body;

    const usuario = await Usuario.findOne({ email: userEmail });

    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    let totalProducts = 0;
    const productosComprados = [];

    for (const detalle of detallesVenta) {
      const producto = await Producto.findOne({ title: detalle.name.trim() });

      if (!producto) {
        res.status(404).json({ message: `Producto no encontrado: ${detalle.name}` });
        return;
      }

      if (detalle.quantity > producto.quantity) {
        const errorMessage = `Cantidad no disponible para: ${detalle.name}`;
        res.status(400).json({ error: errorMessage });
        return;
      }

      const pedido = new Pedidos({
        user: usuario._id,
        products: [{ product: producto._id, title: detalle.name, quantity: detalle.quantity }],
        totalAmount: detalle.quantity * producto.price,
        numeroPedido: ++numeroPedidoActual,
      });

      totalProducts += pedido.totalAmount;
      producto.quantity -= detalle.quantity;

      const result = await pedido.save();
      usuario.compras.push(result._id as ObjectId);
      productosComprados.push({ _id: producto._id, quantity: detalle.quantity });
    }

    await usuario.save();
    await Promise.all(productosComprados.map(producto => Producto.findByIdAndUpdate(producto._id, { $inc: { quantity: -producto.quantity } })));

    notifySSEClients({
      eventType: 'newPedido',
      eventData: {
        numeroPedido: numeroPedidoActual,
        userEmail,
        detallesVenta,
      },
    });

    res.json({ numeroPedido: numeroPedidoActual, message: "Pedido creado con éxito" });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Error al crear el pedido: " + (error instanceof Error ? error.message : error) });
  }
};


export const obtenerPedidos = async (_req: Request, res: Response): Promise<void> => {
  try {
    const pedidos = await Pedidos.find().populate('user').populate('products.product');

    const pedidosDetallados = pedidos.map((pedido) => ({
      _id: pedido._id,
      user: pedido.user,
      products: pedido.products.map((item) => ({
        title: item.product.title || 'Producto no disponible',
        quantity: item.quantity,
        totalProduct: item.quantity * (item.product.price || 0),
      })),
      totalAmount: pedido.totalAmount,
      createdAt: pedido.createdAt,
    }));

    res.json({ pedidos: pedidosDetallados });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error al recuperar los pedidos.' });
  }
};

export const borrarTodosLosPedidos = async (_req: Request, res: Response): Promise<void> => {
  try {
    await Pedidos.deleteMany({});
    res.json({ alert: { type: "success", message: 'Todos los pedidos han sido eliminados' } });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ alert: { type: "error", message: 'Error al borrar los pedidos' } });
  }
};

export const pagarPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pedidoId } = req.params;

    // Marcar el pedido como pagado en la base de datos
    await Pedidos.findByIdAndUpdate(pedidoId, { pagado: true });

    // Obtener los productos asociados al pedido
    const pedido = await Pedidos.findById(pedidoId);
    if (!pedido) {
      res.status(404).json({ message: 'Pedido no encontrado.' });
      return;
    }
    const productosPedido = pedido.products.map(item => ({ _id: item.product, quantity: item.quantity }));

    // Eliminar los productos asociados al pedido de la base de datos
    await Promise.all(productosPedido.map(producto => Producto.findByIdAndUpdate(producto._id, { $inc: { quantity: producto.quantity } })));

    res.json({ message: 'Pedido pagado exitosamente y productos eliminados de la base de datos.' });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error al pagar el pedido y eliminar los productos.' });
  }
};

export const obtenerPedidoPorId = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pedidoId } = req.params;

    // Obtener el pedido por su ID con todos los detalles
    const pedido = await Pedidos.findById(pedidoId).populate('user').populate('products.product');

    if (!pedido) {
      res.status(404).json({ message: 'Pedido no encontrado.' });
      return;
    }

    res.json({ pedido });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error al obtener los detalles del pedido.' });
  }
};

export const actualizarPedido = async (req: Request, res: Response): Promise<void> => {
  try {
    const { pedidoId } = req.params;
    const { detallesActualizados } = req.body;

    // Actualizar los detalles del pedido en la base de datos
    await Pedidos.findByIdAndUpdate(pedidoId, { detallesVenta: detallesActualizados });

    res.json({ message: 'Detalles del pedido actualizados correctamente.' });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: 'Error al actualizar los detalles del pedido.' });
  }
};
