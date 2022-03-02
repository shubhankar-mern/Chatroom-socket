const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const formatMessages = require('./utils/messeges');
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);
const botName = 'chatCord_Bot';

const port = 8000 || process.env.PORT;
//serve static files
app.use(express.static(path.join(__dirname, 'public')));
//onsole.log(path.join(__dirname, 'public'));
//make server listen

//run whne client connetcts
io.on('connection', (socket) => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = userJoin(socket.id, username, room);

    socket.join(user.room);
    //welcome current user
    socket.emit('message', formatMessages(botName, 'Welcome to ChatCord!'));
    //Broadcast when user connects//io.emit() to all clients
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessages(botName, `${user.username} has joined the chata`)
      ); //emits to everyone except the guy who is connectiong
    //when client disconnects
    //send user and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for chat msg
  socket.on('chatMessage', (msg) => {
    const user = getCurrentUser(socket.id);
    io.to(user.room).emit('message', formatMessages(user.username, msg));
  });

  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessages(botName, `A ${user.username} has left the chat`)
      );
      //send user and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(port, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`server running on ${port}`);
  }
});
