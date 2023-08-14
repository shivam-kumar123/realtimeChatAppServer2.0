const express = require("express");
const app = express();
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

require("dotenv").config();

app.use(cors());

app.use(express.json({ limit: "10mb" })); // Increasing the JSON payload size limit
app.use(express.urlencoded({ limit: "10mb", extended: true })); // Increasing the URL-encoded payload size limit

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.HOSTED_CLIENT,
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8,
});

let userNamesRoom = {};
let roomLimit = {};

io.on("connection", (socket) => {

  socket.emit("your_id", socket.id);

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
        const names_server_to_client_room = [...userNamesRoom[roomID]];
        io.to(roomID).emit("room_names", names_server_to_client_room);
    } else{
      socket.join(process.env.DEFAULT_ROOM_ID)
    }
  });

  socket.on("join_room_user", (roomID, name) => { //roomID -> room id (unique hash)
    let clientsInRoom = 0;
    if (userNamesRoom.hasOwnProperty(roomID)) clientsInRoom = userNamesRoom[roomID].length;
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
        const names_server_to_client_room = [...userNamesRoom[roomID]]
        io.to(roomID).emit("room_names", names_server_to_client_room);
        io.to(roomID).emit("join_user_msg", name);
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

  socket.on("leave_room", (roomID, nameLeavingRoom) => {

    const namesInRoom = [...userNamesRoom[roomID]];
    userNamesRoom[roomID] = namesInRoom.filter((name) => name !== nameLeavingRoom);
    if (userNamesRoom[roomID].length === 0) {
        delete userNamesRoom[roomID];
        delete roomLimit[roomID];
    }
    io.to(roomID).emit("room_names", userNamesRoom[roomID]);
    socket.disconnect();
  });
});

server.listen(process.env.PORT);