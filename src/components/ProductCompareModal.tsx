import React, { useEffect, useState } from 'react';
import { Bell, Heart, MapPin, Plus, ShoppingCart, X } from 'lucide-react';
import type { FavoriteAlert, ProductCategory, ProductComparison } from '../types/market';
import { formatBRL, formatRelativeTime } from '../utils/pricing';
import { PriceVariationChart } from './PriceCharts';

const CATEGORY_LABEL_MAP: Record<ProductCategory, string> = {
  grãos: 'Grãos',
  laticínios: 'Laticínios',
  carnes: 'Carnes',
  hortifruti: 'Hortifruti',
  padaria: 'Padaria',
  limpeza: 'Limpeza',
  óleo_açúcar: 'Óleo e Açúcar',
  bebidas: 'Bebidas',
};

interface ProductCompareModalProps {
  comparison: ProductComparison | null;
  favorite: FavoriteAlert | null;
  onClose: () => void;
  onAddToShoppingList: (productId: string) => void;
  onSaveFavorite: (
    productId: string,
    desiredMaxPrice: number,
    notifyOnPromo: boolean,
    notifyOnLowest: boolean
  ) => void;
  onRemoveFavorite: (productId: string) => void;
  onLocateStoreOnMap: (storeId: string) => void;
  onRegisterPriceForProduct: (productId: string) => void;
}

export const ProductCompareModal: React.FC<ProductCompareModalProps> = ({
  comparison,
  favorite,
  onClose,
  onAddToShoppingList,
  onSaveFavorite,
  onRemoveFavorite,
  onLocateStoreOnMap,
  onRegisterPriceForProduct,
}) => {
  const [targetPriceInput, setTargetPriceInput] = useState<string>(() =>
    favorite
      ? String(favorite.desiredMaxPrice)
      : comparison?.lowestQuote
        ? (comparison.lowestQuote.entry.price * 0.95).toFixed(2)
        : '10.00'
  );
  const [notifyPromo, setNotifyPromo] = useState<boolean>(favorite?.notifyOnPromo ?? true);
  const [notifyLowest, setNotifyLowest] = useState<boolean>(favorite?.notifyOnLowest ?? true);
  const [alertSavedMsg, setAlertSavedMsg] = useState<string>('');

  const productId = comparison?.product.id ?? null;
  const lowestPriceValue = comparison?.lowestQuote?.entry.price ?? null;

  useEffect(() => {
    if (!productId) return;
    if (favorite) {
      setTargetPriceInput(String(favorite.desiredMaxPrice));
      setNotifyPromo(favorite.notifyOnPromo);
      setNotifyLowest(favorite.notifyOnLowest);
    } else {
      setTargetPriceInput(
        lowestPriceValue !== null ? (lowestPriceValue * 0.95).toFixed(2) : '10.00'
      );
      setNotifyPromo(true);
      setNotifyLowest(true);
    }
    setAlertSavedMsg('');
  }, [productId, favorite, lowestPriceValue]);

  if (!comparison) return null;

  const { product, lowestQuote, allQuotes, averagePrice, savingsPotential, weeklySeries, monthlySeries } =
    comparison;

  const handleSaveAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(targetPriceInput.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10000) return;
    onSaveFavorite(product.id, Number(parsed.toFixed(2)), notifyPromo, notifyLowest);
    setAlertSavedMsg('Alerta salvo para este produto.');
    setTimeout(() => setAlertSavedMsg(''), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
    >
      <div className="bg-[#F7F8F7] border border-[#E2E7E4] rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-[#E2E7E4] px-5 py-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs text-[#526058]">
              {CATEGORY_LABEL_MAP[product.category] || product.category} · {product.unit} · {product.brand}
            </p>
            <h2 id="compare-modal-title" className="font-display text-lg sm:text-xl font-bold text-[#111815] mt-0.5">
              {product.name} — Comparativo em tempo real
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar comparativo"
            className="p-2 text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Summary strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
              <span className="text-xs text-[#526058]">Menor preço encontrado</span>
              <div className="font-mono text-2xl font-bold text-[#15803D] tabular-nums mt-1">
                {lowestQuote ? formatBRL(lowestQuote.entry.price) : '—'}
              </div>
              <p className="text-xs text-[#111815] font-medium mt-1 truncate">
                {lowestQuote ? `${lowestQuote.store.name} (${lowestQuote.store.neighborhood})` : 'Sem estoque'}
              </p>
            </div>

            <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
              <span className="text-xs text-[#526058]">Preço médio na região</span>
              <div className="font-mono text-2xl font-bold text-[#111815] tabular-nums mt-1">
                {averagePrice > 0 ? formatBRL(averagePrice) : '—'}
              </div>
              <p className="text-xs text-[#526058] mt-1 tabular-nums">
                Baseado em {allQuotes.length} {allQuotes.length === 1 ? 'estabelecimento' : 'estabelecimentos'}
              </p>
            </div>

            <div className="bg-white border border-[#E2E7E4] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs text-[#526058]">Economia máxima por unidade</span>
                <div className="font-mono text-2xl font-bold text-[#111815] tabular-nums mt-1">
                  {formatBRL(savingsPotential)}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => onAddToShoppingList(product.id)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Adicionar à lista</span>
                </button>
                <button
                  type="button"
                  onClick={() => onRegisterPriceForProduct(product.id)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Novo preço</span>
                </button>
              </div>
            </div>
          </div>

          {/* All supermarkets and mercadinhos table */}
          <div className="bg-white border border-[#E2E7E4] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E7E4] flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold text-[#111815]">
                Preços em outros supermercados e mercadinhos ({allQuotes.length})
              </h3>
              <span className="text-xs text-[#526058]">Ordenado do menor para o maior</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#E2E7E4] text-xs text-[#526058] bg-[#F7F8F7]">
                    <th className="py-2.5 px-4 font-medium">Estabelecimento</th>
                    <th className="py-2.5 px-4 font-medium">Endereço</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Preço</th>
                    <th className="py-2.5 px-4 font-medium text-right">Diferença</th>
                    <th className="py-2.5 px-4 font-medium text-right">Localização</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E7E4] text-sm">
                  {allQuotes.map((q) => (
                    <tr key={q.entry.id} className="hover:bg-[#F7F8F7]/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#111815]">{q.store.name}</div>
                        <div className="text-xs text-[#526058]">
                          {q.store.type} · por {q.entry.reporterName} · {formatRelativeTime(q.entry.createdAtMs)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-[#526058]">
                        <div>{q.store.street}</div>
                        <div>{q.store.neighborhood}</div>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {!q.entry.inStock ? (
                          <span className="text-[#B91C1C] font-medium">Em falta</span>
                        ) : q.isLowest ? (
                          <span className="text-[#15803D] font-semibold">
                            Menor preço{q.entry.isPromo ? ` · ${q.entry.promoLabel || 'Promoção'}` : ''}
                          </span>
                        ) : q.entry.isPromo ? (
                          <span className="text-[#B45309] font-medium">
                            {q.entry.promoLabel || 'Em promoção'}
                          </span>
                        ) : (
                          <span className="text-[#526058]">Disponível</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#111815]">
                        {formatBRL(q.entry.price)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums">
                        {q.isLowest ? (
                          <span className="text-[#15803D] font-semibold">Melhor</span>
                        ) : (
                          <span className="text-[#526058]">+{q.diffFromLowestPct}%</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => onLocateStoreOnMap(q.store.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#15803D] hover:bg-[#15803D]/10 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Ver no mapa</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weekly & Monthly Variation Charts */}
          <PriceVariationChart
            weeklySeries={weeklySeries}
            monthlySeries={monthlySeries}
            productName={product.name}
          />

          {/* Favorite & Price Alert Config */}
          <form
            onSubmit={handleSaveAlert}
            className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                <h3 className="font-display text-sm font-semibold text-[#111815]">
                  Favoritar e configurar alerta de menor preço
                </h3>
              </div>
              {favorite && (
                <button
                  type="button"
                  onClick={() => onRemoveFavorite(product.id)}
                  className="text-xs font-medium text-[#B91C1C] hover:underline cursor-pointer"
                >
                  Remover dos favoritos
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label htmlFor="desired-max-price" className="block text-xs font-medium text-[#526058] mb-1">
                  Preço desejado (R$)
                </label>
                <input
                  id="desired-max-price"
                  type="text"
                  inputMode="decimal"
                  value={targetPriceInput}
                  onChange={(e) => setTargetPriceInput(e.target.value)}
                  className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
                />
              </div>

              <div className="space-y-1.5 text-xs text-[#111815]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyPromo}
                    onChange={(e) => setNotifyPromo(e.target.checked)}
                    className="accent-[#15803D] w-4 h-4"
                  />
                  <span>Notificar promoções deste item</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifyLowest}
                    onChange={(e) => setNotifyLowest(e.target.checked)}
                    className="accent-[#15803D] w-4 h-4"
                  />
                  <span>Notificar menor preço nos favoritos</span>
                </label>
              </div>

              <button
                type="submit"
                className="h-10 px-4 inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                <Heart className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{favorite ? 'Atualizar alerta' : 'Salvar nos favoritos'}</span>
              </button>
            </div>
            {alertSavedMsg && (
              <p className="text-xs font-medium text-[#15803D]">{alertSavedMsg}</p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
