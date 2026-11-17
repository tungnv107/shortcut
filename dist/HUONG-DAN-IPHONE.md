# Media Saver — cài trực tiếp trên iPhone

Bản thử nghiệm chạy bằng **Safari + Phím tắt (Shortcuts)**, không cần máy tính/VPS khi sử dụng, không cần Scriptable, không dùng website tải hộ. Phạm vi là media của **một bài đăng đang mở**. Không quét toàn bộ tài khoản hoặc toàn bộ lịch sử Facebook/Instagram/TikTok.

**Trạng thái:** đã kiểm thử mã và DOM trên Windows; chưa kiểm thử việc nhập/chạy/lưu vào Ảnh trên iPhone thật. Không bảo đảm lấy đủ mọi bài. Xem kết quả thực tế ở `KIEM-THU.md`.

## Cài nhanh — không cần Mac, không cần chép mã

1. Trên Safari của iPhone, bấm **[Tải Media-Saver.shortcut đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.2/Media-Saver.shortcut)**.
2. Mở tệp vừa tải từ nút tải về của Safari hoặc **Tệp → Tải về**. Nếu đang mở link trong trình duyệt của ứng dụng khác, chọn mở bằng Safari trước.
3. Khi ứng dụng **Phím tắt** hiện màn hình nhập, bấm **Thêm phím tắt / Add Shortcut**. Không cần tạo lại các tác vụ.

Sau khi thêm, vào **Cài đặt → Phím tắt → Nâng cao**, bật **Cho phép chạy tập lệnh / Allow Running Scripts** nếu iOS yêu cầu. Tùy phiên bản iOS, mục Phím tắt nằm trong **Cài đặt → Ứng dụng**.

Để dùng: mở bài đăng trong Safari → **Chia sẻ → Media Saver**. Cấp quyền truy cập trang, tải tệp và thêm vào Ảnh khi iOS hỏi lần đầu. iOS vẫn yêu cầu bạn xác nhận cài; link tải không tự bỏ qua bước xác nhận.

Tên tệp cần mở là **`Media-Saver.shortcut`**. `Media-Saver.unsigned.shortcut` là bản nguồn dành cho phát triển, không phải bản cài.

Tệp đã được Shortcuty ký ở chế độ `anyone`; đã kiểm tra định dạng và SHA-256. Việc nhập/chạy trên iPhone thật chưa được xác nhận trong môi trường hiện tại. Nếu iOS báo lỗi nhập, giữ nguyên thông báo lỗi để kiểm tra tiếp.

**Phần dưới chỉ là phương án cài thủ công dự phòng. Bạn có thể bỏ qua khi đã thêm được bản ký.**

## 1. Chuẩn bị (cài thủ công dự phòng)

1. Trên Safari của iPhone, [tải Media-Saver-iPhone.zip](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.2/Media-Saver-iPhone.zip). Mở **Tệp → Tải về**, chạm tệp ZIP để giải nén. Mở `Safari-Media-Saver.txt`, chọn toàn bộ rồi sao chép. Trong mã nguồn GitHub, tệp này nằm trong thư mục `dist`; tệp `.txt` và `.js` có nội dung giống nhau.
2. Mở **Cài đặt**, tìm **Phím tắt / Shortcuts → Nâng cao / Advanced**, bật **Cho phép chạy tập lệnh / Allow Running Scripts**. Tùy iOS, Phím tắt có thể nằm trong mục **Ứng dụng**.
3. Mở **Phím tắt**, bấm **+**, đặt tên **Media Saver**.
4. Mở phần **Chi tiết** của phím tắt, bật **Hiển thị trong bảng chia sẻ / Show in Share Sheet**.
5. Ở dòng **Nhận / Receive**, chỉ giữ **Trang web Safari / Safari Web Pages**. Không chọn chỉ URL: tác vụ JavaScript cần trang Safari đang mở, không phải văn bản đường dẫn.

Tên dịch có thể thay đổi theo phiên bản iOS; tên tiếng Anh trong bảng bên dưới là tên để đối chiếu.

## 2. Thêm các tác vụ theo đúng thứ tự

Ở các bước lấy từ điển, phải chọn lại đầu ra của tác vụ JavaScript bằng **Chọn biến / Select Variable**. Đừng để tự dùng đầu ra của tác vụ ngay trước đó.

| Bước | Tác vụ | Cấu hình |
|---|---|---|
| 1 | **Chạy JavaScript trên trang web / Run JavaScript on Web Page** | Đầu vào: **Đầu vào phím tắt / Shortcut Input**. Xóa mã mẫu và dán toàn bộ nội dung `Safari-Media-Saver.txt`. Đặt tên biến đầu ra là **Kết quả media** để dễ chọn. |
| 2 | **Lấy giá trị từ điển / Get Dictionary Value** | Lấy khóa **`notice`** từ **Kết quả media** (đầu ra bước 1). |
| 3 | **Hiển thị cảnh báo / Show Alert** | Tiêu đề: **Media Saver**. Nội dung: giá trị ở bước 2. Bật nút **Hủy / Cancel**. |
| 4 | **Lấy giá trị từ điển / Get Dictionary Value** | Lấy khóa **`pageURL`** từ **Kết quả media**, không phải từ cảnh báo. Gọi đầu ra này là **Trang nguồn**. |
| 5 | **Lấy giá trị từ điển / Get Dictionary Value** | Lấy khóa **`urls`** từ **Kết quả media**. Đây là danh sách liên kết media, không phải liên kết bài đăng. |
| 6 | **Lặp lại với mỗi mục / Repeat with Each** | Lặp với danh sách ở bước 5. Hai tác vụ tiếp theo đặt bên trong khối lặp. |
| 7 | **Lấy nội dung của URL / Get Contents of URL** | URL: **Mục lặp lại / Repeat Item**. Phương thức **GET**. Mở thêm tùy chọn, thêm tiêu đề **`Referer`** có giá trị là biến **Trang nguồn** ở bước 4. |
| 8 | **Lưu vào album ảnh / Save to Photo Album** | Đầu vào: **Nội dung của URL** ở bước 7. Album: **Gần đây / Recents**, hoặc album bạn tự chọn. Tác vụ này nhận cả ảnh lẫn video tương thích. |
| 9 | **Kết thúc lặp lại / End Repeat** | Dòng này được tạo tự động khi thêm vòng lặp. |

Không cần thêm tác vụ **Lấy hình ảnh từ đầu vào**: tác vụ đó sẽ làm mất video.

## 3. Dùng hằng ngày

1. Trong Facebook/Instagram/TikTok, **Sao chép liên kết** của bài đăng.
2. Dán và mở liên kết trong **Safari**. Chờ liên kết rút gọn chuyển thành trang bài đăng thật. Nếu trang yêu cầu đăng nhập, đăng nhập trực tiếp trong Safari.
3. Chờ ảnh hiện rõ. Với video, bấm phát một lần. Với bài nhiều ảnh, lướt các ảnh để trang tải dữ liệu.
4. Bấm **Chia sẻ → Media Saver**. Cho phép JavaScript truy cập trang, tải từ tên miền media và thêm vào Ảnh khi iOS hỏi lần đầu.
5. Đọc số lượng tìm được và thông báo thiếu dữ liệu. Bấm **OK** để tải lần lượt. Giữ Safari/Phím tắt đang mở cho tới khi hoàn tất.
6. Mở **Ảnh** và kiểm tra các tệp vừa lưu. Phím tắt chỉ lưu những media thực sự tải được; lỗi tải giữa chừng sẽ dừng vòng lặp, các tệp trước đó vẫn còn.

**Chạy lại có thể tạo bản sao trong Ảnh.** Chỉ loại trùng trong một lần chạy, không đọc thư viện Ảnh để so sánh giữa các lần.

## Khả năng và giới hạn

| Nội dung | Cách xử lý / giới hạn |
|---|---|
| Instagram ảnh, Reels, bài nhiều ảnh/video | Đọc dữ liệu bài đăng và thử một yêu cầu GET cùng tên miền bằng phiên Safari hiện tại. Nếu bị chặn, chỉ lấy được media trong DOM/metadata; có cảnh báo có thể thiếu. |
| TikTok video | Lấy URL phát/tải trực tiếp do trang cung cấp. CDN có thể từ chối 403 vì cookie, chữ ký URL, khu vực hoặc điều kiện tải; bản này không vượt qua chặn đó. |
| TikTok bài ảnh | Lấy toàn bộ `imagePost.images` khi dữ liệu này hiện diện trong trang. Nhạc nền không được ghép vào bộ ảnh. |
| Facebook ảnh, video, Reels, bài có nhiều tệp | Đọc các phần đính kèm và URL video trực tiếp nếu trang cung cấp. Nhiều bài yêu cầu đăng nhập hoặc không cung cấp tệp trong HTML/DOM. |
| Video HLS/DASH hoặc `blob:` | Không ghép các đoạn/âm thanh thành MP4. Không tải ảnh bìa rồi báo là video. |
| Nội dung riêng tư, Stories, livestream, nội dung trả phí | Không có cam kết hỗ trợ; không vượt quyền truy cập hoặc DRM. Stories và livestream không nằm trong phạm vi bản này. |
| Toàn bộ trang cá nhân, nhóm, playlist, album phân trang | Không hỗ trợ. Mở từng bài đăng cụ thể. |
| Chất lượng / watermark | Chọn phiên bản tốt nhất trong dữ liệu đọc được; không cam kết chất lượng gốc hoặc xóa watermark. |

## Khi gặp lỗi

- **Không thấy Media Saver trong menu chia sẻ:** mở menu của Safari, không phải menu bên trong ứng dụng mạng xã hội; kiểm tra loại đầu vào là Trang web Safari.
- **Không thể chuyển URL thành Trang web Safari:** chạy từ nút Chia sẻ của trang đang mở trong Safari. Không chạy bằng cách dán URL vào tác vụ JavaScript.
- **Chưa tìm được media:** mở đúng bài đăng, đăng nhập Safari, tắt chế độ Reader nếu đang dùng, tải lại trang, phát video/lướt ảnh rồi thử lại.
- **Chỉ có một ảnh của bài nhiều ảnh:** trang/API chỉ trả một phần; đọc cảnh báo và mở các ảnh còn lại. Bản này không tự khẳng định đã lấy đủ.
- **403 hoặc Không thể lưu vào Ảnh:** URL CDN có thể hết hạn/bị chặn, hoặc phản hồi là trang HTML thay vì tệp media. Tải lại bài rồi chạy lại. Nếu vẫn lỗi thì bài đó hiện không được hỗ trợ; đổi đuôi `.mp4` không khắc phục được.
- **Video lớn bị dừng:** iOS có giới hạn thời gian/bộ nhớ khi chạy tiện ích. Giữ ứng dụng mở; bản này không hỗ trợ tiếp tục tải đang dở.

## Tệp `.shortcut` đi kèm

`Media-Saver.shortcut` trong Release beta.2 là **bản đã ký** để cài theo phần Cài nhanh. `dist/Media-Saver.unsigned.shortcut` vẫn là **bản nguồn CHƯA KÝ**, dùng để bảo trì/tự ký lại.

Nếu sau này có Mac, có thể ký bản nguồn bằng Terminal:

```sh
shortcuts sign --mode anyone --input "Media-Saver.unsigned.shortcut" --output "Media-Saver.shortcut"
```

Sau đó chuyển tệp đã ký sang iPhone, mở bằng Phím tắt, xem các tác vụ rồi thêm. Bản phát hành hiện tại đã được ký qua Shortcuty nên bạn không cần thực hiện lệnh này. Không có liên kết iCloud được xuất bản trong dự án này; link tải là GitHub Release.

## Nguồn đối chiếu

- [Apple: Run JavaScript on Webpage](https://support.apple.com/en-asia/guide/shortcuts/apdb71a01d93/ios) — yêu cầu đầu vào Safari và bật menu Chia sẻ.
- [Apple: Cho phép chạy tập lệnh](https://support.apple.com/en-vn/guide/shortcuts/apdfeb05586f/ios) — vị trí thiết lập và quyền truy cập trang.
- [Apple: ký Shortcut bằng dòng lệnh](https://support.apple.com/en-gb/guide/shortcuts-mac/apd455c82f02/mac) — quy trình ký trên macOS.
