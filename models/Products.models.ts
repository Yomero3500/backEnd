import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  title: string;
  desc?: string;
  price: number;
  quantity: number;
  img?: Buffer;
  createdAt?: Date;
  updatedAt?: Date;
}

const ProductSchema: Schema = new Schema({
  title: { type: String, required: true },
  desc: { type: String },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  img: { type: Buffer },
}, { timestamps: true }); // Habilitar timestamps

export default mongoose.model<IProduct>('Product', ProductSchema);
