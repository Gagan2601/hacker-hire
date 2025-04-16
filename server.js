// socket-server/server.js
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  path: "/socketio",
  cors: {
    origin: process.env.CLIENT_URL || "https://hacker-hire-one.vercel.app",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);

  socket.on("join-room", (roomId) => {
    console.log(`Client ${socket.id} joined room ${roomId}`);
    socket.join(roomId);
    const userCount = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("room-info", { userCount });
    socket.to(roomId).emit("user-joined", socket.id);
  });

  socket.on("offer", (data) => {
    socket.to(data.roomId).emit("offer", data);
  });

  socket.on("answer", (data) => {
    socket.to(data.roomId).emit("answer", data);
  });

  socket.on("ice-candidate", (data) => {
    socket.to(data.roomId).emit("ice-candidate", data);
  });

  socket.on("disconnect", () => {
    socket.broadcast.emit("user-disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});
