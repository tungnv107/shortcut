# Media Saver v1.0.0-beta.2 — tệp đã ký để cài trên iPhone

**[Tải Media-Saver.shortcut đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.2/Media-Saver.shortcut)**

## Cài trong ứng dụng Phím tắt

1. Mở link trên bằng Safari của iPhone.
2. Mở tệp `Media-Saver.shortcut` vừa tải trong Safari hoặc **Tệp → Tải về**.
3. Khi Phím tắt hiện màn hình nhập, bấm **Thêm phím tắt / Add Shortcut**.

Không cần Mac, chép mã hoặc tạo từng tác vụ. iOS vẫn yêu cầu xác nhận thêm và cấp quyền khi chạy. Xem [hướng dẫn](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.2/HUONG-DAN-IPHONE.md).

Sau khi cài, mở bài đăng bằng Safari → **Chia sẻ → Media Saver**. Bật **Cho phép chạy tập lệnh** trong cài đặt Phím tắt nếu iOS yêu cầu.

## Thay đổi so với beta.1

- Bổ sung `Media-Saver.shortcut` được Shortcuty ký ở chế độ `anyone`.
- Kiểm tra định dạng `AEA1`, kích thước và SHA-256 đầu vào/đầu ra.
- Bổ sung công cụ ký lại và báo cáo xác minh; gói ZIP kèm cả bản ký lẫn nguồn.
- Giữ nguyên logic tải media. Không có dịch vụ tải hộ mới trong quá trình sử dụng.

## Kiểm thử và giới hạn

25 kiểm thử logic và 5 kiểm thử DOM trên máy tính đạt. Chưa kiểm thử nhập hoặc chạy trên iPhone thật. Việc ký giúp tạo tệp để nhập, không khắc phục các giới hạn tải của nền tảng: Instagram mẫu chỉ lấy được một phần carousel; TikTok mẫu trả 403; Facebook mẫu chưa lấy được media. Không cam kết tải mọi bài, Stories, livestream hoặc luồng HLS/DASH.

[Báo cáo kiểm thử](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.2/KIEM-THU.md) · [Tài liệu dịch vụ ký Shortcuty](https://github.com/Shortcuty/Signing-Server-API-Documentation)

`Media-Saver.unsigned.shortcut` là bản nguồn; hãy chọn **Media-Saver.shortcut** để cài. `SHA256SUMS.txt` và `SIGNING-VERIFICATION.json` dùng để đối chiếu tệp.
