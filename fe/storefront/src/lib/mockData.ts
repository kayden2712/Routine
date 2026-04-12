import type { Product, ProductCategory, ProductDetailMeta } from '@/types/customer.types'

export const categories: ProductCategory[] = [
  'Áo sơ mi',
  'Áo thun',
  'Quần kaki',
  'Quần jeans',
  'Áo khoác',
  'Váy',
]

export const products: Product[] = [
  {
    id: 'p01',
    name: 'Áo sơ mi Linen Trắng Ngà',
    category: 'Áo sơ mi',
    price: 420000,
    image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=80',
    colors: ['Trắng', 'Be', 'Xám nhạt'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.8,
    reviewCount: 184,
    badge: 'bestseller',
    description: 'Chất linen pha cotton thoáng mát, phù hợp đi làm và đi chơi cuối tuần.',
  },
  {
    id: 'p02',
    name: 'Áo sơ mi Cuban Nâu Khói',
    category: 'Áo sơ mi',
    price: 390000,
    oldPrice: 460000,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1000&q=80',
    colors: ['Nâu khói', 'Đen'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.6,
    reviewCount: 97,
    badge: 'sale',
    description: 'Form relax cùng cổ Cuban tạo cảm giác hiện đại và thoải mái.',
  },
  {
    id: 'p03',
    name: 'Áo thun Essential Đen',
    category: 'Áo thun',
    price: 220000,
    image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=80',
    colors: ['Đen', 'Trắng', 'Xám'],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    rating: 4.7,
    reviewCount: 251,
    badge: 'new',
    description: 'Áo thun cotton compact dày dặn, cổ giữ form tốt sau nhiều lần giặt.',
  },
  {
    id: 'p04',
    name: 'Áo thun Boxy Kem Sữa',
    category: 'Áo thun',
    price: 260000,
    image: 'https://images.unsplash.com/photo-1622445275463-afa2ab738c34?auto=format&fit=crop&w=1000&q=80',
    colors: ['Kem sữa', 'Rêu nhạt'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    reviewCount: 72,
    description: 'Form boxy năng động, dễ phối với jeans hoặc kaki cạp cao.',
  },
  {
    id: 'p05',
    name: 'Quần kaki Straight Beige',
    category: 'Quần kaki',
    price: 510000,
    image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=1000&q=80',
    colors: ['Be', 'Nâu nhạt'],
    sizes: ['28', '29', '30', '31', '32'],
    rating: 4.7,
    reviewCount: 131,
    badge: 'bestseller',
    description: 'Dáng straight đứng form, chất kaki co giãn nhẹ giúp di chuyển thoải mái.',
  },
  {
    id: 'p06',
    name: 'Quần kaki Slim Đen',
    category: 'Quần kaki',
    price: 480000,
    oldPrice: 560000,
    image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?auto=format&fit=crop&w=1000&q=80',
    colors: ['Đen', 'Xanh đêm'],
    sizes: ['28', '29', '30', '31', '32'],
    rating: 4.4,
    reviewCount: 66,
    badge: 'sale',
    description: 'Dáng slim gọn gàng, phù hợp phối blazer hoặc sơ mi ôm.',
  },
  {
    id: 'p07',
    name: 'Quần jeans Straight Xanh Đậm',
    category: 'Quần jeans',
    price: 620000,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=1000&q=80',
    colors: ['Xanh đậm', 'Xanh wash'],
    sizes: ['28', '29', '30', '31', '32'],
    rating: 4.8,
    reviewCount: 201,
    badge: 'new',
    description: 'Denim định lượng cao, hoàn thiện wash thủ công cho hiệu ứng tự nhiên.',
  },
  {
    id: 'p08',
    name: 'Quần jeans Loose Xám Bạc',
    category: 'Quần jeans',
    price: 650000,
    image: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&w=1000&q=80',
    colors: ['Xám bạc', 'Đen wash'],
    sizes: ['28', '29', '30', '31', '32'],
    rating: 4.6,
    reviewCount: 88,
    description: 'Dáng loose hiện đại tạo điểm nhấn cá tính cho outfit tối giản.',
  },
  {
    id: 'p09',
    name: 'Áo khoác Bomber Đen Mờ',
    category: 'Áo khoác',
    price: 590000,
    image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=80',
    colors: ['Đen mờ', 'Navy'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.7,
    reviewCount: 109,
    badge: 'bestseller',
    description: 'Áo khoác bomber dáng gọn, lớp lót mềm phù hợp thời tiết chuyển mùa.',
  },
  {
    id: 'p10',
    name: 'Áo khoác Trench Be Khói',
    category: 'Áo khoác',
    price: 610000,
    oldPrice: 680000,
    image: 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=1000&q=80',
    colors: ['Be khói', 'Nâu cà phê'],
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    reviewCount: 54,
    badge: 'sale',
    description: 'Trench coat phom dài mang cảm hứng editorial, dễ layer nhiều phong cách.',
  },
  {
    id: 'p11',
    name: 'Váy Midi Satin Olive',
    category: 'Váy',
    price: 360000,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    colors: ['Olive', 'Champagne'],
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.8,
    reviewCount: 143,
    badge: 'new',
    description: 'Chất satin rũ nhẹ, độ bóng vừa phải cho vẻ ngoài sang trọng.',
  },
  {
    id: 'p12',
    name: 'Váy Đen Cổ Vuông',
    category: 'Váy',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80',
    colors: ['Đen', 'Đỏ đô'],
    sizes: ['XS', 'S', 'M', 'L'],
    rating: 4.4,
    reviewCount: 76,
    description: 'Thiết kế cổ vuông thanh lịch, phù hợp cho nhiều dịp từ hằng ngày đến tiệc nhẹ.',
  },
]

export const slugifyProductName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const findProductById = (productId: string) =>
  products.find((product) => product.id === productId)

export const findProductBySlug = (slug: string) =>
  products.find((product) => slugifyProductName(product.name) === slug)

const reviewerNames = ['Anh Nguyen', 'Thu Le', 'Minh Tran', 'Linh Pham', 'Bao Hoang']

export const productDetailData: Record<string, ProductDetailMeta> = Object.fromEntries(
  products.map((product, index) => {
    const reviews = [
      {
        id: `${product.id}-r1`,
        author: reviewerNames[index % reviewerNames.length],
        date: '12/03/2026',
        rating: Math.max(4, Math.round(product.rating)),
        comment: 'Chất liệu ổn, lên form đẹp và màu đúng mô tả. Đóng gói cẩn thận, giao nhanh.',
      },
      {
        id: `${product.id}-r2`,
        author: reviewerNames[(index + 2) % reviewerNames.length],
        date: '08/03/2026',
        rating: Math.max(4, Math.round(product.rating - 0.2)),
        comment: 'Mặc thoải mái cả ngày, dễ phối đồ. Sẽ quay lại mua thêm màu khác.',
      },
    ]

    const details: ProductDetailMeta = {
      sku: `RT-${String(index + 1).padStart(4, '0')}`,
      stock: 15 + ((index * 7) % 48),
      material:
        product.category === 'Áo thun'
          ? '100% Cotton Compact 230gsm'
          : product.category === 'Quần jeans'
            ? 'Denim Cotton Co giãn nhẹ'
            : product.category === 'Váy'
              ? 'Satin/Poly pha mềm mịn'
              : 'Cotton pha Linen cao cấp',
      fit: product.category === 'Quần jeans' ? 'Straight/Loose Fit' : 'Regular Fit',
      season: 'Xuân - Hè - Thu',
      care: 'Giặt lạnh dưới 30°C, không sấy nhiệt cao, ủi mặt trái.',
      highlights: [
        'Đường may chắc chắn, hoàn thiện kỹ.',
        'Form tôn dáng, dễ phối nhiều phong cách.',
        'Màu giữ ổn định sau nhiều lần giặt.',
      ],
      gallery: [product.image, product.image, product.image, product.image],
      reviews,
    }

    return [product.id, details]
  }),
)

export const findProductByRef = (value: string) => findProductById(value) ?? findProductBySlug(value)
