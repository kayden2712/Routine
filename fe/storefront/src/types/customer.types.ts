export type ProductCategory = string

export type ProductBadge = 'new' | 'sale' | 'bestseller'

export type ProductSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | '28' | '29' | '30' | '31' | '32'

export interface Product {
  id: string
  code?: string
  name: string
  category: ProductCategory
  price: number
  oldPrice?: number
  image: string
  colors: string[]
  sizes: ProductSize[]
  rating: number
  reviewCount: number
  badge?: ProductBadge
  description: string
  stock?: number
  minStock?: number
}

export interface ProductReview {
  id: string
  author: string
  date: string
  rating: number
  comment: string
}

export interface ProductDetailMeta {
  sku: string
  stock: number
  material: string
  fit: string
  season: string
  care: string
  highlights: string[]
  gallery: string[]
  reviews: ProductReview[]
}

export interface CartItem {
  productId: string
  name: string
  image: string
  price: number
  size: ProductSize
  color: string
  quantity: number
}

export interface CustomerUser {
  id: string
  fullName: string
  email: string
  phone?: string
  token?: string
  refreshToken?: string
}
