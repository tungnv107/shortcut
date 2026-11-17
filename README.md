# Media Saver — Shortcut iPhone + VPS Docker

Chia sẻ bài từ **Facebook / Instagram / TikTok → Thêm/Khác → Media Saver**. VPS tải và chuẩn hóa media; iPhone lưu từng tệp vào ứng dụng **Ảnh** bằng các tác vụ Phím tắt gốc. Không cần Mac hoặc Scriptable.

**Beta.4:** bài có nhiều media sẽ hiện danh sách để chọn một hoặc nhiều mục, hoặc **Tải tất cả**. Mỗi dòng có số thứ tự, loại **Ảnh/Video** và dung lượng; chưa có ảnh xem trước. Không chọn sẵn mục nào. Chỉ các mục đã chọn được tải về iPhone; bài một media bỏ qua bước chọn. Tiếp theo nhập tên album một lần (mặc định **Media Saver**); album cùng tên được dùng lại hoặc tạo mới.

**Sửa máy chủ ngày 17/11/2026:** một số Instagram Reel bị báo “Dịch vụ dự phòng đang lỗi” vì nguồn trả một đối tượng media thay vì danh sách. Server nay nhận cả hai dạng và ưu tiên tải Reel trực tiếp bằng yt-dlp. Riêng bản sửa Reel không yêu cầu cài lại; tính năng chọn media ở beta.4 cần cập nhật Shortcut như hướng dẫn bên dưới.

## Cài v1.1.0-beta.4

Dùng **trang cài riêng** được quản trị viên gửi: sao chép mã truy cập → tải Shortcut → dán mã khi được hỏi → Thêm/Thay thế Media Saver cũ. Đây là thiết lập một lần. Trang cài và mã truy cập không được đăng lên GitHub.

[Tải Shortcut đã ký](https://github.com/tungnv107/shortcut/releases/download/v1.1.0-beta.4/Media-Saver.shortcut) · [Hướng dẫn iPhone](HUONG-DAN-IPHONE.md) · [Vận hành VPS](DOCKER-VPS.md) · [Kết quả kiểm thử](KIEM-THU.md)

Cần cài bản Shortcut mới để có bước chọn; mã truy cập cũ vẫn dùng được. Backend beta.4 bổ sung danh sách lựa chọn và vẫn tương thích các bản Shortcut VPS cũ.

Tệp công khai đã điền địa chỉ VPS `https://media-saver.161.118.222.102.sslip.io`, **chưa chứa mã truy cập**. Người khác tải tệp sẽ không dùng được dịch vụ nếu chưa được cấp mã. Bản cũ 1.0.0-beta.4 gọi dịch vụ công khai trực tiếp; cần cài lại bản này để chuyển sang VPS.

**Nếu beta.1 báo “Mã tệp trả về không hợp lệ”** dù đã nhận link: cài bản mới và chọn Thay thế. Bản sửa từ beta.2 vẫn được giữ. Server trả danh sách mã dạng văn bản và Shortcut lấy từng mã theo vị trí. Đã chạy mô hình luồng mới với API thật, tải đủ hai album 5 và 8 ảnh của các lần lỗi; chưa xác nhận bản sửa trên iPhone thật.

## Phạm vi đã kiểm chứng

Kiểm tra bộ tải trên VPS ngày 17/11/2026 ở beta.1, tải toàn bộ tệp qua HTTPS có xác thực. Báo cáo cũ được giữ nguyên; beta.3 bổ sung kiểm tra link Facebook nhóm bên dưới:

| Nội dung mẫu | Kết quả |
|---|---|
| TikTok video | 1 MP4, H.264 + AAC |
| TikTok bài ảnh | 16 JPEG |
| Instagram bài ảnh | 5 JPEG qua nguồn dự phòng |
| Instagram bài video | 3 MP4 H.264 qua nguồn dự phòng; nguồn mẫu không có luồng âm thanh |
| Facebook video | 1 MP4, H.264 + AAC |
| Facebook album ảnh | Chưa tải được trong thử nghiệm không có cookie |

Ảnh/album Facebook có bộ xử lý gallery-dl nhưng **chưa xác nhận hoạt động**; có thể cần cookie đăng nhập. Không hứa tải được mọi bài hoặc mọi media. Chưa thử cài/chạy bản này trên iPhone thật. Bài riêng tư, Stories, livestream, tải cả trang cá nhân không thuộc phạm vi bản phát hành.

Kiểm tra thêm ở beta.3: video nhóm từ link `/share/v/…` từng báo lỗi đã tải đủ 19.616.516 byte, H.264 + AAC. Bài ảnh nhóm từ `/share/p/…` đã nhận dạng đúng nhưng vẫn không lấy được media khi VPS chưa có cookie. Xem [báo cáo Facebook](artifacts/facebook-live-results.json).

## Cách hoạt động

Shortcut gửi URL bài tới API riêng, theo dõi hàng đợi, cho chọn media nếu có nhiều mục rồi tải các tệp đã chọn từ cùng VPS. **Server vẫn tải và xử lý toàn bộ media lấy được của bài trước khi hiện danh sách**; lựa chọn chỉ giảm số tệp tải về/lưu trên iPhone, không giảm dung lượng xử lý ban đầu trên VPS. Tệp không chọn vẫn tự hết hạn cùng tác vụ. Server dùng **gallery-dl / yt-dlp / FFmpeg**: ảnh thành JPEG, video thành MP4 H.264 và âm thanh AAC nếu nguồn có âm thanh. Nếu nguồn trực tiếp thất bại và chưa cấu hình cookie, server có thể gửi link bài công khai tới TikWM, Siputzx/SSSInstagram hoặc VKrDownloader. Có thể tắt bằng `ALLOW_PUBLIC_FALLBACK: "0"`.

Mặc định: tối đa 100 tệp và 512 MiB mỗi bài; một tác vụ chạy cùng lúc; hàng đợi tối đa 8; xử lý tối đa 10 phút; giữ tệp tạm 1 giờ. Phím tắt chờ khoảng 2 phút, sau đó cho phép chia sẻ lại cùng bài để lấy kết quả đang xử lý. Tải lại có thể tạo bản sao trong Ảnh.

## Mã nguồn và kiểm tra

```sh
npm run verify
```

Node.js 24, không cần thư viện npm. Backend có thêm Python, yt-dlp, gallery-dl và FFmpeg được cài trong image Docker. Hướng dẫn Docker tại [DOCKER-VPS.md](DOCKER-VPS.md).

- `src/native-workflow.cjs`: tạo luồng VPS với 138 tác vụ gốc.
- `server/`: API, hàng đợi, tải và chuẩn hóa tệp.
- `compose.yaml`, `deploy/`: cấu hình Docker và HTTPS cho VPS đã chỉ định.
- `tools/probe-server.cjs`: kiểm tra tải tệp thực tế; `artifacts/server-live-results.json`: báo cáo đã loại thông tin bí mật.
- `artifacts/selection-live-results.json`: kiểm tra beta.4 chọn một/nhiều mục, tải tất cả, hủy và bài đơn với API thật; không phải kiểm tra iPhone.
- `artifacts/shortcut-live-results.json`: báo cáo beta.3 với API thật và hai album 5/8 ảnh, giữ để tham khảo.
- `artifacts/facebook-live-results.json`: kết quả của hai link Facebook nhóm từng bị từ chối, không chứa URL bài hoặc token.
- `dist/workflow.json`, `dist/Media-Saver.unsigned.shortcut`: đầu ra có thể kiểm tra; tệp ký nằm trong GitHub Release.
- `src/legacy-workflow.cjs`, các báo cáo `native-live`/Safari: giữ để tham khảo bản cũ, không phải luồng hiện tại.

Shortcut công khai được [Shortcuty](https://github.com/Shortcuty/Signing-Server-API-Documentation) ký chế độ `anyone`; **không gửi mã truy cập VPS** tới dịch vụ ký. Công cụ kiểm tra marker, kích thước và SHA-256, từ chối đóng gói bản ký không khớp nguồn. Xác nhận nhập và chạy trên iOS vẫn cần thiết bị thật.
