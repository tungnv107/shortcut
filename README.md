# Media Saver cho iOS — bản thử nghiệm

Shortcut dùng Safari để tìm ảnh/video thuộc **một bài đăng** Facebook, Instagram hoặc TikTok, sau đó tải từng tệp và lưu vào Ảnh. Không cần backend riêng hoặc ứng dụng phụ. Cần kết nối Internet.

**Chưa phải bản đã xác nhận chạy đầy đủ trên iPhone.** Bộ phân tích và quy trình tạo tệp đã được kiểm thử; kiểm tra website thực tế chỉ tải được ảnh Instagram mẫu, TikTok trả 403 và Facebook chưa lấy được tệp. Không có tuyên bố tải được mọi media hay mọi tài khoản.

## Tải và cài trên iPhone

**[Tải bộ cài ZIP](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.1/Media-Saver-iPhone.zip)** · **[Hướng dẫn cài từng bước](HUONG-DAN-IPHONE.md)** · **[Xem bản phát hành](https://github.com/tungnv107/shortcut/releases/tag/v1.0.0-beta.1)**

1. Mở link tải ZIP bằng Safari trên iPhone, lưu vào **Tệp**, chạm tệp ZIP để giải nén.
2. Mở `Safari-Media-Saver.txt`, sao chép toàn bộ mã.
3. Tạo **Media Saver** trong ứng dụng **Phím tắt** theo [9 bước trong hướng dẫn](HUONG-DAN-IPHONE.md#2-thêm-các-tác-vụ-theo-đúng-thứ-tự).
4. Mở bài đăng bằng Safari → **Chia sẻ → Media Saver**.

**Bản này cài thủ công.** Tệp `Media-Saver.unsigned.shortcut` chưa ký nên không nhập trực tiếp được. Không cần Mac, VPS hoặc ứng dụng phụ cho cách cài ở trên.

Nếu chỉ cần mã: [tải tệp TXT](https://github.com/tungnv107/shortcut/releases/download/v1.0.0-beta.1/Safari-Media-Saver.txt) hoặc [mở mã dạng văn bản](https://raw.githubusercontent.com/tungnv107/shortcut/v1.0.0-beta.1/dist/Safari-Media-Saver.txt).

| Tệp | Mục đích |
|---|---|
| `dist/Safari-Media-Saver.txt` | Sao chép toàn bộ vào tác vụ JavaScript trong Phím tắt. |
| `dist/Safari-Media-Saver.js` | Cùng nội dung ở dạng JavaScript. |
| `dist/Media-Saver.unsigned.shortcut` | Bản nguồn plist, phải ký trước khi nhập trực tiếp. |
| `dist/workflow.json` | Các tác vụ và liên kết biến để kiểm tra. |
| `src/collector.js` | Bộ trích xuất có thể bảo trì và kiểm thử. |
| `KIEM-THU.md` | Kết quả thực tế và phần chưa được xác nhận. |

## Cách hoạt động

1. Chỉ nhận trang Safari của một bài đăng; từ chối bảng tin/trang cá nhân và tên miền giả.
2. So khớp ID/shortcode của bài đăng trong JSON nhúng; lấy carousel/ảnh/video theo nền tảng.
3. Nếu cần, Instagram được hỏi qua GET cùng tên miền, dùng phiên Safari sẵn có. Không đọc/xuất cookie, mật khẩu, token tài khoản; không gửi dữ liệu đến dịch vụ tải hộ.
4. Nếu không có dữ liệu cấu trúc, đọc media của phần bài đăng trong DOM hoặc metadata đúng bài; đánh dấu có thể thiếu. Không quét toàn bộ ảnh trên trang.
5. Phím tắt tải từng URL với Referer của trang nguồn và đưa kết quả vào tác vụ Save to Photo Album. URL media có thể bị CDN chặn dù Safari đang phát được.

Không có giới hạn số lượng tệp tùy ý, nhưng có giới hạn dữ liệu JSON và thời gian đọc để tránh treo tiện ích iOS. Không tự cuộn/truy cập bài khác; không ghép luồng HLS/DASH, âm thanh riêng hoặc hỗ trợ tải tiếp.

## Phát triển và kiểm thử

Không cần cài npm package. Yêu cầu Node.js 20+ cho công cụ phát triển; iPhone không cần Node.js.

```powershell
npm.cmd run verify
npm.cmd run test:browser
```

`verify` tạo lại các tệp trong `dist` và chạy kiểm thử logic. `test:browser` chạy Chrome/Edge headless với một hồ sơ tạm riêng, kiểm tra DOM của năm trang mẫu. Có thể đặt `MEDIA_SAVER_BROWSER` nếu trình duyệt nằm ở đường dẫn khác. Lệnh headless không mở hồ sơ trình duyệt đang sử dụng.

`node tools/browser-check.cjs --live` đọc các bản HTML công khai đã lưu trong `artifacts/live`. `node tools/probe-live.cjs` kiểm tra một phần tệp media tìm được. Những lệnh này không chứng minh Safari/iOS đã chạy thành công. HTML, URL CDN tạm và hồ sơ kiểm thử được bỏ qua bởi `.gitignore`.

Các test dùng dữ liệu dựng theo cấu trúc tham khảo, không phải toàn bộ dữ liệu phản hồi thật của nền tảng. Dữ liệu thật có thể thay đổi.

## Tài liệu tham khảo

- [Apple Shortcuts](https://support.apple.com/en-asia/guide/shortcuts/apdb71a01d93/ios).
- [yt-dlp: Instagram](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/instagram.py), [Facebook](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/facebook.py), [TikTok](https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/tiktok.py): đối chiếu trường dữ liệu và URL mẫu, không dùng yt-dlp làm backend.
- [gallery-dl: TikTok](https://github.com/mikf/gallery-dl/blob/master/gallery_dl/extractor/tiktok.py): đối chiếu cấu trúc bài ảnh.
- [Cherri: tác vụ Web](https://github.com/electrikmilk/cherri/blob/main/actions/web.cherri), [Photos](https://github.com/electrikmilk/cherri/blob/main/actions/photos.cherri): đối chiếu định danh/tham số Shortcut. Mã của dự án được viết riêng.
