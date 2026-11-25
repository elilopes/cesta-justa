import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Cloud,
  MapPin,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import type {
  PriceEntry,
  Product,
  RegionConfig,
  ShoppingList,
  Store,
  StoreListMatch,
} from '../types/market';
import {
  computeSmartBasketSummary,
  findStoresByStreetOrNeighborhoodForList,
  formatBRL,
} from '../utils/pricing';
import { StoreMap, type MapsConsentStatus } from './StoreMap';

interface ShoppingListMapViewProps {
  shoppingList: ShoppingList;
  products: Product[];
  stores: Store[];
  entries: PriceEntry[];
  regionConfig: RegionConfig;
  isCloudSynced: boolean;
  selectedStoreId: string | null;
  quotaExceeded: boolean;
  mapsConsent: MapsConsentStatus;
  onRequestMapsConsent: (storeId?: string) => void;
  onGrantMapsConsent: () => void;
  onUseOfflineMap: () => void;
  onSelectStore: (storeId: string) => void;
  onUpdateList: (nextList: ShoppingList) => void;
  onRecordSavings: (match: StoreListMatch) => void;
}

export const ShoppingListMapView: React.FC<ShoppingListMapViewProps> = ({
  shoppingList,
  products,
  stores,
  entries,
  regionConfig,
  isCloudSynced,
  selectedStoreId,
  quotaExceeded,
  mapsConsent,
  onRequestMapsConsent,
  onGrantMapsConsent,
  onUseOfflineMap,
  onSelectStore,
  onUpdateList,
  onRecordSavings,
}) => {
  const [locationQuery, setLocationQuery] = useState('');
  const [addProductId, setAddProductId] = useState(products[0]?.id || '');
  const [savedNotice, setSavedNotice] = useState('');

  useEffect(() => {
    setLocationQuery('');
  }, [regionConfig.city, regionConfig.neighborhood]);

  const matches = useMemo(
    () =>
      findStoresByStreetOrNeighborhoodForList(
        locationQuery,
        shoppingList.items,
        stores,
        entries
      ),
    [locationQuery, shoppingList.items, stores, entries]
  );

  const matchesByStoreId = useMemo(() => {
    const record: Record<string, StoreListMatch> = {};
    for (const m of matches) {
      record[m.store.id] = m;
    }
    return record;
  }, [matches]);

  const basketSummary = useMemo(
    () => computeSmartBasketSummary(shoppingList.items, stores, entries),
    [shoppingList.items, stores, entries]
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === addProductId);
    if (!prod) return;

    const existingIdx = shoppingList.items.findIndex((i) => i.productId === prod.id);
    const nextItems = [...shoppingList.items];
    if (existingIdx >= 0) {
      nextItems[existingIdx] = {
        ...nextItems[existingIdx],
        quantity: Math.min(99, nextItems[existingIdx].quantity + 1),
      };
    } else {
      if (nextItems.length >= 50) return;
      nextItems.push({
        productId: prod.id,
        productName: prod.name,
        quantity: 1,
        checked: false,
        targetPrice: Number((prod.referencePrice * 0.92).toFixed(2)),
      });
    }

    onUpdateList({
      ...shoppingList,
      items: nextItems,
      updatedAtMs: Date.now(),
    });
  };

  const handleQty = (productId: string, delta: number) => {
    const nextItems = shoppingList.items
      .map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, Math.min(99, item.quantity + delta)) }
          : item
      )
      .filter((item) => item.quantity > 0);

    onUpdateList({
      ...shoppingList,
      items: nextItems,
      updatedAtMs: Date.now(),
    });
  };

  const handleToggleChecked = (productId: string) => {
    const nextItems = shoppingList.items.map((item) =>
      item.productId === productId ? { ...item, checked: !item.checked } : item
    );
    onUpdateList({
      ...shoppingList,
      items: nextItems,
      updatedAtMs: Date.now(),
    });
  };

  const handleLocationChange = (val: string) => {
    setLocationQuery(val);
    onUpdateList({
      ...shoppingList,
      neighborhoodFilter: val.slice(0, 80),
      updatedAtMs: Date.now(),
    });
  };

  const handleConfirmSavings = (match: StoreListMatch) => {
    onRecordSavings(match);
    setSavedNotice(`Compra registrada em ${match.store.name}. Economia adicionada ao histórico mensal!`);
    setTimeout(() => setSavedNotice(''), 4000);
  };

  const visibleStoresForMap = matches.length > 0 ? matches.map((m) => m.store) : stores;

  return (
    <div className="space-y-6">
      {/* Smart Basket Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-[#526058]">
            <span>Melhor mercado único para a lista</span>
            <Cloud className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
          </div>
          <div className="font-mono text-2xl font-bold text-[#15803D] tabular-nums mt-1">
            {basketSummary.bestSingleStore ? formatBRL(basketSummary.bestSingleStore.totalCost) : '—'}
          </div>
          <p className="text-xs text-[#111815] font-medium mt-1 truncate">
            {basketSummary.bestSingleStore
              ? `${basketSummary.bestSingleStore.store.name} (${basketSummary.bestSingleStore.matchedCount}/${basketSummary.bestSingleStore.totalRequestedCount} itens)`
              : 'Adicione itens à lista'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <span className="text-xs text-[#526058]">Compra combinada (menor por item)</span>
          <div className="font-mono text-2xl font-bold text-[#111815] tabular-nums mt-1">
            {formatBRL(basketSummary.splitLowestTotal)}
          </div>
          <p className="text-xs text-[#526058] mt-1 tabular-nums">
            Média regional: {formatBRL(basketSummary.regionalAverageTotal)}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <span className="text-xs text-[#526058]">Economia estimada na cesta</span>
          <div className="font-mono text-2xl font-bold text-[#15803D] tabular-nums mt-1">
            {formatBRL(basketSummary.splitSavingsVsAverage)}
          </div>
          <p className="text-xs text-[#526058] mt-1">
            {isCloudSynced ? 'Sincronizado na nuvem' : 'Salvo localmente (entre para sincronizar)'}
          </p>
        </div>
      </div>

      {/* Main 2-column workspace: Shopping List + Street/Neighborhood Store Finder & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Smart Cloud Shopping List */}
        <section
          aria-labelledby="shopping-list-heading"
          className="lg:col-span-5 bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 id="shopping-list-heading" className="font-display text-base font-bold text-[#111815]">
                {shoppingList.name}
              </h2>
              <p className="text-xs text-[#526058] tabular-nums">
                {shoppingList.items.length} {shoppingList.items.length === 1 ? 'item' : 'itens'} na lista inteligente
              </p>
            </div>
          </div>

          <form onSubmit={handleAddItem} className="flex gap-2">
            <label htmlFor="add-list-product" className="sr-only">
              Adicionar produto à lista
            </label>
            <select
              id="add-list-product"
              value={addProductId}
              onChange={(e) => setAddProductId(e.target.value)}
              className="flex-1 h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] min-w-0"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="h-10 px-3.5 inline-flex items-center gap-1 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Adicionar</span>
            </button>
          </form>

          {shoppingList.items.length === 0 ? (
            <div className="py-8 text-center text-sm text-[#526058] border border-dashed border-[#D4DBD7] rounded-lg">
              Sua lista está vazia. Adicione produtos da cesta básica acima.
            </div>
          ) : (
            <ul className="divide-y divide-[#E2E7E4]" data-testid="shopping-list-items">
              {shoppingList.items.map((item) => (
                <li key={item.productId} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleChecked(item.productId)}
                      aria-label={`Marcar ${item.productName}`}
                      className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                        item.checked
                          ? 'bg-[#15803D] border-[#15803D] text-white'
                          : 'border-[#C9D2CC] bg-white'
                      }`}
                    >
                      {item.checked && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                    </button>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          item.checked ? 'line-through text-[#7A8981]' : 'text-[#111815]'
                        }`}
                      >
                        {item.productName}
                      </p>
                      <p className="text-xs text-[#526058] font-mono tabular-nums">
                        Meta: {formatBRL(item.targetPrice)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleQty(item.productId, -1)}
                      aria-label={`Diminuir quantidade de ${item.productName}`}
                      className="w-7 h-7 rounded-md bg-[#F2F4F3] hover:bg-[#E5EAE7] flex items-center justify-center text-[#111815] cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-semibold tabular-nums">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQty(item.productId, 1)}
                      aria-label={`Aumentar quantidade de ${item.productName}`}
                      className="w-7 h-7 rounded-md bg-[#F2F4F3] hover:bg-[#E5EAE7] flex items-center justify-center text-[#111815] cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQty(item.productId, -item.quantity)}
                      aria-label={`Remover ${item.productName}`}
                      className="w-7 h-7 rounded-md text-[#526058] hover:text-[#B91C1C] hover:bg-[#FEF2F2] flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Right: Street/Neighborhood Store Finder + Integrated Map */}
        <section
          aria-labelledby="neighborhood-map-heading"
          className="lg:col-span-7 space-y-4"
        >
          <div className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4">
            <div>
              <h2 id="neighborhood-map-heading" className="font-display text-base font-bold text-[#111815]">
                Estabelecimentos em {regionConfig.neighborhood || regionConfig.city} ({regionConfig.city})
              </h2>
              <p className="text-xs sm:text-sm text-[#526058] mt-0.5">
                Filtre por uma rua específica dentro da região selecionada para ver quais mercados possuem sua lista e localizá-los no mapa.
              </p>
            </div>

            <div className="relative">
              <Search
                className="w-4 h-4 text-[#526058] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <label htmlFor="street-neighborhood-search" className="sr-only">
                Pesquisar rua ou bairro
              </label>
              <input
                id="street-neighborhood-search"
                type="text"
                placeholder="Pesquisar rua ou bairro (ex: Rua Augusta, Consolação, Bela Vista)..."
                value={locationQuery}
                onChange={(e) => handleLocationChange(e.target.value)}
                className="w-full h-11 pl-10 pr-20 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
              />
              {locationQuery && (
                <button
                  type="button"
                  onClick={() => handleLocationChange('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[#526058] hover:text-[#111815] cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {savedNotice && (
              <div role="status" className="p-3 rounded-lg bg-[#ECFDF5] border border-[#A7F3D0] text-xs font-medium text-[#15803D]">
                {savedNotice}
              </div>
            )}

            {/* Integrated Map */}
            <StoreMap
              stores={visibleStoresForMap}
              matchesByStoreId={matchesByStoreId}
              selectedStoreId={selectedStoreId || visibleStoresForMap[0]?.id || null}
              onSelectStore={onSelectStore}
              quotaExceeded={quotaExceeded}
              mapsConsent={mapsConsent}
              onGrantMapsConsent={onGrantMapsConsent}
              onUseOfflineMap={onUseOfflineMap}
            />

            {/* Matching Establishments Ranked List */}
            <div className="space-y-2.5 pt-1" data-testid="street-neighborhood-results">
              <h3 className="text-xs font-semibold text-[#526058]">
                Estabelecimentos encontrados ({matches.length})
              </h3>

              {matches.length === 0 ? (
                <div className="p-4 rounded-lg border border-dashed border-[#D4DBD7] text-xs text-[#526058] text-center">
                  Nenhum estabelecimento encontrado em &ldquo;{locationQuery}&rdquo;. Tente outro bairro ou limpe o filtro.
                </div>
              ) : (
                <div className="divide-y divide-[#E2E7E4] border border-[#E2E7E4] rounded-xl overflow-hidden">
                  {matches.map((match) => {
                    const isSelected = match.store.id === selectedStoreId;
                    return (
                      <div
                        key={match.store.id}
                        className={`p-3.5 transition-colors ${
                          isSelected ? 'bg-[#ECFDF5]/60' : 'bg-white hover:bg-[#F7F8F7]'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex flex-wrap items-center gap-x-2">
                              <span className="font-semibold text-sm text-[#111815]">
                                {match.store.name}
                              </span>
                              <span className="text-xs text-[#526058]">
                                {match.store.type} · {match.store.neighborhood}
                              </span>
                            </div>
                            <p className="text-xs text-[#526058]">{match.store.street}</p>
                            <div className="text-xs pt-0.5 tabular-nums">
                              <span
                                className={
                                  match.matchedCount === match.totalRequestedCount
                                    ? 'text-[#15803D] font-semibold'
                                    : 'text-[#B45309] font-medium'
                                }
                              >
                                Possui {match.matchedCount} de {match.totalRequestedCount} itens da lista ({match.coveragePct}%)
                              </span>
                              {match.missingItems.length > 0 && (
                                <span className="text-[#526058]">
                                  {' '}
                                  · Faltam: {match.missingItems.map((m) => m.productName.split(' ')[0]).join(', ')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="text-left sm:text-right">
                              <div className="font-mono text-base font-bold text-[#111815] tabular-nums">
                                {formatBRL(match.totalCost)}
                              </div>
                              {match.estimatedSavings > 0 && (
                                <div className="text-xs text-[#15803D] font-mono tabular-nums">
                                  Economia {formatBRL(match.estimatedSavings)}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  onSelectStore(match.store.id);
                                  if (mapsConsent === 'prompt') {
                                    onRequestMapsConsent(match.store.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                              >
                                <MapPin className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                                <span>Mapa</span>
                              </button>
                              {match.matchedCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmSavings(match)}
                                  className="px-2.5 py-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg inline-flex items-center gap-1 whitespace-nowrap cursor-pointer"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" aria-hidden="true" />
                                  <span>Comprei aqui</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
