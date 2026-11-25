import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  ArrowUpRight,
  Bell,
  Cloud,
  Copy,
  Edit3,
  Flame,
  Heart,
  LogIn,
  LogOut,
  MapPin,
  MoreVertical,
  Search,
  Share2,
  ShoppingCart,
  SlidersHorizontal,
  Store as StoreIcon,
} from 'lucide-react';
import { AlertsView } from './components/AlertsView';
import { Header, type ActiveTab } from './components/Header';
import { MapsPermissionModal } from './components/MapsPermissionModal';
import { MostSearchedModal } from './components/MostSearchedModal';
import { ProductCompareModal } from './components/ProductCompareModal';
import { RegionConfigModal } from './components/RegionConfigModal';
import { SavingsAnalyticsView } from './components/SavingsAnalyticsView';
import { ShoppingListMapView } from './components/ShoppingListMapView';
import { StoreLookupBar } from './components/StoreLookupBar';
import type { MapsConsentStatus } from './components/StoreMap';
import { SubmitPriceModal } from './components/SubmitPriceModal';
import {
  buildSeedPriceEntries,
  buildSeedSavingsLogs,
  SEED_FAVORITES,
  SEED_PRODUCTS,
  SEED_SHOPPING_LIST,
  SEED_STORES,
} from './data/seedData';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  sanitizeId,
  signInWithGoogle,
  signOutUser,
  testConnection,
  timestampToMs,
} from './firebase';
import type {
  FavoriteAlert,
  PriceEntry,
  Product,
  ProductCategory,
  RegionConfig,
  SavingsLog,
  ShoppingList,
  Store,
  StoreListMatch,
  StoreType,
} from './types/market';
import {
  computeNotifications,
  filterEntriesByStores,
  filterStoresByRegion,
  formatBRL,
  formatRelativeTime,
  getProductComparison,
  normalizeText,
} from './utils/pricing';

const LOCAL_STORAGE_KEY = 'cesta_justa_local_state_v1';
const REGION_STORAGE_KEY = 'cesta_justa_region_v1';

const DEFAULT_REGION: RegionConfig = {
  city: 'São Paulo',
  neighborhood: 'Consolação',
};

function loadInitialRegion(): RegionConfig {
  try {
    const raw = localStorage.getItem(REGION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<RegionConfig>;
      if (typeof parsed.city === 'string' && parsed.city.trim().length >= 2) {
        return {
          city: parsed.city.trim(),
          neighborhood: typeof parsed.neighborhood === 'string' ? parsed.neighborhood.trim() : '',
        };
      }
    }
  } catch {
    // Ignore invalid storage
  }
  return DEFAULT_REGION;
}

interface LocalStateSnapshot {
  stores: Store[];
  products: Product[];
  entries: PriceEntry[];
  shoppingList: ShoppingList;
  favorites: FavoriteAlert[];
  savingsLogs: SavingsLog[];
  readNotificationIds: string[];
}

function loadInitialLocalState(): LocalStateSnapshot {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<LocalStateSnapshot>;
      if (
        Array.isArray(parsed.stores) &&
        parsed.stores.length > 0 &&
        Array.isArray(parsed.products) &&
        parsed.products.length > 0 &&
        Array.isArray(parsed.entries)
      ) {
        // Merge any newly seeded stores/entries so regional expansions appear alongside user data
        const storeIds = new Set(parsed.stores.map((s) => s.id));
        const mergedStores = [
          ...parsed.stores,
          ...SEED_STORES.filter((s) => !storeIds.has(s.id)),
        ];
        const entryIds = new Set(parsed.entries.map((e) => e.id));
        const freshSeedEntries = buildSeedPriceEntries().filter((e) => !entryIds.has(e.id));

        return {
          stores: mergedStores,
          products: parsed.products,
          entries: [...parsed.entries, ...freshSeedEntries],
          shoppingList: parsed.shoppingList || SEED_SHOPPING_LIST,
          favorites: Array.isArray(parsed.favorites) ? parsed.favorites : SEED_FAVORITES,
          savingsLogs: Array.isArray(parsed.savingsLogs)
            ? parsed.savingsLogs
            : buildSeedSavingsLogs(),
          readNotificationIds: Array.isArray(parsed.readNotificationIds)
            ? parsed.readNotificationIds
            : [],
        };
      }
    }
  } catch {
    // Ignore corrupt localStorage and fall back to seed
  }

  return {
    stores: SEED_STORES,
    products: SEED_PRODUCTS,
    entries: buildSeedPriceEntries(),
    shoppingList: SEED_SHOPPING_LIST,
    favorites: SEED_FAVORITES,
    savingsLogs: buildSeedSavingsLogs(),
    readNotificationIds: [],
  };
}

const CATEGORY_LABEL_MAP: Record<ProductCategory, string> = {
  grãos: 'Grãos e Massas',
  laticínios: 'Laticínios e Ovos',
  carnes: 'Carnes',
  hortifruti: 'Hortifruti',
  padaria: 'Padaria',
  óleo_açúcar: 'Óleo e Açúcar',
  bebidas: 'Café e Bebidas',
  limpeza: 'Limpeza',
};

const CATEGORY_TABS: { id: 'all' | ProductCategory; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'grãos', label: 'Grãos e Massas' },
  { id: 'laticínios', label: 'Laticínios e Ovos' },
  { id: 'carnes', label: 'Carnes' },
  { id: 'hortifruti', label: 'Hortifruti' },
  { id: 'padaria', label: 'Padaria' },
  { id: 'óleo_açúcar', label: 'Óleo e Açúcar' },
  { id: 'bebidas', label: 'Café e Bebidas' },
  { id: 'limpeza', label: 'Limpeza' },
];

export default function App() {
  const initialLocal = useMemo(() => loadInitialLocalState(), []);
  const initialRegion = useMemo(() => loadInitialRegion(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>('comparar');
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [regionConfig, setRegionConfig] = useState<RegionConfig>(initialRegion);
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  // Auth & Cloud sync state
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Application data
  const [stores, setStores] = useState<Store[]>(initialLocal.stores);
  const [products, setProducts] = useState<Product[]>(initialLocal.products);
  const [entries, setEntries] = useState<PriceEntry[]>(initialLocal.entries);
  const [shoppingList, setShoppingList] = useState<ShoppingList>(initialLocal.shoppingList);
  const [favorites, setFavorites] = useState<FavoriteAlert[]>(initialLocal.favorites);
  const [savingsLogs, setSavingsLogs] = useState<SavingsLog[]>(initialLocal.savingsLogs);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(
    initialLocal.readNotificationIds
  );

  // Search, modals, and selections
  const [productQuery, setProductQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ProductCategory>('all');
  const [showUnpricedCatalogItems, setShowUnpricedCatalogItems] = useState(false);
  const [compareProductId, setCompareProductId] = useState<string | null>(null);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [mostSearchedModalOpen, setMostSearchedModalOpen] = useState(false);
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
  const [submitInitialProductId, setSubmitInitialProductId] = useState<string | undefined>(undefined);
  const [submitInitialStoreId, setSubmitInitialStoreId] = useState<string | undefined>(undefined);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    () => filterStoresByRegion(initialLocal.stores, initialRegion)[0]?.id || initialLocal.stores[0]?.id || null
  );
  const [liveToast, setLiveToast] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setLiveToast(msg);
    setTimeout(() => {
      setLiveToast((prev) => (prev === msg ? '' : prev));
    }, 4500);
  }, []);

  // Google Maps quota listener
  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // Firebase connection test + auth listener
  useEffect(() => {
    testConnection();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  // Persist local mode changes when guest
  useEffect(() => {
    if (user) return;
    try {
      const snapshot: LocalStateSnapshot = {
        stores,
        products,
        entries,
        shoppingList,
        favorites,
        savingsLogs,
        readNotificationIds,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(snapshot));
    } catch {
      // Ignore storage quota issues
    }
  }, [user, stores, products, entries, shoppingList, favorites, savingsLogs, readNotificationIds]);

  // Persist region config immediately so every app start displays the selected city & neighborhood
  useEffect(() => {
    try {
      localStorage.setItem(REGION_STORAGE_KEY, JSON.stringify(regionConfig));
    } catch {
      // Ignore storage quota issues
    }
  }, [regionConfig]);

  // Seed Firestore once if empty when authenticated user logs in
  const seedFirestoreIfEmpty = useCallback(async (uid: string) => {
    try {
      const storesSnap = await getDocs(query(collection(db, 'stores'), limit(1)));
      if (storesSnap.empty) {
        for (const s of SEED_STORES) {
          await setDoc(doc(db, 'stores', s.id), {
            ...s,
            createdBy: uid,
            createdAt: serverTimestamp(),
          });
        }
        for (const p of SEED_PRODUCTS) {
          await setDoc(doc(db, 'products', p.id), {
            ...p,
            createdBy: uid,
            createdAt: serverTimestamp(),
          });
        }
        const seedEntries = buildSeedPriceEntries().filter((e) => !e.id.startsWith('seed_hist_'));
        for (const e of seedEntries) {
          await setDoc(doc(db, 'priceEntries', e.id), {
            id: e.id,
            productId: e.productId,
            storeId: e.storeId,
            price: e.price,
            isPromo: e.isPromo,
            promoLabel: e.promoLabel,
            inStock: e.inStock,
            reportedBy: uid,
            reporterName: e.reporterName,
            createdAt: serverTimestamp(),
          });
        }
      }

      // Ensure user has a default cloud shopping list if none exists
      const listsSnap = await getDocs(
        query(collection(db, 'shoppingLists'), where('userId', '==', uid), limit(1))
      );
      if (listsSnap.empty) {
        const listId = sanitizeId(`list_${uid}_default`);
        await setDoc(doc(db, 'shoppingLists', listId), {
          id: listId,
          userId: uid,
          name: SEED_SHOPPING_LIST.name,
          neighborhoodFilter: SEED_SHOPPING_LIST.neighborhoodFilter,
          items: SEED_SHOPPING_LIST.items,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'stores');
    }
  }, []);

  // Attach real-time Firestore listeners when authenticated
  useEffect(() => {
    if (!authReady || !user) return;

    seedFirestoreIfEmpty(user.uid);

    const unsubStores = onSnapshot(
      collection(db, 'stores'),
      (snap) => {
        if (!snap.empty) {
          const list: Store[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id,
              name: data.name,
              type: data.type,
              street: data.street,
              neighborhood: data.neighborhood,
              city: data.city,
              lat: Number(data.lat),
              lng: Number(data.lng),
              hours: data.hours,
              createdBy: data.createdBy,
            };
          });
          setStores(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'stores')
    );

    const unsubProducts = onSnapshot(
      collection(db, 'products'),
      (snap) => {
        if (!snap.empty) {
          const list: Product[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id,
              name: data.name,
              category: data.category,
              unit: data.unit,
              brand: data.brand,
              isEssentialBasket: Boolean(data.isEssentialBasket),
              referencePrice: Number(data.referencePrice),
              createdBy: data.createdBy,
            };
          });
          setProducts(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'products')
    );

    const unsubEntries = onSnapshot(
      collection(db, 'priceEntries'),
      (snap) => {
        if (!snap.empty) {
          const cloudEntries: PriceEntry[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id,
              productId: data.productId,
              storeId: data.storeId,
              price: Number(data.price),
              isPromo: Boolean(data.isPromo),
              promoLabel: data.promoLabel || '',
              inStock: Boolean(data.inStock),
              reportedBy: data.reportedBy,
              reporterName: data.reporterName || 'Comunidade',
              createdAtMs: timestampToMs(data.createdAt),
            };
          });
          // Merge historical seed entries for richer 6-month charts while preferring live cloud entries
          const cloudIds = new Set(cloudEntries.map((e) => e.id));
          const historicalOnly = buildSeedPriceEntries().filter(
            (e) => e.id.startsWith('seed_hist_') && !cloudIds.has(e.id)
          );
          setEntries([...cloudEntries, ...historicalOnly]);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'priceEntries')
    );

    const unsubLists = onSnapshot(
      query(collection(db, 'shoppingLists'), where('userId', '==', user.uid)),
      (snap) => {
        if (!snap.empty) {
          const docData = snap.docs[0].data();
          setShoppingList({
            id: docData.id,
            userId: docData.userId,
            name: docData.name,
            neighborhoodFilter: docData.neighborhoodFilter || '',
            items: Array.isArray(docData.items) ? docData.items : [],
            updatedAtMs: timestampToMs(docData.updatedAt),
          });
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'shoppingLists')
    );

    const unsubFavs = onSnapshot(
      query(collection(db, 'favorites'), where('userId', '==', user.uid)),
      (snap) => {
        const list: FavoriteAlert[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: data.id,
            userId: data.userId,
            productId: data.productId,
            desiredMaxPrice: Number(data.desiredMaxPrice),
            notifyOnPromo: Boolean(data.notifyOnPromo),
            notifyOnLowest: Boolean(data.notifyOnLowest),
            updatedAtMs: timestampToMs(data.updatedAt),
          };
        });
        setFavorites(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'favorites')
    );

    const unsubSavings = onSnapshot(
      query(collection(db, 'savingsLogs'), where('userId', '==', user.uid)),
      (snap) => {
        if (!snap.empty) {
          const list: SavingsLog[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: data.id,
              userId: data.userId,
              monthKey: data.monthKey,
              storeId: data.storeId,
              storeName: data.storeName,
              paidTotal: Number(data.paidTotal),
              averageMarketTotal: Number(data.averageMarketTotal),
              savedAmount: Number(data.savedAmount),
              itemsCount: Number(data.itemsCount),
              createdAtMs: timestampToMs(data.createdAt),
            };
          });
          setSavingsLogs(list);
        }
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'savingsLogs')
    );

    const userProfileRef = doc(db, 'users', user.uid);
    const unsubUserProfile = onSnapshot(
      userProfileRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (typeof data.city === 'string' && data.city.trim()) {
            setRegionConfig({
              city: data.city.trim(),
              neighborhood: typeof data.neighborhood === 'string' ? data.neighborhood.trim() : '',
            });
          }
        } else {
          setDoc(userProfileRef, {
            uid: user.uid,
            displayName: (user.displayName || 'Consumidor Local').slice(0, 60),
            city: regionConfig.city,
            neighborhood: regionConfig.neighborhood,
            createdAt: serverTimestamp(),
          }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
        }
      },
      (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`)
    );

    return () => {
      unsubStores();
      unsubProducts();
      unsubEntries();
      unsubLists();
      unsubFavs();
      unsubSavings();
      unsubUserProfile();
    };
  }, [authReady, user, seedFirestoreIfEmpty]);

  // Scoped establishments & prices strictly for the configured city & neighborhood
  const scopedStores = useMemo(
    () => filterStoresByRegion(stores, regionConfig),
    [stores, regionConfig]
  );

  const scopedEntries = useMemo(
    () => filterEntriesByStores(entries, scopedStores),
    [entries, scopedStores]
  );

  // Keep selectedStoreId aligned with active region
  useEffect(() => {
    if (scopedStores.length === 0) {
      setSelectedStoreId(null);
      return;
    }
    if (!selectedStoreId || !scopedStores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(scopedStores[0].id);
    }
  }, [scopedStores, selectedStoreId]);

  // Derived comparisons and notifications strictly within configured city & neighborhood
  const comparisonsByProduct = useMemo(() => {
    const record: Record<string, ReturnType<typeof getProductComparison>> = {};
    for (const product of products) {
      record[product.id] = getProductComparison(product, scopedStores, scopedEntries);
    }
    return record;
  }, [products, scopedStores, scopedEntries]);

  const filteredProducts = useMemo(() => {
    const q = normalizeText(productQuery);
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      const hasRegionQuote = (comparisonsByProduct[p.id]?.allQuotes.length || 0) > 0;
      if (!showUnpricedCatalogItems && !hasRegionQuote && !q) return false;
      if (!q) return true;
      return (
        normalizeText(p.name).includes(q) ||
        normalizeText(p.brand).includes(q) ||
        normalizeText(p.category).includes(q)
      );
    });
  }, [products, productQuery, categoryFilter, comparisonsByProduct, showUnpricedCatalogItems]);

  const notifications = useMemo(
    () => computeNotifications(products, scopedStores, scopedEntries, favorites),
    [products, scopedStores, scopedEntries, favorites]
  );

  const unreadAlertsCount = useMemo(
    () => notifications.filter((n) => !readNotificationIds.includes(n.id)).length,
    [notifications, readNotificationIds]
  );

  // Handlers
  const handleSignIn = async () => {
    setAuthError('');
    setAuthLoading(true);
    try {
      await signInWithGoogle();
      showToast('Conta Google conectada! Dados sincronizados na nuvem.');
    } catch (err) {
      setAuthError('Não foi possível concluir o login com o Google. Você pode continuar usando normalmente.');
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOutUser();
    showToast('Sessão encerrada.');
  };

  const handleCopyAddress = (store?: Store) => {
    if (!store) {
      showToast('Nenhum estabelecimento cadastrado para este produto ainda.');
      return;
    }
    const addr = `${store.name} · ${store.street}, ${store.neighborhood} - ${store.city}`;
    navigator.clipboard
      .writeText(addr)
      .then(() => {
        showToast('Endereço copiado para a área de transferência.');
      })
      .catch(() => {
        showToast('Não foi possível copiar o endereço.');
      });
  };

  const handleShareAddress = async (store?: Store) => {
    if (!store) {
      showToast('Nenhum estabelecimento cadastrado para este produto ainda.');
      return;
    }
    const addr = `${store.name} · ${store.street}, ${store.neighborhood} - ${store.city}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Endereço do Estabelecimento - Cesta Justa',
          text: addr,
        });
        return;
      } catch {
        // Fallback
      }
    }
    navigator.clipboard.writeText(addr);
    showToast('Endereço copiado para compartilhamento.');
  };

  const handleCopyProductAndPrice = (product: Product, lowest?: { entry: PriceEntry; store: Store } | null) => {
    const priceText = lowest ? formatBRL(lowest.entry.price) : 'Sem preço';
    const storeText = lowest ? ` em ${lowest.store.name} (${lowest.store.neighborhood})` : '';
    const text = `${product.name} (${product.unit} · ${product.brand}): ${priceText}${storeText} — Cesta Justa`;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast('Produto e valor copiados para a área de transferência.');
      })
      .catch(() => {
        showToast('Não foi possível copiar.');
      });
  };

  const handleShareProductAndPrice = async (product: Product, lowest?: { entry: PriceEntry; store: Store } | null) => {
    const priceText = lowest ? formatBRL(lowest.entry.price) : 'Sem preço';
    const storeText = lowest ? ` em ${lowest.store.name} (${lowest.store.neighborhood})` : '';
    const text = `${product.name} (${product.unit} · ${product.brand}): ${priceText}${storeText} — Cesta Justa`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text,
        });
        return;
      } catch {
        // Fallback
      }
    }
    navigator.clipboard.writeText(text);
    showToast('Informações copiadas para compartilhamento.');
  };

  const handleEditPrice = (product: Product, lowest?: { entry: PriceEntry; store: Store } | null) => {
    if (!user) {
      showToast('Para editar o valor, faça login com sua Conta Google.');
      handleSignIn();
      return;
    }
    openSubmitModal(product.id, lowest?.store?.id);
  };

  const handleSubmitPrice = async (payload: {
    productId: string;
    storeId: string;
    price: number;
    isPromo: boolean;
    promoLabel: string;
    inStock: boolean;
    reporterName: string;
  }) => {
    const id = sanitizeId(`entry_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`);
    const newEntry: PriceEntry = {
      id,
      productId: payload.productId,
      storeId: payload.storeId,
      price: payload.price,
      isPromo: payload.isPromo,
      promoLabel: payload.promoLabel,
      inStock: payload.inStock,
      reportedBy: user?.uid || 'local_guest',
      reporterName: payload.reporterName,
      createdAtMs: Date.now(),
    };

    // Check if this beats current lowest price for notification toast
    const prevComp = comparisonsByProduct[payload.productId];
    const prod = products.find((p) => p.id === payload.productId);
    const store = stores.find((s) => s.id === payload.storeId);

    setEntries((prev) => [newEntry, ...prev]);

    if (user) {
      try {
        await setDoc(doc(db, 'priceEntries', id), {
          id,
          productId: newEntry.productId,
          storeId: newEntry.storeId,
          price: newEntry.price,
          isPromo: newEntry.isPromo,
          promoLabel: newEntry.promoLabel,
          inStock: newEntry.inStock,
          reportedBy: user.uid,
          reporterName: newEntry.reporterName,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `priceEntries/${id}`);
      }
    }

    if (prevComp?.lowestQuote && payload.inStock && payload.price < prevComp.lowestQuote.entry.price) {
      showToast(
        `Novo menor preço para ${prod?.name}: ${formatBRL(payload.price)} em ${store?.name}!`
      );
    } else {
      showToast(`Preço de ${prod?.name} atualizado em ${store?.name}.`);
    }
  };

  const handleCreateStore = (payload: {
    name: string;
    type: StoreType;
    street: string;
    neighborhood: string;
    city: string;
    hours: string;
    lat: number;
    lng: number;
  }): string => {
    const id = sanitizeId(`store_${Date.now()}`);
    const newStore: Store = {
      id,
      ...payload,
      createdBy: user?.uid || 'local_guest',
    };
    setStores((prev) => [...prev, newStore]);

    if (user) {
      setDoc(doc(db, 'stores', id), {
        ...newStore,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `stores/${id}`));
    }
    showToast(`Estabelecimento ${newStore.name} adicionado.`);
    return id;
  };

  const handleCreateProduct = (payload: {
    name: string;
    category: ProductCategory;
    unit: string;
    brand: string;
    isEssentialBasket: boolean;
    referencePrice: number;
  }): string => {
    const id = sanitizeId(`prod_${Date.now()}`);
    const newProd: Product = {
      id,
      ...payload,
      createdBy: user?.uid || 'local_guest',
    };
    setProducts((prev) => [newProd, ...prev]);

    if (user) {
      setDoc(doc(db, 'products', id), {
        ...newProd,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
      }).catch((err) => handleFirestoreError(err, OperationType.CREATE, `products/${id}`));
    }
    showToast(`Produto ${newProd.name} cadastrado.`);
    return id;
  };

  const handleUpdateShoppingList = async (nextList: ShoppingList) => {
    setShoppingList(nextList);
    if (user) {
      const listId = sanitizeId(nextList.id || `list_${user.uid}_default`);
      try {
        await setDoc(
          doc(db, 'shoppingLists', listId),
          {
            id: listId,
            userId: user.uid,
            name: nextList.name.slice(0, 80),
            neighborhoodFilter: nextList.neighborhoodFilter.slice(0, 80),
            items: nextList.items.slice(0, 50),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `shoppingLists/${listId}`);
      }
    }
  };

  const handleAddToShoppingList = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    const exists = shoppingList.items.some((i) => i.productId === productId);
    const nextItems = exists
      ? shoppingList.items.map((i) =>
          i.productId === productId ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
        )
      : [
          ...shoppingList.items,
          {
            productId: prod.id,
            productName: prod.name,
            quantity: 1,
            checked: false,
            targetPrice: Number((prod.referencePrice * 0.92).toFixed(2)),
          },
        ].slice(0, 50);

    handleUpdateShoppingList({
      ...shoppingList,
      items: nextItems,
      updatedAtMs: Date.now(),
    });
    showToast(`${prod.name} adicionado à lista inteligente.`);
  };

  const handleSaveFavorite = async (
    productId: string,
    desiredMaxPrice: number,
    notifyOnPromo: boolean,
    notifyOnLowest: boolean
  ) => {
    const uid = user?.uid || 'local_guest';
    const favId = sanitizeId(`fav_${uid}_${productId}`);
    const nextFav: FavoriteAlert = {
      id: favId,
      userId: uid,
      productId,
      desiredMaxPrice,
      notifyOnPromo,
      notifyOnLowest,
      updatedAtMs: Date.now(),
    };

    setFavorites((prev) => {
      const filtered = prev.filter((f) => f.productId !== productId);
      return [nextFav, ...filtered];
    });

    if (user) {
      try {
        await setDoc(doc(db, 'favorites', favId), {
          id: favId,
          userId: user.uid,
          productId,
          desiredMaxPrice,
          notifyOnPromo,
          notifyOnLowest,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `favorites/${favId}`);
      }
    }
    showToast('Alerta de favorito e preço desejado salvo.');
  };

  const handleRemoveFavorite = async (productId: string) => {
    const existing = favorites.find((f) => f.productId === productId);
    setFavorites((prev) => prev.filter((f) => f.productId !== productId));

    if (user && existing) {
      try {
        await deleteDoc(doc(db, 'favorites', existing.id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `favorites/${existing.id}`);
      }
    }
  };

  const handleRecordSavings = async (match: StoreListMatch) => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const logId = sanitizeId(`sav_${Date.now()}`);
    const uid = user?.uid || 'local_guest';
    const log: SavingsLog = {
      id: logId,
      userId: uid,
      monthKey,
      storeId: match.store.id,
      storeName: match.store.name,
      paidTotal: match.totalCost,
      averageMarketTotal: match.averageCostForMatched,
      savedAmount: match.estimatedSavings,
      itemsCount: Math.max(1, match.matchedCount),
      createdAtMs: Date.now(),
    };

    setSavingsLogs((prev) => [...prev, log]);

    if (user) {
      try {
        await setDoc(doc(db, 'savingsLogs', logId), {
          id: logId,
          userId: user.uid,
          monthKey: log.monthKey,
          storeId: log.storeId,
          storeName: log.storeName,
          paidTotal: log.paidTotal,
          averageMarketTotal: log.averageMarketTotal,
          savedAmount: log.savedAmount,
          itemsCount: log.itemsCount,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `savingsLogs/${logId}`);
      }
    }
  };

  const [mapsConsent, setMapsConsent] = useState<MapsConsentStatus>('prompt');
  const [mapsPromptOpen, setMapsPromptOpen] = useState(false);
  const [pendingMapStoreId, setPendingMapStoreId] = useState<string | null>(null);

  const handleRequestMapAction = (storeId?: string) => {
    if (storeId) {
      setSelectedStoreId(storeId);
    }
    if (mapsConsent === 'prompt') {
      setPendingMapStoreId(storeId ?? null);
      setMapsPromptOpen(true);
      return;
    }
    setCompareProductId(null);
    setActiveTab('lista_mapa');
  };

  const handleAllowGoogleMaps = () => {
    setMapsConsent('granted');
    setMapsPromptOpen(false);
    if (pendingMapStoreId) {
      setSelectedStoreId(pendingMapStoreId);
    }
    setPendingMapStoreId(null);
    setCompareProductId(null);
    setActiveTab('lista_mapa');
  };

  const handleUseOfflineMap = () => {
    setMapsConsent('offline');
    setMapsPromptOpen(false);
    if (pendingMapStoreId) {
      setSelectedStoreId(pendingMapStoreId);
    }
    setPendingMapStoreId(null);
    setCompareProductId(null);
    setActiveTab('lista_mapa');
  };

  const handleSaveRegion = async (nextRegion: RegionConfig) => {
    setRegionConfig(nextRegion);
    setShowUnpricedCatalogItems(false);
    const matching = filterStoresByRegion(stores, nextRegion);
    setSelectedStoreId(matching[0]?.id || null);

    if (user) {
      const userProfileRef = doc(db, 'users', user.uid);
      try {
        const snap = await getDoc(userProfileRef);
        if (snap.exists()) {
          await updateDoc(userProfileRef, {
            city: nextRegion.city,
            neighborhood: nextRegion.neighborhood,
          });
        } else {
          await setDoc(userProfileRef, {
            uid: user.uid,
            displayName: (user.displayName || 'Consumidor Local').slice(0, 60),
            city: nextRegion.city,
            neighborhood: nextRegion.neighborhood,
            createdAt: serverTimestamp(),
          });
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
    }

    const label = nextRegion.neighborhood
      ? `${nextRegion.neighborhood}, ${nextRegion.city}`
      : nextRegion.city;
    showToast(`Região configurada para ${label}.`);
  };

  const openSubmitModal = (productId?: string, storeId?: string) => {
    setSubmitInitialProductId(productId);
    setSubmitInitialStoreId(storeId || scopedStores[0]?.id);
    setSubmitModalOpen(true);
  };

  const activeComparison = compareProductId ? comparisonsByProduct[compareProductId] || null : null;
  const activeFavorite = compareProductId
    ? favorites.find((f) => f.productId === compareProductId) || null
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F8F7] text-[#111815]">
      {/* Google Maps Platform Demo Key Quota Banner (when triggered) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Header
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSubmitPrice={() => openSubmitModal()}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* Live Toast Notification */}
      {liveToast && (
        <div
          role="status"
          className="fixed bottom-4 right-4 z-50 max-w-sm bg-[#111815] text-white px-4 py-3 rounded-xl shadow-lg text-xs font-medium flex items-center gap-2.5"
        >
          <Bell className="w-4 h-4 text-[#4ADE80] shrink-0" aria-hidden="true" />
          <span>{liveToast}</span>
        </div>
      )}

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Workspace Hero & Cloud Sync Strip */}
        <section className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E2E7E4] pb-5">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-medium text-[#15803D]">
              Rede colaborativa em tempo real · {scopedStores.length}{' '}
              {scopedStores.length === 1 ? 'estabelecimento' : 'estabelecimentos'} em{' '}
              {regionConfig.neighborhood ? `${regionConfig.neighborhood}, ` : ''}
              {regionConfig.city}
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#111815]">
              Preços da cesta básica nos mercados e mercadinhos da região
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setRegionModalOpen(true)}
              data-testid="configure-region-btn"
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white border border-[#D4DBD7] hover:border-[#15803D] text-[#111815] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
              <span>
                {regionConfig.neighborhood
                  ? `${regionConfig.neighborhood} · ${regionConfig.city}`
                  : regionConfig.city}
              </span>
            </button>

            {user ? (
              <div className="flex items-center gap-3 bg-white border border-[#E2E7E4] rounded-lg px-3 py-2">
                <Cloud className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                <div className="text-xs">
                  <span className="font-semibold text-[#111815] block leading-tight">
                    {user.displayName || 'Conectado'}
                  </span>
                  <span className="text-[#526058]">Nuvem sincronizada</span>
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  aria-label="Sair da conta Google"
                  className="p-1.5 text-[#526058] hover:text-[#111815] rounded cursor-pointer"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={authLoading}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-white border border-[#D4DBD7] hover:border-[#15803D] text-[#111815] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                <span>{authLoading ? 'Conectando...' : 'Entrar com Google (Nuvem)'}</span>
              </button>
            )}
          </div>
        </section>

        {authError && (
          <div role="alert" className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            {authError}
          </div>
        )}

        {/* TAB 1: COMPARAR PREÇOS */}
        {activeTab === 'comparar' && (
          <div className="space-y-6">
            {/* Search & Category Controls */}
            <section aria-label="Busca de produtos" className="space-y-3">
              <div className="relative">
                <Search
                  className="w-4 h-4 text-[#526058] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <label htmlFor="product-search-input" className="sr-only">
                  Pesquisar produto da cesta básica
                </label>
                <input
                  id="product-search-input"
                  type="search"
                  placeholder="Pesquisar produto da cesta básica (ex: Arroz, Feijão, Café, Leite, Óleo)..."
                  value={productQuery}
                  onChange={(e) => setProductQuery(e.target.value)}
                  className="w-full h-12 pl-11 pr-4 text-sm sm:text-base bg-white border border-[#D4DBD7] rounded-xl text-[#111815] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {CATEGORY_TABS.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        categoryFilter === cat.id
                          ? 'bg-[#111815] text-white'
                          : 'bg-white border border-[#E2E7E4] text-[#526058] hover:text-[#111815]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setMostSearchedModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A] flex items-center justify-center gap-1.5"
                >
                  <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Mais Pesquisados</span>
                </button>
              </div>
            </section>

            {/* Real-time Store Stock & Price Lookup */}
            <StoreLookupBar
              products={products}
              stores={scopedStores}
              entries={scopedEntries}
              onQuickUpdatePrice={(pid, sid) => openSubmitModal(pid, sid)}
            />

            {/* Product Results Grid: Displays Lowest Price + Lowest-Price Store + Adjacent "Ver outros preços" Button */}
            <section aria-labelledby="products-results-heading" className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 id="products-results-heading" className="font-display text-lg font-bold text-[#111815]">
                  Menor preço em {regionConfig.neighborhood || regionConfig.city} ({filteredProducts.length})
                </h2>
                <div className="flex flex-wrap items-center gap-4">
                  {scopedStores.length > 0 && filteredProducts.length < products.length && (
                    <button
                      type="button"
                      onClick={() => setShowUnpricedCatalogItems((prev) => !prev)}
                      className="text-xs font-medium text-[#526058] hover:text-[#111815] underline cursor-pointer"
                    >
                      {showUnpricedCatalogItems
                        ? 'Ocultar itens sem preço no bairro'
                        : 'Mostrar todos os itens do catálogo'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRequestMapAction()}
                    className="text-xs font-medium text-[#15803D] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Ver mercados no mapa ({shoppingList.items.length} na lista)</span>
                  </button>
                </div>
              </div>

              {scopedStores.length === 0 ? (
                <div className="bg-white border border-[#E2E7E4] rounded-xl p-8 text-center space-y-3">
                  <p className="text-sm text-[#526058]">
                    Ainda não há estabelecimentos cadastrados em{' '}
                    <strong className="text-[#111815]">
                      {regionConfig.neighborhood
                        ? `${regionConfig.neighborhood}, ${regionConfig.city}`
                        : regionConfig.city}
                    </strong>
                    .
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => openSubmitModal()}
                      className="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg cursor-pointer"
                    >
                      Cadastrar mercado nesta região
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegionModalOpen(true)}
                      className="px-4 py-2 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg cursor-pointer"
                    >
                      Alterar cidade ou bairro
                    </button>
                  </div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border border-[#E2E7E4] rounded-xl p-8 text-center space-y-3">
                  <p className="text-sm text-[#526058]">
                    Nenhum produto encontrado neste bairro{productQuery ? ` para "${productQuery}"` : ''}.
                  </p>
                  <button
                    type="button"
                    onClick={() => openSubmitModal()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg cursor-pointer"
                  >
                    Cadastrar novo preço ou produto
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="product-comparison-grid">
                  {filteredProducts.map((product) => {
                    const comp = comparisonsByProduct[product.id];
                    const lowest = comp?.lowestQuote;
                    const otherCount = Math.max(0, (comp?.allQuotes.length || 0) - 1);
                    const isFav = favorites.some((f) => f.productId === product.id);

                    return (
                      <article
                        key={product.id}
                        className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 flex flex-col justify-between gap-4 hover:border-[#C2CCC6] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-[#526058]">
                              {CATEGORY_LABEL_MAP[product.category]} · {product.unit} · {product.brand}
                            </p>
                            <h3 className="font-display text-base sm:text-lg font-bold text-[#111815] mt-0.5 truncate">
                              {product.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                isFav
                                  ? handleRemoveFavorite(product.id)
                                  : handleSaveFavorite(
                                      product.id,
                                      Number(((lowest?.entry.price || product.referencePrice) * 0.95).toFixed(2)),
                                      true,
                                      true
                                    )
                              }
                              aria-label={
                                isFav
                                  ? `Remover ${product.name} dos favoritos`
                                  : `Favoritar ${product.name}`
                              }
                              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                                isFav
                                  ? 'text-[#15803D] bg-[#15803D]/10'
                                  : 'text-[#526058] hover:bg-[#F2F4F3]'
                              }`}
                            >
                              <Heart
                                className="w-4 h-4"
                                fill={isFav ? 'currentColor' : 'none'}
                                aria-hidden="true"
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddToShoppingList(product.id)}
                              aria-label={`Adicionar ${product.name} à lista de compras`}
                              className="p-2 rounded-lg text-[#526058] hover:text-[#15803D] hover:bg-[#F2F4F3] transition-colors cursor-pointer"
                            >
                              <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                            </button>

                            {/* Card Actions Menu */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => setActiveCardMenuId(activeCardMenuId === product.id ? null : product.id)}
                                aria-label="Mais opções do produto"
                                className="p-2 rounded-lg text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] transition-colors cursor-pointer"
                              >
                                <MoreVertical className="w-4 h-4" aria-hidden="true" />
                              </button>

                              {activeCardMenuId === product.id && (
                                <div className="absolute right-0 mt-1.5 w-60 bg-white border border-[#E2E7E4] rounded-xl shadow-lg z-30 py-1.5 text-xs text-[#111815]">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      if (lowest?.store) handleRequestMapAction(lowest.store.id);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <MapPin className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
                                    <span>Abrir no mapa</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      handleCopyAddress(lowest?.store);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4 text-[#526058] shrink-0" aria-hidden="true" />
                                    <span>Copiar endereço</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      handleShareAddress(lowest?.store);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Share2 className="w-4 h-4 text-[#526058] shrink-0" aria-hidden="true" />
                                    <span>Compartilhar endereço</span>
                                  </button>
                                  <div className="my-1 border-t border-[#E2E7E4]" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      handleCopyProductAndPrice(product, lowest);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Copy className="w-4 h-4 text-[#526058] shrink-0" aria-hidden="true" />
                                    <span>Copiar produto e valor</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      handleShareProductAndPrice(product, lowest);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 cursor-pointer"
                                  >
                                    <Share2 className="w-4 h-4 text-[#526058] shrink-0" aria-hidden="true" />
                                    <span>Compartilhar produto e valor</span>
                                  </button>
                                  <div className="my-1 border-t border-[#E2E7E4]" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveCardMenuId(null);
                                      handleEditPrice(product, lowest);
                                    }}
                                    className="w-full text-left px-3.5 py-2 hover:bg-[#F2F4F3] flex items-center gap-2.5 text-[#15803D] font-medium cursor-pointer"
                                  >
                                    <Edit3 className="w-4 h-4 shrink-0" aria-hidden="true" />
                                    <span>Editar o valor (solicita login)</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Lowest Price & Store + Adjacent "Ver outros preços" Button */}
                        <div className="pt-3 border-t border-[#E2E7E4] flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                          {lowest ? (
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-baseline gap-2.5">
                                <span className="font-mono text-2xl font-bold text-[#15803D] tabular-nums">
                                  {formatBRL(lowest.entry.price)}
                                </span>
                                {lowest.entry.isPromo && (
                                  <span className="text-xs font-semibold text-[#B45309]">
                                    {lowest.entry.promoLabel || 'Em promoção'}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#111815] font-medium flex items-center gap-1.5">
                                <StoreIcon className="w-3.5 h-3.5 text-[#15803D] shrink-0" aria-hidden="true" />
                                <span className="truncate">
                                  Menor preço em <strong>{lowest.store.name}</strong> ({lowest.store.neighborhood})
                                </span>
                              </div>
                              <p className="text-xs text-[#526058] truncate">
                                {lowest.store.street} · {formatRelativeTime(lowest.entry.createdAtMs)}
                              </p>
                            </div>
                          ) : (
                            <div className="text-xs text-[#526058]">
                              Sem preços registrados ainda. Seja o primeiro!
                            </div>
                          )}

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => setCompareProductId(product.id)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111815] bg-[#F2F4F3] hover:bg-[#E2E7E4] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <span>
                                {otherCount > 0
                                  ? `Ver outros preços (${otherCount})`
                                  : 'Ver comparativo'}
                              </span>
                              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}

        {/* TAB 2: LISTA INTELIGENTE & MAPA POR RUA/BAIRRO */}
        {activeTab === 'lista_mapa' && (
          <ShoppingListMapView
            shoppingList={shoppingList}
            products={products}
            stores={scopedStores}
            entries={scopedEntries}
            regionConfig={regionConfig}
            isCloudSynced={Boolean(user)}
            selectedStoreId={selectedStoreId}
            quotaExceeded={quotaExceeded}
            mapsConsent={mapsConsent}
            onRequestMapsConsent={(storeId) => handleRequestMapAction(storeId)}
            onGrantMapsConsent={handleAllowGoogleMaps}
            onUseOfflineMap={handleUseOfflineMap}
            onSelectStore={setSelectedStoreId}
            onUpdateList={handleUpdateShoppingList}
            onRecordSavings={handleRecordSavings}
          />
        )}

        {/* TAB 3: ECONOMIA & GRÁFICOS SEMANAIS/MENSAIS */}
        {activeTab === 'economia' && (
          <SavingsAnalyticsView
            products={products}
            stores={scopedStores}
            entries={scopedEntries}
            savingsLogs={savingsLogs}
          />
        )}

        {/* TAB 4: ALERTAS & FAVORITOS */}
        {activeTab === 'alertas' && (
          <AlertsView
            notifications={notifications}
            readNotificationIds={readNotificationIds}
            favorites={favorites}
            products={products}
            onMarkAllRead={() => setReadNotificationIds(notifications.map((n) => n.id))}
            onOpenProductCompare={(pid) => setCompareProductId(pid)}
            onSaveFavorite={handleSaveFavorite}
            onRemoveFavorite={handleRemoveFavorite}
          />
        )}
      </main>

      <footer className="border-t border-[#E2E7E4] bg-white mt-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#526058]">
          <span>Cesta Justa · Monitoramento colaborativo de preços da cesta básica</span>
          <span>Preços atualizados pela comunidade · Integração com Google Maps e nuvem</span>
        </div>
      </footer>

      {/* Modals */}
      <ProductCompareModal
        comparison={activeComparison}
        favorite={activeFavorite}
        onClose={() => setCompareProductId(null)}
        onAddToShoppingList={handleAddToShoppingList}
        onSaveFavorite={handleSaveFavorite}
        onRemoveFavorite={handleRemoveFavorite}
        onLocateStoreOnMap={(storeId) => handleRequestMapAction(storeId)}
        onRegisterPriceForProduct={(pid) => {
          setCompareProductId(null);
          openSubmitModal(pid);
        }}
      />

      <MapsPermissionModal
        isOpen={mapsPromptOpen}
        onAllowGoogleMaps={handleAllowGoogleMaps}
        onUseOfflineMap={handleUseOfflineMap}
        onCancel={() => {
          setMapsPromptOpen(false);
          setPendingMapStoreId(null);
        }}
      />

      <RegionConfigModal
        isOpen={regionModalOpen}
        currentRegion={regionConfig}
        stores={stores}
        onSaveRegion={handleSaveRegion}
        onClose={() => setRegionModalOpen(false)}
      />

      <MostSearchedModal
        isOpen={mostSearchedModalOpen}
        products={products}
        stores={scopedStores}
        entries={scopedEntries}
        onClose={() => setMostSearchedModalOpen(false)}
        onOpenProductCompare={(pid) => setCompareProductId(pid)}
        onAddToShoppingList={handleAddToShoppingList}
      />

      <SubmitPriceModal
        key={`${submitModalOpen}-${submitInitialProductId || ''}-${submitInitialStoreId || ''}-${regionConfig.city}-${regionConfig.neighborhood}`}
        isOpen={submitModalOpen}
        products={products}
        stores={scopedStores.length > 0 ? [...scopedStores, ...stores.filter((s) => !scopedStores.some((sc) => sc.id === s.id))] : stores}
        entries={scopedEntries}
        initialProductId={submitInitialProductId}
        initialStoreId={submitInitialStoreId}
        defaultCity={regionConfig.city}
        defaultNeighborhood={regionConfig.neighborhood}
        defaultReporterName={user?.displayName || 'Consumidor Local'}
        onClose={() => setSubmitModalOpen(false)}
        onSubmitPrice={handleSubmitPrice}
        onCreateStore={handleCreateStore}
        onCreateProduct={handleCreateProduct}
      />
    </div>
  );
}
