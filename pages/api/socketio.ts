// pages/api/signal.ts
import { Server as IOServer } from "socket.io";
import { Server as HTTPServer } from "http";
import { Socket } from "net";
import { NextApiRequest, NextApiResponse } from "next";

type NextApiResponseWithSocket = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: IOServer;
    };
  };
};

let io: IOServer | undefined;

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) {
  if (!res.socket.server.io) {
    io = new IOServer(res.socket.server as any, {
      path: "/api/socketio",
    });
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      socket.on("join-room", (roomId) => {
        socket.join(roomId);
        const userCount = io?.sockets.adapter.rooms.get(roomId)?.size || 0;
        io?.to(roomId).emit("room-info", { userCount });
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
  }

  res.end();
}
