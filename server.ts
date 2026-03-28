import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("quiz_v2.db");
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student'
  );

  CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    createdBy INTEGER,
    FOREIGN KEY(createdBy) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS chapters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    courseId INTEGER NOT NULL,
    name TEXT NOT NULL,
    FOREIGN KEY(courseId) REFERENCES courses(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quizzes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    chapterId INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    passingScore INTEGER DEFAULT 70,
    isPublished INTEGER DEFAULT 0,
    FOREIGN KEY(chapterId) REFERENCES chapters(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quizId INTEGER NOT NULL,
    questionText TEXT NOT NULL,
    image TEXT,
    codeSnippet TEXT,
    programmingLanguage TEXT,
    options TEXT NOT NULL, -- JSON string
    numberOfCorrectAnswers INTEGER DEFAULT 1,
    "order" INTEGER DEFAULT 0,
    FOREIGN KEY(quizId) REFERENCES quizzes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS quiz_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    quizId INTEGER NOT NULL,
    score INTEGER NOT NULL,
    totalQuestions INTEGER NOT NULL,
    timeSpent INTEGER NOT NULL,
    isPassed INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(quizId) REFERENCES quizzes(id)
  );
`);

// Seed an admin user if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE email = ?").get("admin@gmail.com");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin@123", 10);
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run("Admin User", "admin@gmail.com", hashedPassword, "admin");
}

// Middleware for authentication
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: "Admin access required" });
  next();
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // --- Authentication ---
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const info = db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run(name, email, hashedPassword, role || 'student');
      const token = jwt.sign({ id: info.lastInsertRowid, email, role: role || 'student' }, JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ token, user: { id: info.lastInsertRowid, name, email, role: role || 'student' } });
    } catch (error) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  // --- Admin - Courses ---
  app.post("/api/admin/courses", authenticateToken, isAdmin, (req, res) => {
    const { name, description } = req.body;
    const info = db.prepare("INSERT INTO courses (name, description, createdBy) VALUES (?, ?, ?)").run(name, description, req.user.id);
    res.status(201).json({ id: info.lastInsertRowid, name, description });
  });

  app.get("/api/admin/courses", authenticateToken, isAdmin, (req, res) => {
    const courses = db.prepare("SELECT * FROM courses").all();
    res.json(courses);
  });

  app.delete("/api/admin/courses/:courseId", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.courseId);
    res.json({ success: true });
  });

  // --- Admin - Chapters ---
  app.post("/api/admin/chapters", authenticateToken, isAdmin, (req, res) => {
    const { courseId, name } = req.body;
    const info = db.prepare("INSERT INTO chapters (courseId, name) VALUES (?, ?)").run(courseId, name);
    res.status(201).json({ id: info.lastInsertRowid, courseId, name });
  });

  app.get("/api/admin/chapters/:courseId", authenticateToken, isAdmin, (req, res) => {
    const chapters = db.prepare("SELECT * FROM chapters WHERE courseId = ?").all(req.params.courseId);
    res.json(chapters);
  });

  app.delete("/api/admin/chapters/:chapterId", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM chapters WHERE id = ?").run(req.params.chapterId);
    res.json({ success: true });
  });

  // --- Admin - Quizzes ---
  app.post("/api/admin/quizzes", authenticateToken, isAdmin, (req, res) => {
    const { chapterId, title, description, passingScore } = req.body;
    const info = db.prepare("INSERT INTO quizzes (chapterId, title, description, passingScore) VALUES (?, ?, ?, ?)").run(chapterId, title, description, passingScore || 70);
    res.status(201).json({ id: info.lastInsertRowid, chapterId, title, description, passingScore });
  });

  app.get("/api/admin/quizzes/:chapterId", authenticateToken, isAdmin, (req, res) => {
    const quizzes = db.prepare("SELECT * FROM quizzes WHERE chapterId = ?").all(req.params.chapterId);
    res.json(quizzes);
  });

  app.get("/api/admin/all-quizzes", authenticateToken, isAdmin, (req, res) => {
    const quizzes = db.prepare(`
      SELECT q.*, c.name as chapterName, co.name as courseName 
      FROM quizzes q
      JOIN chapters c ON q.chapterId = c.id
      JOIN courses co ON c.courseId = co.id
    `).all();
    res.json(quizzes);
  });

  app.patch("/api/admin/quizzes/:quizId/publish", authenticateToken, isAdmin, (req, res) => {
    const { isPublished } = req.body;
    db.prepare("UPDATE quizzes SET isPublished = ? WHERE id = ?").run(isPublished ? 1 : 0, req.params.quizId);
    res.json({ success: true });
  });

  app.delete("/api/admin/quizzes/:quizId", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM quizzes WHERE id = ?").run(req.params.quizId);
    res.json({ success: true });
  });

  // --- Admin - Questions ---
  app.post("/api/admin/questions", authenticateToken, isAdmin, (req, res) => {
    const { quizId, questionText, image, codeSnippet, programmingLanguage, options, numberOfCorrectAnswers, order } = req.body;
    const info = db.prepare(`
      INSERT INTO questions (quizId, questionText, image, codeSnippet, programmingLanguage, options, numberOfCorrectAnswers, "order")
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(quizId, questionText, image, codeSnippet, programmingLanguage, JSON.stringify(options), numberOfCorrectAnswers || 1, order || 0);
    res.status(201).json({ id: info.lastInsertRowid, quizId, questionText, options });
  });

  app.get("/api/admin/questions/:quizId", authenticateToken, isAdmin, (req, res) => {
    const questions = db.prepare("SELECT * FROM questions WHERE quizId = ? ORDER BY \"order\" ASC").all(req.params.quizId);
    res.json(questions.map((q: any) => ({ ...q, options: JSON.parse(q.options) })));
  });

  app.patch("/api/admin/questions/:questionId", authenticateToken, isAdmin, (req, res) => {
    const { questionText, image, codeSnippet, programmingLanguage, options, numberOfCorrectAnswers, order } = req.body;
    db.prepare(`
      UPDATE questions 
      SET questionText = ?, image = ?, codeSnippet = ?, programmingLanguage = ?, options = ?, numberOfCorrectAnswers = ?, "order" = ?
      WHERE id = ?
    `).run(questionText, image, codeSnippet, programmingLanguage, JSON.stringify(options), numberOfCorrectAnswers, order, req.params.questionId);
    res.json({ success: true });
  });

  app.delete("/api/admin/questions/:questionId", authenticateToken, isAdmin, (req, res) => {
    db.prepare("DELETE FROM questions WHERE id = ?").run(req.params.questionId);
    res.json({ success: true });
  });

  // --- Admin - Leaderboard ---
  app.get("/api/admin/leaderboard/:quizId", authenticateToken, isAdmin, (req, res) => {
    const leaderboard = db.prepare(`
      SELECT r.*, u.name as userName
      FROM quiz_results r
      JOIN users u ON r.userId = u.id
      WHERE r.quizId = ?
      ORDER BY r.score DESC, r.timeSpent ASC
    `).all(req.params.quizId);
    res.json(leaderboard);
  });

  // --- Student - Quiz ---
  app.get("/api/quiz/all", authenticateToken, (req, res) => {
    const quizzes = db.prepare(`
      SELECT q.*, c.name as chapterName, co.name as courseName 
      FROM quizzes q
      JOIN chapters c ON q.chapterId = c.id
      JOIN courses co ON c.courseId = co.id
      WHERE q.isPublished = 1
    `).all();
    res.json(quizzes);
  });

  app.get("/api/quiz/:quizId", authenticateToken, (req, res) => {
    const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ? AND isPublished = 1").get(req.params.quizId) as any;
    if (!quiz) return res.status(404).json({ error: "Quiz not found" });
    const questions = db.prepare("SELECT * FROM questions WHERE quizId = ? ORDER BY \"order\" ASC").all(req.params.quizId);
    res.json({
      ...quiz,
      questions: questions.map((q: any) => ({ ...q, options: JSON.parse(q.options) }))
    });
  });

  app.post("/api/quiz/submit", authenticateToken, (req, res) => {
    const { quizId, answers, timeSpent } = req.body;
    const questions = db.prepare("SELECT * FROM questions WHERE quizId = ?").all(quizId);
    let score = 0;

    questions.forEach((q: any) => {
      const options = JSON.parse(q.options);
      const studentAnswers = answers[q.id] || []; // Array of selected option indices
      
      const correctIndices = options
        .map((opt: any, idx: number) => opt.isCorrect ? idx : -1)
        .filter((idx: number) => idx !== -1);

      const isCorrect = 
        studentAnswers.length === correctIndices.length &&
        studentAnswers.every((val: number) => correctIndices.includes(val));

      if (isCorrect) score++;
    });

    const quiz = db.prepare("SELECT * FROM quizzes WHERE id = ?").get(quizId) as any;
    const isPassed = (score / questions.length) * 100 >= (quiz.passingScore || 70);

    const info = db.prepare(`
      INSERT INTO quiz_results (userId, quizId, score, totalQuestions, timeSpent, isPassed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.user.id, quizId, score, questions.length, timeSpent, isPassed ? 1 : 0);

    res.json({
      id: info.lastInsertRowid,
      score,
      totalQuestions: questions.length,
      isPassed,
      percentage: (score / questions.length) * 100
    });
  });

  // --- Student - Results ---
  app.get("/api/results/my-results", authenticateToken, (req, res) => {
    const results = db.prepare(`
      SELECT r.*, q.title as quizTitle
      FROM quiz_results r
      JOIN quizzes q ON r.quizId = q.id
      WHERE r.userId = ?
      ORDER BY r.createdAt DESC
    `).all(req.user.id);
    res.json(results);
  });

  app.get("/api/results/:resultId", authenticateToken, (req, res) => {
    const result = db.prepare(`
      SELECT r.*, q.title as quizTitle, q.description as quizDescription
      FROM quiz_results r
      JOIN quizzes q ON r.quizId = q.id
      WHERE r.id = ? AND r.userId = ?
    `).get(req.params.resultId, req.user.id);
    if (!result) return res.status(404).json({ error: "Result not found" });
    res.json(result);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
