# Kiểm thử Media Saver 1.1.0-beta.3 — 17/11/2026

## Kiểm tra mã

`npm run verify`: **65/65 test đạt** trên Node.js 24 sau bản sửa server Instagram Reel. Trong đó 7 test cho Shortcut VPS, 9 test HTTP/backend, 5 test phản hồi Instagram và 44 test giữ lại cho các luồng/collector trước. Báo cáo đi kèm tệp Shortcut beta.3 giữ kết quả 60 test tại lúc phát hành; không cần phát hành lại tệp cài cho thay đổi chỉ ở server.

## Sửa phản hồi Reel đơn trên máy chủ

Hai tác vụ Reel lúc 10:37 và 10:39 ngày 17/11/2026 bị báo “Dịch vụ dự phòng đang lỗi”. Đối chiếu nguồn thật cho thấy HTTP 200, `status: true`, nhưng `data` là một đối tượng có `url[]`; carousel trả `data` dạng mảng. Mã cũ chỉ chấp nhận mảng, nên thử lại ba lần rồi báo lỗi dù phản hồi hợp lệ. VPS vẫn khỏe và các album ảnh khác vẫn tải được; không phải lỗi mã truy cập hay đầy bộ nhớ.

Server nhận cả đối tượng đơn và danh sách. Mỗi media chọn một chất lượng phù hợp, ưu tiên video thay vì ảnh bìa trong cùng mục; bỏ `thumb`/`meta`; dữ liệu sai không được biến thành album thành công. Các bài `/reel/`, `/reels/`, `/tv/` thử yt-dlp trước để ghép luồng video/âm thanh, rồi mới gallery-dl và nguồn dự phòng. Luồng tải carousel giữ nguyên. Xem [cơ chế chọn định dạng yt-dlp](https://github.com/yt-dlp/yt-dlp#format-selection).

Năm test mới bao gồm Reel đơn, carousel hỗn hợp đúng thứ tự, ảnh đơn, dữ liệu thiếu/sai và URL không hợp lệ. Phần chuẩn hóa media và hợp đồng API với Shortcut không thay đổi; mã truy cập và tệp cài beta.3 vẫn dùng tiếp.

Sau khi đối chiếu SHA-256 mã backend đang chạy, đã gửi lại **đúng hai Reel từng lỗi**, tải đầy đủ tệp qua HTTPS có xác thực, so SHA-256 với tệp VPS và đọc codec bằng ffprobe. Cả hai trả `ready` qua bộ tải trực tiếp. Báo cáo [artifacts/instagram-reels-live-results.json](artifacts/instagram-reels-live-results.json) ghi kết quả và hash backend, không chứa URL bài người dùng, cookie hoặc token. Đây là kiểm tra server, không phải thao tác lưu thật trên iPhone.

Luồng mới có **105 tác vụ Phím tắt gốc**: nhận URL/văn bản từ bảng chia sẻ, hỏi liên kết nếu mở trực tiếp, gửi POST JSON có Bearer token, theo dõi trạng thái, kiểm tra ID tệp rồi tải từ cùng VPS và lưu vào Ảnh. Một câu hỏi nhập mã được gắn vào tác vụ văn bản thứ ba. Cấu trúc import question được đối chiếu [Cherri shortcutgen.go](https://github.com/electrikmilk/cherri/blob/main/shortcutgen.go).

Các test mới kiểm tra: chỉ gửi mã tới VPS; tải theo đúng trạng thái; không lưu khi lỗi; chặn ID tệp có URL; giới hạn số lần chờ; xác thực API; URL giả/nội bộ; Range; gộp tác vụ trùng; giới hạn hàng đợi đồng thời; hết hạn tệp; kết quả một phần; trang cài riêng; loại cache codec cũ khi restart. Dùng downloader giả cho test API, không gọi nền tảng trong unit test.

Bản sửa Get URLs từ beta.4 vẫn được giữ: đầu vào dùng `WFTextTokenString`, tránh kiểu `WFTextTokenAttachment` không phù hợp với tham số văn bản. Mô hình `test/helpers/native-runner.cjs` mô phỏng các tác vụ; **không thay thế kiểm tra trên iOS**.

## Album và link nhóm Facebook ở beta.3

Bỏ `WFCameraRollSelectedGroup: Recents`. Luồng hỏi tên album một lần, mặc định `Media Saver`, rồi dùng **Create Photo Album** với từng tệp và cùng tên album. Theo [catalog tác vụ Shortcuts](https://github.com/frontboat/shortcutkit/blob/main/data/builtin-actions.json), tác vụ dùng album cùng tên nếu đã tồn tại, tạo mới nếu chưa có. Test kiểm tra tên tiếng Việt/emoji được giữ cho toàn bộ bài và dừng trước khi tải nếu tên trống. Chưa kiểm tra tạo/lưu album trên iPhone thật.

Hai link Facebook đã lỗi được quan sát trực tiếp trên VPS: `/share/p/…` và `/share/v/…` đều trả HTTP 302 tới `/groups/<nhóm>/permalink/<mã-bài>/`. Bộ lọc cũ từ chối đường dẫn nhóm, tạo thông báo trong ảnh chụp 09:51. Bản mới nhận bài cụ thể qua `permalink`/`posts`, giữ gợi ý video từ `/share/v/`, thử bộ tải ảnh hoặc video theo loại. Trang nhóm chung, bảng tin và Stories vẫn bị từ chối. Test mô phỏng chuỗi chuyển hướng thật, link đăng nhập và đích ngoài danh sách cho phép.

Kiểm tra lại hai bài thật qua API HTTPS: **video nhóm tải thành công 19.616.516 byte**, SHA-256 trùng tệp VPS; ffprobe báo H.264 1432×2548 và AAC. **Bài ảnh nhóm vẫn không tải được**: gallery-dl không trả tệp, đường thử video/nguồn dự phòng cũng không có media. VPS chưa có cookie Facebook; chưa xác nhận cookie sẽ giải quyết được bài này. Không còn thông báo nhận nhầm thành trang cá nhân. Báo cáo [artifacts/facebook-live-results.json](artifacts/facebook-live-results.json) giữ cả thành công và thất bại, không chứa URL bài người dùng.

## Sửa lỗi đọc mã tệp của beta.1

Ảnh chụp iPhone lúc 09:31 (giờ Việt Nam) báo “Mã tệp trả về không hợp lệ”. Tác vụ server lúc 09:31:34 đã ở trạng thái `ready`, có 5 ảnh và tất cả ID đều là chuỗi hex 32 ký tự; tác vụ Instagram trước đó có 8 ảnh cũng hợp lệ. Lỗi nằm sau bước tạo tác vụ/đọc trạng thái, trong đường đọc mã từng tệp ở Shortcut. Không có thiết bị kết nối để quan sát trực tiếp giá trị biến lúc lỗi, nên chưa xác nhận nguyên nhân chi tiết bên trong runtime iOS.

Beta.2 bổ sung `fileIds` dạng văn bản, mỗi dòng một ID; vẫn giữ `files` để tương thích client cũ. Shortcut kiểm tra toàn bộ danh sách trước khi tải, dùng biến đếm riêng và Get Item at Index, không đọc `id` từ `Repeat Item` trong vòng lặp lồng nhau. Không đặt tên đầu ra tùy biến cho tác vụ điều khiển. Tham số tác vụ được đối chiếu [catalog Shortcuts](https://github.com/frontboat/shortcutkit/blob/main/data/builtin-actions.json) và [cách tuần tự hóa Cherri](https://github.com/electrikmilk/cherri/blob/main/shortcutgen.go).

Test mới bao gồm danh sách 1/5/8/100 tệp đúng thứ tự, metadata dictionary không dùng tới, danh sách thiếu/sai có URL lạ phải dừng trước khi tải, và hợp đồng `fileIds` khớp `files` của API. Đây là kiểm tra hướng xử lý mới, không phải mô phỏng đã chứng minh tái hiện chính xác lỗi runtime của beta.1.

Đã chạy **workflow hiện tại trong mô hình tác vụ với API thật** trên VPS cho đúng hai bài Instagram vừa chia sẻ: **5/5 và 8/8 ảnh**. Tải toàn bộ 13 tệp qua HTTPS có Bearer, so số byte, dấu hiệu JPEG và SHA-256 với tệp trên VPS. Thông báo hoàn tất được đi tới trong mô hình; thao tác lưu chỉ được thu nhận trong bộ kiểm tra, **không lưu vào thư viện Ảnh trên iPhone**. Báo cáo [artifacts/shortcut-live-results.json](artifacts/shortcut-live-results.json) được cập nhật khi kiểm tra lại beta.3, không chứa URL bài cá nhân, token hoặc link cài riêng.

## Tải thực tế trên VPS từ beta.1

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

Chưa có iPhone kết nối để thử nhập bản 1.1.0-beta.3, câu hỏi mã truy cập, hiển thị trong bảng chia sẻ từng ứng dụng, quyền truy cập và lưu vào Ảnh. Kiểm tra codec không phải phát toàn bộ video trên iPhone. Ảnh lỗi beta.1 và metadata VPS xác nhận thiết bị đã nhận link, xác thực và đến bước đọc tệp; chưa xác nhận bước lưu sau bản sửa.

Ảnh/album Facebook chưa đạt trong thử nghiệm; cookie có thể cần nhưng chưa được cung cấp hoặc kiểm tra. Nội dung riêng tư, Stories, livestream, bài bị giới hạn vùng và mọi dạng link rút gọn chưa được xác nhận. Cấu hình giới hạn 100 tệp/512 MiB mỗi bài và thời gian xử lý có thể khiến bài lớn không tải hết. Nguồn tải có thể thay đổi sau thời điểm kiểm tra.
