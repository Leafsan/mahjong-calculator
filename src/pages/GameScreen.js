import React, { useState, useEffect } from "react";

function GameScreen({ players, numericPositions, host, isHost }) {
  const [points, setPoints] = useState({}); // 각 플레이어의 점수
  const [pot, setPot] = useState(0); // 공탁금
  const [extend, setExtend] = useState(0);
  const [reachedPlayers, setReachedPlayers] = useState([]); // 리치한 플레이어 목록
  const [currentRound, setCurrentRound] = useState(0);
  const [ronPlayer, setRonPlayer] = useState("");
  const [ronTarget, setRonTarget] = useState(""); // 론 대상 플레이어
  const [ronOpen, setRonOpen] = useState(false); // 론 입력창 열림 여부
  const [han, setHan] = useState(1); // 판수 (한)
  const [fu, setFu] = useState(30); // 부수 (기본 30부)

  const hanValue = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const fuValue = [20, 25, 30, 40, 50, 60, 70, 80, 90, 100, 110];
  const winds = ["동", "남", "서", "북"];

  // 게임 시작 시 초기 점수 설정
  useEffect(() => {
    const initialPoints = {};
    players.forEach((player) => {
      initialPoints[player] = 25000; // 각 플레이어의 초기 점수 25000
    });
    setPoints(initialPoints);
  }, [players]);

  // 리치 버튼 처리
  const handleReach = (player) => {
    if (points[player] >= 1000) {
      const updatedPoints = { ...points };

      if (reachedPlayers.includes(player)) {
        // 이미 리치한 경우 점수 반환
        updatedPoints[player] += 1000;
        setPot((prev) => prev - 1000);
        setReachedPlayers(reachedPlayers.filter((p) => p !== player)); // 리치 상태 해제
      } else {
        // 리치 진행
        updatedPoints[player] -= 1000;
        setPot((prev) => prev + 1000);
        setReachedPlayers([...reachedPlayers, player]); // 리치 상태 추가
      }

      setPoints(updatedPoints);
    } else {
      alert("리치를 선언하려면 최소 1000점이 필요합니다.");
    }
  };

  // 론 버튼 처리
  const handleRon = (player) => {
    setRonTarget("");
    setRonPlayer(player); // 론 대상 플레이어 설정
    setRonOpen(true); // 론 입력창 열기
  };

  // 다음 국 진행
  const handleNextRound = () => {
    setCurrentRound(currentRound + 1);
  };

  // 론 점수 계산 및 반영
  const calculateRonScore = () => {
    console.log("론 대상", ronTarget);
    if (!ronTarget) {
      alert("론할 대상을 선택해주세요.");
      return;
    }

    // 점수 계산 로직 (예시)
    const basePoints = calculateBaseScore();
    const updatedPoints = { ...points };

    const ronPoints =
      basePoints * (currentRound % 4 === numericPositions[ronPlayer] ? 6 : 4) +
      extend * 300;

    updatedPoints[ronTarget] -= ronPoints; // 론 당한 사람 점수 차감
    updatedPoints[ronPlayer] += ronPoints; // 론한 사람에게 점수 추가

    if (currentRound % 4 === numericPositions[ronPlayer]) {
      setExtend(extend + 1);
    } else {
      setExtend(0);
    }

    setPoints(updatedPoints);
    setRonOpen(false); // 론 입력창 닫기
    setRonTarget(""); // 론 대상 초기화
  };

  const calculateBaseScore = () => {
    if (han >= 13) return 8000;
    if (han >= 11) return 6000;
    if (han >= 8) return 4000;
    if (han >= 6) return 3000;
    if (han == 5 || (han == 4 && fu >= 40) || (han == 3 && fu >= 70))
      return 2000;
    return 2 ** (han + 2) * fu;
  };

  const checkRoundName = () => {
    return `${winds[Math.floor(currentRound / 4) % 4]}${
      (currentRound % 4) + 1
    }국`;
  };

  const checkPlayerWind = (numericPosition) => {
    return `${winds[(numericPosition + 4 - (currentRound % 4)) % 4]}`;
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>현재 라운드: {checkRoundName()}</h1>
      <h2>공탁금: {pot}</h2>
      <h2>연장: {extend}</h2>

      <ul>
        {players.map((player) => (
          <li key={player}>
            {player} ({checkPlayerWind(numericPositions[player])}) -{" "}
            {points[player]} 점
            {reachedPlayers.includes(player) && <strong> [리치 선언]</strong>}
            <button onClick={() => handleReach(player)}>리치</button>
            <button onClick={() => handleRon(player)}>론</button>
            <button>쯔모</button>
          </li>
        ))}
      </ul>

      {/* 론 버튼 클릭 시 론 대상, 판수, 부수를 선택할 수 있는 입력창 */}
      {ronOpen && (
        <div style={{ marginTop: "20px" }}>
          <h3>론 점수 계산</h3>
          <label>론할 대상 선택:</label>

          {players
            .filter((player) => player !== ronPlayer) // 론을 선언한 플레이어 제외
            .map((player) => (
              <div key={player}>
                <input
                  type="radio"
                  name="player"
                  value={player}
                  onChange={(e) => setRonTarget(e.target.value)}
                />
                <label>{player}</label>
              </div>
            ))}

          <div>
            <label>판수:</label>
            <select
              value={han}
              onChange={(e) => setHan(Number(e.target.value))}
            >
              {hanValue.map((value) => (
                <option key={value} value={value}>
                  {value} 판
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>부수:</label>
            <select value={fu} onChange={(e) => setFu(Number(e.target.value))}>
              {fuValue.map((value) => (
                <option key={value} value={value}>
                  {value} 부
                </option>
              ))}
            </select>
          </div>
          <button onClick={calculateRonScore}>점수 계산</button>
        </div>
      )}

      {isHost && (
        <div>
          <h3>호스트 컨트롤</h3>
          <button onClick={() => alert("유국이 선언되었습니다!")}>유국</button>
          <button onClick={() => alert("연장이 선언되었습니다.")}>연장</button>
          <button onClick={handleNextRound}>다음 국</button>
        </div>
      )}
    </div>
  );
}

export default GameScreen;
