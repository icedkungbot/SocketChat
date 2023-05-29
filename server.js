const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const ejs = require("ejs");

const httpServer = require("http").createServer(app);

app.use(cors());
app.set("view engine", "ejs");
app.set("views", "./views");
app.use(express.static("./public"));
app.use(express.static("./views"));

app.get("/", (req, res) => {
    res.redirect("/joinorcreate");
});

app.get("/joinorcreate", (req, res) => {
    res.render("joinorcreate");
});

app.get("/healthz", (req, res) => {
    res.status(200).send("OK");
});

app.get("/chatroom", (req, res) => {
    let username = req.query.username;
    let roomId = req.query.roomcode;
    if(username == null || username == undefined || username == ""){
        username = "Anonymous#"+ Math.floor(Math.random() * 1000000) ;
    }
    if(roomId == null || roomId == undefined || roomId == "" || roomId == 'new_room'){
        roomId = Math.floor(Math.random() * 1000000);
        console.log("Room created : ", roomId);
        activeRooms.push(roomId);
    }
    if(activeUsers.includes({username: username, roomId: roomId})){
        username = username + "#" + Math.floor(Math.random() * 1000);
        activeUsers.push({username: username, roomId: roomId});
        res.render("chatroom", { username: username, roomId: roomId });
    }else{
        activeUsers.push({username: username, roomId: roomId});
        res.render("chatroom", { username: username, roomId: roomId });
    }
});

app.get("/admin", (req, res) => {
    res.render("admin", {accessKey : process.env.ACCESS_KEY});
});

httpServer.listen(process.env.PORT || 8080, () => {
    console.log(`Server is running at ${httpServer.address().address}:${httpServer.address().port}`);
});


let activeRooms = [];
let activeUsers = [];


const io = require("socket.io")(httpServer, {
    cors: {
        origins: ["http://localhost:8080","https://tiget-roomchat.onrender.com/","*",]
    },
    handlePreflightRequest: (req, res) => {
        const headers = {
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Origin": "*", //or the specific origin you want to give access to,
            "Access-Control-Allow-Credentials": true
        };
        res.writeHead(200, headers);
        res.end();
    }
});

io.on("connection", (socket) => {

    socket.on("join-room", ({roomId, username}) => {
        
            socket.join(roomId);
            socket.to(roomId).emit("user-connected", username);
            socket.emit("check-room", roomId);
            console.log(`User ${username} connected to room ${roomId}`);
            socket.broadcast.emit("admin-console", {socketId: socket.id,socketOn:"join-room", msg: `User ${username} connected to room ${roomId}`});
            socket.on("message", (data) => {
            io.to(roomId).emit("message", {
                sender: data.sender,
                message: data.message
            });
        });
        
        
    }
    );

    socket.on("leave-room", ({roomId, username}) => {
        console.log(`User ${username} disconnected from room ${roomId}`);
        activeUsers.splice(activeUsers.indexOf({username: username, roomId: roomId}), 1);
        socket.broadcast.emit("admin-console", {socketId: socket.id,socketOn:"leave-room", msg: `User ${username} disconnected from room ${roomId}`});
        socket.leave(roomId);
        socket.to(roomId).emit("user-disconnected", username);
        socket.emit("check-room", roomId);
    }
    );
    socket.on("disconnect", () => {
        socket.broadcast.emit("disconnected");
    }
    );

    //if no one is in the room, delete the room from the activeRooms array and delete the room from the server
    socket.on("check-room", (roomId) => {
        console.log("Checking room : ", roomId);
        console.log("Room size : ", io.sockets.adapter.rooms.get(roomId).size);
        if(io.sockets.adapter.rooms.get(roomId).size == 0){
            activeRooms.splice(activeRooms.indexOf(roomId), 1);
            io.of("/").in(roomId).clients((error, socketIds) => {
                if (error) throw error;
                socketIds.forEach(socketId => io.sockets.sockets[socketId].leave(roomId));
                console.log("Room deleted : ", roomId);
                socket.broadcast.emit("admin-console", {socketId: socket.id,socketOn:"check-room", msg: `Room deleted : ${roomId}`});
            }
            );
    }});

    socket.on("get-active-rooms", () => {
        socket.emit("active-rooms", activeRooms);
    }
    );
}
);