const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("./db"); // SQLite 데이터베이스 연결 파일

require("dotenv").config();
const SECRET_KEY = process.env.SECRET_KEY;

const router = express.Router();

// 회원가입 API
router.post("/signup", async (req, res) => {
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
router.post("/login", (req, res) => {
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

module.exports = router;
