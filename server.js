const express = require('express');
const app = express();
// const cors = require('cors');
// app.use(cors());
const server = require('http').Server(app);
const io = require('socket.io')(server); // Handle real-time communication with WebSocket
const { ExpressPeerServer } = require('peer'); // Set up a WebRTC peer server
const peerServer = ExpressPeerServer(server, { debug: true }); // Create a new PeerJS server
const { v4: uuidV4 } = require('uuid'); // Generate unique room IDs

app.use('/peerjs', peerServer);
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect(`/${uuidV4()}`); // Redirects users to a unique room generated with UUID
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room }); // Renders the `room` view, passing the room ID as a variable.
});

io.on('connection', (socket) => {
    socket.on('join-room', (roomId, userId) => { // Listens for users joining a room.
        socket.join(roomId); // Adds the user to the room.
        socket.to(roomId).broadcast.emit('user-connected', userId); // Notifies other users in the room that a new user has connected.

        socket.on('message', (message) => {
            io.to(roomId).emit('createMessage', message); // Broadcasts the message to all users in the room.
        });

        socket.on('disconnect', () => { // When a user disconnects
            socket.to(roomId).broadcast.emit('user-disconnected', userId); // Notifies all users in the room except the one who disconnected.
        });
    });

    socket.on('error', (err) => { // Error handling
        console.error(`Error: ${err.message}`);
    });
});

server.listen(process.env.PORT || 3030);
