# Routine Storefront

Ứng dụng bán hàng phía khách (customer-facing) của Routine.

Project này tập trung vào trải nghiệm mua sắm online: duyệt sản phẩm, lọc tìm kiếm, wishlist, giỏ hàng, checkout và quản lý tài khoản khách hàng.

## Phạm vi dự án

Đây là phần storefront dành cho khách mua hàng.

- Không bao gồm nghiệp vụ vận hành nội bộ như POS/kho/nhân sự.
- Dùng mock data để mô phỏng luồng mua sắm.
- Tối ưu cho trải nghiệm giao diện và tương tác người dùng.

## Công nghệ

- React 18
- TypeScript 5
- Vite
- Tailwind CSS v4
- Zustand
- React Router
- Radix UI (một số primitives)
- date-fns
- Lucide React

## Tính năng chính

- Trang chủ, danh sách sản phẩm, trang chi tiết sản phẩm.
- Lọc theo danh mục, giới tính, khuyến mãi, yêu thích và từ khóa tìm kiếm.
- Wishlist và giỏ hàng với trạng thái đồng bộ.
- Điều hướng nhanh từ navbar (search, sale, wishlist).
- Trang tài khoản khách hàng, đăng nhập/đăng ký.
- Luồng checkout và trang thành công đơn hàng.
- Trung tâm hỗ trợ khách hàng.

## Chạy dự án

Chạy lệnh trong đúng thư mục storefront:

```bash
cd storefront
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
storefront/
  src/
    app/            # Router
    components/     # Layout, shared components, ui primitives
    lib/            # Mock data, helper functions
    pages/          # Home, ProductList, ProductDetail, Cart, Checkout, Account...
    store/          # Zustand stores (cart, wishlist, auth)
    styles/         # Global styles
    types/          # Kiểu dữ liệu storefront
```

## Ghi chú phát triển

- Dữ liệu mẫu nằm trong src/lib/mockData.ts.
- Có thể thay mock data bằng API thật mà không cần đổi cấu trúc route chính.
