
require("dotenv").config();
const db = require("./db");

async function main() {
  const updates = [
    {
      oldTitle: "%IT101",
      title: "Kiểm tra giữa kỳ - IT101",
      description:
        "Bài kiểm tra giữa kỳ môn Triển khai và quản trị hệ thống phần mềm",
      status: "Chưa mở",
    },
    {
      oldTitle: "%IT102",
      title: "Bài thực hành AI - IT102",
      description:
        "Bài thực hành môn Ứng dụng trí tuệ nhân tạo",
      status: "Đang mở",
    },
  ];

  try {
    for (const item of updates) {
      const [result] = await db.execute(
        `UPDATE assessments
         SET title = ?, description = ?, status = ?
         WHERE title LIKE ?
         LIMIT 1`,
        [
          item.title,
          item.description,
          item.status,
          item.oldTitle,
        ]
      );

      console.log(
        `${item.title}: ${result.affectedRows} bản ghi cập nhật`
      );
    }

    const [rows] = await db.execute(
      `SELECT id, title, description, status
       FROM assessments
       ORDER BY id`
    );

    console.table(rows);
  } catch (error) {
    console.error("Lỗi cập nhật:", error.message);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main();
