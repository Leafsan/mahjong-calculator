import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import decodeToken from "../utils/decodeToken";

const apiUrl = process.env.REACT_APP_API_URL;

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
      fetch(`${apiUrl}/api/rooms`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => setRooms(data))
        .catch(() => setError("Failed to load rooms"));
    }
  }, [token]);

  // 방 만들기
  const createRoom = () => {
    const roomId = prompt("Enter a room ID:");
    if (roomId) {
      fetch(`${apiUrl}/api/createRoom`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      })
        .then((response) => {
          if (response.ok) {
            navigate(`/room/${roomId}`); // 방으로 이동
          } else {
            alert("Failed to create room");
          }
        })
        .catch((err) => alert("Error creating room"));
    }
  };

  // 테스트 방 만들기 (개발 환경에서만)
  const createTestRoom = () => {
    const roomId = "test_room"; // 테스트 방 ID 고정
    fetch(`${apiUrl}/api/createTestRoom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({ roomId }),
    })
      .then((response) => {
        if (response.ok) {
          navigate(`/room/${roomId}`); // 테스트 방으로 이동
        } else {
          alert("Failed to create test room");
        }
      })
      .catch((err) => alert("Error creating test room"));
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Active Rooms</h1>
      <ul>
        {rooms.map((room, index) => (
          <li key={index}>
            <button
              onClick={() => navigate(`/room/${room.roomId}`)}
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

      {/* 테스트 방 만들기 버튼 (개발 환경에서만 노출) */}
      {process.env.REACT_APP_NODE_ENV === "development" && (
        <button onClick={createTestRoom}>Create Test Room</button>
      )}

      {/* 로그아웃 버튼 */}
      <button onClick={() => navigate("/login")}>Logout</button>
    </div>
  );
}

export default MainPage;
