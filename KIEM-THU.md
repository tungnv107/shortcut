# Kiểm thử Media Saver beta.4 — 17/11/2026

## Mã và luồng tác vụ

`npm.cmd run verify`: **44/44 test đạt**. Gồm 19 kiểm thử mới cho luồng gốc và 25 kiểm thử cũ/kiểm tra liên kết tác vụ.

Luồng mới có 163 tác vụ: nhận URL/văn bản từ Share Sheet, phân loại nền tảng, gọi API, chọn media, kiểm tra URL, tải và lưu. Không có tác vụ JavaScript, mở Safari, Scriptable hay đọc clipboard. Nguồn là `src/native-workflow.cjs`; đầu ra kiểm tra được là `dist/workflow.json` và plist XML.

Test mới kiểm tra: ảnh TikTok theo thứ tự; Instagram album ảnh/video và cấu trúc hỗn hợp; chỉ chọn một chất lượng mỗi media; loại ảnh bìa Facebook; dữ liệu lỗi/rỗng; tên miền giả; URL có thông tin đăng nhập; luồng HLS/DASH; nhiều link; chạy không có đầu vào; dừng khi lưu lỗi. Fixtures rút gọn từ phản hồi thật, thay URL bằng tên miền thử nghiệm.

Mô hình `test/helpers/native-runner.cjs` chỉ mô phỏng tập tác vụ được dùng. Test đạt **không chứng minh iOS chạy thành công**. Cấu trúc điều kiện/biến được đối chiếu [mã Cherri](https://github.com/electrikmilk/cherri/blob/main/shortcutgen.go).

## Sửa lỗi nhận link trên iPhone

Ảnh người dùng gửi cho thấy beta.3 đã chạy trong Instagram nhưng dừng ở thông báo “Chưa nhận được link HTTPS”. Kiểm tra nguồn phát hiện tác vụ Get URLs dùng `WFTextTokenAttachment` cho ô đầu vào văn bản. Bản beta.4 đổi sang `WFTextTokenString` với ký tự thay thế và bảng tham chiếu biến. Đối chiếu [tham khảo định dạng Get URLs](https://github.com/viticci/shortcuts-playground-plugin/blob/main/codex/skills/shortcuts-playground/BEST_PRACTICES.md) và kiểu tham số text trong [Cherri web.cherri](https://github.com/electrikmilk/cherri/blob/main/actions/web.cherri).

Bổ sung ba test: xác nhận cấu trúc đầu vào đúng; đưa cấu trúc beta.3 vào mô hình để tái hiện lỗi mất URL; kiểm tra link Instagram đơn và link kèm chú thích. Mô hình cũ đọc mọi kiểu tham chiếu như nhau nên đã bỏ sót khác biệt này. Chưa thể xác nhận đây là nguyên nhân duy nhất trên iPhone của người dùng, vì chưa nhận được chính link bài bị lỗi hoặc kiểm thử bản sửa trên thiết bị.

## Kiểm tra mạng thực tế (từ beta.3, cùng ngày)

Phần gọi dịch vụ và chọn media không đổi trong beta.4. Báo cáo mạng dưới đây giữ nguyên kết quả đã quan sát lúc phát hành beta.3, không ghi thành một lần kiểm tra mới.

Các yêu cầu dùng bài công khai, không có cookie hoặc tài khoản cá nhân. Với mỗi hàng, API trả danh sách media; tải thử **1.024 byte đầu của một tệp**. Đối chiếu HTTP, MIME và dấu hiệu tệp; chưa tải toàn bộ album.

| Trường hợp | Danh sách nhận được | Mẫu tệp kiểm tra |
|---|---|---|
| TikTok video `6742501081818877190` qua TikWM | 1 video | HTTP 206, `video/mp4`, `ftyp` |
| TikTok ảnh `7240568259186019630` qua TikWM | 16 ảnh | HTTP 206, `image/jpeg`, `FF D8 FF` |
| Instagram `BQ0eAlwhDrw` qua Siputzx/SSSInstagram | 3 video | HTTP 206, `video/mp4`, `ftyp` |
| Instagram `BoHk1haB5tM` qua Siputzx/SSSInstagram | 5 ảnh | HTTP 206, `image/jpeg`, `FF D8 FF` |
| Facebook CNN `10155529876156509` qua VKrDownloader | 1 video được chọn từ các chất lượng | HTTP 206, `video/mp4`, `ftyp` |

VKrDownloader trả một JPEG được gắn nhãn “4K” trước các MP4; luồng bỏ JPEG đó. Dịch vụ này không lấy được các bài Instagram đã thử, nên luồng Instagram dùng Siputzx/SSSInstagram. Endpoint FastDL được thử nhưng trả 503 và không được dùng trong bản phát hành.

Báo cáo máy đọc: `artifacts/native-live-results.json`. URL CDN tạm, dữ liệu phản hồi đầy đủ và các byte media không đưa vào Git. `tools/report-native-probes.cjs` tổng hợp và kiểm tra các bản ghi cục bộ; nó không tự gọi lại mạng.

## Ký, đóng gói và phần chưa xác nhận

Tệp phát hành được Shortcuty ký `anyone`. Công cụ kiểm tra marker `AEA1`, kích thước, SHA-256 nguồn/đầu ra theo phản hồi dịch vụ. Báo cáo đi kèm là `SIGNING-VERIFICATION.json`; chưa xác minh chữ ký độc lập bằng thiết bị Apple. Công cụ đóng gói từ chối tệp ký cũ hoặc bị thay đổi.

**Chưa có iPhone kết nối để xác nhận** việc nhập beta.4, hiện trong bảng chia sẻ thực tế của từng ứng dụng, các hộp cấp quyền, chạy toàn bộ tác vụ và lưu vào Ảnh. Chưa xác nhận tải đủ tệp lớn, phát hết video hoặc có âm thanh. Môi trường kiểm thử mạng là Windows, không phải mạng của iPhone.

Facebook ảnh/album chưa hỗ trợ. Bài riêng tư, Stories, livestream và nội dung cần đăng nhập chưa hỗ trợ. Dịch vụ có thể thay đổi hoặc giới hạn lượt gọi. Các báo cáo Safari cũ (`browser-results.json`, `live-probe-results.json`) không đại diện cho luồng beta.4.
