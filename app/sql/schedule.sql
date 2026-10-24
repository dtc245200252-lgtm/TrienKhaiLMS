
CREATE TABLE IF NOT EXISTS schedules (
    id INT NOT NULL AUTO_INCREMENT,
    course_id INT NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) DEFAULT NULL,
    note VARCHAR(255) DEFAULT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_schedules_course
        FOREIGN KEY (course_id) REFERENCES courses(id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT chk_schedules_day
        CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_schedules_time
        CHECK (end_time > start_time)
);
