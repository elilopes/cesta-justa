import React, { useEffect, useMemo, useState } from 'react';
import { Check, MapPin, X } from 'lucide-react';
import type { RegionConfig, Store } from '../types/market';
import { filterStoresByRegion, normalizeText } from '../utils/pricing';

interface RegionConfigModalProps {
  isOpen: boolean;
  currentRegion: RegionConfig;
  stores: Store[];
  onSaveRegion: (nextRegion: RegionConfig) => void;
  onClose: () => void;
}

export const RegionConfigModal: React.FC<RegionConfigModalProps> = ({
  isOpen,
  currentRegion,
  stores,
  onSaveRegion,
  onClose,
}) => {
  const cities = useMemo(() => {
    const unique = Array.from(new Set(stores.map((s) => s.city.trim()).filter(Boolean)));
    unique.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return unique;
  }, [stores]);

  const [selectedCityOption, setSelectedCityOption] = useState<string>(currentRegion.city);
  const [customCity, setCustomCity] = useState<string>('');
  const [selectedNeighborhoodOption, setSelectedNeighborhoodOption] = useState<string>(
    currentRegion.neighborhood
  );
  const [customNeighborhood, setCustomNeighborhood] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    const cityExists = cities.some((c) => normalizeText(c) === normalizeText(currentRegion.city));
    if (cityExists || !currentRegion.city) {
      const matched =
        cities.find((c) => normalizeText(c) === normalizeText(currentRegion.city)) ||
        cities[0] ||
        '';
      setSelectedCityOption(matched);
      setCustomCity('');
    } else {
      setSelectedCityOption('__custom__');
      setCustomCity(currentRegion.city);
    }

    const activeCity = cityExists ? currentRegion.city : '';
    const cityStores = stores.filter(
      (s) => normalizeText(s.city) === normalizeText(activeCity)
    );
    const cityNeighborhoods = Array.from(new Set(cityStores.map((s) => s.neighborhood.trim())));

    if (!currentRegion.neighborhood) {
      setSelectedNeighborhoodOption('');
      setCustomNeighborhood('');
    } else {
      const matchedNb = cityNeighborhoods.find(
        (n) => normalizeText(n) === normalizeText(currentRegion.neighborhood)
      );
      if (matchedNb) {
        setSelectedNeighborhoodOption(matchedNb);
        setCustomNeighborhood('');
      } else {
        setSelectedNeighborhoodOption('__custom__');
        setCustomNeighborhood(currentRegion.neighborhood);
      }
    }
  }, [isOpen, currentRegion, cities, stores]);

  const effectiveCity =
    selectedCityOption === '__custom__' ? customCity.trim() : selectedCityOption.trim();

  const neighborhoodsForCity = useMemo(() => {
    const list = Array.from(
      new Set(
        stores
          .filter((s) => normalizeText(s.city) === normalizeText(effectiveCity))
          .map((s) => s.neighborhood.trim())
          .filter(Boolean)
      )
    );
    list.sort((a, b) => a.localeCompare(b, 'pt-BR'));
    return list;
  }, [stores, effectiveCity]);

  const effectiveNeighborhood =
    selectedNeighborhoodOption === '__custom__'
      ? customNeighborhood.trim()
      : selectedNeighborhoodOption.trim();

  const matchingStoresCount = useMemo(
    () =>
      filterStoresByRegion(stores, {
        city: effectiveCity,
        neighborhood: effectiveNeighborhood,
      }).length,
    [stores, effectiveCity, effectiveNeighborhood]
  );

  if (!isOpen) return null;

  const handleCitySelectChange = (val: string) => {
    setSelectedCityOption(val);
    setErrorMsg('');
    if (val === '__custom__') {
      setSelectedNeighborhoodOption('__custom__');
      return;
    }
    const nextNeighborhoods = Array.from(
      new Set(
        stores
          .filter((s) => normalizeText(s.city) === normalizeText(val))
          .map((s) => s.neighborhood.trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'pt-BR'));

    setSelectedNeighborhoodOption(nextNeighborhoods[0] || '');
    setCustomNeighborhood('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (effectiveCity.length < 2) {
      setErrorMsg('Informe ou selecione uma cidade válida.');
      return;
    }
    if (selectedNeighborhoodOption === '__custom__' && effectiveNeighborhood.length < 2) {
      setErrorMsg('Digite o nome do bairro ou escolha uma opção da lista.');
      return;
    }
    onSaveRegion({
      city: effectiveCity.slice(0, 80),
      neighborhood: effectiveNeighborhood.slice(0, 80),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-config-title"
    >
      <div className="bg-white border border-[#E2E7E4] rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#15803D]" aria-hidden="true" />
            <h2 id="region-config-title" className="font-display text-base font-bold text-[#111815]">
              Configurar Cidade e Bairro
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar configuração de cidade e bairro"
            className="p-1.5 text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-[#526058] leading-relaxed">
            Defina sua cidade e bairro padrão. Sempre que você abrir o aplicativo, os produtos, preços, ofertas e estabelecimentos serão exibidos para essa região.
          </p>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]"
            >
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="config-city-select" className="block text-xs font-medium text-[#526058] mb-1">
              Cidade
            </label>
            <select
              id="config-city-select"
              value={selectedCityOption}
              onChange={(e) => handleCitySelectChange(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
            >
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__custom__">Outra cidade...</option>
            </select>
            {selectedCityOption === '__custom__' && (
              <input
                id="config-custom-city"
                type="text"
                maxLength={80}
                placeholder="Digite o nome da cidade (ex: Curitiba)"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="mt-2 w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="config-neighborhood-select"
              className="block text-xs font-medium text-[#526058] mb-1"
            >
              Bairro
            </label>
            <select
              id="config-neighborhood-select"
              value={selectedNeighborhoodOption}
              onChange={(e) => {
                setSelectedNeighborhoodOption(e.target.value);
                setErrorMsg('');
              }}
              className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
            >
              {neighborhoodsForCity.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
              <option value="">Todos os bairros da cidade</option>
              <option value="__custom__">Outro bairro...</option>
            </select>
            {selectedNeighborhoodOption === '__custom__' && (
              <input
                id="config-custom-neighborhood"
                type="text"
                maxLength={80}
                placeholder="Digite o nome do bairro (ex: Moema)"
                value={customNeighborhood}
                onChange={(e) => setCustomNeighborhood(e.target.value)}
                className="mt-2 w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815] focus:outline-none focus:border-[#15803D]"
              />
            )}
          </div>

          <div className="p-3 rounded-xl bg-[#F7F8F7] border border-[#E2E7E4] text-xs text-[#526058] tabular-nums">
            <strong className="text-[#111815]">
              {matchingStoresCount}{' '}
              {matchingStoresCount === 1 ? 'estabelecimento' : 'estabelecimentos'}
            </strong>{' '}
            {effectiveNeighborhood
              ? `em ${effectiveNeighborhood}, ${effectiveCity || '—'}`
              : `em toda a cidade de ${effectiveCity || '—'}`}
            .
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#526058] hover:text-[#111815] rounded-lg cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Salvar e aplicar região</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
