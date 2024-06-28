import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import { sseRouter, notifySSEClients } from './controllers/SSE';

const app: Application = express();
const server: http.Server = http.createServer(app);
const wsServer: WebSocketServer = new WebSocketServer({ server, path: '/ws' });

app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use("/user", authRoutes);
app.use('/sse', sseRouter);

let connectedUsers: number = 0;
let activeSockets: WebSocket[] = [];

// WebSocket server handling
wsServer.on('connection', (socket: WebSocket) => {
  console.log('A client has connected');
  connectedUsers++;
  activeSockets.push(socket);
  socket.send(JSON.stringify({ type: 'connected_users', count: connectedUsers }));

  socket.on('message', (message: string) => {
    const data = JSON.parse(message);
    switch (data.type) {
      case 'chat_message':
        // Broadcast the message to all connected sockets except the sender
        activeSockets.forEach((client) => {
          if (client !== socket && client.readyState === client.OPEN) {
            client.send(JSON.stringify({ type: 'chat_message', message: data.message }));
          }
        });
        break;
      case 'get_connected_users':
        socket.send(JSON.stringify({ type: 'connected_users', count: connectedUsers }));
        break;
      case 'private_message':
        const { message, recipientId } = data;
        const recipientSocket = activeSockets.find((client) => client === recipientId && client.readyState === client.OPEN);
        if (recipientSocket) {
          recipientSocket.send(JSON.stringify({ type: 'private_message', senderSocketId: socket, message }));
        }
        break;
    }
  });

  socket.on('close', () => {
    connectedUsers--;
    activeSockets = activeSockets.filter((activeSocket) => activeSocket !== socket);
  });
});

app.post('/webhook', (req: Request, res: Response) => {
  const hookId = req.params.hookId;
  console.log(`Webhook received for hookId: ${hookId}`);
  res.status(200).json({ message: `Webhook received for hookId: ${hookId}` });
});



export { app, server, notifySSEClients };
