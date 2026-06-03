import type { ReactNode } from 'react'

export interface Product {
  id: string
  name: string
  description?: string
  image_url?: string
  created_at: string
  updated_at?: string
}

export interface Detail {
  id: string
  name: string
  width: number
  length: number
  amount: number
  product_id: string
  created_at: string
  updated_at?: string
}

export interface Order {
  id: string
  status: string
  excel_url?: string
  user_id: string
  created_at: string
  updated_at?: string
}

export interface OrderItem {
  id: string
  quantity: number
  order_id: string
  product_id: string
  product?: Product
  created_at: string
}

export interface User {
  id: string
  username: string
  first_name: string
  last_name: string
  is_admin?: boolean
  created_at: string
  updated_at?: string
}

export interface AuthUser {
  id: string | null
  isAdmin: boolean
  issuedAt: Date | null
  expiresAt: Date | null
}

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export type ToastType = 'success' | 'error' | 'info'

export interface Column<T = Record<string, unknown>> {
  key: string
  label: string
  width?: string
  render?: (value: unknown, row: T) => ReactNode
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TableRow = Record<string, any>
