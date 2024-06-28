// index.ts
import {  server } from './app';
import { connectDB } from './db';
import { PORT } from './config';

connectDB();

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});