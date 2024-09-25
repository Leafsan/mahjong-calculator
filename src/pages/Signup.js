import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const apiUrl = process.env.REACT_APP_API_URL;

  const handleSignup = () => {
    // 비밀번호 일치 확인
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }

    fetch(`${apiUrl}/api/signup`, {
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

export default Signup;
