import mongoose, { Schema, Document } from 'mongoose';

interface ProductItem {
  product: mongoose.Types.ObjectId | any; // Usar 'any' para permitir la población
  quantity: number;
}

interface Pedido extends Document {
  user: mongoose.Types.ObjectId;
  products: ProductItem[];
  totalAmount: number;
  createdAt: Date;
}

const PedidosSchema: Schema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  products: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true,
      },
      quantity: {
        type: Number,
        required: true,
      },
    },
  ],
  totalAmount: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Pedidos = mongoose.model<Pedido>('Pedidos', PedidosSchema);

export default Pedidos;
