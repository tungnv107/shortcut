# Media Saver v1.0.0-beta.4 — sửa lỗi nhận liên kết chia sẻ

**[Tải Media Saver beta.4 đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.4/Media-Saver.shortcut)**

Bản beta.3 có lỗi định dạng đầu vào của tác vụ **Lấy URL**, khiến iOS có thể báo “Chưa nhận được link HTTPS” dù đã chọn Media Saver từ bảng chia sẻ Instagram. Beta.4 sửa cách nối biến vào tác vụ này. Không cần cài ứng dụng phụ hoặc sửa tác vụ thủ công.

Mở tệp vừa tải → **Thêm / Thay thế** Media Saver cũ. Sau đó dùng **Facebook / TikTok / Instagram → Chia sẻ → Thêm/Khác → Media Saver** như trước.

44/44 test đạt, gồm kiểm tra cấu trúc đầu vào theo tham khảo độc lập, tái hiện cấu trúc lỗi cũ trong mô hình và nhận link Instagram kèm chú thích. Mô hình kiểm thử cũ đã bỏ sót khác biệt giữa hai kiểu tham chiếu biến. **Chưa kiểm thử bản sửa beta.4 trên iPhone thật**; không khẳng định đã loại trừ mọi nguyên nhân của lỗi trên thiết bị.

Phạm vi tải và dịch vụ không đổi: ảnh/video TikTok và Instagram, video Facebook; chưa hỗ trợ ảnh/album Facebook, bài riêng tư, Stories, livestream. Link được gửi tới TikWM, Siputzx/SSSInstagram hoặc VKrDownloader.

[Hướng dẫn cập nhật](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.4/HUONG-DAN-IPHONE.md) · [Chi tiết kiểm thử và lỗi đã sửa](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.4/KIEM-THU.md)

Chọn **Media-Saver.shortcut** để cài. `Media-Saver.unsigned.shortcut` là bản nguồn; `SHA256SUMS.txt` và `SIGNING-VERIFICATION.json` dùng đối chiếu tệp.
