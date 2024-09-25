import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import decodeToken from "../utils/decodeToken";
import GameScreen from "./GameScreen"; // 게임 화면 컴포넌트

const positionsList = ["동", "남", "서", "북"]; // 포지션 목록
const apiUrl = process.env.REACT_APP_API_URL;

function Room() {
  const { roomId } = useParams();
  const [players, setPlayers] = useState([]);
  const [positions, setPositions] = useState({}); // 플레이어들의 위치 (동,남,서,북)
  const [sortedPlayers, setSortedPlayers] = useState([]); // 포지션에 따른 플레이어 순서
  const [numericPositions, setNumericPositions] = useState({}); // 숫자로 변환된 포지션
  const [gameReady, setGameReady] = useState(false);
  const [isHost, setIsHost] = useState(false); // 호스트 여부
  const [host, setHost] = useState(""); // 호스트 ID
  const [gameStarted, setGameStarted] = useState(false); // 게임 시작 여부
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const decodedToken = decodeToken(token);
  const userId = decodedToken?.id;

  // 방 상태 불러오기
  useEffect(() => {
    fetch(`${apiUrl}/api/room/${roomId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlayers(data.players);
        setHost(data.host);
        setIsHost(data.host === userId); // 현재 사용자가 호스트인지 확인
        setGameReady(data.players.length === 4); // 플레이어가 4명일 때만 게임 시작 가능
        setGameStarted(data.gameStarted); // 게임 시작 여부 확인

        // 플레이어가 들어온 순서대로 포지션 할당 (동,남,서,북)
        const initialPositions = {};
        const initialNumericPositions = {}; // 숫자로 변환된 포지션
        data.players.forEach((player, index) => {
          initialPositions[player] = positionsList[index]; // 포지션 할당
          initialNumericPositions[player] = index; // 숫자로 변환
        });
        setPositions(initialPositions);
        setNumericPositions(initialNumericPositions);

        // 포지션에 따라 플레이어를 정렬
        const sorted = data.players.sort((a, b) => {
          return numericPositions[a] - numericPositions[b];
        });
        setSortedPlayers(sorted);
      });
  }, [roomId, token, userId]);

  // 플레이어 위치 변경 핸들러
  const handlePositionChange = (player, newPosition) => {
    // 기존 포지션과 교체
    const currentPositionOfNew = Object.keys(positions).find(
      (key) => positions[key] === newPosition
    );
    const updatedPositions = { ...positions };
    const updatedNumericPositions = { ...numericPositions };

    // 교체할 플레이어의 포지션을 맞바꾸기
    updatedPositions[currentPositionOfNew] = positions[player];
    updatedPositions[player] = newPosition;

    // 숫자 포지션도 교체
    updatedNumericPositions[currentPositionOfNew] = numericPositions[player];
    updatedNumericPositions[player] = positionsList.indexOf(newPosition);

    setPositions(updatedPositions);
    setNumericPositions(updatedNumericPositions);

    // 포지션 변경 후 정렬된 플레이어 목록 업데이트
    const sorted = players.sort((a, b) => {
      return updatedNumericPositions[a] - updatedNumericPositions[b];
    });
    setSortedPlayers(sorted);
  };

  // 게임 시작 핸들러
  const startGame = () => {
    if (isHost) {
      fetch(`${apiUrl}/api/startGame`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ roomId }),
      })
        .then((response) => {
          if (response.ok) {
            setGameStarted(true); // 게임 시작 상태로 전환
          } else {
            alert("Failed to start game");
          }
        })
        .catch((err) => alert("Error starting game"));
    } else {
      alert("Only the host can start the game");
    }
  };

  // 방 나가기 처리
  const leaveRoom = () => {
    fetch(`${apiUrl}/api/leaveRoom`, {
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

  return gameStarted ? (
    <GameScreen
      players={sortedPlayers} // 정렬된 플레이어 순서 전달
      numericPositions={numericPositions} // 숫자 포지션 전달
      host={host}
      isHost={isHost}
    />
  ) : (
    <div style={{ padding: "20px" }}>
      <h1>Room ID: {roomId}</h1>
      <h2>Players in room:</h2>
      <ul>
        {players.map((player, index) => (
          <li key={index}>
            {player} {player === host && <strong> (호스트)</strong>}
            {/* 모든 플레이어는 자신의 포지션을 볼 수 있지만, 호스트만 변경 가능 */}
            {isHost ? (
              <select
                value={positions[player] || ""}
                onChange={(e) => handlePositionChange(player, e.target.value)}
              >
                {positionsList.map((position) => (
                  <option key={position} value={position}>
                    {position}
                  </option>
                ))}
              </select>
            ) : (
              <span>{positions[player]}</span> // 호스트가 아니면 포지션만 표시
            )}
          </li>
        ))}
      </ul>

      <button onClick={leaveRoom}>Leave Room</button>

      {/* 게임 시작 버튼: 호스트만 가능, 4명이 다 찼을 때만 가능 */}
      <button
        onClick={startGame}
        disabled={!gameReady || !isHost || Object.keys(positions).length !== 4}
      >
        {isHost && gameReady
          ? "Start Game"
          : !isHost
          ? "Only the host can start the game"
          : "Waiting for players..."}
      </button>
    </div>
  );
}

export default Room;
