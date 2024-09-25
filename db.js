const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 데이터베이스 파일 경로 설정
const dbPath = path.resolve(__dirname, "database.sqlite");
const db = new sqlite3.Database(dbPath);

// 사용자 테이블 생성
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      password TEXT NOT NULL
    )
  `);
});

module.exports = db;
