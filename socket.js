// socket.js
const { rooms } = require("./room");

function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("createRoom", (roomId) => {
      if (!roomId || roomId.trim() === "") {
        socket.emit("invalidRoomId", "Room ID cannot be empty");
        return;
      }

      if (!rooms[roomId]) {
        rooms[roomId] = {
          host: socket.id,
          players: [socket.id],
        };
      }

      if (rooms[roomId].players.length < 4) {
        rooms[roomId].players.push(socket.id);
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);
        io.to(roomId).emit("updateRoom", rooms[roomId]);

        if (rooms[roomId].players.length === 4) {
          io.to(roomId).emit("roomReady");
        }
      } else {
        socket.emit("roomFull");
      }
    });

    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        rooms[roomId].players = rooms[roomId].players.filter(
          (id) => id !== socket.id
        );
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
        } else {
          io.to(roomId).emit("updateRoom", rooms[roomId]);
        }
      }
      console.log(`User ${socket.id} disconnected`);
    });
  });
}

module.exports = socketHandler;
