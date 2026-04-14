# Routine Admin

Ứng dụng quản trị nội bộ cho vận hành cửa hàng Routine.

## Chức năng chính

- Dashboard tổng quan.
- POS bán tại quầy.
- Quản lý đơn hàng online/offline.
- Quản lý sản phẩm, kho, khách hàng, nhân viên.
- Theo dõi báo cáo vận hành.

## Công nghệ

- React 18
- TypeScript 5
- Vite 8
- Tailwind CSS 4
- Zustand
- React Router
- Axios, Recharts, jsPDF

## Cài đặt và chạy local

```bash
cd fe/admin
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

Admin mặc định chạy tại: `http://localhost:5174`

## Build / Lint / Preview

```bash
cd fe/admin
npm run lint
npm run build
npm run preview
```

## Cấu hình môi trường

Tạo `.env.local` nếu cần override:

```env
VITE_API_URL=http://localhost:8080/api
```

## Cấu trúc thư mục

```text
src/
  app/         router + bootstrap
  components/  layout + shared UI
  lib/         api client + utils
  pages/       màn hình nghiệp vụ
  store/       Zustand stores
  types/       typings
```

## Ghi chú

- Dự án dùng TypeScript strict mode.
- Realtime trạng thái đơn dùng WebSocket topic `/topic/orders/status-changed`.
- Nếu không gọi được API, kiểm tra `VITE_API_URL` và backend port 8080.
