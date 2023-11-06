const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
const path = require("path");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  },
});
const { ExpressPeerServer } = require("peer");
const { config } = require("dotenv");
config();
const opinions = {
  debug: true,
};

app.use("/peerjs", ExpressPeerServer(server, opinions));
// app.use(express.static("public"));
app.use("/join-meeting", express.static(path.join(__dirname, "public")));
``;

// app.get("/", (req, res) => {
//   res.redirect(`/${uuidv4()}`);
// });

// app.get("/:room", (req, res) => {
//   res.render("room", { roomId: req.params.room });
// });

// app.get("/create-meeting/:id", (req, res) => {
//   res.render("create-meeting", { roomId: req.params.id });
// });

app.get("/join-meeting", (req, res) => {
  res.render("join-meeting", {
    live_url: process.env.LIVE_URL,
  });
  // io.on("connection",(socket)=>{
  //   console.log('User Connected')
  // });
});

// io.on("connection", (socket) => {
//   socket.on("join-room", (roomId, userId, userName) => {
//     socket.join(roomId);
//     setTimeout(() => {
//       socket.to(roomId).emit("user-connected", userId);
//     }, 1000);
//     socket.on("message", (message) => {
//       io.to(roomId).emit("createMessage", message, userName);
//     });
//     socket.on("leave-room", (roomId) => {
//       socket.leave(roomId);
//       // socket.to(roomId).emit("user-disconnected", userId);
//     });
//     socket.on("disconnect", () => {
//       socket.leave(roomId);
//       socket.to(roomId).emit("user-disconnected", userId);
//     });
//   });
// });

let availableUser = [];
let rooms = [];

// app.get("/", (req, res) => {
//   // console.log(availableUser);
//   // return res.send(availableUser);
//   return res.render("start");
// });

app.get("/user", (req, res) => {
  console.log(availableUser);
});

app.get("/room", (req, res) => {
  return res.send(rooms);
});

const meetingIo = io.of("/meeting");

meetingIo.on("connection", (socket) => {
  // console.log('User connected');
  // let rooms = io.sockets.adapter.rooms;
  // console.log(rooms)
  // socket.on("create-meeting",(roomId)=>{
  //   socket.join(roomId);
  // });
  // socket.on("disconnect",()=>{
  //   console.log('user disconected')
  // });
  // socket.on("join-room", (roomId, userId, userName) => {
  //   console.log(roomId, ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
  //   console.log(userId + " join a room " + roomId);
  //   socket.join(roomId);
  //   setTimeout(() => {
  //     socket.to(roomId).emit("user-connected", userId);
  //   }, 1000);
  //   socket.on("message", (message) => {
  //     console.log("message is ", message);
  //     meetingIo.to(roomId).emit("createMessage", message, userName);
  //   });
  //   socket.on("leave-room", (roomID) => {
  //     console.log("leave room ", roomID);
  //     socket.leave(roomID);
  //     meetingIo.to(roomID).emit("user-disconnected", userId);
  //   });
  //   socket.on("disconnect", () => {
  //     console.log("User disconnected ", userId);
  //     socket.leave(roomId);
  //     meetingIo.to(roomId).emit("user-disconnected", userId);
  //   });
  // });

  //................................................................................................................

  socket.on("user-connect", (userId) => {
    // console.log(socket.id)d], "sdfsdfdsfddsdfsdfsddd");
    // const targetSocket = io.sockets.sockets[socket.id];
    // io.sockets.sockets[targetSocket].join('roomName');
    // console.log(io.sockets[socket.io])
    console.log("New user connected ", userId);
    availableUser.push({
      socketId: socket.id,
      userId,
      isOn: false,
      socket,
    });
    console.log("Online user", availableUser.length);
    meetingIo.emit("online-user", availableUser.length);

    socket.on("random", () => {
      console.log("random userrrrrrrrrrrrrrrrr");
      let filterOnlineUser = availableUser.filter((e) => !e.isOn);
      let randomUser = Math.floor(Math.random() * filterOnlineUser.length);
      let otherUser = filterOnlineUser[randomUser];
      // if (otherUser?.socketId == socket.id) {
      //   randomUser = Math.floor(Math.random() * filterOnlineUser.length);
      //   otherUser = filterOnlineUser[randomUser];
      // }
      if (!otherUser || otherUser.socketId === socket.id) {
        // let mySocketIndex = availableUser.findIndex(
        //   (e) => e.socket === socket.id
        // );
        // let randomSocketIndex = availableUser.findIndex(e=>e.socket === otherUser.socket);
        // if (otherUser.socketId === socket.id) {
        //   console.log("Please try later.. no user found on online");
        //   // socket.emit("retryRandom", true);
        //   return socket.emit(
        //     "alertMessage",
        //     "Please try later.. no user found on online"
        //   );
        // }
        console.log("No user found or same user found, retrying...");
        // return socket.emit("retryRandom", true);
        return;
      }
      let roomId = uuidv4();
      console.log(roomId, "room ID");
      otherSocket = otherUser?.socket;
      socket.join(roomId);
      otherSocket.join(roomId);
      rooms.push({
        roomId,
        userId,
        otherUser: otherUser?.userId,
      });

      availableUser.map((e) => {
        if (e.socketId === socket.id) {
          console.log("inside the if cond");
          e.isOn = true;
        } else if (e.socketId === otherUser?.socketId) {
          console.log("inside the else if");
          e.isOn = true;
        }
      });
      console.log("random user selected", otherUser?.userId);
      socket.emit("random-user", otherUser?.userId);
      meetingIo.to(roomId).emit("retryRandom", true);
    });

    // socket.on("message", (message) => {
    //   rooms.filter((e) => {
    //     if (e.userId == userId || e.otherUser == userId) {
    //       meetingIo.to(e.roomId).emit("createMessage", message, userId);
    //     }
    //   });
    // });

    socket.on("random-leave", () => {
      console.log("user leave ", userId);
      console.log("user iddddd", userId);
      rooms = rooms.filter((e) => {
        if (e.userId == userId || e.otherUser == userId) {
          meetingIo.to(e.roomId).emit("leave", e.roomId);
          return false;
        } else return true;
      });
      // availableUser.map((e) => {
      //   if (e.socketId === socket.id) {
      //     e.isOn = false;
      //   } else if (e.userId === userId) {
      //     e.isOn = false;
      //   }
      // });
    });

    socket.on("leave-all", (roomID) => {
      availableUser.filter((e) => {
        if (e.socketId === socket.id) {
          meetingIo.to(roomID).emit("user-disconnected", e.userId);
        }
      });
      socket.leave(roomID);
    });
    socket.on("disconnect", () => {
      // let mySocketIndex = availableUser.findIndex((e) => {
      //   return e.socketId == socket.id;
      // });
      // console.log(availableUser, "availbe user");
      // if (mySocketIndex) {
      //   console.log("User disconnected", mySocketIndex.userId);
      //   availableUser.splice(mySocketIndex, 1);
      // }
      // console.log("Online user dfdfd", availableUser.length);
      // meetingIo.emit("online-user", availableUser.length);
      //......................... Phase 2 .....................................

      rooms = rooms.filter((e) => {
        if (e.userId == userId || e.otherUser == userId) {
          meetingIo.to(e.roomId).emit("leave", e.roomId);
          return false;
        } else return true;
      });
      let mySocketIndex = availableUser.findIndex((e) => {
        return e.socketId == socket.id;
      });
      if (mySocketIndex > -1) {
        console.log("User disconnected");
        availableUser.splice(mySocketIndex, 1);
      }
    });
  });
});

server.listen(process.env.PORT || 3030);
