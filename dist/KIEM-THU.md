# Kết quả kiểm thử — 17/11/2026 (Asia/Saigon)

Đây là báo cáo về kết quả đã quan sát, không phải xác nhận ứng dụng hoạt động đầy đủ trên iOS.

| Kiểm tra | Kết quả |
|---|---|
| `npm.cmd run verify` | 25/25 test thành công: carousel hỗn hợp, bài ảnh TikTok, video/ảnh Facebook, dữ liệu thiếu, lọc bài khác, URL không hợp lệ, luồng không hỗ trợ, API Instagram, đầu ra completion và liên kết các tác vụ. |
| Chrome headless + DOMParser | 5/5 trang HTML mẫu thành công. Có JSON và DOM thật để kiểm tra selector, không chỉ mock. Đây không phải Safari. |
| Plist XML | PowerShell đọc được tệp `.unsigned.shortcut` thành XML. Chưa xác nhận Apple chấp nhận chữ ký/nhập tệp. |
| Bản ký beta.2 | Shortcuty trả tệp 29.602 byte, định dạng `AEA1`, chế độ `anyone`. SHA-256 nguồn và tệp nhận được khớp metadata dịch vụ. Chưa xác minh chữ ký độc lập hoặc thử nhập trên iPhone. Báo cáo `SIGNING-VERIFICATION.json` đi kèm Release. |
| Instagram bài `BQ0eAlwhDrw` | HTML công khai trả một ảnh qua metadata. Tải 1.024 byte thành công: HTTP 206, `image/jpeg`, đúng dấu hiệu JPEG. Bài có nhiều media nhưng chưa lấy đủ. |
| Instagram API của bài đó, không đăng nhập | Sau chuyển hướng trả HTML thay vì JSON; fallback giữ kết quả một ảnh và cảnh báo thiếu. Chưa kiểm tra API bằng phiên Safari đã đăng nhập. |
| TikTok video `6742501081818877190` | Tìm được dữ liệu video và URL trực tiếp. Cả thử nguồn tải và nguồn phát đều bị CDN trả HTTP 403 với nội dung HTML. **Chưa tải thành công video thực tế.** |
| Facebook video CNN `10155529876156509` | HTML HTTP 200 có tiêu đề bài nhưng không có nguồn media trực tiếp mà bộ phân tích đọc được. **Chưa tải thành công media Facebook thực tế.** |
| iPhone / iOS Photos | Không có iPhone kết nối trong môi trường này. **Chưa kiểm tra nhập Shortcut, quyền Safari, tải tệp đầy đủ và lưu vào Ảnh.** |

Kết quả máy đọc: `artifacts/browser-results.json` và `artifacts/live-probe-results.json`.

## Kiểm tra còn cần trên iPhone

- Tạo theo hướng dẫn và xác nhận nhận đúng đầu vào Trang web Safari.
- Ảnh Instagram đơn; carousel trộn ảnh/video trong phiên đã đăng nhập.
- TikTok video và bài ảnh; kiểm tra cả hình lẫn âm thanh, số lượng ảnh.
- Facebook ảnh, bài nhiều ảnh, video và Reel mà tài khoản hiện tại xem được.
- Bài bị chặn/không còn tồn tại; xác nhận không lưu HTML hoặc ảnh bìa thay video.
- Quyền thêm ảnh, video lớn, mất mạng và lỗi giữa vòng lặp.

Nếu thử trên iPhone vẫn bị chặn, cần mẫu liên kết cụ thể và thông báo lỗi để tiếp tục điều chỉnh. Không thể suy ra thành công trên thiết bị từ các test mô phỏng.
