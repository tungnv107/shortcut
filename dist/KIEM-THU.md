# Kiểm thử Media Saver 1.1.0-beta.1 — 17/11/2026

## Kiểm tra mã

`npm run verify`: **55/55 test đạt** trên Node.js 24. Trong đó 4 test cho Shortcut VPS, 7 test HTTP/backend và 44 test giữ lại cho các luồng/collector trước. Test cũ không được tính là kiểm tra tải thực tế của VPS.

Luồng mới có **89 tác vụ Phím tắt gốc**: nhận URL/văn bản từ bảng chia sẻ, hỏi liên kết nếu mở trực tiếp, gửi POST JSON có Bearer token, theo dõi trạng thái, kiểm tra ID tệp rồi tải từ cùng VPS và lưu vào Ảnh. Một câu hỏi nhập mã được gắn vào tác vụ văn bản thứ ba. Cấu trúc import question được đối chiếu [Cherri shortcutgen.go](https://github.com/electrikmilk/cherri/blob/main/shortcutgen.go).

Các test mới kiểm tra: chỉ gửi mã tới VPS; tải theo đúng trạng thái; không lưu khi lỗi; chặn ID tệp có URL; giới hạn số lần chờ; xác thực API; URL giả/nội bộ; Range; gộp tác vụ trùng; giới hạn hàng đợi đồng thời; hết hạn tệp; kết quả một phần; trang cài riêng; loại cache codec cũ khi restart. Dùng downloader giả cho test API, không gọi nền tảng trong unit test.

Bản sửa Get URLs từ beta.4 vẫn được giữ: đầu vào dùng `WFTextTokenString`, tránh kiểu `WFTextTokenAttachment` không phù hợp với tham số văn bản. Mô hình `test/helpers/native-runner.cjs` mô phỏng các tác vụ; **không thay thế kiểm tra trên iOS**.

## Tải thực tế trên VPS

Server ARM64 Ubuntu, Docker, HTTPS tên miền sslip.io có chứng chỉ công khai. Bộ tải: yt-dlp 2026.10.26, gallery-dl 1.32.20, FFmpeg. Chưa có cookie đăng nhập. Probe tạo tác vụ qua API có xác thực, tải **toàn bộ từng tệp** qua HTTPS, so số byte, dấu hiệu định dạng, SHA-256 và đọc codec bằng ffprobe trên VPS.

| Mẫu | Kết quả | Nguồn và định dạng |
|---|---|---|
| TikTok video `6742501081818877190` | 1 tệp thành công | Trực tiếp; MP4 H.264 540×960 + AAC |
| TikTok ảnh `7240568259186019630` | 16 tệp thành công | Trực tiếp; 16 JPEG |
| Instagram ảnh `BoHk1haB5tM` | 5 tệp thành công | Siputzx/SSSInstagram dự phòng; 5 JPEG 1080×1080 |
| Instagram video `BQ0eAlwhDrw` | 3 tệp thành công | Siputzx/SSSInstagram dự phòng; MP4 H.264 640×640, không có luồng âm thanh trong nguồn mẫu |
| Facebook video CNN `10155529876156509` | 1 tệp thành công | Trực tiếp; MP4 H.264 1080×1080 + AAC |
| Facebook album `a.10152716010956729` | Thất bại | Không lấy được media khi chưa có cookie; không xác nhận hỗ trợ album |

Tổng cộng **26 tệp từ 5 bài thành công, 1 bài thất bại**. Kết quả không được diễn giải thành “mọi ảnh/video trên cả ba nền tảng đều tải được”. Máy chủ thực tế đã dùng nguồn dự phòng cho Instagram; không khẳng định chỉ cần tải trực tiếp là đủ.

Trong kiểm thử đầu, video Facebook chứa VP9 dù đuôi MP4; đã thêm kiểm tra codec, chuyển sang H.264 và vô hiệu cache cũ. Lần tải lại xác nhận H.264 + AAC. Lần gọi Instagram đầu gặp lỗi nhà cung cấp; đã thêm thử lại tối đa ba lần và lần kiểm tra sau lấy đủ 5 ảnh. Hai vấn đề này được phát hiện bằng tải thực tế, không chỉ kiểm tra phản hồi JSON.

Báo cáo máy đọc: [artifacts/server-live-results.json](artifacts/server-live-results.json), được sao vào `dist/SERVER-LIVE-RESULTS.json` khi đóng gói. Báo cáo chỉ chứa URL bài công khai, thông số tệp và kết quả; không chứa token, cookie, link CDN tạm hoặc URL cài riêng. Các báo cáo `native-live-results.json`, `browser-results.json` cũ không đại diện cho bản VPS này.

## Vận hành và bản cài

`/healthz` được kiểm tra qua HTTPS từ bên ngoài; API tác vụ/tệp yêu cầu mã. Trang cài riêng trả HTTP 200 với nút sao chép mã và link bản phát hành, kèm `no-store` và `no-referrer`. Nginx kiểm tra cấu hình thành công, dịch vụ mới chỉ thêm hostname riêng vào NPM hiện có; cổng HTTP backend chỉ bind localhost. Certbot `renew --cert-name media-saver --dry-run` đã hoàn tất thành công; cron gia hạn riêng chứng chỉ này đã được cài.

Shortcut được Shortcuty ký chế độ `anyone`, kiểm tra marker `AEA1`, kích thước và SHA-256 nguồn/đầu ra. `SIGNING-VERIFICATION.json` ghi `deviceImportTested: false`; đây không phải xác minh chữ ký độc lập bằng thiết bị Apple. Tệp công khai và dữ liệu gửi ký không chứa API token. Công cụ đóng gói từ chối chữ ký không khớp workflow hiện tại.

## Chưa xác nhận

Chưa có iPhone kết nối để thử nhập bản 1.1.0-beta.1, câu hỏi mã truy cập, hiển thị trong bảng chia sẻ từng ứng dụng, quyền truy cập và lưu vào Ảnh. Kiểm tra codec không phải phát toàn bộ video trên iPhone. Không có kết quả với bài Instagram chính xác trong ảnh lỗi của người dùng vì chưa nhận được URL bài đó.

Ảnh/album Facebook chưa đạt trong thử nghiệm; cookie có thể cần nhưng chưa được cung cấp hoặc kiểm tra. Nội dung riêng tư, Stories, livestream, bài bị giới hạn vùng và mọi dạng link rút gọn chưa được xác nhận. Cấu hình giới hạn 100 tệp/512 MiB mỗi bài và thời gian xử lý có thể khiến bài lớn không tải hết. Nguồn tải có thể thay đổi sau thời điểm kiểm tra.
