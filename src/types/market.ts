export type StoreType = 'supermercado' | 'mercadinho' | 'atacarejo' | 'hortifruti';

export type ProductCategory =
  | 'grãos'
  | 'laticínios'
  | 'carnes'
  | 'hortifruti'
  | 'padaria'
  | 'limpeza'
  | 'bebidas'
  | 'óleo_açúcar';

export interface Store {
  id: string;
  name: string;
  type: StoreType;
  street: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  hours: string;
  createdBy: string;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  unit: string;
  brand: string;
  isEssentialBasket: boolean;
  referencePrice: number;
  createdBy: string;
}

export interface PriceEntry {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  isPromo: boolean;
  promoLabel: string;
  inStock: boolean;
  reportedBy: string;
  reporterName: string;
  createdAtMs: number;
}

export interface StorePriceQuote {
  entry: PriceEntry;
  store: Store;
  diffFromLowestPct: number;
  isLowest: boolean;
}

export interface PricePoint {
  label: string;
  lowestPrice: number;
  averagePrice: number;
}

export interface ProductComparison {
  product: Product;
  lowestQuote: StorePriceQuote | null;
  allQuotes: StorePriceQuote[];
  averagePrice: number;
  highestPrice: number;
  savingsPotential: number;
  weeklySeries: PricePoint[];
  monthlySeries: PricePoint[];
}

export interface ShoppingListItem {
  productId: string;
  productName: string;
  quantity: number;
  checked: boolean;
  targetPrice: number;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  neighborhoodFilter: string;
  items: ShoppingListItem[];
  updatedAtMs: number;
}

export interface FavoriteAlert {
  id: string;
  userId: string;
  productId: string;
  desiredMaxPrice: number;
  notifyOnPromo: boolean;
  notifyOnLowest: boolean;
  updatedAtMs: number;
}

export interface SavingsLog {
  id: string;
  userId: string;
  monthKey: string; // YYYY-MM
  storeId: string;
  storeName: string;
  paidTotal: number;
  averageMarketTotal: number;
  savedAmount: number;
  itemsCount: number;
  createdAtMs: number;
}

export interface StoreStockCheckResult {
  existsInStore: boolean;
  inStock: boolean;
  latestEntry: PriceEntry | null;
  store: Store | null;
  product: Product | null;
  regionalLowestPrice: number | null;
  diffFromLowestPct: number | null;
}

export interface StoreListMatch {
  store: Store;
  matchedItems: {
    item: ShoppingListItem;
    quote: PriceEntry;
  }[];
  missingItems: ShoppingListItem[];
  matchedCount: number;
  totalRequestedCount: number;
  coveragePct: number;
  totalCost: number;
  averageCostForMatched: number;
  estimatedSavings: number;
}

export type NotificationKind = 'promo' | 'target_price' | 'favorite_lowest';

export interface PriceNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  message: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName: string;
  price: number;
  createdAtMs: number;
}

export interface MonthlySavingsAggregate {
  monthKey: string;
  label: string;
  savedAmount: number;
  paidTotal: number;
  averageMarketTotal: number;
  tripsCount: number;
}

export interface RegionConfig {
  city: string;
  neighborhood: string;
}
