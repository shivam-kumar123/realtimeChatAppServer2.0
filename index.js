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
    origin: "https://chatappclient2-0.onrender.com/",
    // origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let userNamesRoom = {}
let roomLimit = {}

io.on("connection", (socket) => {

  socket.emit("your_id", socket.id)
  let userCount = io.engine.clientsCount
  console.log(`User Connected: ${socket.id}`)

  socket.on("join_room_admin", (roomID, name, limit) => { //roomID -> room id (unique hash)
    if(!roomLimit.hasOwnProperty(roomID)){
      try{
        console.log('[socket]','join room :',roomID)
        socket.join(roomID);
        socket.to(roomID).emit('user joined', name);
      }catch(e){
        console.log('[error]','join room :',e);
        socket.emit('error','couldnt perform requested action');
      }
      console.log(`useCount: ${userCount}`)
      // console.log(`room id: ${roomID}`)
      // console.log(`socket.id: ${socket.id}`)
      console.log(`${name} has joined as admin to roomID: ${roomID}`)
      if (!userNamesRoom.hasOwnProperty(roomID)) {
        userNamesRoom[roomID] = [];
      }
      userNamesRoom[roomID].push(name);
      if(!roomLimit.hasOwnProperty(roomID)){
        roomLimit[roomID] = limit
      }
      const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
        io.to(roomID).emit("room_count", clientsInRoom);
        const names_server_to_client_room = [...userNamesRoom[roomID]]
        io.to(roomID).emit("room_names", names_server_to_client_room);
        // io.emit("user_count", io.engine.clientsCount);
    } else{
      socket.join(369)
    }
  });

  socket.on("join_room_user", (roomID, name) => { //roomID -> room id (unique hash)
    const clientsInRoom = io.sockets.adapter.rooms.get(roomID)?.size ?? 0;
    console.log(`clientsInRoom: ${clientsInRoom}`)
    console.log(`roomLimit[roomID]: ${roomLimit[roomID]}`)
      if(roomLimit[roomID] >= clientsInRoom + 1){
        try{
          console.log('[socket]','join room :',roomID)
          socket.join(roomID);
          socket.to(roomID).emit('user joined', name);
        }catch(e){
          console.log('[error]','join room :',e);
          socket.emit('error','couldnt perform requested action');
        }
        console.log(`useCount: ${userCount}`)
        // console.log(`room id: ${roomID}`)
        // console.log(`socket.id: ${socket.id}`)
        console.log(`${name} has joined as user to roomID: ${roomID}`)
        if (!userNamesRoom.hasOwnProperty(roomID)) {
          userNamesRoom[roomID] = [];
        }
        userNamesRoom[roomID].push(name);
        io.to(roomID).emit("room_count", clientsInRoom + 1);
        const names_server_to_client_room = [...userNamesRoom[roomID]]
        io.to(roomID).emit("room_names", names_server_to_client_room);
        // io.emit("user_count", io.engine.clientsCount);
      } else {
        socket.join(369)
      }
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