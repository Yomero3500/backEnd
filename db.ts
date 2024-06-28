//db.ts
import mongoose from 'mongoose';

export const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://DanielPerez:mordecai77.@cluster0.22a1wwe.mongodb.net/Delivery')
        console.log('DB is connected')
    } catch (error) {
        console.log(error);
    }
}