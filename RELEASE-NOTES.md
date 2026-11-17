# Media Saver v1.0.0-beta.3 — nhận link từ bảng chia sẻ

**[Tải Media Saver beta.3 đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.3/Media-Saver.shortcut)**

Mở tệp vừa tải → **Thêm phím tắt / Thay thế**. Bản cũ beta.2 chỉ nhận trang Safari; cần cài bản mới để nhận link từ ứng dụng.

**Facebook / TikTok / Instagram → Chia sẻ → Thêm/Khác → Media Saver.** Cuộn xuống danh sách tác vụ của bảng chia sẻ iOS. Lần đầu cấp quyền kết nối và thêm vào Ảnh khi iOS hỏi.

## Thay đổi

- Chỉ dùng ứng dụng Phím tắt và các tác vụ gốc. Không cần Scriptable, Mac hoặc chép mã.
- Nhận URL/văn bản từ Share Sheet; không yêu cầu mở bài bằng Safari. Nếu chạy từ ô Phím tắt, hỏi dán link.
- TikTok: video và bài ảnh; Instagram: ảnh, Reels và bài nhiều media; Facebook: video/Reels.
- Bỏ ảnh bìa, tránh tải nhiều bản chất lượng của cùng video; kiểm tra URL và báo số tệp sau khi lưu.
- Link được gửi tới dịch vụ công khai: TikWM, Siputzx/SSSInstagram, VKrDownloader. Không đọc/gửi cookie, mật khẩu hay token đăng nhập.

## Kiểm chứng và giới hạn

41/41 test đạt trên máy tính. API thực tế trả 16 ảnh TikTok, 5 ảnh Instagram và 3 video Instagram; mẫu video TikTok/Facebook cũng tải được. Kiểm tra 1.024 byte đầu của một tệp mỗi trường hợp: HTTP 206, JPEG/MP4 hợp lệ. Chưa thử nhập/chạy beta.3, lưu vào Ảnh hoặc phát video trên iPhone thật.

**Chưa hỗ trợ ảnh/album Facebook**, bài riêng tư, Stories, livestream, tải cả trang cá nhân hoặc ghép luồng HLS/DASH. Dịch vụ tải có thể lỗi/giới hạn lượt gọi; không cam kết tải mọi bài.

[Hướng dẫn iPhone](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.3/HUONG-DAN-IPHONE.md) · [Kiểm thử](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.3/KIEM-THU.md)

Chọn **Media-Saver.shortcut** để cài; `Media-Saver.unsigned.shortcut` là nguồn dành cho phát triển. `SHA256SUMS.txt` và `SIGNING-VERIFICATION.json` dùng đối chiếu tệp.
