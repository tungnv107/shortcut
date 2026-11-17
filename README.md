# Media Saver cho iPhone — beta.3

**Facebook / TikTok / Instagram → Chia sẻ → Thêm/Khác → Media Saver → lưu vào Ảnh.**

Chỉ cần ứng dụng **Phím tắt**. Bản beta.3 nhận URL hoặc văn bản từ bảng chia sẻ iOS và dùng tác vụ gốc để tải tệp. Không cần Scriptable, Mac, chép mã hay tự dựng VPS. Khi sử dụng, link bài đăng được gửi tới các dịch vụ tải công khai; cần Internet.

**[Tải Media Saver beta.3 đã ký để cài](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.3/Media-Saver.shortcut)** · [Hướng dẫn iPhone](HUONG-DAN-IPHONE.md) · [Bản phát hành](https://github.com/tungnv107/shortcut/releases/tag/v1.0.0-beta.3)

## Cài hoặc cập nhật

1. Mở link tải trên bằng Safari, rồi mở tệp `Media-Saver.shortcut` vừa tải.
2. Bấm **Thêm phím tắt**. Nếu đã có Media Saver, chọn **Thay thế** khi iOS hỏi. Nếu iOS tạo bản trùng, xóa bản cũ beta.2 để tránh chạy nhầm.
3. Trong ứng dụng mạng xã hội, mở bài → **Chia sẻ → Thêm/Khác → Media Saver**. Cấp quyền kết nối và thêm vào Ảnh khi iOS hỏi lần đầu.

`Thêm/Khác` dùng để mở **bảng chia sẻ của iOS**; tên/vị trí nút tùy phiên bản ứng dụng. Cuộn xuống danh sách tác vụ để thấy Media Saver. Shortcut đã bật hiển thị trong bảng chia sẻ và nhận **URL, Văn bản, Trang web Safari**. Không cần bật quyền chạy JavaScript.

## Phạm vi hiện tại

| Nền tảng | Nội dung được xử lý | Kết quả kiểm tra thực tế trên máy tính |
|---|---|---|
| TikTok | Video hoặc tất cả ảnh mà API trả về cho một bài | Nhận 1 video; bài ảnh nhận 16 ảnh. Tệp video và ảnh mẫu tải được. |
| Instagram | Ảnh, Reel, bài nhiều ảnh/video | Nhận đủ danh sách 5 ảnh và 3 video từ hai bài mẫu; tải được tệp mẫu của mỗi loại. |
| Facebook | Một video/Reel; chọn một bản MP4, bỏ ảnh bìa và các bản chất lượng trùng | Video công khai mẫu tải được. **Chưa hỗ trợ ảnh/album Facebook.** |

Kiểm tra mạng dùng 1.024 byte đầu của một tệp cho mỗi trường hợp: HTTP 206, MIME và dấu hiệu JPEG/MP4 hợp lệ. **Chưa kiểm thử nhập/chạy beta.3 và lưu vào Ảnh trên iPhone thật**, cũng chưa kiểm tra phát hết video/âm thanh. [Báo cáo chi tiết](KIEM-THU.md).

Không cam kết tải mọi bài hoặc chất lượng gốc. Bài riêng tư, Stories, livestream, toàn bộ trang cá nhân, album Facebook và luồng HLS/DASH chưa được hỗ trợ. Một lần chạy xử lý một bài; nếu nhận nhiều link sẽ hỏi chọn bài. Lỗi tải/lưu giữa chừng làm dừng Shortcut; các tệp đã lưu vẫn còn. Chạy lại có thể tạo bản sao.

## Dịch vụ và dữ liệu gửi đi

| Nền tảng | Dịch vụ nhận link | Cách chọn tệp |
|---|---|---|
| TikTok | [TikWM](https://www.tikwm.com/) | Dùng danh sách `images`; với video ưu tiên `hdplay`, dự phòng `play`. |
| Instagram | [Siputzx](https://app.siputzx.my.id/) qua endpoint SSSInstagram | Lặp từng media, lấy một biến thể tải; bỏ `thumb`. [OpenAPI công khai](https://api.siputzx.my.id/api/openapi.json). |
| Facebook | [VKrDownloader](https://github.com/theofficialvkr/VKrDownloader) | Chọn MP4 đầu tiên, không chọn JPEG dù dịch vụ gắn nhãn “4K”. |

Shortcut gửi đầy đủ link bạn chia sẻ tới dịch vụ tương ứng rồi tải từ URL dịch vụ trả về. Không đọc/gửi cookie, mật khẩu, token tài khoản hoặc thư viện Ảnh. Không dùng phiên đăng nhập Facebook/Instagram/TikTok trên iPhone. Các dịch vụ có thể đổi API, giới hạn lượt gọi hoặc ngừng hoạt động.

## Mã nguồn và kiểm thử

Node.js 20+ chỉ cần trên máy phát triển; iPhone không cần Node.js hay npm package.

```powershell
npm.cmd run verify
node tools/sign-shortcut.cjs
powershell -NoProfile -ExecutionPolicy Bypass -File tools/package.ps1
```

- `src/native-workflow.cjs`: tạo các tác vụ Phím tắt gốc cho beta.3.
- `dist/workflow.json`, `dist/Media-Saver.unsigned.shortcut`: nguồn có thể kiểm tra; bản unsigned không dùng để cài trực tiếp.
- `test/native-workflow.test.cjs`: kiểm tra đầu vào chia sẻ, album, loại ảnh bìa, lỗi mạng/API, URL và các nhánh xử lý bằng mô hình tác vụ. Mô hình này không phải runtime iOS.
- `test/fixtures`: cấu trúc rút gọn từ phản hồi API thật, URL tạm được thay bằng tên miền thử nghiệm.
- `artifacts/native-live-results.json`: báo cáo kiểm tra API và mẫu tệp của beta.3.
- `src/collector.js`, `dist/Safari-Media-Saver.*`: bộ trích xuất Safari cũ để tham khảo/bảo trì; **không được chạy trong Shortcut beta.3**. Các báo cáo `browser-results.json` và `live-probe-results.json` thuộc cách cũ.

Công cụ ký gửi nguồn workflow công khai tới [Shortcuty](https://github.com/Shortcuty/Signing-Server-API-Documentation), nhận tệp `AEA1` chế độ `anyone` và đối chiếu kích thước, SHA-256. Chưa xác minh chữ ký độc lập trên thiết bị. Shortcut đã cài không gọi Shortcuty khi tải media. Công cụ đóng gói từ chối bản ký không khớp nguồn.

[Tải gói ZIP](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.3/Media-Saver-iPhone.zip) · [Apple: chạy Shortcut từ ứng dụng khác](https://support.apple.com/en-gb/guide/shortcuts/apd163eb9f95/ios) · [Cherri: cấu trúc tác vụ](https://github.com/electrikmilk/cherri/blob/main/shortcutgen.go)
