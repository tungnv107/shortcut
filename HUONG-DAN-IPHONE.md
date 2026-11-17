# Media Saver 1.1.0-beta.4 — chọn media và dùng với VPS

Chỉ cần ứng dụng **Phím tắt**, Internet và mã truy cập VPS của bạn. Không cần Mac, Scriptable hoặc tự thêm tác vụ.

## Cài một lần

1. Mở **trang cài riêng** được gửi cho bạn bằng Safari trên iPhone; bấm **Sao chép mã**.
2. Bấm **Tải Media Saver**, mở tệp vừa tải từ Safari hoặc **Tệp → Tải về**.
3. Dán mã ở bước thiết lập; chọn **Thêm / Thay thế** Media Saver cũ khi iOS hỏi.

Nếu beta.1 báo **“Mã tệp trả về không hợp lệ”**, hãy thay bằng bản mới này; bản sửa từ beta.2 vẫn được giữ. Mã truy cập cũ vẫn dùng được; sao chép từ cùng trang cài riêng rồi dán khi thiết lập. Không cần thay đổi tài khoản Instagram hoặc VPS.

Nếu tải trực tiếp từ [GitHub](https://github.com/tungnv107/shortcut/releases/download/v1.1.0-beta.4/Media-Saver.shortcut), vẫn cần mã từ trang cài riêng. Tệp có sẵn địa chỉ máy chủ nhưng không chứa mã bí mật. Giữ riêng trang cài vì người có link có thể lấy mã sử dụng VPS.

Nếu iOS bỏ qua câu hỏi thiết lập, mở **Phím tắt → Media Saver → …** và dán mã vào ô văn bản **Mã truy cập VPS** ở đầu luồng. Không thay đổi các tác vụ khác. Chưa có iPhone kết nối để xác nhận giao diện nhập bản này trên từng phiên bản iOS.

## Dùng hằng ngày

1. Mở một bài đăng hoặc video trong **Facebook, Instagram hoặc TikTok**.
2. Bấm **Chia sẻ**, rồi **Thêm / Khác / More / Share to…** nếu ứng dụng đang hiện menu riêng.
3. Trong bảng chia sẻ iOS, chọn **Media Saver** ở danh sách tác vụ.
4. Cho phép kết nối `media-saver.161.118.222.102.sslip.io` và thêm vào **Ảnh** khi iOS hỏi lần đầu. Giữ ứng dụng mở tới thông báo hoàn tất.
5. Nếu bài có nhiều media, đánh dấu **một hoặc nhiều mục** rồi bấm **Xong**. Danh sách ghi số thứ tự, **Ảnh/Video** và dung lượng; chưa có ảnh xem trước. Chọn **Tải tất cả** nếu muốn toàn bộ. Không mục nào được chọn sẵn; hủy/không chọn sẽ dừng, không lưu tệp. Bài chỉ có một media bỏ qua bước này.
6. Khi được hỏi **Tên album để lưu**, giữ `Media Saver` hoặc nhập tên album bạn muốn. Nếu tên đó đã có, dùng album đó; nếu chưa có, tạo mới. Chỉ hỏi một lần cho mỗi bài, không hỏi lại với từng ảnh/video. Không còn phụ thuộc tên album `Recents` hoặc ngôn ngữ iPhone.

Chỉ tệp đã chọn được tải về iPhone. VPS vẫn xử lý toàn bộ media lấy được trước khi cho chọn và tự xóa tệp tạm sau khoảng một giờ, kể cả tệp bạn không chọn.

Không cần mở bài bằng Safari. Nếu mở ô Media Saver trong Phím tắt, nó sẽ hỏi dán link. Nếu có nhiều link, chọn một bài.

## Phạm vi và thời gian chờ

- **TikTok:** đã thử video có âm thanh và bài 16 ảnh. Bài ảnh lưu thành ảnh, không ghép nhạc.
- **Instagram:** đã thử bài 5 ảnh và bài 3 video. Kết quả thực tế dùng nguồn dự phòng khi tải trực tiếp bị chặn.
- **Facebook:** đã thử video có âm thanh. **Album ảnh chưa tải được khi không có cookie**, chưa bảo đảm hỗ trợ ảnh/album.

Beta.3 nhận các bài cụ thể trong nhóm Facebook sau khi mở link `/share/p/…` hoặc `/share/v/…`. Nếu báo **“Đã nhận đúng link bài Facebook, nhưng Facebook chưa cung cấp media…”**, phần nhận link đã thành công; nội dung chưa tải được với phiên truy cập của VPS. Quản trị viên có thể cấu hình cookie Facebook để thử tiếp, không cần đổi album trên iPhone.

Không bảo đảm tải được mọi bài hoặc toàn bộ media của mọi bài. Stories, livestream, trang cá nhân và bài riêng tư chưa được xác nhận hỗ trợ. Mỗi bài tối đa 100 tệp, 512 MiB. Máy chủ giữ tệp tạm khoảng 1 giờ.

Sau khoảng 2 phút, nếu Shortcut báo VPS vẫn xử lý, đợi một lát rồi chia sẻ lại cùng bài. Tác vụ server có thể chạy tối đa 10 phút. iOS có thể dừng luồng lâu trong bảng chia sẻ; khi đó thử chạy ô Media Saver trong Phím tắt và dán cùng link. Chạy lại sau khi đã lưu có thể tạo bản sao; nếu dừng giữa chừng, các ảnh/video đã lưu vẫn còn.

## Khi gặp lỗi

| Hiện tượng | Cách xử lý |
|---|---|
| Không thấy Media Saver | Mở bảng chia sẻ **iOS** bằng Thêm/Khác. Trong chi tiết Shortcut, bật **Hiển thị trong bảng chia sẻ**; đầu vào cho phép URL và Văn bản. Kiểm tra đang dùng bản có ghi chú `Media Saver VPS 1.1.0-beta.4`. |
| Vẫn tự tải toàn bộ | Cài beta.4 và chọn **Thay thế** bản cũ. Bước chọn chỉ hiện khi VPS trả về nhiều media. Mã truy cập cũ vẫn dùng được. |
| Chưa nhận được liên kết | Ứng dụng phải gửi link bài. Có thể Sao chép liên kết rồi mở ô Media Saver để dán. Luồng vẫn giữ bản sửa định dạng Get URLs của beta.4. |
| Mã truy cập không đúng/chưa cấu hình | Sao chép lại mã từ trang cài riêng, cài lại và dán ở bước thiết lập. |
| Không kết nối được VPS | Kiểm tra Internet; quản trị viên kiểm tra container và HTTPS. |
| Nền tảng yêu cầu đăng nhập hoặc giới hạn truy cập | Thử lại sau hoặc thử bài công khai khác. Quản trị viên có thể cấu hình cookie trên VPS; không gửi mật khẩu/cookie vào chat. |
| Không lưu được vào Ảnh | Kiểm tra quyền thêm ảnh của Phím tắt và dung lượng iPhone. Chia sẻ lại nếu tệp tạm đã hết hạn. |

VPS xử lý URL bạn chọn, không đọc mật khẩu hoặc ảnh có sẵn trên điện thoại. Nguồn dự phòng có thể nhận URL bài công khai. [Hướng dẫn bảng chia sẻ của Apple](https://support.apple.com/en-gb/guide/shortcuts/apd163eb9f95/ios) · [Kết quả kiểm chứng và giới hạn](KIEM-THU.md).
