import React from 'react';
import { ArrowUpRight, Flame, ShoppingCart, X } from 'lucide-react';
import type { Product, PriceEntry, Store } from '../types/market';
import { formatBRL, getProductComparison } from '../utils/pricing';

interface MostSearchedModalProps {
  isOpen: boolean;
  products: Product[];
  stores: Store[];
  entries: PriceEntry[];
  onClose: () => void;
  onOpenProductCompare: (productId: string) => void;
  onAddToShoppingList: (productId: string) => void;
}

export const MostSearchedModal: React.FC<MostSearchedModalProps> = ({
  isOpen,
  products,
  stores,
  entries,
  onClose,
  onOpenProductCompare,
  onAddToShoppingList,
}) => {
  if (!isOpen) return null;

  // Compute rankings based on search/quote popularity simulation combined with essential status
  const rankedProducts = products.map((product) => {
    const comp = getProductComparison(product, stores, entries);
    const quoteCount = comp.allQuotes.length;
    // Simulated search volume score: base score + quote activity
    const searchScore = 1200 + (product.isEssentialBasket ? 450 : 200) + quoteCount * 85 + (product.id.length * 17) % 300;
    return {
      product,
      comp,
      searchScore,
      quoteCount,
    };
  }).sort((a, b) => b.searchScore - a.searchScore);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="most-searched-title"
    >
      <div className="bg-white border border-[#E2E7E4] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-[#E2E7E4] px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] flex items-center justify-center text-[#D97706]">
              <Flame className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="most-searched-title" className="font-display text-lg font-bold text-[#111815]">
                Produtos Mais Pesquisados na Região
              </h2>
              <p className="text-xs text-[#526058]">
                Itens da cesta básica com maior volume de consultas e atualizações da comunidade.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-2 text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {rankedProducts.map(({ product, comp, searchScore }, index) => {
            const lowest = comp.lowestQuote;
            const rank = index + 1;
            const rankBadgeColor =
              rank === 1
                ? 'bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]'
                : rank === 2
                  ? 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]'
                  : rank === 3
                    ? 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]'
                    : 'bg-[#F7F8F7] text-[#526058] border-[#E2E7E4]';

            return (
              <div
                key={product.id}
                className="bg-[#F7F8F7] border border-[#E2E7E4] hover:border-[#D4DBD7] rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-lg border font-mono text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${rankBadgeColor}`}
                  >
                    #{rank}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-sm font-semibold text-[#111815] truncate">
                        {product.name}
                      </h3>
                      <span className="text-[11px] text-[#526058] bg-white px-2 py-0.5 rounded border border-[#E2E7E4]">
                        {product.unit} · {product.brand}
                      </span>
                    </div>
                    <p className="text-xs text-[#526058] mt-0.5 flex items-center gap-2">
                      <span>🔥 {searchScore.toLocaleString('pt-BR')} buscas recentes</span>
                      <span>·</span>
                      <span>Média regional: <strong className="text-[#111815]">{comp.averagePrice > 0 ? formatBRL(comp.averagePrice) : '—'}</strong></span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#E2E7E4]">
                  <div className="text-left sm:text-right">
                    <div className="font-mono text-sm font-bold text-[#15803D] tabular-nums">
                      {lowest ? formatBRL(lowest.entry.price) : 'Sem preço'}
                    </div>
                    <div className="text-[11px] text-[#526058] truncate max-w-[140px]">
                      {lowest ? lowest.store.name : '—'}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onAddToShoppingList(product.id);
                      }}
                      title="Adicionar à lista de compras"
                      className="p-2 text-[#526058] hover:text-[#15803D] bg-white border border-[#E2E7E4] hover:border-[#15803D] rounded-lg transition-colors cursor-pointer"
                    >
                      <ShoppingCart className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenProductCompare(product.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-[#111815] bg-white border border-[#E2E7E4] hover:bg-[#F2F4F3] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <span>Comparar</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
