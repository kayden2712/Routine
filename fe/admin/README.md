# Routine Admin

Ứng dụng nội bộ dành cho nhân viên vận hành cửa hàng Routine.

## Mục tiêu

Admin app hỗ trợ các nghiệp vụ chính:

- POS bán tại quầy.
- Quản lý sản phẩm, tồn kho, khách hàng và nhân viên.
- Quản lý đơn hàng online/offline.
- Theo dõi báo cáo và trạng thái vận hành.

## Công nghệ chính

- React 18
- TypeScript 5.9
- Vite 8
- Tailwind CSS 4
- Zustand
- React Router
- Axios, Recharts, jsPDF

## Kết nối backend

Admin gọi API qua biến môi trường `VITE_API_URL`.

Mặc định local:

```env
VITE_API_URL=http://localhost:8080/api
```

Tạo file `.env.local` nếu cần thay đổi địa chỉ backend.

## Chạy local

```bat
cd fe\admin
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

## Build và preview

```bat
cd fe\admin
npm run build
npm run preview
```

## Tính năng hiện có

- Dashboard tổng quan.
- POS tạo hóa đơn và xử lý thanh toán.
- Bắt buộc xác định khách hàng trước khi chốt đơn trong POS.
- Quản lý sản phẩm và tồn kho.
- Quản lý khách hàng và nhân viên.
- Màn hình đơn hàng với lọc trạng thái và tìm kiếm.
- Ưu tiên hiển thị các đơn vừa thay đổi trạng thái.

## Cấu trúc thư mục

```text
src/
  app/         router và bootstrap app
  components/  layout và shared UI
  lib/         api client, mapping, utility
  pages/       màn hình nghiệp vụ
  store/       Zustand stores
  types/       kiểu dữ liệu
```

## Ghi chú

- Dự án dùng TypeScript strict mode.
- `npm run build` có thể phát sinh cảnh báo chunk lớn; đây chưa hẳn là lỗi runtime.
- Nếu frontend không gọi được backend, kiểm tra `VITE_API_URL` và backend có đang chạy ở cổng 8080 hay không.
