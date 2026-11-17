# Media Saver v1.1.0-beta.2 — sửa bước đọc mã tệp

**[Tải Media Saver beta.2 đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.1.0-beta.2/Media-Saver.shortcut)**

Beta.1 có thể báo **“Mã tệp trả về không hợp lệ”** trên iPhone dù VPS đã tải xong album và trả các mã đúng định dạng. Beta.2 đổi cách đọc danh sách mã: server trả văn bản đơn giản, Shortcut lấy từng mã theo vị trí, không phụ thuộc biến Mục lặp trong vòng lặp lồng nhau.

Mở **trang cài riêng đã gửi trước đó** → **Sao chép mã → Tải Media Saver → dán mã khi thiết lập → Thay thế** bản cũ. Mã truy cập và địa chỉ VPS giữ nguyên. Dùng **Instagram/Facebook/TikTok → Chia sẻ → Thêm/Khác → Media Saver** như trước.

**58/58 test đạt.** Đã chạy workflow mới trong mô hình tác vụ với API thật, tải đủ **5/5 và 8/8 ảnh** của hai bài Instagram vừa chia sẻ; so SHA-256 toàn bộ tệp với VPS. **Chưa xác nhận bản sửa trên iPhone thật**, và chưa quan sát trực tiếp giá trị biến gây lỗi trong runtime iOS. Báo cáo phân biệt rõ kiểm tra mô hình/API với thao tác lưu vào Ảnh.

Bộ tải và giới hạn nền tảng không đổi: album ảnh Facebook chưa đạt trong thử nghiệm không có cookie; Instagram mẫu có thể dùng nguồn dự phòng công khai. Bản cài không chứa token; API tác vụ/tệp vẫn yêu cầu xác thực.

[Hướng dẫn cập nhật](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.2/HUONG-DAN-IPHONE.md) · [Chi tiết kiểm thử](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.2/KIEM-THU.md)

`SHORTCUT-LIVE-RESULTS.json` là báo cáo mới cho beta.2; `SERVER-LIVE-RESULTS.json` giữ kết quả kiểm tra bộ tải từ beta.1. Các tệp không chứa token hoặc link cài riêng. `SIGNING-VERIFICATION.json` và `SHA256SUMS.txt` dùng kiểm tra bản tải về.
