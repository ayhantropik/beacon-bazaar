export const API_VERSION = 'v1';
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SEARCH_RADIUS_KM = 5;
export const MAX_SEARCH_RADIUS_KM = 50;
export const DEFAULT_CURRENCY = 'TRY';
export const DEFAULT_LANGUAGE = 'tr';
export const SUPPORTED_LANGUAGES = ['tr', 'en'] as const;
export const SUPPORTED_CURRENCIES = ['TRY', 'USD', 'EUR'] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  preparing: 'Hazırlanıyor',
  shipped: 'Kargoya Verildi',
  delivered: 'Teslim Edildi',
  cancelled: 'İptal Edildi',
  refunded: 'İade Edildi',
};

export const BEACON_PROXIMITY = {
  IMMEDIATE: 0.5,
  NEAR: 3,
  FAR: 10,
} as const;
