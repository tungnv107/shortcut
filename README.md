# Media Saver — Shortcut iPhone + VPS Docker

Chia sẻ bài từ **Facebook / Instagram / TikTok → Thêm/Khác → Media Saver**. VPS tải và chuẩn hóa media; iPhone lưu từng tệp vào ứng dụng **Ảnh** bằng các tác vụ Phím tắt gốc. Không cần Mac hoặc Scriptable.

## Cài v1.1.0-beta.1

Dùng **trang cài riêng** được quản trị viên gửi: sao chép mã truy cập → tải Shortcut → dán mã khi được hỏi → Thêm/Thay thế Media Saver cũ. Đây là thiết lập một lần. Trang cài và mã truy cập không được đăng lên GitHub.

[Tải Shortcut đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.1.0-beta.1/Media-Saver.shortcut) · [Hướng dẫn iPhone](HUONG-DAN-IPHONE.md) · [Vận hành VPS](DOCKER-VPS.md) · [Kết quả kiểm thử](KIEM-THU.md)

Tệp công khai đã điền địa chỉ VPS `https://media-saver.161.118.222.102.sslip.io`, **chưa chứa mã truy cập**. Người khác tải tệp sẽ không dùng được dịch vụ nếu chưa được cấp mã. Bản cũ 1.0.0-beta.4 gọi dịch vụ công khai trực tiếp; cần cài lại bản này để chuyển sang VPS.

## Phạm vi đã kiểm chứng

Kiểm tra trên VPS ngày 17/11/2026, tải toàn bộ tệp qua HTTPS có xác thực:

| Nội dung mẫu | Kết quả |
|---|---|
| TikTok video | 1 MP4, H.264 + AAC |
| TikTok bài ảnh | 16 JPEG |
| Instagram bài ảnh | 5 JPEG qua nguồn dự phòng |
| Instagram bài video | 3 MP4 H.264 qua nguồn dự phòng; nguồn mẫu không có luồng âm thanh |
| Facebook video | 1 MP4, H.264 + AAC |
| Facebook album ảnh | Chưa tải được trong thử nghiệm không có cookie |

Ảnh/album Facebook có bộ xử lý gallery-dl nhưng **chưa xác nhận hoạt động**; có thể cần cookie đăng nhập. Không hứa tải được mọi bài hoặc mọi media. Chưa thử cài/chạy bản này trên iPhone thật. Bài riêng tư, Stories, livestream, tải cả trang cá nhân không thuộc phạm vi bản phát hành.

## Cách hoạt động

Shortcut gửi URL bài tới API riêng, theo dõi hàng đợi rồi tải từng tệp từ cùng VPS. Server dùng **gallery-dl / yt-dlp / FFmpeg**: ảnh thành JPEG, video thành MP4 H.264 và âm thanh AAC nếu nguồn có âm thanh. Nếu nguồn trực tiếp thất bại và chưa cấu hình cookie, server có thể gửi link bài công khai tới TikWM, Siputzx/SSSInstagram hoặc VKrDownloader. Có thể tắt bằng `ALLOW_PUBLIC_FALLBACK: "0"`.

Mặc định: tối đa 100 tệp và 512 MiB mỗi bài; một tác vụ chạy cùng lúc; hàng đợi tối đa 8; xử lý tối đa 10 phút; giữ tệp tạm 1 giờ. Phím tắt chờ khoảng 2 phút, sau đó cho phép chia sẻ lại cùng bài để lấy kết quả đang xử lý. Tải lại có thể tạo bản sao trong Ảnh.

## Mã nguồn và kiểm tra

```sh
npm run verify
```

Node.js 24, không cần thư viện npm. Backend có thêm Python, yt-dlp, gallery-dl và FFmpeg được cài trong image Docker. Hướng dẫn Docker tại [DOCKER-VPS.md](DOCKER-VPS.md).

- `src/native-workflow.cjs`: tạo luồng VPS với 89 tác vụ gốc.
- `server/`: API, hàng đợi, tải và chuẩn hóa tệp.
- `compose.yaml`, `deploy/`: cấu hình Docker và HTTPS cho VPS đã chỉ định.
- `tools/probe-server.cjs`: kiểm tra tải tệp thực tế; `artifacts/server-live-results.json`: báo cáo đã loại thông tin bí mật.
- `dist/workflow.json`, `dist/Media-Saver.unsigned.shortcut`: đầu ra có thể kiểm tra; tệp ký nằm trong GitHub Release.
- `src/legacy-workflow.cjs`, các báo cáo `native-live`/Safari: giữ để tham khảo bản cũ, không phải luồng hiện tại.

Shortcut công khai được [Shortcuty](https://github.com/Shortcuty/Signing-Server-API-Documentation) ký chế độ `anyone`; **không gửi mã truy cập VPS** tới dịch vụ ký. Công cụ kiểm tra marker, kích thước và SHA-256, từ chối đóng gói bản ký không khớp nguồn. Xác nhận nhập và chạy trên iOS vẫn cần thiết bị thật.
