# Routine Admin (`fe/admin`)

Ứng dụng nội bộ cho nhân viên vận hành cửa hàng Routine.

## Mục tiêu

Hỗ trợ các tác vụ chính:

- POS bán tại quầy.
- Quản lý sản phẩm, tồn kho, khách hàng.
- Quản lý đơn hàng online/offline và cập nhật trạng thái.
- Theo dõi báo cáo vận hành.

## Công nghệ

- React 18
- TypeScript 5
- Vite
- Tailwind CSS
- Zustand
- React Router

## Kết nối backend

Admin gọi API backend tại `VITE_API_URL`.

Mặc định local:

`http://localhost:8080/api`

Nếu cần đổi API URL, tạo file `.env.local`:

```env
VITE_API_URL=http://localhost:8080/api
```

## Chạy local

```bat
cd fe\admin
npm install
npm run dev -- --host 0.0.0.0 --port 5174
```

## Build

```bat
cd fe\admin
npm run build
npm run preview
```

## Tính năng hiện có

- Dashboard tổng quan.
- POS tạo hóa đơn.
- Bắt buộc xác định khách hàng trước khi thanh toán trong POS.
- Quản lý sản phẩm và tồn kho.
- Quản lý khách hàng và nhân viên.
- Màn hình đơn online với lọc trạng thái, tìm kiếm và xử lý nghiệp vụ.
- Danh sách đơn online ưu tiên đơn vừa thay đổi trạng thái.

## Cấu trúc thư mục

```text
src/
  app/          router
  components/   layout + shared UI
  lib/          api client, backend mapping, utils
  pages/        màn hình nghiệp vụ
  store/        zustand stores
  types/        kiểu dữ liệu
```

## Ghi chú

- Dự án dùng TypeScript strict mode.
- Build có thể cảnh báo chunk lớn, không phải lỗi runtime.
