# Media Saver beta.4 — dùng trực tiếp từ bảng chia sẻ

Chỉ cần ứng dụng **Phím tắt** có sẵn trên iPhone và Internet. Không cần Mac, Scriptable, chép mã hoặc tự thêm tác vụ. Link bài đăng sẽ được gửi tới dịch vụ tải công khai.

## Cài bản mới

1. Bấm **[Tải Media Saver beta.4 đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.4/Media-Saver.shortcut)** bằng Safari trên iPhone.
2. Mở tệp vừa tải trong mục tải về của Safari hoặc **Tệp → Tải về**.
3. Bấm **Thêm phím tắt**. Nếu đã có Media Saver, chọn **Thay thế** khi iOS hỏi. Nếu xuất hiện hai bản, xóa bản cũ beta.2/beta.3; giữ bản có dòng ghi chú `Media Saver 1.0.0-beta.4`.

Bản cũ beta.2 chỉ nhận Trang web Safari nên không xuất hiện khi các ứng dụng gửi link. Bản mới nhận URL và Văn bản, đã bật hiển thị trong bảng chia sẻ. iOS vẫn yêu cầu xác nhận cài đặt.

Nếu đang dùng **beta.3** và gặp “Chưa nhận được link HTTPS” dù chia sẻ đúng từ ứng dụng, hãy thay bằng beta.4. Bản cũ ghi sai định dạng đầu vào của tác vụ Lấy URL; bạn không cần sửa các tác vụ thủ công.

## Dùng hằng ngày

1. Mở **một bài đăng/video công khai** trong Facebook, TikTok hoặc Instagram.
2. Bấm **Chia sẻ** (với Instagram thường là biểu tượng máy bay giấy).
3. Chọn **Thêm / Khác / More / Share to…** để mở bảng chia sẻ của iOS nếu ứng dụng đang hiện menu chia sẻ riêng. Tên nút thay đổi theo phiên bản ứng dụng.
4. Cuộn danh sách tác vụ xuống và chọn **Media Saver**.
5. Lần đầu, cho phép truy cập tên miền tải và **thêm vào Ảnh** khi iOS hỏi. Giữ ứng dụng mở cho tới thông báo **Đã lưu … tệp vào Ảnh**.

Không cần mở bài bằng Safari hay đăng nhập Safari để tải. Nếu mở Media Saver từ ô trong Phím tắt, nó sẽ hỏi bạn dán link. Nếu chia sẻ nhiều link, chọn một bài để tải.

## Nội dung tải được

- **TikTok:** video và danh sách ảnh của bài. Bài ảnh không được ghép nhạc thành video.
- **Instagram:** ảnh, Reels, bài nhiều ảnh/video; mỗi media lấy một phiên bản. Nhận link `/p/`, `/reel/`, `/reels/`, `/tv/`; chưa nhận link `/share/`, Stories hoặc trang cá nhân.
- **Facebook:** video/Reels khi dịch vụ trả về MP4. **Chưa hỗ trợ ảnh hoặc album Facebook.**

Chưa hỗ trợ bài riêng tư, nội dung cần phiên đăng nhập, livestream, tải cả trang cá nhân hoặc ghép HLS/DASH. Số tệp được quyết định bởi dữ liệu dịch vụ trả về; không bảo đảm mọi bài đều đầy đủ. Chạy lại có thể tạo bản sao trong Ảnh. Nếu lỗi giữa chừng, các tệp trước đó vẫn được giữ.

## Không thấy Media Saver

1. Kiểm tra đã cài **beta.4**, không còn chạy nhầm beta.3 hoặc bản Safari beta.2.
2. Mở **bảng chia sẻ iOS** bằng nút Thêm/Khác của ứng dụng. Media Saver nằm trong danh sách tác vụ bên dưới, không nhất thiết nằm ở hàng biểu tượng ứng dụng.
3. Nếu vẫn chưa có: vào **Phím tắt → Media Saver → … → Chi tiết (ⓘ hoặc menu tên) → Hiển thị trong bảng chia sẻ**, bật tùy chọn đó. Đầu vào phải cho phép **URL** và **Văn bản**.
4. Đóng rồi mở lại bảng chia sẻ. Có thể dùng **Sửa tác vụ / Edit Actions** để đưa Media Saver lên đầu nếu tùy chọn xuất hiện.

[Hướng dẫn bảng chia sẻ của Apple](https://support.apple.com/en-gb/guide/shortcuts/apd163eb9f95/ios).

## Khi chạy báo lỗi

- **Chưa nhận được link:** chia sẻ liên kết bài cụ thể, không chia sẻ ảnh chụp màn hình hoặc trang cá nhân. Có thể sao chép link rồi mở ô Media Saver để dán.
- **Dịch vụ chưa lấy được media / HTTP 403, 429, 503:** bài có thể bị giới hạn hoặc dịch vụ đang lỗi. Chờ rồi thử lại với bài công khai khác. Không cần cung cấp mật khẩu/cookie.
- **Không thể lưu vào Ảnh:** kiểm tra quyền thêm ảnh cho Phím tắt. URL media có thể hết hạn hoặc dịch vụ trả nội dung lỗi thay tệp; chạy lại từ link bài.
- **Video lớn bị dừng:** giữ ứng dụng mở. Bản này chưa có tải tiếp khi gián đoạn.

## Dịch vụ bên ngoài

TikTok dùng **TikWM**; Instagram dùng **Siputzx/SSSInstagram**; Facebook dùng **VKrDownloader**. Shortcut gửi link bài bạn chọn, rồi tải tệp từ các tên miền được trả về. Không đọc cookie, mật khẩu, token đăng nhập hoặc ảnh sẵn có trong điện thoại. Bạn không phải tự vận hành máy chủ.

Tệp cài đã được dịch vụ Shortcuty ký ở chế độ `anyone`. Môi trường phát triển chưa có iPhone để thử nhập/chạy beta.4; xem [kết quả đã kiểm chứng](https://github.com/tungnv107/shortcut/blob/v1.0.0-beta.4/KIEM-THU.md).
