CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_code VARCHAR(20) NOT NULL UNIQUE,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  lesson_no INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  UNIQUE KEY uq_lesson (course_id, lesson_no),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id)
    REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS enrollments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT NOT NULL,
  course_id INT NOT NULL,
  enrolled_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_enroll (student_id, course_id),
  CONSTRAINT fk_enr_student FOREIGN KEY (student_id)
    REFERENCES students(id) ON DELETE CASCADE,
  CONSTRAINT fk_enr_course FOREIGN KEY (course_id)
    REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO students (student_code, full_name, email) VALUES
('DTC001', 'Nguyễn Văn An', 'an.nv@example.com'),
('DTC002', 'Trần Thị Bình', 'binh.tt@example.com'),
('DTC003', 'Lê Minh Châu', 'chau.lm@example.com');

INSERT INTO lessons (course_id, lesson_no, title, content)
SELECT id, 1, 'Giới thiệu môn học', 'Mục tiêu, nội dung và cách đánh giá.' FROM courses WHERE course_code = 'IT101';
INSERT INTO lessons (course_id, lesson_no, title, content)
SELECT id, 2, 'Container và Docker Compose', 'Image, container, network, volume.' FROM courses WHERE course_code = 'IT101';
INSERT INTO lessons (course_id, lesson_no, title, content)
SELECT id, 1, 'Tổng quan trí tuệ nhân tạo', 'Lịch sử và các hướng ứng dụng.' FROM courses WHERE course_code = 'IT102';
INSERT INTO lessons (course_id, lesson_no, title, content)
SELECT id, 1, 'Nhập môn chủ nghĩa xã hội khoa học', 'Đối tượng và phương pháp nghiên cứu.' FROM courses WHERE course_code = 'IT103';

INSERT INTO enrollments (student_id, course_id)
SELECT s.id, c.id FROM students s JOIN courses c
WHERE (s.student_code = 'DTC001' AND c.course_code IN ('IT101','IT102'))
   OR (s.student_code = 'DTC002' AND c.course_code = 'IT101')
   OR (s.student_code = 'DTC003' AND c.course_code = 'IT103');