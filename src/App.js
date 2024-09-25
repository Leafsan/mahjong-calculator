import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </Router>
  );
}

function MainPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  return <RoomList />;
}

function RoomList() {
  const [rooms, setRooms] = useState([]);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 방 목록 불러오기
  useEffect(() => {
    if (token) {
      fetch("/api/rooms", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => setRooms(data))
        .catch(() => setError("Failed to load rooms"));
    }
  }, [token]);

  // 방 클릭 시 방 참가
  const joinRoom = (roomId) => {
    fetch("/api/joinRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId }),
    })
      .then((response) => {
        if (response.ok) {
          navigate(`/room/${roomId}`); // 참가 후 방으로 이동
        } else {
          alert("Failed to join room");
        }
      })
      .catch((err) => alert("Error joining room"));
  };

  // 방 만들기
  const createRoom = () => {
    const roomId = prompt("Enter a room ID:");
    if (roomId) {
      fetch("/api/createRoom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      })
        .then((response) => {
          if (response.ok) {
            navigate(`/room/${roomId}`);
          } else {
            alert("Failed to create room");
          }
        })
        .catch((err) => alert("Error creating room"));
    }
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Active Rooms</h1>
      <ul>
        {rooms.map((room, index) => (
          <li key={index}>
            {/* 방에 4명이 있으면 버튼 비활성화 */}
            <button
              onClick={() => joinRoom(room.roomId)}
              disabled={room.playerCount >= 4}
            >
              {room.roomId} ({room.playerCount}/4 players)
            </button>
          </li>
        ))}
      </ul>
      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* 방 만들기 버튼 */}
      <button onClick={createRoom}>Create Room</button>

      {/* 로그아웃 버튼 */}
      <button onClick={logout}>Logout</button>
    </div>
  );
}

function Signup() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSignup = () => {
    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    })
      .then((response) =>
        response.text().then((message) => {
          setMessage(message);
          if (response.status === 201) {
            navigate("/login");
          }
        })
      )
      .catch((error) => {
        console.error("Error:", error);
        setMessage("Signup failed");
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Signup</h1>
      <input
        type="text"
        placeholder="ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
      />
      <button onClick={handleSignup}>Signup</button>
      <p>{message}</p>

      {/* 로그인 화면으로 돌아가는 버튼 */}
      <button onClick={() => navigate("/login")}>Back to Login</button>
    </div>
  );
}

function Login() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = () => {
    fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, password }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.token) {
          localStorage.setItem("token", data.token);
          navigate("/");
        } else {
          setMessage("Login failed");
        }
      });
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>
      <input
        type="text"
        placeholder="ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>Login</button>
      <p>{message}</p>
      <button onClick={() => navigate("/signup")}>Signup</button>
    </div>
  );
}

function Room() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [gameReady, setGameReady] = useState(false);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // 방 상태 불러오기
  useEffect(() => {
    fetch(`/api/room/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlayers(data.players);
        setGameReady(data.players.length === 4);
      });
  }, [roomId, token]);

  // 게임 시작
  const startGame = () => {
    alert("Game Started!");
  };

  // 방 나가기 처리
  const leaveRoom = () => {
    fetch("/api/leaveRoom", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ roomId }),
    })
      .then((response) => {
        if (response.ok) {
          navigate("/"); // 방 목록으로 이동
        } else {
          alert("Failed to leave room");
        }
      })
      .catch((err) => alert("Error leaving room"));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Room ID: {roomId}</h1>
      <h2>Players in room:</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>{player}</li>
        ))}
      </ul>
      <button onClick={leaveRoom}>Leave Room</button>
      <button onClick={startGame} disabled={!gameReady}>
        {gameReady ? "Start Game" : "Waiting for players..."}
      </button>
    </div>
  );
}

export default App;
