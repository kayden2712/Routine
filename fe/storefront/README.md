# Routine Storefront

Ứng dụng khách hàng của Routine, phục vụ luồng mua sắm online từ duyệt sản phẩm đến theo dõi đơn hàng.

## Công nghệ chính

- React 18
- TypeScript 5.9
- Vite 8
- Tailwind CSS 4
- Zustand
- React Router
- STOMP client cho realtime order updates

## Kết nối backend

Storefront gọi API qua biến môi trường `VITE_API_URL`.

Mặc định local:

```env
VITE_API_URL=http://localhost:8080/api
```

Tạo file `.env.local` nếu cần đổi backend.

## Chạy local

```bat
cd fe\storefront
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Build và preview

```bat
cd fe\storefront
npm run build
npm run preview
```

## Tính năng hiện có

- Duyệt sản phẩm, tìm kiếm và lọc.
- Giỏ hàng và checkout.
- Lịch sử đơn hàng sắp xếp từ mới đến cũ.
- Trạng thái đơn hàng tự cập nhật realtime qua WebSocket.
- Xác nhận hoàn thành đơn khi đơn đang giao.
- Gửi yêu cầu hủy đơn, hủy yêu cầu hủy và yêu cầu hoàn tiền theo trạng thái hợp lệ.
- Đánh giá sản phẩm sau khi đơn thành công.
- Đính kèm ảnh trong đánh giá với preview trước khi gửi.

## Cấu trúc thư mục

```text
src/
  app/         router và bootstrap app
  components/  layout và shared UI
  lib/         api client, mapping, utility
  pages/       màn hình khách hàng
  store/       Zustand stores
  types/       kiểu dữ liệu
```

## Ghi chú

- Khi backend không chạy, các luồng lấy dữ liệu sẽ báo lỗi network.
- Nếu cần realtime ổn định, đảm bảo backend đang mở WebSocket endpoint `/api/ws`.
- Nếu WebSocket không nhận được sự kiện, kiểm tra backend có publish vào `/topic/orders/status-changed` hay không.
