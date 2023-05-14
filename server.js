const express = require("express");
const socketio = require("socket.io");
const app = express();
const dotenv = require("dotenv").config();
const cors = require("cors");
app.use(cors());
const httpServer = require("http").createServer(app);
const io = require("socket.io")(httpServer, {
    cors: {
      origin: "http://localhost:5001"
    }
  });
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("views"));

app.get("/", (req, res) => {
    res.render("index");
});

httpServer.listen(process.env.PORT || 5001, () => {
    console.log(`Server is running at ${httpServer.address().address}:${httpServer.address().port}`);
});

io.on("connection", (socket) => {
    socket.on("new-user", (name) => {
        socket.emit("user-connected", name);
    }
    );

    socket.on("message", (data) => {

        io.sockets.emit("message", {
            sender: data.sender,
            message: data.message
        });
        
    }
    );

    socket.on("disconnect", () => {
        socket.emit("user-disconnected");
    }
    );
});


/* client side 
(function io(){
            document.querySelector('.chat-display').scrollTop = document.querySelector('.chat-display').scrollHeight;
            const socket = io('http://localhost:3000');
            const sender = document.getElementById('sender');
            const inputMgs = document.getElementById('inputMgs');
            const send = document.getElementById('send');
            const chatDisplay = document.querySelector('.chat-display');
            const chatLeft = document.querySelector('.chat-left');
            const chatRight = document.querySelector('.chat-right');

            // get sender name
            sender.value = prompt('Enter your name');
            socket.on('connect', () => {
                socket.emit('new-user', sender.value);
            }
            );

            // send message
            send.addEventListener('click', (e) => {
                e.preventDefault();
                if(inputMgs.value != ''){
                    socket.emit('message', {
                        sender: sender.value,
                        message: inputMgs.value
                    });
                    inputMgs.value = '';
                }
            });

            // receive message
            socket.on('message', (data) => {
                if(data.sender == sender.value){
                    chatRight.innerHTML += `
                        <div class="chat-message">
                            <p class="chat-sender">${data.sender}</p>
                            <p class="chat-msg">${data.message}</p>
                        </div>
                    `;
                }else{
                    chatLeft.innerHTML += `
                        <div class="chat-message">
                            <p class="chat-sender">${data.sender}</p>
                            <p class="chat-msg">${data.message}</p>
                        </div>
                    `;
                }
            });

            // auto scroll
            chatDisplay.scrollTop = chatDisplay.scrollHeight;
        })();

*/
