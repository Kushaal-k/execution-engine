import { io } from "socket.io-client";

const socket2 = io("http://localhost:3000");
const socket = io("http://localhost:5000");

export {socket, socket2};