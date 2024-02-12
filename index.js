// backend/index.js

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite database
const db = new sqlite3.Database(":memory:");

// Create tables
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      type TEXT NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
});

app.use(cors());
app.use(bodyParser.json());

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get("/api", (req, res) => {
  res.json({ user: ["userOne", "userTwo", "userThree"] });
});

// Routes
app.post("/login", (req, res) => {
  // Authenticate user (mock implementation)
  const { username, password } = req.body;
  if (username === "admin" && password === "admin123") {
    const accessToken = jwt.sign(
      { username: username },
      process.env.ACCESS_TOKEN_SECRET
    );
    res.json({ accessToken });
  } else {
    res.sendStatus(401);
  }
});

app.get("/transactions", authenticateToken, (req, res) => {
  // Fetch transactions for authenticated user (mock implementation)
  const userId = req.user.id;
  db.all("SELECT * FROM transactions WHERE userId = ?", userId, (err, rows) => {
    if (err) {
      console.error(err.message);
      res.sendStatus(500);
    } else {
      res.json(rows);
    }
  });
});

app.post("/transactions", authenticateToken, (req, res) => {
  // Add new transaction for authenticated user (mock implementation)
  const userId = req.user.id;
  const { title, amount, type } = req.body;
  db.run(
    "INSERT INTO transactions (userId, title, amount, type) VALUES (?, ?, ?, ?)",
    [userId, title, amount, type],
    function (err) {
      if (err) {
        console.error(err.message);
        res.sendStatus(500);
      } else {
        res.json({ id: this.lastID });
      }
    }
  );
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
