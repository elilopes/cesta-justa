import React, { useCallback, useEffect, useState } from 'react';
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useApiLoadingStatus,
  APILoadingStatus,
} from '@vis.gl/react-google-maps';
import { ExternalLink, MapPin, Navigation } from 'lucide-react';
import type { Store, StoreListMatch } from '../types/market';
import { formatBRL } from '../utils/pricing';

export type MapsConsentStatus = 'prompt' | 'granted' | 'offline';

interface StoreMapProps {
  stores: Store[];
  matchesByStoreId?: Record<string, StoreListMatch>;
  selectedStoreId: string | null;
  onSelectStore: (storeId: string) => void;
  quotaExceeded: boolean;
  mapsConsent: MapsConsentStatus;
  onGrantMapsConsent: () => void;
  onUseOfflineMap: () => void;
}

type AdvancedMarkerInstance = NonNullable<ReturnType<typeof useAdvancedMarkerRef>[1]>;

interface MarkerWithInfoProps {
  store: Store;
  match?: StoreListMatch;
  isSelected: boolean;
  onSelect: (storeId: string, marker?: AdvancedMarkerInstance) => void;
}

const StoreAdvancedMarker: React.FC<MarkerWithInfoProps> = ({
  store,
  match,
  isSelected,
  onSelect,
}) => {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const hasFullList = match && match.totalRequestedCount > 0 && match.matchedCount === match.totalRequestedCount;

  return (
    <AdvancedMarker
      ref={markerRef}
      position={{ lat: store.lat, lng: store.lng }}
      zIndex={isSelected ? 1000 : hasFullList ? 500 : 100}
      title={`${store.name} — ${store.street}`}
      onClick={() => {
        onSelect(store.id, marker || undefined);
      }}
    >
      <Pin
        background={isSelected ? '#111815' : hasFullList ? '#15803D' : '#D97706'}
        borderColor="#FFFFFF"
        glyphColor="#FFFFFF"
      />
    </AdvancedMarker>
  );
};

const GoogleMapCanvas: React.FC<
  StoreMapProps & { onFallback: () => void }
> = ({
  stores,
  matchesByStoreId = {},
  selectedStoreId,
  onSelectStore,
  onFallback,
}) => {
  const status = useApiLoadingStatus();
  const [tilesLoaded, setTilesLoaded] = useState(false);
  const [anchorMarker, setAnchorMarker] = useState<AdvancedMarkerInstance | null>(null);

  useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
      onFallback();
      return;
    }
    if (!tilesLoaded) {
      const timer = setTimeout(() => {
        onFallback();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [status, tilesLoaded, onFallback]);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || null;
  const centerStore = selectedStore || stores[0];
  const center = centerStore
    ? { lat: centerStore.lat, lng: centerStore.lng }
    : { lat: -23.558, lng: -46.655 };

  const handleMarkerSelect = useCallback(
    (storeId: string, marker?: AdvancedMarkerInstance) => {
      onSelectStore(storeId);
      if (marker) {
        setAnchorMarker(marker);
      }
    },
    [onSelectStore]
  );

  return (
    <div className="relative w-full h-[380px] lg:h-[460px] rounded-xl overflow-hidden border border-[#E2E7E4]">
      {!tilesLoaded && (
        <div className="absolute inset-0 z-10 bg-[#EEF2EF] flex items-center justify-center text-xs text-[#526058]">
          Carregando mapa interativo da região...
        </div>
      )}
      <GoogleMap
        mapId="DEMO_MAP_ID"
        renderingType="RASTER"
        defaultCenter={center}
        center={selectedStore ? { lat: selectedStore.lat, lng: selectedStore.lng } : undefined}
        defaultZoom={13}
        gestureHandling="greedy"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        onTilesLoaded={() => setTilesLoaded(true)}
        style={{ width: '100%', height: '100%' }}
      >
        {stores.map((store) => (
          <StoreAdvancedMarker
            key={store.id}
            store={store}
            match={matchesByStoreId[store.id]}
            isSelected={store.id === selectedStoreId}
            onSelect={handleMarkerSelect}
          />
        ))}

        {selectedStore && anchorMarker && (
          <InfoWindow
            anchor={anchorMarker}
            pixelOffset={[0, -4]}
            onCloseClick={() => setAnchorMarker(null)}
          >
            <div className="p-1 max-w-[230px] text-[#111815] space-y-1">
              <p className="font-semibold text-sm leading-tight">{selectedStore.name}</p>
              <p className="text-xs text-[#526058]">
                {selectedStore.street} · {selectedStore.neighborhood}
              </p>
              <p className="text-xs text-[#526058]">{selectedStore.hours}</p>
              {matchesByStoreId[selectedStore.id] && matchesByStoreId[selectedStore.id].totalRequestedCount > 0 && (
                <p className="text-xs font-medium text-[#15803D] tabular-nums">
                  {matchesByStoreId[selectedStore.id].matchedCount}/
                  {matchesByStoreId[selectedStore.id].totalRequestedCount} itens ·{' '}
                  {formatBRL(matchesByStoreId[selectedStore.id].totalCost)}
                </p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#15803D] underline pt-0.5"
              >
                Abrir rota no Google Maps
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

/**
 * Interactive vector coordinate map used when Google Maps API key is unavailable or quota-limited.
 */
const FallbackInteractiveMap: React.FC<
  Pick<StoreMapProps, 'stores' | 'matchesByStoreId' | 'selectedStoreId' | 'onSelectStore'> & {
    canEnableGoogleMaps?: boolean;
    onEnableGoogleMaps?: () => void;
  }
> = ({
  stores,
  matchesByStoreId = {},
  selectedStoreId,
  onSelectStore,
  canEnableGoogleMaps = false,
  onEnableGoogleMaps,
}) => {
  const lats = stores.map((s) => s.lat);
  const lngs = stores.map((s) => s.lng);
  const minLat = Math.min(...lats, -23.59);
  const maxLat = Math.max(...lats, -23.54);
  const minLng = Math.min(...lngs, -46.69);
  const maxLng = Math.max(...lngs, -46.63);
  const latSpan = Math.max(0.015, maxLat - minLat);
  const lngSpan = Math.max(0.015, maxLng - minLng);

  const selectedStore = stores.find((s) => s.id === selectedStoreId) || stores[0] || null;

  return (
    <div
      data-testid="interactive-neighborhood-map"
      className="relative w-full h-[380px] lg:h-[460px] rounded-xl overflow-hidden border border-[#E2E7E4] bg-[#EEF2EF]"
    >
      {canEnableGoogleMaps && onEnableGoogleMaps && (
        <button
          type="button"
          onClick={onEnableGoogleMaps}
          className="absolute top-3 right-3 z-30 px-2.5 py-1.5 text-xs font-medium text-[#111815] bg-white/95 hover:bg-white border border-[#D4DBD7] rounded-lg shadow-xs cursor-pointer"
        >
          Ativar Google Maps
        </button>
      )}
      {/* Subtle neighborhood street grid SVG backdrop */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 800 460"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <pattern id="streetGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#DCE4DF" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="800" height="460" fill="url(#streetGrid)" />
        <path d="M 0 190 Q 320 210 800 140" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M 180 0 Q 250 230 340 460" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        <path d="M 540 0 L 480 460" fill="none" stroke="#FFFFFF" strokeWidth="6" />
        <path d="M 0 330 L 800 290" fill="none" stroke="#FFFFFF" strokeWidth="6" />
      </svg>

      {/* Store pins positioned proportionally by lat/lng */}
      {stores.map((store) => {
        const xPct = 10 + ((store.lng - minLng) / lngSpan) * 80;
        const yPct = 14 + ((maxLat - store.lat) / latSpan) * 66;
        const isSelected = store.id === selectedStore?.id;
        const match = matchesByStoreId[store.id];
        const hasFullList =
          match && match.totalRequestedCount > 0 && match.matchedCount === match.totalRequestedCount;

        return (
          <button
            key={store.id}
            type="button"
            onClick={() => onSelectStore(store.id)}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            aria-label={`Selecionar ${store.name} em ${store.neighborhood}`}
            className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-transform cursor-pointer focus-visible:outline-2 focus-visible:outline-[#15803D] ${
              isSelected
                ? 'bg-[#111815] text-white border-[#111815] z-20 scale-105 shadow-md'
                : hasFullList
                  ? 'bg-[#15803D] text-white border-[#14532D] z-10 hover:scale-105'
                  : 'bg-white text-[#111815] border-[#C9D2CC] hover:border-[#15803D]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="whitespace-nowrap max-w-[130px] truncate">{store.name}</span>
            {match && match.totalRequestedCount > 0 && (
              <span className="font-mono tabular-nums opacity-90">
                · {formatBRL(match.totalCost)}
              </span>
            )}
          </button>
        );
      })}

      {/* Selected store info card anchored at bottom-left */}
      {selectedStore && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-white/95 backdrop-blur-xs border border-[#E2E7E4] rounded-lg p-3.5 shadow-sm z-30">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-display text-sm font-semibold text-[#111815]">
                {selectedStore.name}
              </p>
              <p className="text-xs text-[#526058] mt-0.5">
                {selectedStore.street} · {selectedStore.neighborhood}
              </p>
              <p className="text-xs text-[#526058] mt-0.5">
                Horário: {selectedStore.hours}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedStore.lat},${selectedStore.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#15803D] bg-[#15803D]/10 hover:bg-[#15803D]/15 rounded-md whitespace-nowrap shrink-0"
            >
              <Navigation className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Ver Rota</span>
            </a>
          </div>
          {matchesByStoreId[selectedStore.id] && matchesByStoreId[selectedStore.id].totalRequestedCount > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E2E7E4] flex items-center justify-between text-xs tabular-nums">
              <span className="text-[#526058]">
                Itens da lista: {matchesByStoreId[selectedStore.id].matchedCount}/
                {matchesByStoreId[selectedStore.id].totalRequestedCount}
              </span>
              <span className="font-mono font-semibold text-[#15803D]">
                Total: {formatBRL(matchesByStoreId[selectedStore.id].totalCost)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const StoreMap: React.FC<StoreMapProps> = (props) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const [useFallback, setUseFallback] = useState(props.quotaExceeded);

  const handleFallback = useCallback(() => {
    setUseFallback(true);
  }, []);

  useEffect(() => {
    if (props.quotaExceeded) {
      setUseFallback(true);
    }
  }, [props.quotaExceeded]);

  // 1. Explicit permission gate: never load Google Maps Platform until the user consents
  if (props.mapsConsent === 'prompt') {
    return (
      <div
        data-testid="maps-permission-gate"
        className="relative w-full h-[380px] lg:h-[460px] rounded-xl overflow-hidden border border-[#E2E7E4] bg-[#EEF2EF] flex items-center justify-center p-4"
      >
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-75"
          viewBox="0 0 800 460"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <pattern id="gateGrid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#DCE4DF" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="800" height="460" fill="url(#gateGrid)" />
          <path d="M 0 190 Q 320 210 800 140" fill="none" stroke="#FFFFFF" strokeWidth="8" />
          <path d="M 180 0 Q 250 230 340 460" fill="none" stroke="#FFFFFF" strokeWidth="8" />
        </svg>

        <div className="relative z-10 max-w-md w-full bg-white/95 backdrop-blur-xs border border-[#E2E7E4] rounded-2xl p-5 shadow-md text-center space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center mx-auto">
            <MapPin className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display text-base font-bold text-[#111815]">
              Permitir uso do Google Maps Platform
            </h3>
            <p className="text-xs text-[#526058] leading-relaxed">
              {props.stores.length}{' '}
              {props.stores.length === 1 ? 'estabelecimento pronto' : 'estabelecimentos prontos'} para visualização. Autorize abaixo apenas se desejar carregar o mapa interativo do Google Maps Platform.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
            <button
              type="button"
              onClick={props.onGrantMapsConsent}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Permitir e Abrir Google Maps
            </button>
            <button
              type="button"
              onClick={props.onUseOfflineMap}
              className="px-4 py-2.5 text-xs font-medium text-[#111815] bg-[#F2F4F3] hover:bg-[#E5EAE7] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Usar mapa local
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (props.mapsConsent === 'offline' || useFallback || !apiKey) {
    return (
      <FallbackInteractiveMap
        stores={props.stores}
        matchesByStoreId={props.matchesByStoreId}
        selectedStoreId={props.selectedStoreId}
        onSelectStore={props.onSelectStore}
        canEnableGoogleMaps={Boolean(apiKey) && !props.quotaExceeded && !useFallback}
        onEnableGoogleMaps={props.onGrantMapsConsent}
      />
    );
  }

  return (
    <APIProvider
      apiKey={apiKey}
      language="pt-BR"
      region="BR"
      libraries={['marker']}
    >
      <GoogleMapCanvas {...props} onFallback={handleFallback} />
    </APIProvider>
  );
};
