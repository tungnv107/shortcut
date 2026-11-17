# Vận hành Media Saver trên VPS

## Cấu hình đang chạy

- VPS: `161.118.222.102`, Ubuntu ARM64, người dùng `ubuntu`.
- Thư mục ứng dụng: `/home/ubuntu/media-saver`.
- HTTPS: `https://media-saver.161.118.222.102.sslip.io`.
- Docker Compose project: `media-saver`; dịch vụ `media-saver`, cổng nội bộ `8787`.
- Cổng host chỉ nghe `127.0.0.1:18787`. Nginx Proxy Manager hiện có (`npm-app-1`) chuyển tiếp qua mạng `npm_default`.
- Cache: volume `media-saver_media_cache`; tự xóa tác vụ hết hạn mỗi phút, mặc định sau một giờ.
- Token API và mã trang cài được sinh trên VPS, đặt trong `.secrets/`, không có trong Git hoặc tệp Shortcut công khai.

Không cần mở thêm cổng 18787 ra Internet. Cổng 80/443 hiện do Nginx Proxy Manager quản lý.

## Kiểm tra và cập nhật

```sh
cd /home/ubuntu/media-saver
docker compose -p media-saver -f compose.yaml -f deploy/compose.npm.yaml ps
curl -fsS https://media-saver.161.118.222.102.sslip.io/healthz
docker compose -p media-saver -f compose.yaml -f deploy/compose.npm.yaml logs --tail=50
```

Thư mục triển khai hiện là bản chép mã nguồn, không phải Git checkout. Để cập nhật, chép các tệp nguồn đã kiểm tra vào cùng thư mục (giữ `.secrets/`, `cookies/` và volume), rồi:

```sh
docker compose -p media-saver -f compose.yaml -f deploy/compose.npm.yaml up -d --build
```

Khởi động lại đánh dấu tác vụ đang chạy là thất bại; chia sẻ lại bài để tải mới. Tệp hoàn tất đúng phiên bản định dạng được giữ tới hạn. Không dùng `down -v` nếu muốn giữ cache.

Image cài phiên bản trong `server/requirements.txt`; khi nền tảng thay đổi, cập nhật phiên bản, build lại và kiểm tra bài mẫu. Kiểm tra đầy đủ qua HTTPS và ffprobe:

```sh
docker compose -p media-saver -f compose.yaml -f deploy/compose.npm.yaml exec -T media-saver node < tools/probe-server.cjs
```

Probe có cả album Facebook chưa tải được khi không có cookie; mã thoát khác 0 phản ánh trường hợp đó, không đồng nghĩa mọi nền tảng đều hỏng. Không in token, link CDN tạm hoặc trang cài riêng vào báo cáo công khai.

## Trang cài riêng và cấp mã

Trang cài nằm ở `/setup/` nối với nội dung `.secrets/setup_token`. Đọc tệp đó qua SSH để gửi riêng đường dẫn cho chủ dịch vụ. Trang có nút sao chép nội dung `.secrets/api_token` và link tải bản ký đúng phiên bản. URL bí mật này không được đưa vào README, issue hoặc release.

Mỗi lần đổi `.secrets/api_token`, người dùng phải cập nhật mã trong Shortcut. Giữ chuỗi 64 ký tự hex. Sau khi đổi secret, dùng `up -d --force-recreate` với hai tệp Compose để mount lại. Đổi `.secrets/setup_token` sẽ vô hiệu hóa link cài cũ. Thư mục `.secrets` quyền `700`, các secret quyền `444` để container đọc mount; không mở quyền thư mục cha ra công khai.

## Cookie tùy chọn

Chưa cấu hình cookie trên VPS. Có thể đặt cookie Netscape của tài khoản được phép truy cập nội dung vào `cookies/facebook.txt`, `cookies/instagram.txt` hoặc `cookies/tiktok.txt`, chuyển tệp bằng SSH/SFTP. **Không commit, đăng lên chat hoặc gửi tới dịch vụ ký.** Chỉ dùng nội dung bạn có quyền tải.

Container chạy UID 1000. Đặt thư mục và tệp để UID này đọc được (ví dụ `sudo chown -R 1000:1000 cookies`, `chmod 700 cookies`, `chmod 600 cookies/*.txt` sau khi kiểm tra đúng thư mục). Mount chỉ đọc. Mỗi tác vụ tạo bản sao cookie tạm để bộ tải có thể cập nhật; bản sao được xóa khi xong hoặc lỗi. Khi nền tảng có tệp cookie, server **không dùng nguồn dự phòng công khai** cho nền tảng đó. Cookie hết hạn cần thay mới; cấu hình cookie không bảo đảm vượt qua mọi giới hạn nền tảng.

## Giới hạn và nguồn dự phòng

Các biến trong `compose.yaml`: `CONCURRENCY=1`, `MAX_FILES=100`, `MAX_JOB_MB=512`, `MAX_CACHE_MB=2048`, `FILE_TTL_SECONDS=3600`, `JOB_TIMEOUT_SECONDS=600`; `MAX_QUEUE` mặc định 8. Cache ngừng nhận bài mới khi đã vượt ngưỡng; tác vụ đang chạy có thể làm dung lượng tạm vượt ngưỡng. Container giới hạn 1,5 GiB RAM và 1,5 CPU.

`ALLOW_PUBLIC_FALLBACK: "1"` bật TikWM, Siputzx/SSSInstagram, VKrDownloader cho URL công khai khi tải trực tiếp không có kết quả và không có cookie. Đặt `"0"` rồi recreate container để chỉ tải trực tiếp. Kết quả Instagram mẫu hiện phụ thuộc nguồn dự phòng; tắt nó có thể làm những bài này thất bại.

API chỉ nhận link bài thuộc Facebook/Instagram/TikTok, dùng Bearer token cho tác vụ và tệp. `/healthz` công khai. Không có endpoint proxy URL tùy ý. ID tệp do server tạo; Shortcut luôn tải từ VPS, không gửi mã truy cập sang tên miền media khác.

## HTTPS và Nginx Proxy Manager

`deploy/nginx-ssl.sh` là adapter **riêng cho VPS hiện tại**, dùng `/home/ubuntu/npm/data/nginx/custom/http.conf` và include `media-saver-servers.conf`. Không chạy nguyên xi trên máy khác. Nó sao lưu cấu hình vào `/home/ubuntu/media-saver/backups/`, kiểm tra `nginx -t`, cấp chứng chỉ bằng Certbot webroot và thêm lịch `/etc/cron.d/media-saver-cert`.

Hostname này nằm trong custom include, không phải Proxy Host được tạo qua giao diện NPM; tránh tạo Proxy Host trùng tên. Không sửa hoặc xóa các cấu hình ứng dụng khác. Chứng chỉ nằm trong `/etc/letsencrypt/live/media-saver/` của container NPM; cron chỉ gia hạn chứng chỉ `media-saver` và reload Nginx khi cần.

```sh
docker exec npm-app-1 nginx -t
docker exec npm-app-1 /opt/certbot/bin/certbot renew --cert-name media-saver --dry-run
```

Hostname sslip.io phụ thuộc IP VPS và DNS của sslip.io. Nếu đổi IP/hostname, cập nhật cấu hình Nginx, cấp lại chứng chỉ và đổi địa chỉ VPS trong nguồn Shortcut rồi build/ký bản mới.

## Máy chủ mới

Cài Docker Engine + Compose plugin, lấy source repo, tạo `.secrets/api_token` và `.secrets/setup_token` bằng `openssl rand -hex 32`, tạo `cookies/`, áp dụng quyền như trên. `deploy/bootstrap.sh` dành cho môi trường có mạng `npm_default`. Nếu dùng reverse proxy khác, dùng riêng `compose.yaml` và cấu hình HTTPS tới `127.0.0.1:18787`. Thay địa chỉ trong `src/native-workflow.cjs` và ký Shortcut trước khi phân phối. Không đưa khóa API vào source công khai.

Tham khảo: [gallery-dl](https://github.com/mikf/gallery-dl), [yt-dlp](https://github.com/yt-dlp/yt-dlp), [NPM custom configuration](https://nginxproxymanager.com/advanced-config/), [Certbot renewal](https://eff-certbot.readthedocs.io/en/stable/using.html#renewing-certificates).
