ICTU LMS - MUC 1c: PROMETHEUS + CADVISOR + GRAFANA
=================================================

Overlay rieng cho muc 1c. Khong thay the compose.yaml va khong can sua app/db/nginx.

Cac file:
- compose.monitoring.yaml
- monitoring/prometheus.yml
- monitoring/grafana-prometheus-datasource.yml

Truoc khi chay:
1. Dat cac file nay truc tiep vao D:\\ictu-lms-infrastructure, canh compose.yaml.
2. Mo .env va them mat khau rieng:
   GRAFANA_ADMIN_PASSWORD=THAY_BANG_MAT_KHAU_MANH_CUA_BAN
   Khong gui file .env hoac mat khau len chat.
3. Kiem tra:
   docker compose -f compose.yaml -f compose.logging.yaml -f compose.monitoring.yaml config --quiet
4. Neu config thanh cong, khoi chay rieng 3 service:
   docker compose -f compose.yaml -f compose.logging.yaml -f compose.monitoring.yaml up -d cadvisor prometheus grafana
5. Kiem tra:
   docker compose -f compose.yaml -f compose.logging.yaml -f compose.monitoring.yaml ps
6. Targets:
   http://localhost:9090/targets
7. Grafana:
   http://localhost:3001
   User: admin
   Password: gia tri GRAFANA_ADMIN_PASSWORD trong .env
8. Trong Grafana > Explore > Prometheus, thu:
   up
   container_memory_usage_bytes
   rate(container_cpu_usage_seconds_total[5m])

Luu y:
- Grafana va Prometheus chi bind vao 127.0.0.1 tren may host.
- cAdvisor can quyen doc mot so duong dan host; Docker Desktop/Windows co the chi cung cap mot phan metrics.
- Neu config --quiet bao loi, dung lai va gui nguyen van loi; khong chay up.
- Khong chay docker compose down -v.
- Overlay nay su dung lai network `frontend` cua compose.yaml.
