
require("dotenv").config();

const express = require("express");
const helmet = require("helmet");
const db = require("./db");

const app = express();

app.set("trust proxy", 1);
app.set("view engine", "ejs");
app.set("views", __dirname + "/views");

app.use(helmet());
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: false }));

// Dashboard: tổng quan học phần
app.get("/", async (req, res, next) => {
  try {
    const [courses] = await db.query(`
      SELECT id, course_code, course_name, lecturer,
             credits, total_weeks, absences, status
      FROM courses
      ORDER BY id
    `);

    res.render("dashboard", { courses });
  } catch (error) {
    next(error);
  }
});

// Lớp học phần: danh sách và tìm kiếm
app.get("/courses", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim();

    let sql = `
      SELECT id, course_code, course_name, lecturer,
             credits, total_weeks, absences, status
      FROM courses
    `;

    const params = [];

    if (q) {
      sql += `
        WHERE course_code LIKE ?
           OR course_name LIKE ?
      `;

      params.push(`%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY id";

    const [courses] = await db.query(sql, params);

    res.render("courses", { courses, q });
  } catch (error) {
    next(error);
  }
});

// Thời khóa biểu: dữ liệu thật từ MySQL
app.get("/schedule", async (req, res, next) => {
  try {
    const [schedules] = await db.query(`
      SELECT
        s.id,
        s.course_id,
        c.course_code,
        c.course_name,
        c.lecturer,
        s.day_of_week,
        s.start_time,
        s.end_time,
        s.room,
        s.note
      FROM schedules AS s
      INNER JOIN courses AS c ON c.id = s.course_id
      ORDER BY s.day_of_week, s.start_time
    `);

    res.render("schedule", { schedules });
  } catch (error) {
    next(error);
  }
});

// Xử lý lỗi chung

/* Kiểm tra thường xuyên: đọc dữ liệu từ MySQL */
app.get("/assessments", async (req, res, next) => {
  try {
    const [assessments] = await db.query(`
      SELECT
        a.id,
        a.title,
        a.assessment_type,
        a.due_date,
        a.max_score,
        a.status,
        a.description,
        c.course_code,
        c.course_name
      FROM assessments AS a
      INNER JOIN courses AS c ON c.id = a.course_id
      ORDER BY a.due_date IS NULL, a.due_date, a.id
    `);

    res.render("assessments", { assessments });
  } catch (error) {
    next(error);
  }
});

/* Thông tin hệ thống */
app.get("/system", async (req, res, next) => {
  try {
    const [dbResult] = await db.query(`
      SELECT
        DATABASE() AS database_name,
        VERSION() AS mysql_version,
        NOW() AS database_time
    `);

    res.render("system", {
      database: dbResult[0],
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime())
    });
  } catch (error) {
    next(error);
  }
});

app.use((error, req, res, next) => {
  console.error("LMS error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).send(
    "LMS gặp lỗi. Hãy kiểm tra log ứng dụng."
  );
});

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`LMS running on port ${port}`);
});
