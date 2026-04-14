# Routine Storefront

Ứng dụng cho khách hàng mua sắm online của Routine.

## Chức năng chính

- Duyệt sản phẩm, tìm kiếm và lọc.
- Giỏ hàng và checkout.
- Theo dõi lịch sử đơn hàng.
- Nhận realtime cập nhật trạng thái đơn.
- Gửi yêu cầu hủy/hoàn theo trạng thái hợp lệ.
- Đánh giá sản phẩm sau mua, hỗ trợ đính kèm ảnh.

## Công nghệ

- React 18
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- Zustand
- React Router
- STOMP client cho realtime

## Cài đặt và chạy local

```bash
cd fe/storefront
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Storefront mặc định chạy tại: `http://localhost:5173`

## Build / Lint / Preview

```bash
cd fe/storefront
npm run lint
npm run build
npm run preview
```

## Cấu hình môi trường

Tạo `.env.local` nếu cần:

```env
VITE_API_URL=http://localhost:8080/api
```

## Cấu trúc thư mục

```text
src/
  app/         router + bootstrap
  components/  layout + shared UI
  lib/         api client + utils
  pages/       màn hình khách hàng
  store/       Zustand stores
  types/       typings
```

## Ghi chú

- Endpoint WebSocket backend: `/api/ws`.
- Topic cập nhật trạng thái đơn: `/topic/orders/status-changed`.
- Nếu dữ liệu không tải được, kiểm tra backend và `VITE_API_URL`.
