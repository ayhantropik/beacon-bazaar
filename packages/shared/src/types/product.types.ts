export interface ProductVariation {
  id: string;
  name: string;
  options: ProductVariationOption[];
}

export interface ProductVariationOption {
  id: string;
  value: string;
  priceModifier?: number;
  stock: number;
  sku?: string;
}

export interface Inventory {
  quantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number;
  currency: string;
  categories: string[];
  tags: string[];
  images: string[];
  thumbnail: string;
  attributes: Record<string, string>;
  variations: ProductVariation[];
  inventory: Inventory;
  rating: { average: number; count: number };
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSearchParams {
  query?: string;
  storeId?: string;
  categories?: string[];
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}
