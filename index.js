const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

require("dotenv").config()

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "https://64d34e6c8b916e3e7fec71e2--thunderous-licorice-61075f.netlify.app/",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {

  socket.emit("your_id", socket.id)
  let userCount = io.engine.clientsCount
  console.log(`User Connected: ${socket.id}`)

  socket.on("join_room", (roomID) => { //roomID -> room id (unique hash)
    socket.join(roomID);
    console.log(`useCount: ${userCount}`)
    console.log(`room id: ${roomID}`)
    console.log(`socket.id: ${socket.id}`)
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
    io.to(roomID).emit("room_count", clientsInRoom);
    io.emit("user_count", io.engine.clientsCount);
  });

  socket.on("send_message", (data) => {
    console.log("recv data:",data);
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", (data) => {
    userCount = io.engine.clientsCount
    console.log("User Disconnected", socket.id);
    const clientsInRoom = io.sockets.adapter.rooms.get(data)?.size ?? 0;
    io.to(data).emit("room_count", clientsInRoom);
    // io.emit("user_count", userCount);
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("SERVER RUNNING");
});