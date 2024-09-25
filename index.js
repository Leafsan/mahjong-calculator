const express = require("express");
const path = require("path");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const cors = require("cors");

const authRoutes = require("./auth");
const roomRoutes = require("./room").router; // 올바른 라우트 연결 확인
const socketHandler = require("./socket");

const app = express();
const port = 3000;
const server = http.createServer(app);
const io = socketIo(server);

app.use(
  cors({
    origin: "http://localhost:3001", // React 개발 서버의 URL 허용
    credentials: true, // 쿠키 및 인증 헤더 허용
  })
);

// JSON 파싱 미들웨어
app.use(bodyParser.json());

// React 정적 파일 서빙
app.use(express.static(path.join(__dirname, "build")));

// API 라우트 설정
app.use("/api", authRoutes);
app.use("/api", roomRoutes); // roomRoutes가 올바르게 설정되었는지 확인

// Socket.IO 핸들러
socketHandler(io);

// 모든 경로에서 React 앱 제공
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// 서버 실행
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
