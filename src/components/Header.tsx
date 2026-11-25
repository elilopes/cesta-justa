import React from 'react';
import { Plus } from 'lucide-react';

export type ActiveTab = 'comparar' | 'lista_mapa' | 'economia' | 'alertas';

interface HeaderProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onOpenSubmitPrice: () => void;
  unreadAlertsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenSubmitPrice,
  unreadAlertsCount,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'comparar', label: 'Comparar' },
    { id: 'lista_mapa', label: 'Lista & Mapa' },
    { id: 'economia', label: 'Economia' },
    {
      id: 'alertas',
      label: unreadAlertsCount > 0 ? `Alertas (${unreadAlertsCount})` : 'Alertas',
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#E2E7E4]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Title (single text element, one line) */}
        <a
          href="#comparar"
          onClick={(e) => {
            e.preventDefault();
            onSelectTab('comparar');
          }}
          className="font-display text-lg sm:text-xl font-bold tracking-tight text-[#111815] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded"
        >
          Cesta Justa
        </a>

        {/* Zone 2: 4 concise single-line nav links */}
        <nav aria-label="Navegação principal" className="hidden md:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-2 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#15803D] rounded ${
                  isActive
                    ? 'text-[#15803D] font-semibold'
                    : 'text-[#526058] hover:text-[#111815]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#15803D]"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenSubmitPrice}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15803D] cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Registrar Preço</span>
          </button>
        </div>
      </div>

      {/* Compact mobile navigation row */}
      <nav
        aria-label="Navegação móvel"
        className="md:hidden flex items-center justify-around border-t border-[#E2E7E4] px-2 bg-white"
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-2.5 px-2 text-xs font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                isActive
                  ? 'border-[#15803D] text-[#15803D] font-semibold'
                  : 'border-transparent text-[#526058]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
