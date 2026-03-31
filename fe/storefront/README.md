# Routine Storefront (`fe/storefront`)

Ứng dụng khách hàng của Routine, phục vụ luồng mua sắm online từ duyệt sản phẩm đến theo dõi đơn hàng.

## Công nghệ

- React 18
- TypeScript 5
- Vite
- Tailwind CSS
- Zustand
- React Router
- STOMP client cho realtime order updates

## Kết nối backend

Storefront gọi API tại `VITE_API_URL`.

Mặc định local:

`http://localhost:8080/api`

Tạo `.env.local` nếu cần thay đổi:

```env
VITE_API_URL=http://localhost:8080/api
```

## Chạy local

```bat
cd fe\storefront
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

## Build

```bat
cd fe\storefront
npm run build
npm run preview
```

## Tính năng hiện có

- Duyệt sản phẩm, tìm kiếm, lọc.
- Giỏ hàng và checkout.
- Lịch sử đơn hàng luôn sắp xếp mới đến cũ.
- Trạng thái đơn hàng tự cập nhật realtime qua WebSocket.
- Xác nhận hoàn thành đơn khi đang giao.
- Yêu cầu hủy đơn, hủy yêu cầu hủy, yêu cầu hoàn tiền theo đúng trạng thái cho phép.
- Đánh giá sản phẩm sau đơn thành công.
- Đánh giá có thể đính kèm ảnh (preview trước khi gửi).

## Cấu trúc thư mục

```text
src/
  app/          router
  components/   layout + shared UI
  lib/          api client, backend mapping, utils
  pages/        màn hình khách hàng
  store/        zustand stores
  types/        kiểu dữ liệu
```

## Ghi chú

- Khi backend không chạy, các luồng lấy dữ liệu sẽ lỗi network.
- Nếu cần realtime ổn định, đảm bảo backend mở endpoint websocket `/api/ws`.
