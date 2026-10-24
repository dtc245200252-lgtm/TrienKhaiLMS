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

// Khóa học / lớp học phần: danh sách và tìm kiếm
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

// Bài học (lọc theo khóa học)
app.get("/lessons", async (req, res, next) => {
  try {
    const courseId = Number(req.query.course_id) || 0;
    const [courses] = await db.query(
      "SELECT id, course_code, course_name FROM courses ORDER BY id"
    );

    let sql = `
      SELECT l.id, l.lesson_no, l.title, l.content,
             c.course_code, c.course_name
      FROM lessons AS l
      INNER JOIN courses AS c ON c.id = l.course_id
    `;
    const params = [];
    if (courseId) {
      sql += " WHERE l.course_id = ?";
      params.push(courseId);
    }
    sql += " ORDER BY c.id, l.lesson_no";

    const [lessons] = await db.query(sql, params);
    res.render("lessons", { lessons, courses, courseId });
  } catch (error) {
    next(error);
  }
});

// Học viên: danh sách + thêm mới
app.get("/students", async (req, res, next) => {
  try {
    const [students] = await db.query(
      "SELECT id, student_code, full_name, email, created_at FROM students ORDER BY id"
    );
    res.render("students", { students, error: req.query.error || "" });
  } catch (error) {
    next(error);
  }
});

app.post("/students", async (req, res, next) => {
  try {
    const code = String(req.body.student_code || "").trim();
    const name = String(req.body.full_name || "").trim();
    const email = String(req.body.email || "").trim();

    if (!code || !name || !/^\S+@\S+\.\S+$/.test(email)) {
      return res.redirect(
        "/students?error=" + encodeURIComponent("Dữ liệu không hợp lệ.")
      );
    }

    await db.query(
      "INSERT INTO students (student_code, full_name, email) VALUES (?, ?, ?)",
      [code, name, email]
    );
    res.redirect("/students");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.redirect(
        "/students?error=" +
          encodeURIComponent("Mã học viên hoặc email đã tồn tại.")
      );
    }
    next(error);
  }
});

// Đăng ký: danh sách + đăng ký học viên vào khóa học
app.get("/enrollments", async (req, res, next) => {
  try {
    const [enrollments] = await db.query(`
      SELECT e.id, e.enrolled_at,
             s.student_code, s.full_name,
             c.course_code, c.course_name
      FROM enrollments AS e
      INNER JOIN students AS s ON s.id = e.student_id
      INNER JOIN courses  AS c ON c.id = e.course_id
      ORDER BY e.enrolled_at DESC, e.id DESC
    `);
    const [students] = await db.query(
      "SELECT id, student_code, full_name FROM students ORDER BY full_name"
    );
    const [courses] = await db.query(
      "SELECT id, course_code, course_name FROM courses ORDER BY id"
    );

    res.render("enrollments", {
      enrollments,
      students,
      courses,
      error: req.query.error || ""
    });
  } catch (error) {
    next(error);
  }
});

app.post("/enrollments", async (req, res, next) => {
  try {
    const studentId = Number(req.body.student_id);
    const courseId = Number(req.body.course_id);

    if (!studentId || !courseId) {
      return res.redirect(
        "/enrollments?error=" +
          encodeURIComponent("Vui lòng chọn học viên và khóa học.")
      );
    }

    await db.query(
      "INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)",
      [studentId, courseId]
    );
    res.redirect("/enrollments");
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.redirect(
        "/enrollments?error=" +
          encodeURIComponent("Học viên đã đăng ký khóa học này.")
      );
    }
    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.redirect(
        "/enrollments?error=" +
          encodeURIComponent("Học viên hoặc khóa học không tồn tại.")
      );
    }
    next(error);
  }
});

// Xử lý lỗi chung
app.use((error, req, res, next) => {
  console.error("LMS error:", error.message);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).send("LMS gặp lỗi. Hãy kiểm tra log ứng dụng.");
});

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`LMS running on port ${port}`);
});