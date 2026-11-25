import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateMonthlySavings,
  checkProductInStore,
  computeNotifications,
  computeSmartBasketSummary,
  filterEntriesByStores,
  filterStoresByRegion,
  findStoresByStreetOrNeighborhoodForList,
  getProductComparison,
} from './pricing';
import type { FavoriteAlert, PriceEntry, Product, SavingsLog, ShoppingListItem, Store } from '../types/market';

const STORES: Store[] = [
  {
    id: 'store_a',
    name: 'Mercado Paulista',
    type: 'supermercado',
    street: 'Rua Augusta, 1400',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    lat: -23.555,
    lng: -46.66,
    hours: '07:00 - 22:00',
    createdBy: 'seed',
  },
  {
    id: 'store_b',
    name: 'Mercadinho Bela Vista',
    type: 'mercadinho',
    street: 'Rua Treze de Maio, 420',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    lat: -23.56,
    lng: -46.648,
    hours: '08:00 - 20:00',
    createdBy: 'seed',
  },
];

const PRODUCTS: Product[] = [
  {
    id: 'prod_arroz',
    name: 'Arroz Branco Tipo 1 (5kg)',
    category: 'grãos',
    unit: '5 kg',
    brand: 'Tio João',
    isEssentialBasket: true,
    referencePrice: 28.9,
    createdBy: 'seed',
  },
  {
    id: 'prod_feijao',
    name: 'Feijão Carioca (1kg)',
    category: 'grãos',
    unit: '1 kg',
    brand: 'Camil',
    isEssentialBasket: true,
    referencePrice: 8.5,
    createdBy: 'seed',
  },
];

const NOW = Date.UTC(2026, 10, 25, 12, 0, 0);

const ENTRIES: PriceEntry[] = [
  {
    id: 'e1',
    productId: 'prod_arroz',
    storeId: 'store_a',
    price: 29.9,
    isPromo: false,
    promoLabel: '',
    inStock: true,
    reportedBy: 'u1',
    reporterName: 'Ana',
    createdAtMs: NOW - 3600_000,
  },
  {
    id: 'e2',
    productId: 'prod_arroz',
    storeId: 'store_b',
    price: 24.5,
    isPromo: true,
    promoLabel: 'Oferta da semana',
    inStock: true,
    reportedBy: 'u2',
    reporterName: 'Carlos',
    createdAtMs: NOW - 1800_000,
  },
  {
    id: 'e3',
    productId: 'prod_feijao',
    storeId: 'store_a',
    price: 7.4,
    isPromo: false,
    promoLabel: '',
    inStock: true,
    reportedBy: 'u1',
    reporterName: 'Ana',
    createdAtMs: NOW - 1000_000,
  },
];

test('getProductComparison identifies lowest price and lowest-price store accurately', () => {
  const comparison = getProductComparison(PRODUCTS[0], STORES, ENTRIES, NOW);
  assert.equal(comparison.lowestQuote?.entry.price, 24.5);
  assert.equal(comparison.lowestQuote?.store.id, 'store_b');
  assert.equal(comparison.allQuotes.length, 2);
  assert.equal(comparison.weeklySeries.length, 7);
  assert.equal(comparison.monthlySeries.length, 6);
});

test('checkProductInStore reports real-time availability and price difference', () => {
  const present = checkProductInStore('prod_arroz', 'store_a', PRODUCTS, STORES, ENTRIES);
  assert.equal(present.existsInStore, true);
  assert.equal(present.inStock, true);
  assert.equal(present.latestEntry?.price, 29.9);
  assert.equal(present.regionalLowestPrice, 24.5);

  const missing = checkProductInStore('prod_feijao', 'store_b', PRODUCTS, STORES, ENTRIES);
  assert.equal(missing.existsInStore, false);
  assert.equal(missing.inStock, false);
});

test('findStoresByStreetOrNeighborhoodForList matches street/neighborhood and scores list coverage', () => {
  const listItems: ShoppingListItem[] = [
    { productId: 'prod_arroz', productName: 'Arroz Branco Tipo 1 (5kg)', quantity: 1, checked: false, targetPrice: 25 },
    { productId: 'prod_feijao', productName: 'Feijão Carioca (1kg)', quantity: 2, checked: false, targetPrice: 8 },
  ];

  const allMatches = findStoresByStreetOrNeighborhoodForList('', listItems, STORES, ENTRIES);
  assert.equal(allMatches[0].store.id, 'store_a');
  assert.equal(allMatches[0].matchedCount, 2);
  assert.equal(allMatches[0].coveragePct, 100);
  assert.equal(allMatches[0].totalCost, 44.7); // 29.9 + 2*7.4

  const streetMatches = findStoresByStreetOrNeighborhoodForList('Treze de Maio', listItems, STORES, ENTRIES);
  assert.equal(streetMatches.length, 1);
  assert.equal(streetMatches[0].store.id, 'store_b');
  assert.equal(streetMatches[0].matchedCount, 1);
  assert.equal(streetMatches[0].missingItems.length, 1);
});

test('computeSmartBasketSummary calculates split vs single store totals', () => {
  const listItems: ShoppingListItem[] = [
    { productId: 'prod_arroz', productName: 'Arroz Branco Tipo 1 (5kg)', quantity: 1, checked: false, targetPrice: 25 },
    { productId: 'prod_feijao', productName: 'Feijão Carioca (1kg)', quantity: 1, checked: false, targetPrice: 8 },
  ];
  const summary = computeSmartBasketSummary(listItems, STORES, ENTRIES);
  assert.equal(summary.splitLowestTotal, 31.9); // 24.5 + 7.4
  assert.equal(summary.bestSingleStore?.store.id, 'store_a');
});

test('computeNotifications detects promo, target price, and favorite lowest price', () => {
  const favs: FavoriteAlert[] = [
    {
      id: 'f1',
      userId: 'u1',
      productId: 'prod_arroz',
      desiredMaxPrice: 26,
      notifyOnPromo: true,
      notifyOnLowest: true,
      updatedAtMs: NOW,
    },
  ];
  const alerts = computeNotifications(PRODUCTS, STORES, ENTRIES, favs);
  const kinds = alerts.map((a) => a.kind);
  assert.ok(kinds.includes('target_price'));
  assert.ok(kinds.includes('favorite_lowest'));
  assert.ok(kinds.includes('promo'));
});

test('aggregateMonthlySavings groups and sums savings logs chronologically', () => {
  const logs: SavingsLog[] = [
    {
      id: 'l1',
      userId: 'u1',
      monthKey: '2026-10',
      storeId: 'store_a',
      storeName: 'Mercado Paulista',
      paidTotal: 120,
      averageMarketTotal: 150,
      savedAmount: 30,
      itemsCount: 8,
      createdAtMs: NOW - 20 * 86400_000,
    },
    {
      id: 'l2',
      userId: 'u1',
      monthKey: '2026-10',
      storeId: 'store_b',
      storeName: 'Mercadinho Bela Vista',
      paidTotal: 80,
      averageMarketTotal: 95,
      savedAmount: 15,
      itemsCount: 5,
      createdAtMs: NOW - 15 * 86400_000,
    },
  ];
  const agg = aggregateMonthlySavings(logs);
  assert.equal(agg.length, 1);
  assert.equal(agg[0].savedAmount, 45);
  assert.equal(agg[0].tripsCount, 2);
});

test('filterStoresByRegion and filterEntriesByStores isolate selected city and neighborhood', () => {
  const extraStores: Store[] = [
    ...STORES,
    {
      id: 'store_campinas',
      name: 'Mercado Cambuí',
      type: 'supermercado',
      street: 'Rua Coronel Quirino, 900',
      neighborhood: 'Cambuí',
      city: 'Campinas',
      lat: -22.893,
      lng: -47.052,
      hours: '08:00 - 21:00',
      createdBy: 'seed',
    },
  ];
  const spConsolacao = filterStoresByRegion(extraStores, {
    city: 'São Paulo',
    neighborhood: 'Consolação',
  });
  assert.equal(spConsolacao.length, 1);
  assert.equal(spConsolacao[0].id, 'store_a');

  const spAll = filterStoresByRegion(extraStores, {
    city: 'São Paulo',
    neighborhood: '',
  });
  assert.equal(spAll.length, 2);

  const scopedEntries = filterEntriesByStores(ENTRIES, spConsolacao);
  assert.equal(scopedEntries.every((e) => e.storeId === 'store_a'), true);
});
