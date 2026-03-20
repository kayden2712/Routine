# Routine Admin

Ứng dụng quản trị nội bộ cho hệ thống bán lẻ Routine.

Mục tiêu của project này là hỗ trợ vận hành cửa hàng với các nghiệp vụ chính: bán hàng tại quầy (POS), quản lý sản phẩm, khách hàng, tồn kho, nhân sự, hóa đơn và báo cáo.

## Phạm vi dự án

Đây là phần admin, dùng cho nhân viên nội bộ.

- Không phải giao diện bán hàng cho khách lẻ.
- Dữ liệu hiện tại chạy theo mock data để demo luồng nghiệp vụ.
- Có phân quyền theo vai trò để điều hướng trang phù hợp.

## Công nghệ

- React 18
- TypeScript 5
- Vite
- Tailwind CSS v4
- Zustand
- React Router
- TanStack Table
- Recharts
- date-fns
- Lucide React

## Tính năng chính

- Đăng nhập mock theo vai trò.
- Dashboard tổng quan doanh thu, đơn hàng và cảnh báo tồn kho.
- POS tạo hóa đơn tại quầy, giỏ hàng, mã giảm giá, thanh toán.
- Quản lý sản phẩm: tìm kiếm, lọc, sắp xếp, thêm/sửa/xóa, xem chi tiết.
- Quản lý khách hàng và lịch sử mua hàng.
- Quản lý kho: theo dõi tồn, lọc mức tồn, nhập/xuất nhanh.
- Quản lý nhân viên và trạng thái làm việc.
- Quản lý hóa đơn và khu vực cài đặt (placeholder mở rộng).
- Báo cáo đa tab theo doanh thu, sản phẩm, khách hàng, tồn kho.

## Vai trò và điều hướng

- manager -> dashboard
- sales -> pos
- warehouse -> inventory
- accountant -> reports

## Chạy dự án

Chạy lệnh trong đúng thư mục admin:

```bash
cd admin
npm install
npm run dev
```

Build production:

```bash
npm run build
npm run preview
```

Kiểm tra lint:

```bash
npm run lint
```

## Cấu trúc thư mục

```text
admin/
  src/
    app/            # Router, guard, metadata route
    components/     # Layout, shared components, ui primitives
    lib/            # Mock data, utils, toast helpers
    pages/          # Dashboard, POS, Products, Customers, Inventory, Staff, Invoices...
    store/          # Zustand stores (auth, cart, product, ui)
    styles/         # Global styles
    types/          # Type domain cho admin
```

## Ghi chú phát triển

- Dữ liệu mock nằm trong src/lib/mockData.ts.
- Nhiều màn hình đã có nền tảng sẵn để thay bằng API thật trong bước tiếp theo.
