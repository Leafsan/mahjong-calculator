const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bodyParser = require("body-parser");
const db = require("./db"); // SQLite 데이터베이스 연결 파일
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const port = 3000;
const SECRET_KEY = "your_secret_key"; // JWT 토큰 생성에 사용할 비밀 키

// HTTP 서버와 Socket.IO 설정
const server = http.createServer(app);
const io = socketIo(server);

// 방 관리 객체
const rooms = {};

// JSON 파싱 미들웨어
app.use(bodyParser.json());

// React 정적 파일 서빙
app.use(express.static(path.join(__dirname, "build")));

// 회원가입 API
app.post("/api/signup", async (req, res) => {
  const { id, password } = req.body;
  if (!id || !password) {
    return res.status(400).send("ID and password are required");
  }

  db.get("SELECT id FROM users WHERE id = ?", [id], async (err, row) => {
    if (err) return res.status(500).send("Internal server error");
    if (row) return res.status(400).send("User already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      "INSERT INTO users (id, password) VALUES (?, ?)",
      [id, hashedPassword],
      (err) => {
        if (err) return res.status(500).send("Failed to register user");
        res.status(201).send("User registered successfully");
      }
    );
  });
});

// 로그인 API
app.post("/api/login", (req, res) => {
  const { id, password } = req.body;

  db.get(
    "SELECT id, password FROM users WHERE id = ?",
    [id],
    async (err, user) => {
      if (err) return res.status(500).send("Internal server error");
      if (!user) return res.status(400).send("User not found");

      const isPasswordCorrect = await bcrypt.compare(password, user.password);
      if (!isPasswordCorrect) {
        return res.status(400).send("Invalid password");
      }

      const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: "1h" });
      res.json({ token });
    }
  );
});

// 방 만들기
app.post("/api/createRoom", (req, res) => {
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

    // 방 생성
    rooms[roomId] = [];

    // 방을 생성한 사용자를 자동으로 방에 추가
    rooms[roomId].push(decoded.id);

    res
      .status(201)
      .send({ message: "Room created and joined successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});
// 방 목록 API (방의 플레이어 수도 함께 반환)
app.get("/api/rooms", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    jwt.verify(token, SECRET_KEY);
    const roomData = Object.keys(rooms).map((roomId) => ({
      roomId,
      playerCount: rooms[roomId].length,
    }));
    res.json(roomData);
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 특정 방의 상태를 반환하는 API
app.get("/api/room/:roomId", (req, res) => {
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
    res.json({ players: rooms[roomId] });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// Socket.IO를 이용한 방 관리 (게임 시작 로직 포함)
io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createRoom", (roomId) => {
    if (!roomId || roomId.trim() === "") {
      socket.emit("invalidRoomId", "Room ID cannot be empty");
      return;
    }

    if (!rooms[roomId]) {
      rooms[roomId] = [];
    }

    if (rooms[roomId].length < 4) {
      rooms[roomId].push(socket.id);
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      io.to(roomId).emit("updateRoom", rooms[roomId]);

      if (rooms[roomId].length === 4) {
        io.to(roomId).emit("roomReady");
      }
    } else {
      socket.emit("roomFull");
    }
  });

  // 사용자가 연결 해제 시 방에서 제거
  socket.on("disconnect", () => {
    for (const roomId in rooms) {
      rooms[roomId] = rooms[roomId].filter((id) => id !== socket.id);
      if (rooms[roomId].length === 0) {
        delete rooms[roomId];
      } else {
        io.to(roomId).emit("updateRoom", rooms[roomId]);
      }
    }
    console.log(`User ${socket.id} disconnected`);
  });
});

// 모든 경로에서 React 앱 제공
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// 방에 참가하는 API
app.post("/api/joinRoom", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  // 토큰 검증
  if (!token) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { roomId } = req.body;

    if (!rooms[roomId]) {
      return res.status(404).send("Room not found");
    }

    // 이미 방에 속해 있는지 확인
    if (rooms[roomId].includes(decoded.id)) {
      return res.status(200).send({ message: "Already in the room", roomId });
    }

    // 방에 참가할 수 있는지 확인 (최대 4명)
    if (rooms[roomId].length >= 4) {
      return res.status(400).send("Room is full");
    }

    // 방에 사용자 추가
    rooms[roomId].push(decoded.id);
    res.status(200).send({ message: "Joined room successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});
// 방에서 나가기 API
app.post("/api/leaveRoom", (req, res) => {
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
    rooms[roomId] = rooms[roomId].filter((id) => id !== decoded.id);

    // 방에 남아있는 사용자가 없으면 방 삭제
    if (rooms[roomId].length === 0) {
      delete rooms[roomId];
    }

    res.status(200).send({ message: "Left room successfully", roomId });
  } catch (error) {
    res.status(401).send("Invalid token");
  }
});

// 서버 실행
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
