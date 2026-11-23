import express from 'express'; import http from 'http'; import path from 'path'; import { fileURLToPath } from 'url'; import { Server } from 'socket.io'; import { SocketManager } from './network/SocketManager.js';
const app = express(), dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../dist'); app.use(express.static(dist));
const srv = http.createServer(app), io = new Server(srv, { cors: { origin: '*' } }); new SocketManager(io);
const port = Number(process.env.PORT) || 3000; srv.listen(port, '0.0.0.0', () => console.log('DISASTER RUN server on http://localhost:' + port));
