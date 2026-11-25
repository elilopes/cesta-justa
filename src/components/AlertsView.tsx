import React, { useState } from 'react';
import { Bell, Heart, Tag, TrendingDown, Trash2 } from 'lucide-react';
import type {
  FavoriteAlert,
  NotificationKind,
  PriceNotification,
  Product,
} from '../types/market';
import { formatBRL, formatRelativeTime } from '../utils/pricing';

interface AlertsViewProps {
  notifications: PriceNotification[];
  readNotificationIds: string[];
  favorites: FavoriteAlert[];
  products: Product[];
  onMarkAllRead: () => void;
  onOpenProductCompare: (productId: string) => void;
  onSaveFavorite: (
    productId: string,
    desiredMaxPrice: number,
    notifyOnPromo: boolean,
    notifyOnLowest: boolean
  ) => void;
  onRemoveFavorite: (productId: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  notifications,
  readNotificationIds,
  favorites,
  products,
  onMarkAllRead,
  onOpenProductCompare,
  onSaveFavorite,
  onRemoveFavorite,
}) => {
  const [filterKind, setFilterKind] = useState<'all' | NotificationKind>('all');
  const [newFavProductId, setNewFavProductId] = useState(products[0]?.id || '');
  const [newFavTargetPrice, setNewFavTargetPrice] = useState('25.00');

  const filtered =
    filterKind === 'all'
      ? notifications
      : notifications.filter((n) => n.kind === filterKind);

  const handleAddDesiredProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(newFavTargetPrice.replace(',', '.'));
    if (!newFavProductId || !Number.isFinite(parsed) || parsed <= 0 || parsed > 10000) return;
    onSaveFavorite(newFavProductId, Number(parsed.toFixed(2)), true, true);
  };

  const kindLabel = (kind: NotificationKind) => {
    if (kind === 'promo') return 'Promoção';
    if (kind === 'target_price') return 'Menor preço desejado';
    return 'Favorito em baixa';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left: Notifications Feed */}
      <section
        aria-labelledby="alerts-feed-heading"
        className="lg:col-span-7 bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id="alerts-feed-heading" className="font-display text-lg font-bold text-[#111815]">
              Central de Notificações
            </h2>
            <p className="text-xs text-[#526058]">
              Promoções ativas, metas de preço desejado e menores preços da sua lista de favoritos.
            </p>
          </div>

          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-medium text-[#15803D] hover:underline cursor-pointer"
          >
            Marcar todas como lidas
          </button>
        </div>

        {/* Filter segmented control */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F2F4F3] rounded-lg">
          {[
            { id: 'all', label: 'Todas' },
            { id: 'promo', label: 'Promoções' },
            { id: 'target_price', label: 'Preço Desejado' },
            { id: 'favorite_lowest', label: 'Menor nos Favoritos' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterKind(tab.id as 'all' | NotificationKind)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterKind === tab.id
                  ? 'bg-white text-[#111815] shadow-xs'
                  : 'text-[#526058] hover:text-[#111815]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#526058] border border-dashed border-[#D4DBD7] rounded-lg">
            Nenhuma notificação nesta categoria no momento.
          </div>
        ) : (
          <ul className="divide-y divide-[#E2E7E4]" data-testid="notifications-list">
            {filtered.map((n) => {
              const isRead = readNotificationIds.includes(n.id);
              return (
                <li
                  key={n.id}
                  className={`py-3.5 flex items-start justify-between gap-4 ${
                    isRead ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-[#15803D] shrink-0">
                      {n.kind === 'promo' ? (
                        <Tag className="w-4 h-4 text-[#B45309]" aria-hidden="true" />
                      ) : n.kind === 'target_price' ? (
                        <Bell className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-x-2 text-xs text-[#526058]">
                        <span
                          className={`font-semibold ${
                            n.kind === 'promo' ? 'text-[#B45309]' : 'text-[#15803D]'
                          }`}
                        >
                          {kindLabel(n.kind)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeTime(n.createdAtMs)}</span>
                        {!isRead && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#111815] font-semibold">Nova</span>
                          </>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-[#111815]">{n.title}</p>
                      <p className="text-xs text-[#526058]">{n.message}</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProductCompare(n.productId)}
                    className="px-3 py-1.5 text-xs font-medium text-[#15803D] bg-[#15803D]/10 hover:bg-[#15803D]/15 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Ver oferta
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Right: Favorites & Desired Target Price Alerts Manager */}
      <section
        aria-labelledby="favorites-manager-heading"
        className="lg:col-span-5 bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div>
          <h2 id="favorites-manager-heading" className="font-display text-base font-bold text-[#111815] flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            <span>Favoritos e Preço Desejado</span>
          </h2>
          <p className="text-xs text-[#526058] mt-0.5">
            Defina o preço desejado de um produto para receber alertas imediatos quando cair.
          </p>
        </div>

        <form onSubmit={handleAddDesiredProduct} className="space-y-3 p-3.5 bg-[#F7F8F7] rounded-xl border border-[#E2E7E4]">
          <div>
            <label htmlFor="fav-product-select" className="block text-xs font-medium text-[#526058] mb-1">
              Produto desejado
            </label>
            <select
              id="fav-product-select"
              value={newFavProductId}
              onChange={(e) => {
                setNewFavProductId(e.target.value);
                const prod = products.find((p) => p.id === e.target.value);
                if (prod) {
                  setNewFavTargetPrice((prod.referencePrice * 0.9).toFixed(2));
                }
              }}
              className="w-full h-10 px-3 text-sm bg-white border border-[#D4DBD7] rounded-lg text-[#111815]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor="fav-target-input" className="block text-xs font-medium text-[#526058] mb-1">
                Avisar quando chegar a (R$)
              </label>
              <input
                id="fav-target-input"
                type="text"
                inputMode="decimal"
                value={newFavTargetPrice}
                onChange={(e) => setNewFavTargetPrice(e.target.value)}
                className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-white border border-[#D4DBD7] rounded-lg text-[#111815]"
              />
            </div>
            <button
              type="submit"
              className="h-10 px-4 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg whitespace-nowrap cursor-pointer"
            >
              Monitorar
            </button>
          </div>
        </form>

        <ul className="divide-y divide-[#E2E7E4]">
          {favorites.map((fav) => {
            const prod = products.find((p) => p.id === fav.productId);
            if (!prod) return null;
            return (
              <li key={fav.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onOpenProductCompare(prod.id)}
                    className="text-sm font-semibold text-[#111815] hover:text-[#15803D] text-left truncate block cursor-pointer"
                  >
                    {prod.name}
                  </button>
                  <p className="text-xs text-[#526058] font-mono tabular-nums">
                    Meta: {formatBRL(fav.desiredMaxPrice)} ·{' '}
                    {fav.notifyOnPromo ? 'Promoções' : ''} {fav.notifyOnLowest ? '· Menor preço' : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onRemoveFavorite(prod.id)}
                  aria-label={`Remover alerta de ${prod.name}`}
                  className="p-2 text-[#526058] hover:text-[#B91C1C] hover:bg-[#FEF2F2] rounded-lg cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
