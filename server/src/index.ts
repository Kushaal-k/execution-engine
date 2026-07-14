import { Server } from "socket.io";
import http from "node:http";
import { registerSocketHandlers } from "./socket/socket.js";

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end("Sync server is running!");
})

export const io = new Server(server, {
    cors: {
        origin: "*",
    }
})

registerSocketHandlers(io);

server.listen(3000, () => {
    console.log(`Server is running at http://localhost:3000`);
})