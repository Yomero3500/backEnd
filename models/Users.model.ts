import mongoose, { Schema, Document } from 'mongoose';

interface User extends Document {
  email: string;
  password: string;
  telefono: string;
  compras: mongoose.Types.ObjectId[];
  isAdmin: boolean;
}

const UsuarioSchema: Schema = new Schema({
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  telefono: {
    type: String,
    required: true,
  },
  compras: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pedidos',
  }],
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

const User = mongoose.model<User>('User', UsuarioSchema);

export default User;
