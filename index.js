const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

require("dotenv").config();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.HOSTED_CLIENT,
    methods: ["GET", "POST"],
  },
});

let userNamesRoom = {};
let roomLimit = {};

io.on("connection", (socket) => {

  socket.emit("your_id", socket.id);
  let userCount = io.engine.clientsCount;

  socket.on("join_room_admin", (roomID, name, limit) => { //roomID -> room id (unique hash)
    if(!roomLimit.hasOwnProperty(roomID)){
      try{
        socket.join(roomID);
      }catch(e){
        socket.emit('error','couldnt perform requested action');
      }
      if (!userNamesRoom.hasOwnProperty(roomID)) {
        userNamesRoom[roomID] = [];
      }
      userNamesRoom[roomID].push(name);
      if(!roomLimit.hasOwnProperty(roomID)){
        roomLimit[roomID] = limit
      }
      const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
        io.to(roomID).emit("room_count", clientsInRoom);
        const names_server_to_client_room = [...userNamesRoom[roomID]];
        io.to(roomID).emit("room_names", names_server_to_client_room);
    } else{
      socket.join(process.env.DEFAULT_ROOM_ID)
    }
  });

  socket.on("join_room_user", (roomID, name) => { //roomID -> room id (unique hash)
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
      if(roomLimit[roomID] >= clientsInRoom + 1){
        try{
          socket.join(roomID);
        }catch(e){
          socket.emit('error','couldnt perform requested action');
        }
        if (!userNamesRoom.hasOwnProperty(roomID)) {
          userNamesRoom[roomID] = [];
        }
        userNamesRoom[roomID].push(name);
        io.to(roomID).emit("room_count", clientsInRoom + 1);
        const names_server_to_client_room = [...userNamesRoom[roomID]]
        io.to(roomID).emit("room_names", names_server_to_client_room);
      } else {
        socket.join(process.env.DEFAULT_ROOM_ID)
      }
  });

  socket.on("file:data", (data) => {
    // Relay the file data to the recipient
      const { fileName, fileType } = data;
      socket.to(data.to).emit("file:data", {
      from: socket.id,
      data: data.data,
      fileName: fileName,
      fileType: fileType
    });
  });

  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  socket.on("leave_room", (data) => {
    userCount = io.engine.clientsCount
    const clientsInRoom = io.sockets.adapter.rooms.get(data)?.size ?? 0;
    io.to(data).emit("room_count", clientsInRoom);
    socket.disconnect();
  });
});

server.listen(process.env.PORT);