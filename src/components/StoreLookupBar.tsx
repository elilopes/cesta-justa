import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, RefreshCw, Search, Store as StoreIcon, XCircle } from 'lucide-react';
import type { PriceEntry, Product, Store } from '../types/market';
import { checkProductInStore, formatBRL, formatRelativeTime } from '../utils/pricing';

interface StoreLookupBarProps {
  products: Product[];
  stores: Store[];
  entries: PriceEntry[];
  onQuickUpdatePrice: (productId: string, storeId: string) => void;
}

export const StoreLookupBar: React.FC<StoreLookupBarProps> = ({
  products,
  stores,
  entries,
  onQuickUpdatePrice,
}) => {
  const [selectedStoreId, setSelectedStoreId] = useState<string>(stores[0]?.id || '');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');

  useEffect(() => {
    if (stores.length === 0) {
      if (selectedStoreId !== '') {
        setSelectedStoreId('');
      }
      return;
    }
    if (!stores.some((s) => s.id === selectedStoreId)) {
      setSelectedStoreId(stores[0].id);
    }
  }, [stores, selectedStoreId]);

  const result = useMemo(
    () =>
      checkProductInStore(
        selectedProductId,
        selectedStoreId,
        products,
        stores,
        entries
      ),
    [selectedProductId, selectedStoreId, products, stores, entries]
  );

  return (
    <section
      aria-labelledby="store-lookup-heading"
      className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 id="store-lookup-heading" className="font-display text-base font-semibold text-[#111815] flex items-center gap-2">
            <StoreIcon className="w-4 h-4 text-[#15803D] shrink-0" aria-hidden="true" />
            <span>Consultar produto em um estabelecimento (tempo real)</span>
          </h2>
          <p className="text-xs sm:text-sm text-[#526058]">
            Verifique se o item existe no supermercado ou mercadinho escolhido e veja o último preço informado.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_1fr] gap-3 w-full lg:w-auto lg:min-w-[560px]">
          <div>
            <label htmlFor="lookup-store" className="block text-xs font-medium text-[#526058] mb-1">
              Estabelecimento
            </label>
            <select
              id="lookup-store"
              value={selectedStoreId}
              disabled={stores.length === 0}
              onChange={(e) => setSelectedStoreId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D] disabled:opacity-60"
            >
              {stores.length === 0 ? (
                <option value="">Nenhum estabelecimento nesta região</option>
              ) : (
                stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.neighborhood})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="lookup-product" className="block text-xs font-medium text-[#526058] mb-1">
              Produto da cesta
            </label>
            <select
              id="lookup-product"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Live verification readout */}
      <div
        data-testid="store-stock-check-result"
        className="mt-4 pt-4 border-t border-[#E2E7E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        {result.existsInStore && result.latestEntry && result.store && result.product ? (
          <>
            <div className="flex items-start sm:items-center gap-3">
              {result.inStock ? (
                <CheckCircle2 className="w-5 h-5 text-[#15803D] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              ) : (
                <XCircle className="w-5 h-5 text-[#B91C1C] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
              )}
              <div>
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-[#111815]">
                    {result.inStock ? 'Disponível neste estabelecimento' : 'Indisponível / Em falta no momento'}
                  </span>
                  <span className="text-xs text-[#526058]">
                    {result.store.street} · {result.store.neighborhood}
                  </span>
                </div>
                <p className="text-xs text-[#526058] mt-0.5 flex flex-wrap items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 inline" aria-hidden="true" />
                  <span>
                    Atualizado {formatRelativeTime(result.latestEntry.createdAtMs)} por {result.latestEntry.reporterName}
                  </span>
                  {result.latestEntry.isPromo && result.latestEntry.promoLabel && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#B45309] font-medium">{result.latestEntry.promoLabel}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-4 shrink-0">
              <div className="text-left sm:text-right">
                <div className="font-mono text-xl font-bold text-[#111815] tabular-nums">
                  {formatBRL(result.latestEntry.price)}
                </div>
                {result.regionalLowestPrice !== null && result.diffFromLowestPct !== null && (
                  <div className="text-xs tabular-nums">
                    {result.diffFromLowestPct <= 0.1 ? (
                      <span className="text-[#15803D] font-medium">Menor preço da região</span>
                    ) : (
                      <span className="text-[#526058]">
                        +{result.diffFromLowestPct}% acima do menor ({formatBRL(result.regionalLowestPrice)})
                      </span>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => onQuickUpdatePrice(selectedProductId, selectedStoreId)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Atualizar preço</span>
              </button>
            </div>
          </>
        ) : stores.length === 0 ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2.5 text-sm text-[#526058]">
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Nenhum estabelecimento cadastrado na cidade e bairro selecionados. Cadastre um mercado pelo botão{' '}
                <strong className="text-[#111815]">Informar Preço</strong> para começar a consultar estoques locais.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onQuickUpdatePrice(selectedProductId, '')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Cadastrar estabelecimento e preço
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2.5 text-sm text-[#526058]">
              <Search className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>
                Ainda não há registro de <strong className="text-[#111815]">{result.product?.name}</strong> em{' '}
                <strong className="text-[#111815]">{result.store?.name}</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onQuickUpdatePrice(selectedProductId, selectedStoreId)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Informar preço agora
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
