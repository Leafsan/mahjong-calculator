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

    // 점수 변화 이벤트 처리
    socket.on("updateScore", (data) => {
      const { roomId, playerId, changeAmount, reason } = data;

      // 방이 존재하는지 확인
      if (!rooms[roomId]) {
        socket.emit("error", { message: "Room not found" });
        return;
      }

      // 플레이어 점수 업데이트 (changeAmount에 따라 증감)
      rooms[roomId].players.forEach((player) => {
        if (player.id === playerId) {
          player.points += changeAmount; // 점수 변경
        }
      });

      // 탁자(공탁금) 점수 업데이트: 특정 이유일 경우에만 (리치 등)
      if (reason === "reach") {
        if (!rooms[roomId].pot) {
          rooms[roomId].pot = 0;
        }
        rooms[roomId].pot += 1000; // 리치 시 공탁금 추가
      }

      // 해당 방의 모든 유저에게 점수 업데이트 이벤트 전송
      io.to(roomId).emit("updateScores", {
        players: rooms[roomId].players,
        pot: rooms[roomId].pot, // 탁자(공탁금)도 포함해서 전송
      });
    });

    // 사용자가 연결 해제 시 방에서 제거
    socket.on("disconnect", () => {
      for (const roomId in rooms) {
        rooms[roomId].players = rooms[roomId].players.filter(
          (id) => id !== socket.id
        );

        // 호스트가 나가면 다음 사람을 호스트로 지정
        if (rooms[roomId].host === socket.id) {
          if (rooms[roomId].players.length > 0) {
            rooms[roomId].host = rooms[roomId].players[0]; // 첫 번째 남은 사람을 호스트로 지정
          } else {
            delete rooms[roomId]; // 방에 아무도 없으면 방 삭제
          }
        } else if (rooms[roomId].players.length > 0) {
          io.to(roomId).emit("updateRoom", rooms[roomId]); // 방 정보 업데이트
        }
      }
      console.log(`User ${socket.id} disconnected`);
    });
  });
}

module.exports = socketHandler;
