// room.js
const express = require("express");
const jwt = require("jsonwebtoken");
const SECRET_KEY = "your_secret_key"; // JWT 토큰 생성에 사용할 비밀 키

const router = express.Router();
const rooms = {}; // 방 관리 객체

// 방 만들기 API
router.post("/createRoom", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.body;

    if (!roomId || rooms[roomId]) {
      return res.status(400).send("Room ID is invalid or already exists");
    }

    // 방 생성 및 사용자 추가 / 방 생성자는 호스트로 설정
    rooms[roomId] = {
      host: decoded.id,
      players: [decoded.id],
    };

    res
      .status(201)
      .send({ message: "Room created and joined successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 방 목록 API
router.get("/rooms", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    jwt.verify(token, SECRET_KEY);
    const roomData = Object.keys(rooms).map((roomId) => ({
      roomId,
      playerCount: rooms[roomId].players.length,
      players: rooms[roomId].players,
    }));
    res.json(roomData);
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 방 상태 반환 API
router.get("/room/:roomId", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    jwt.verify(token, SECRET_KEY);
    const roomId = req.params.roomId;
    if (!rooms[roomId]) {
      return res.status(404).send("Room not found");
    }

    res.json({ players: rooms[roomId].players, host: rooms[roomId].host });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 방에 참가 API
router.post("/joinRoom", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.body;

    if (!rooms[roomId]) {
      return res.status(404).send("Room not found");
    }

    if (rooms[roomId].players.includes(decoded.id)) {
      return res.status(200).send({ message: "Already in the room", roomId });
    }

    if (rooms[roomId].players.length >= 4) {
      return res.status(400).send("Room is full");
    }

    rooms[roomId].players.push(decoded.id);
    res.status(200).send({ message: "Joined room successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 방 나가기 API
router.post("/leaveRoom", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.body;

    if (!rooms[roomId]) {
      return res.status(404).send("Room not found");
    }

    rooms[roomId].players = rooms[roomId].players.filter(
      (id) => id !== decoded.id
    );

    if (rooms[roomId].players.length === 0) {
      delete rooms[roomId];
    }

    res.status(200).send({ message: "Left room successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

module.exports = { router, rooms };
