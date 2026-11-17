# Media Saver 1.1.0-beta.4 — chọn ảnh/video muốn tải

Bài có nhiều media sẽ hiện danh sách **số thứ tự · Ảnh/Video · dung lượng** để chọn một hoặc nhiều mục; chưa có ảnh xem trước. Không chọn sẵn mục nào. Chọn **Tải tất cả** nếu muốn toàn bộ. Hủy thì không lưu; bài một media bỏ qua bộ chọn. Chỉ các mục đã chọn được tải về iPhone, sau đó lưu vào album bạn nhập.

Mở **trang cài riêng → Sao chép mã → Tải Media Saver → dán mã → Thay thế**. Cần cài bản Shortcut mới để có bước chọn; mã truy cập và địa chỉ VPS không đổi. Backend mới vẫn tương thích các Shortcut VPS cũ.

**69/69 test đạt.** Kiểm tra mô hình Shortcut với API HTTPS thật: chọn ảnh 2 và 5 trong bài 5 ảnh chỉ tải 2 ảnh; chọn video 2 trong bài 3 video chỉ tải 1 video. Tải tất cả, không chọn và bài đơn đều đạt; toàn bộ tệp thực tải đã đối chiếu SHA-256. Xem `SELECTION-LIVE-RESULTS.json`. Chưa thử giao diện chọn/lưu trên iPhone thật.

VPS vẫn tải và xử lý toàn bộ media lấy được trước khi hiển thị danh sách; tệp tạm tự hết hạn sau khoảng một giờ, kể cả mục không chọn. Các giới hạn nền tảng giữ nguyên: một số bài Facebook cần đăng nhập/cookie, chưa bảo đảm mọi ảnh/album tải được.

[Hướng dẫn cập nhật](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.4/HUONG-DAN-IPHONE.md) · [Chi tiết kiểm thử](https://github.com/tungnv107/shortcut/blob/v1.1.0-beta.4/KIEM-THU.md)

Tệp phát hành không chứa token hoặc link cài riêng. Đối chiếu bản tải về bằng `SIGNING-VERIFICATION.json` và `SHA256SUMS.txt`. Các báo cáo beta.1/beta.3 được giữ nguyên và ghi rõ phiên bản.
