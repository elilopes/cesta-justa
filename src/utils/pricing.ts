import type {
  FavoriteAlert,
  MonthlySavingsAggregate,
  PriceEntry,
  PriceNotification,
  PricePoint,
  Product,
  ProductComparison,
  RegionConfig,
  SavingsLog,
  ShoppingListItem,
  Store,
  StoreListMatch,
  StorePriceQuote,
  StoreStockCheckResult,
} from '../types/market';

export function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function formatRelativeTime(timestampMs: number, nowMs: number = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return 'agora mesmo';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'há 1 dia';
  if (diffDays < 30) return `há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  return diffMonths === 1 ? 'há 1 mês' : `há ${diffMonths} meses`;
}

/**
 * Filters establishments strictly to the configured city and (optional) neighborhood.
 */
export function filterStoresByRegion(stores: Store[], region: RegionConfig): Store[] {
  const targetCity = normalizeText(region.city);
  const targetNeighborhood = normalizeText(region.neighborhood);

  return stores.filter((store) => {
    if (targetCity && normalizeText(store.city) !== targetCity) {
      return false;
    }
    if (targetNeighborhood && normalizeText(store.neighborhood) !== targetNeighborhood) {
      return false;
    }
    return true;
  });
}

/**
 * Filters price entries to only those belonging to the provided establishments.
 */
export function filterEntriesByStores(entries: PriceEntry[], stores: Store[]): PriceEntry[] {
  const allowedStoreIds = new Set(stores.map((s) => s.id));
  return entries.filter((entry) => allowedStoreIds.has(entry.storeId));
}

/**
 * Picks the most recent PriceEntry for each (productId, storeId) pair.
 */
export function getLatestEntriesMap(entries: PriceEntry[]): Record<string, PriceEntry> {
  const latestByKey: Record<string, PriceEntry> = {};
  for (const entry of entries) {
    const key = `${entry.productId}::${entry.storeId}`;
    const existing = latestByKey[key];
    if (!existing || entry.createdAtMs > existing.createdAtMs) {
      latestByKey[key] = entry;
    }
  }
  return latestByKey;
}

/**
 * Builds weekly (last 7 days) and monthly (last 6 months) price variation series for a product.
 */
export function buildPriceVariationSeries(
  product: Product,
  productEntries: PriceEntry[],
  nowMs: number = Date.now()
): { weeklySeries: PricePoint[]; monthlySeries: PricePoint[] } {
  const dayMs = 24 * 60 * 60 * 1000;
  const inStockEntries = productEntries.filter((e) => e.inStock);

  // Weekly: 7 daily buckets (D-6 .. Hoje)
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weeklySeries: PricePoint[] = [];
  for (let offset = 6; offset >= 0; offset--) {
    const bucketEnd = nowMs - offset * dayMs;
    const bucketStart = bucketEnd - dayMs;
    const d = new Date(bucketEnd);
    const label = offset === 0 ? 'Hoje' : dayNames[d.getDay()];

    // Entries created on or before bucketEnd give snapshot of market on that day
    const windowEntries = inStockEntries.filter(
      (e) => e.createdAtMs >= bucketStart && e.createdAtMs <= bucketEnd
    );
    const cumulativeEntries =
      windowEntries.length > 0
        ? windowEntries
        : inStockEntries.filter((e) => e.createdAtMs <= bucketEnd);

    if (cumulativeEntries.length > 0) {
      // Keep latest per store up to bucketEnd
      const perStore: Record<string, PriceEntry> = {};
      for (const e of cumulativeEntries) {
        if (!perStore[e.storeId] || e.createdAtMs > perStore[e.storeId].createdAtMs) {
          perStore[e.storeId] = e;
        }
      }
      const prices = Object.values(perStore).map((e) => e.price);
      const lowest = Math.min(...prices);
      const avg = prices.reduce((acc, p) => acc + p, 0) / prices.length;
      weeklySeries.push({
        label,
        lowestPrice: Number(lowest.toFixed(2)),
        averagePrice: Number(avg.toFixed(2)),
      });
    } else {
      weeklySeries.push({
        label,
        lowestPrice: Number((product.referencePrice * 0.92).toFixed(2)),
        averagePrice: Number(product.referencePrice.toFixed(2)),
      });
    }
  }

  // Monthly: last 6 calendar months
  const monthShort = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const baseDate = new Date(nowMs);
  const monthlySeries: PricePoint[] = [];

  for (let mOffset = 5; mOffset >= 0; mOffset--) {
    const target = new Date(baseDate.getFullYear(), baseDate.getMonth() - mOffset, 1);
    const nextMonth = new Date(target.getFullYear(), target.getMonth() + 1, 1);
    const label = `${monthShort[target.getMonth()]}/${String(target.getFullYear()).slice(-2)}`;

    const monthEntries = inStockEntries.filter(
      (e) => e.createdAtMs >= target.getTime() && e.createdAtMs < nextMonth.getTime()
    );

    if (monthEntries.length > 0) {
      const prices = monthEntries.map((e) => e.price);
      const lowest = Math.min(...prices);
      const avg = prices.reduce((acc, p) => acc + p, 0) / prices.length;
      monthlySeries.push({
        label,
        lowestPrice: Number(lowest.toFixed(2)),
        averagePrice: Number(avg.toFixed(2)),
      });
    } else {
      // Fallback interpolation if a historical month has no logged entries yet
      const fallbackEntries = inStockEntries.filter((e) => e.createdAtMs < nextMonth.getTime());
      if (fallbackEntries.length > 0) {
        const prices = fallbackEntries.map((e) => e.price);
        monthlySeries.push({
          label,
          lowestPrice: Number(Math.min(...prices).toFixed(2)),
          averagePrice: Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)),
        });
      } else {
        monthlySeries.push({
          label,
          lowestPrice: Number((product.referencePrice * 0.9).toFixed(2)),
          averagePrice: Number(product.referencePrice.toFixed(2)),
        });
      }
    }
  }

  return { weeklySeries, monthlySeries };
}

/**
 * Computes full price comparison across all supermarkets & mercadinhos for a single product.
 */
export function getProductComparison(
  product: Product,
  stores: Store[],
  entries: PriceEntry[],
  nowMs: number = Date.now()
): ProductComparison {
  const storeMap: Record<string, Store> = {};
  for (const s of stores) storeMap[s.id] = s;

  const latestMap = getLatestEntriesMap(entries);
  const productEntries = entries.filter((e) => e.productId === product.id);

  const rawQuotes: { entry: PriceEntry; store: Store }[] = [];
  for (const entry of Object.values(latestMap)) {
    if (entry.productId === product.id) {
      const store = storeMap[entry.storeId];
      if (store) {
        rawQuotes.push({ entry, store });
      }
    }
  }

  // Sort: in-stock ascending by price first, out-of-stock last
  rawQuotes.sort((a, b) => {
    if (a.entry.inStock !== b.entry.inStock) {
      return a.entry.inStock ? -1 : 1;
    }
    return a.entry.price - b.entry.price;
  });

  const inStockQuotes = rawQuotes.filter((q) => q.entry.inStock);
  const lowestPrice =
    inStockQuotes.length > 0
      ? inStockQuotes[0].entry.price
      : rawQuotes.length > 0
        ? rawQuotes[0].entry.price
        : 0;

  const allQuotes: StorePriceQuote[] = rawQuotes.map((q, index) => {
    const diffFromLowestPct =
      lowestPrice > 0 ? Number((((q.entry.price - lowestPrice) / lowestPrice) * 100).toFixed(1)) : 0;
    return {
      entry: q.entry,
      store: q.store,
      diffFromLowestPct,
      isLowest: q.entry.inStock && index === 0,
    };
  });

  const prices = inStockQuotes.map((q) => q.entry.price);
  const averagePrice =
    prices.length > 0 ? Number((prices.reduce((a, b) => a + b, 0) / prices.length).toFixed(2)) : 0;
  const highestPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const lowestQuote = allQuotes.find((q) => q.isLowest) || allQuotes[0] || null;
  const savingsPotential =
    lowestQuote && highestPrice > lowestQuote.entry.price
      ? Number((highestPrice - lowestQuote.entry.price).toFixed(2))
      : 0;

  const { weeklySeries, monthlySeries } = buildPriceVariationSeries(product, productEntries, nowMs);

  return {
    product,
    lowestQuote,
    allQuotes,
    averagePrice,
    highestPrice,
    savingsPotential,
    weeklySeries,
    monthlySeries,
  };
}

/**
 * Checks whether a product exists in a specific supermarket/mercadinho and returns its real-time price.
 */
export function checkProductInStore(
  productId: string,
  storeId: string,
  products: Product[],
  stores: Store[],
  entries: PriceEntry[]
): StoreStockCheckResult {
  const product = products.find((p) => p.id === productId) || null;
  const store = stores.find((s) => s.id === storeId) || null;
  if (!product || !store) {
    return {
      existsInStore: false,
      inStock: false,
      latestEntry: null,
      store,
      product,
      regionalLowestPrice: null,
      diffFromLowestPct: null,
    };
  }

  const latestMap = getLatestEntriesMap(entries);
  const latestEntry = latestMap[`${productId}::${storeId}`] || null;

  const regionalInStockPrices = Object.values(latestMap)
    .filter((e) => e.productId === productId && e.inStock)
    .map((e) => e.price);
  const regionalLowestPrice =
    regionalInStockPrices.length > 0 ? Math.min(...regionalInStockPrices) : null;

  const diffFromLowestPct =
    latestEntry && latestEntry.inStock && regionalLowestPrice && regionalLowestPrice > 0
      ? Number((((latestEntry.price - regionalLowestPrice) / regionalLowestPrice) * 100).toFixed(1))
      : null;

  return {
    existsInStore: Boolean(latestEntry),
    inStock: Boolean(latestEntry?.inStock),
    latestEntry,
    store,
    product,
    regionalLowestPrice,
    diffFromLowestPct,
  };
}

/**
 * Finds establishments in a matching street or neighborhood that carry items from the user's shopping list.
 */
export function findStoresByStreetOrNeighborhoodForList(
  locationQuery: string,
  listItems: ShoppingListItem[],
  stores: Store[],
  entries: PriceEntry[]
): StoreListMatch[] {
  const normalizedQuery = normalizeText(locationQuery);
  const matchingStores = normalizedQuery
    ? stores.filter(
        (s) =>
          normalizeText(s.street).includes(normalizedQuery) ||
          normalizeText(s.neighborhood).includes(normalizedQuery) ||
          normalizeText(s.city).includes(normalizedQuery) ||
          normalizeText(s.name).includes(normalizedQuery)
      )
    : stores;

  const latestMap = getLatestEntriesMap(entries);

  // Average market price per productId across all in-stock stores
  const avgByProduct: Record<string, number> = {};
  for (const item of listItems) {
    const prices = Object.values(latestMap)
      .filter((e) => e.productId === item.productId && e.inStock)
      .map((e) => e.price);
    avgByProduct[item.productId] =
      prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  }

  const matches: StoreListMatch[] = matchingStores.map((store) => {
    const matchedItems: { item: ShoppingListItem; quote: PriceEntry }[] = [];
    const missingItems: ShoppingListItem[] = [];
    let totalCost = 0;
    let averageCostForMatched = 0;

    for (const item of listItems) {
      const entry = latestMap[`${item.productId}::${store.id}`];
      if (entry && entry.inStock) {
        matchedItems.push({ item, quote: entry });
        totalCost += entry.price * item.quantity;
        averageCostForMatched += (avgByProduct[item.productId] || entry.price) * item.quantity;
      } else {
        missingItems.push(item);
      }
    }

    const totalRequestedCount = listItems.length;
    const matchedCount = matchedItems.length;
    const coveragePct =
      totalRequestedCount > 0 ? Math.round((matchedCount / totalRequestedCount) * 100) : 100;
    const estimatedSavings = Math.max(0, Number((averageCostForMatched - totalCost).toFixed(2)));

    return {
      store,
      matchedItems,
      missingItems,
      matchedCount,
      totalRequestedCount,
      coveragePct,
      totalCost: Number(totalCost.toFixed(2)),
      averageCostForMatched: Number(averageCostForMatched.toFixed(2)),
      estimatedSavings,
    };
  });

  // Sort by highest item coverage first, then lowest total cost
  matches.sort((a, b) => {
    if (b.matchedCount !== a.matchedCount) {
      return b.matchedCount - a.matchedCount;
    }
    return a.totalCost - b.totalCost;
  });

  return matches;
}

/**
 * Calculates smart shopping basket totals: single best store vs split lowest-per-item total.
 */
export function computeSmartBasketSummary(
  listItems: ShoppingListItem[],
  stores: Store[],
  entries: PriceEntry[]
): {
  splitLowestTotal: number;
  regionalAverageTotal: number;
  bestSingleStore: StoreListMatch | null;
  splitSavingsVsAverage: number;
} {
  if (listItems.length === 0) {
    return {
      splitLowestTotal: 0,
      regionalAverageTotal: 0,
      bestSingleStore: null,
      splitSavingsVsAverage: 0,
    };
  }

  const latestMap = getLatestEntriesMap(entries);
  let splitLowestTotal = 0;
  let regionalAverageTotal = 0;

  for (const item of listItems) {
    const prices = Object.values(latestMap)
      .filter((e) => e.productId === item.productId && e.inStock)
      .map((e) => e.price);
    if (prices.length > 0) {
      const minP = Math.min(...prices);
      const avgP = prices.reduce((a, b) => a + b, 0) / prices.length;
      splitLowestTotal += minP * item.quantity;
      regionalAverageTotal += avgP * item.quantity;
    }
  }

  const storeMatches = findStoresByStreetOrNeighborhoodForList('', listItems, stores, entries);
  const fullCoverage = storeMatches.filter((m) => m.matchedCount === listItems.length);
  const bestSingleStore = fullCoverage[0] || storeMatches[0] || null;

  return {
    splitLowestTotal: Number(splitLowestTotal.toFixed(2)),
    regionalAverageTotal: Number(regionalAverageTotal.toFixed(2)),
    bestSingleStore,
    splitSavingsVsAverage: Math.max(0, Number((regionalAverageTotal - splitLowestTotal).toFixed(2))),
  };
}

/**
 * Generates real-time notifications for:
 * 1) Active promotions
 * 2) Desired target price reached
 * 3) Lowest price for favorited products
 */
export function computeNotifications(
  products: Product[],
  stores: Store[],
  entries: PriceEntry[],
  favorites: FavoriteAlert[]
): PriceNotification[] {
  const productMap: Record<string, Product> = {};
  for (const p of products) productMap[p.id] = p;
  const storeMap: Record<string, Store> = {};
  for (const s of stores) storeMap[s.id] = s;
  const latestEntries = Object.values(getLatestEntriesMap(entries));

  const notifications: PriceNotification[] = [];

  // 1) Favorites: lowest price alerts & desired target price alerts
  for (const fav of favorites) {
    const product = productMap[fav.productId];
    if (!product) continue;

    const productQuotes = latestEntries
      .filter((e) => e.productId === fav.productId && e.inStock)
      .sort((a, b) => a.price - b.price);

    if (productQuotes.length === 0) continue;
    const lowest = productQuotes[0];
    const store = storeMap[lowest.storeId];
    if (!store) continue;

    if (lowest.price <= fav.desiredMaxPrice) {
      notifications.push({
        id: `target::${fav.productId}::${store.id}`,
        kind: 'target_price',
        title: `Meta de preço atingida: ${product.name}`,
        message: `Encontrado por ${formatBRL(lowest.price)} em ${store.name} (${store.neighborhood}), abaixo da sua meta de ${formatBRL(fav.desiredMaxPrice)}.`,
        productId: product.id,
        productName: product.name,
        storeId: store.id,
        storeName: store.name,
        price: lowest.price,
        createdAtMs: lowest.createdAtMs,
      });
    }

    if (fav.notifyOnLowest) {
      notifications.push({
        id: `favlow::${fav.productId}::${store.id}`,
        kind: 'favorite_lowest',
        title: `Menor preço nos favoritos: ${product.name}`,
        message: `${store.name} (${store.neighborhood}) tem o menor valor da região hoje: ${formatBRL(lowest.price)}.`,
        productId: product.id,
        productName: product.name,
        storeId: store.id,
        storeName: store.name,
        price: lowest.price,
        createdAtMs: lowest.createdAtMs,
      });
    }
  }

  // 2) Active promotions across stores (prioritize favorited products first, then latest promos)
  const favoriteProductIds = new Set(favorites.map((f) => f.productId));
  const promoEntries = latestEntries
    .filter((e) => e.isPromo && e.inStock)
    .sort((a, b) => {
      const aFav = favoriteProductIds.has(a.productId) ? 1 : 0;
      const bFav = favoriteProductIds.has(b.productId) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return b.createdAtMs - a.createdAtMs;
    });

  for (const entry of promoEntries.slice(0, 8)) {
    const product = productMap[entry.productId];
    const store = storeMap[entry.storeId];
    if (!product || !store) continue;
    notifications.push({
      id: `promo::${entry.id}`,
      kind: 'promo',
      title: `Promoção em ${store.name}: ${product.name}`,
      message: `${entry.promoLabel ? `${entry.promoLabel} · ` : ''}${formatBRL(entry.price)} na ${store.street} (${store.neighborhood}).`,
      productId: product.id,
      productName: product.name,
      storeId: store.id,
      storeName: store.name,
      price: entry.price,
      createdAtMs: entry.createdAtMs,
    });
  }

  return notifications.sort((a, b) => b.createdAtMs - a.createdAtMs);
}

/**
 * Aggregates monthly savings logs sorted chronologically.
 */
export function aggregateMonthlySavings(logs: SavingsLog[]): MonthlySavingsAggregate[] {
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const byMonth: Record<string, MonthlySavingsAggregate> = {};

  for (const log of logs) {
    const [yr, mo] = log.monthKey.split('-');
    const monthIndex = Math.max(0, Math.min(11, Number(mo) - 1));
    const label = `${monthNames[monthIndex]}/${yr.slice(-2)}`;

    if (!byMonth[log.monthKey]) {
      byMonth[log.monthKey] = {
        monthKey: log.monthKey,
        label,
        savedAmount: 0,
        paidTotal: 0,
        averageMarketTotal: 0,
        tripsCount: 0,
      };
    }

    byMonth[log.monthKey].savedAmount = Number(
      (byMonth[log.monthKey].savedAmount + log.savedAmount).toFixed(2)
    );
    byMonth[log.monthKey].paidTotal = Number(
      (byMonth[log.monthKey].paidTotal + log.paidTotal).toFixed(2)
    );
    byMonth[log.monthKey].averageMarketTotal = Number(
      (byMonth[log.monthKey].averageMarketTotal + log.averageMarketTotal).toFixed(2)
    );
    byMonth[log.monthKey].tripsCount += 1;
  }

  return Object.values(byMonth).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}
