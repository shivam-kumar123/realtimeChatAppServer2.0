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
    // origin: "https://64d463f3681b8822b620f1f7--fluffy-souffle-ad3e68.netlify.app/",
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let userNamesRoom = {}

io.on("connection", (socket) => {

  socket.emit("your_id", socket.id)
  let userCount = io.engine.clientsCount
  console.log(`User Connected: ${socket.id}`)

  socket.on("join_room", (roomID, name) => { //roomID -> room id (unique hash)
    socket.join(roomID);
    console.log(`useCount: ${userCount}`)
    console.log(`room id: ${roomID}`)
    console.log(`socket.id: ${socket.id}`)
    console.log(`name is: ${name}`)
    if (!userNamesRoom.hasOwnProperty(roomID)) {
      userNamesRoom[roomID] = [];
  }
    userNamesRoom[roomID].push(name);
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
    io.to(roomID).emit("room_count", clientsInRoom);
    const names_server_to_client_room = [...userNamesRoom[roomID]]
    io.to(roomID).emit("room_names", names_server_to_client_room);
    // io.emit("user_count", io.engine.clientsCount);
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