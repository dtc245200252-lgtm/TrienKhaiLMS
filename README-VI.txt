# ICTU LMS Mini - Đề 17: Hệ thống Học trực tuyến (LMS đơn giản)

Bài thực hành môn **Triển khai và Quản trị Hệ thống Phần mềm**.
Toàn bộ dịch vụ chạy bằng Docker Compose.

## 1. Kiến trúc

| Thành phần | Công nghệ | Truy cập |
|---|---|---|
| Website LMS | Node.js (Express + EJS) | qua Nginx |
| Reverse proxy | Nginx 1.28 (HTTPS mkcert, security headers) | https://localhost:8443 (HTTP 8080 chuyển hướng 301) |
| Cơ sở dữ liệu | MySQL 8.0.44 | không publish cổng ra host |
| Công cụ quản lý DB | phpMyAdmin 5.2 | http://localhost:8082 |
| Giám sát | Prometheus + Grafana + cAdvisor | :9090 / :3001 / :8081 |
| Log tập trung | Loki + Promtail | Loki :3100, truy vấn qua Grafana |

Các cổng quản trị chỉ bind `127.0.0.1`, không mở ra mạng LAN.

Chức năng website: **khóa học, bài học, học viên, đăng ký** (chặn đăng ký trùng), kèm thời khóa biểu và kiểm tra thường xuyên.

## 2. Cấu trúc thư mục

```
app/                 Mã nguồn Node.js (server.js, db.js, views/, public/, sql/)
nginx/nginx.conf     Cấu hình reverse proxy + security headers
nginx/certs/         Chứng chỉ TLS (KHÔNG commit, tự tạo bằng mkcert)
monitoring/          Cấu hình Prometheus, Grafana datasource, Loki, Promtail
compose.yaml            db, phpmyadmin, app, nginx
compose.monitoring.yaml cadvisor, prometheus, grafana
compose.logging.yaml    loki, promtail
.env.example         Mẫu biến môi trường
```

## 3. Yêu cầu

- Docker Desktop (Compose v2)
- [mkcert](https://github.com/FiloSottile/mkcert) (tạo chứng chỉ HTTPS cho localhost)

## 4. Cài đặt và chạy

**Bước 1. Tạo file môi trường**
```cmd
copy .env.example .env
```
Mở `.env`, đổi mọi giá trị `CHANGE_ME` sang **mật khẩu mạnh** (tối thiểu 16 ký tự, gồm chữ hoa, chữ thường, số, ký hiệu). `MYSQL_DATABASE` và `DB_NAME` phải giống nhau.

**Bước 2. Tạo chứng chỉ HTTPS**
```cmd
mkcert -install
mkdir nginx\certs
mkcert -cert-file nginx/certs/localhost.crt -key-file nginx/certs/localhost.key localhost 127.0.0.1 ::1
```

**Bước 3. Khởi động toàn bộ hệ thống**
```cmd
docker compose -f compose.yaml -f compose.monitoring.yaml -f compose.logging.yaml up -d --build
docker compose -f compose.yaml -f compose.monitoring.yaml -f compose.logging.yaml ps
```

**Bước 4. Nạp database** (chỉ lần đầu, khi database còn trống): import file dump đầy đủ.
```cmd
docker compose exec -T db sh -c "mysql -uroot -p$MYSQL_ROOT_PASSWORD" < app\sql\000_full_dump.sql
```
Hoặc mở phpMyAdmin (http://localhost:8082), tab **Import**, chọn `app/sql/000_full_dump.sql`.
Các file `001_students_lessons_enrollments.sql` và `schedule.sql` chỉ để tham khảo cấu trúc, **không chạy thêm** sau khi đã import dump.

**Bước 5. Truy cập**

| Dịch vụ | Địa chỉ |
|---|---|
| Website LMS | https://localhost:8443 |
| phpMyAdmin | http://localhost:8082 (đăng nhập bằng tài khoản MySQL trong `.env`) |
| Grafana | http://localhost:3001 (user `admin`, mật khẩu `GRAFANA_ADMIN_PASSWORD`) |
| Prometheus | http://localhost:9090 (Status > Targets) |
| cAdvisor | http://localhost:8081 |

**Cấu hình Grafana lần đầu:** datasource Prometheus được nạp tự động. Thêm datasource Loki: Connections > Data sources > Add > Loki, URL `http://loki:3100`, bấm Save & test.

> Không chạy `docker compose down -v` vì sẽ xóa volume dữ liệu MySQL.

## 5. Truy vấn log (LogQL) trong Grafana > Explore > Loki

```logql
{compose_service="app"}
{compose_service="nginx"} |= "301"
{compose_service="app"} |= "LMS error"
```

## 6. Các biện pháp hardening

- **Non-root container:** app chạy bằng user `node` (uid 1000). Kiểm tra: `docker compose exec app id`.
- **Network isolation:** mạng `backend` đặt `internal: true`; MySQL chỉ nằm trong `backend`, không có `ports:`.
- **Hạn chế bề mặt tấn công:** mọi cổng quản trị chỉ bind `127.0.0.1`.
- **Nginx:** TLS 1.2/1.3, chuyển hướng HTTP sang HTTPS, các header CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy; ẩn phiên bản (`server_tokens off`).
- **Secrets:** mật khẩu đặt trong `.env` (không commit); ứng dụng kết nối bằng tài khoản `DB_USER` riêng, không dùng root.
- **Truy vấn tham số hóa** (`?`) trong mã nguồn để chống SQL injection; EJS tự escape đầu ra.

## 7. Ghi chú

- Promtail đã ngừng hỗ trợ (EOL) và cần đọc Docker socket, chỉ dùng cho môi trường lab.
- Chứng chỉ mkcert chỉ được tin cậy trên máy đã chạy `mkcert -install`; triển khai thật cần chứng chỉ từ CA công cộng (ví dụ Let's Encrypt).
- Hướng phát triển: đăng nhập/phân quyền, CSRF protection, MySQL Exporter, sao lưu tự động, cảnh báo Grafana, đặt phpMyAdmin sau Nginx HTTPS.