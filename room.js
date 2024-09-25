const express = require("express");
const jwt = require("jsonwebtoken");

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

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
      gameStarted: false, // 게임 시작 여부 추가
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
      gameStarted: rooms[roomId].gameStarted, // 게임 시작 여부 반환
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

    res.json({
      players: rooms[roomId].players,
      host: rooms[roomId].host,
      gameStarted: rooms[roomId].gameStarted, // 게임 시작 상태 반환
    });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 게임 시작 API
router.post("/startGame", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { roomId } = req.body;

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);

    if (!rooms[roomId]) {
      return res.status(404).send("Room not found");
    }

    if (rooms[roomId].host !== decoded.id) {
      return res.status(403).send("Only the host can start the game");
    }

    rooms[roomId].gameStarted = true; // 게임 시작 상태로 전환
    res.status(200).send({ message: "Game started successfully" });
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

    // 사용자를 방에서 제거
    rooms[roomId].players = rooms[roomId].players.filter(
      (id) => id !== decoded.id
    );

    // 호스트가 나가면 남아있는 첫 번째 사람을 새로운 호스트로 지정
    if (rooms[roomId].host === decoded.id) {
      if (rooms[roomId].players.length > 0) {
        rooms[roomId].host = rooms[roomId].players[0]; // 첫 번째 남은 사람을 호스트로 지정
      } else {
        delete rooms[roomId]; // 방에 아무도 남지 않았으면 방 삭제
      }
    }

    res.status(200).send({ message: "Left room successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// test code area
// 테스트용 방 생성 API (첫 번째 유저는 현재 로그인한 계정으로, 나머지는 가상 유저)
router.post("/createTestRoom", (req, res) => {
  // 이 API는 개발 환경에서만 동작하게 설정
  if (process.env.NODE_ENV !== "development") {
    return res.status(403).send("Forbidden");
  }

  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    // JWT 토큰에서 현재 로그인한 유저 정보 추출
    const decoded = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.body;

    if (!roomId || rooms[roomId]) {
      return res.status(400).send("Room ID is invalid or already exists");
    }

    // 4명의 유저로 가득 찬 방 생성, 첫 번째 유저는 현재 로그인한 유저
    rooms[roomId] = {
      host: decoded.id, // 첫 번째 유저는 현재 로그인한 유저로 설정
      players: [decoded.id, "test_user_2", "test_user_3", "test_user_4"],
      gameStarted: false,
      pot: 0,
    };

    res.status(201).send({ message: "Test room created successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

module.exports = { router, rooms };
