# Media Saver v1.1.0-beta.3 — album tùy chọn và link Facebook nhóm

**[Tải Media Saver beta.3 đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.1.0-beta.3/Media-Saver.shortcut)**

Bỏ album `Recents` cố định. Mỗi lần tải, nhập tên album (mặc định **Media Saver**). Tác vụ Create Photo Album dùng lại album cùng tên nếu đã có, hoặc tạo mới rồi lưu ảnh/video. Chỉ hỏi tên một lần cho cả bài.

Sửa lỗi Facebook báo “Hãy chọn một bài, video hoặc album cụ thể” khi link chia sẻ chuyển tới `/groups/.../permalink/...`. Nhận dạng bài trong nhóm, giữ gợi ý video từ link chia sẻ và chọn bộ tải ảnh/video phù hợp. Trang nhóm chung, Stories và bảng tin vẫn không được tải.

Mở **trang cài riêng** → **Sao chép mã → Tải Media Saver → dán mã khi thiết lập → Thay thế**. Mã truy cập và địa chỉ VPS không đổi.

**60/60 test đạt.** Đã chạy lại mô hình Shortcut với API thật, tải đủ hai album Instagram 5 và 8 ảnh. Video Facebook nhóm từng bị từ chối đã tải thành công 19.616.516 byte, H.264 + AAC. Bài ảnh nhóm vẫn chưa trả media khi VPS không có cookie đăng nhập; chưa xác nhận cookie sẽ giải quyết được bài này. Kết quả được ghi trong `FACEBOOK-LIVE-RESULTS.json`. Chưa kiểm tra thao tác tạo/lưu album trên iPhone thật.

[Hướng dẫn cập nhật](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.3/HUONG-DAN-IPHONE.md) · [Chi tiết kiểm thử](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.3/KIEM-THU.md)

Tệp phát hành không chứa token hoặc link cài riêng. `SIGNING-VERIFICATION.json` và `SHA256SUMS.txt` dùng đối chiếu bản tải về. Báo cáo phân biệt kiểm tra HTTP/mô hình với thao tác thật trên iPhone.
