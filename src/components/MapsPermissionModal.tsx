import React from 'react';
import { MapPin, ShieldCheck, X } from 'lucide-react';

interface MapsPermissionModalProps {
  isOpen: boolean;
  onAllowGoogleMaps: () => void;
  onUseOfflineMap: () => void;
  onCancel: () => void;
}

export const MapsPermissionModal: React.FC<MapsPermissionModalProps> = ({
  isOpen,
  onAllowGoogleMaps,
  onUseOfflineMap,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="maps-permission-title"
    >
      <div className="bg-white border border-[#E2E7E4] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            <h2 id="maps-permission-title" className="font-display text-base font-bold text-[#111815]">
              Permitir uso do Google Maps Platform?
            </h2>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar solicitação de permissão do mapa"
            className="p-1.5 text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-[#526058] leading-relaxed">
            Para exibir o mapa interativo, ruas da região e localização dos supermercados e mercadinhos, o aplicativo precisa da sua permissão para ativar o <strong className="text-[#111815]">Google Maps Platform</strong>.
          </p>

          <div className="p-3 rounded-xl bg-[#F7F8F7] border border-[#E2E7E4] flex items-start gap-2.5 text-xs text-[#526058]">
            <ShieldCheck className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              Nenhuma chamada ao Google Maps Platform é realizada antes da sua autorização. Você também pode usar a visualização local sem mapa externo.
            </span>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <button
              type="button"
              onClick={onAllowGoogleMaps}
              className="w-full h-10 px-4 text-xs sm:text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
            >
              Permitir e Abrir Google Maps
            </button>
            <button
              type="button"
              onClick={onUseOfflineMap}
              className="w-full h-10 px-4 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg transition-colors cursor-pointer"
            >
              Continuar com mapa local (sem Google Maps)
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2 text-xs font-medium text-[#526058] hover:text-[#111815] cursor-pointer"
            >
              Agora não
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
