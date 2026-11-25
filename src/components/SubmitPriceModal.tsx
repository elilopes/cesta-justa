import React, { useMemo, useState } from 'react';
import { TrendingUp, X } from 'lucide-react';
import type { PriceEntry, Product, ProductCategory, Store, StoreType } from '../types/market';
import { formatBRL, formatRelativeTime, getLatestEntriesMap } from '../utils/pricing';

interface SubmitPriceModalProps {
  isOpen: boolean;
  products: Product[];
  stores: Store[];
  entries: PriceEntry[];
  initialProductId?: string;
  initialStoreId?: string;
  defaultCity?: string;
  defaultNeighborhood?: string;
  defaultReporterName: string;
  onClose: () => void;
  onSubmitPrice: (payload: {
    productId: string;
    storeId: string;
    price: number;
    isPromo: boolean;
    promoLabel: string;
    inStock: boolean;
    reporterName: string;
  }) => void;
  onCreateStore: (payload: {
    name: string;
    type: StoreType;
    street: string;
    neighborhood: string;
    city: string;
    hours: string;
    lat: number;
    lng: number;
  }) => string;
  onCreateProduct: (payload: {
    name: string;
    category: ProductCategory;
    unit: string;
    brand: string;
    isEssentialBasket: boolean;
    referencePrice: number;
  }) => string;
}

export const SubmitPriceModal: React.FC<SubmitPriceModalProps> = ({
  isOpen,
  products,
  stores,
  entries,
  initialProductId,
  initialStoreId,
  defaultCity = 'São Paulo',
  defaultNeighborhood = '',
  defaultReporterName,
  onClose,
  onSubmitPrice,
  onCreateStore,
  onCreateProduct,
}) => {
  const [mode, setMode] = useState<'price' | 'store' | 'product'>('price');

  // Price form
  const [productId, setProductId] = useState(initialProductId || products[0]?.id || '');
  const [storeId, setStoreId] = useState(initialStoreId || stores[0]?.id || '');
  const [priceStr, setPriceStr] = useState('');
  const [isPromo, setIsPromo] = useState(false);
  const [promoLabel, setPromoLabel] = useState('');
  const [inStock, setInStock] = useState(true);
  const [reporterName, setReporterName] = useState(defaultReporterName || 'Consumidor Local');

  // New store form
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState<StoreType>('mercadinho');
  const [storeStreet, setStoreStreet] = useState('');
  const [storeNeighborhood, setStoreNeighborhood] = useState(defaultNeighborhood);
  const [storeCity, setStoreCity] = useState(defaultCity);
  const [storeHours, setStoreHours] = useState('07:30 – 21:00');

  // New product form
  const [prodName, setProdName] = useState('');
  const [prodCategory, setProdCategory] = useState<ProductCategory>('grãos');
  const [prodUnit, setProdUnit] = useState('1 kg');
  const [prodBrand, setProdBrand] = useState('');
  const [prodRefPrice, setProdRefPrice] = useState('');
  const [prodEssential, setProdEssential] = useState(true);

  const [errorMsg, setErrorMsg] = useState('');

  // Compute previous price in store and regional average when product & store are selected
  const latestMap = useMemo(() => getLatestEntriesMap(entries), [entries]);
  const previousEntry = useMemo(
    () => latestMap[`${productId}::${storeId}`] || null,
    [latestMap, productId, storeId]
  );
  const regionalPrices = useMemo(
    () => entries.filter((e) => e.productId === productId && e.inStock).map((e) => e.price),
    [entries, productId]
  );
  const averageRegionalPrice = useMemo(() => {
    if (regionalPrices.length < 2) return null;
    return regionalPrices.reduce((a, b) => a + b, 0) / regionalPrices.length;
  }, [regionalPrices]);

  if (!isOpen) return null;

  const handlePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const parsed = Number(priceStr.replace(',', '.'));
    if (!productId || !storeId) {
      setErrorMsg('Selecione o produto e o estabelecimento.');
      return;
    }
    if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 10000) {
      setErrorMsg('Informe um preço válido maior que zero (ex: 24,90).');
      return;
    }
    if (!reporterName.trim()) {
      setErrorMsg('Informe seu nome ou apelido para crédito colaborativo.');
      return;
    }

    onSubmitPrice({
      productId,
      storeId,
      price: Number(parsed.toFixed(2)),
      isPromo,
      promoLabel: isPromo ? promoLabel.trim().slice(0, 60) || 'Promoção local' : '',
      inStock,
      reporterName: reporterName.trim().slice(0, 60),
    });
    setPriceStr('');
    setPromoLabel('');
    setIsPromo(false);
    onClose();
  };

  const handleStoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (storeName.trim().length < 2 || storeStreet.trim().length < 3 || storeNeighborhood.trim().length < 2) {
      setErrorMsg('Preencha nome, rua/endereço e bairro corretamente.');
      return;
    }
    // Slight deterministic offset around São Paulo center for newly added stores
    const hash = Array.from(storeName + storeStreet).reduce((a, c) => a + c.charCodeAt(0), 0);
    const lat = Number((-23.545 - ((hash % 40) * 0.001)).toFixed(4));
    const lng = Number((-46.635 - (((hash * 7) % 45) * 0.001)).toFixed(4));

    const createdId = onCreateStore({
      name: storeName.trim().slice(0, 100),
      type: storeType,
      street: storeStreet.trim().slice(0, 120),
      neighborhood: storeNeighborhood.trim().slice(0, 80),
      city: storeCity.trim().slice(0, 80) || 'São Paulo',
      hours: storeHours.trim().slice(0, 60) || '08:00 – 21:00',
      lat,
      lng,
    });
    setStoreId(createdId);
    setStoreName('');
    setStoreStreet('');
    setStoreNeighborhood('');
    setMode('price');
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const parsedRef = Number(prodRefPrice.replace(',', '.'));
    if (prodName.trim().length < 2 || !prodUnit.trim()) {
      setErrorMsg('Informe o nome do produto e a unidade (ex: 1 kg, 500 g).');
      return;
    }
    if (!Number.isFinite(parsedRef) || parsedRef <= 0 || parsedRef > 10000) {
      setErrorMsg('Informe um preço de referência válido.');
      return;
    }

    const createdId = onCreateProduct({
      name: prodName.trim().slice(0, 100),
      category: prodCategory,
      unit: prodUnit.trim().slice(0, 20),
      brand: prodBrand.trim().slice(0, 60) || 'Marca Variada',
      isEssentialBasket: prodEssential,
      referencePrice: Number(parsedRef.toFixed(2)),
    });
    setProductId(createdId);
    setProdName('');
    setProdBrand('');
    setProdRefPrice('');
    setMode('price');
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="submit-price-title"
    >
      <div className="bg-white border border-[#E2E7E4] rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E2E7E4] flex items-center justify-between gap-4">
          <h2 id="submit-price-title" className="font-display text-lg font-bold text-[#111815]">
            Colaborar com a Comunidade
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar formulário"
            className="p-2 text-[#526058] hover:text-[#111815] hover:bg-[#F2F4F3] rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Mode switch */}
        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 bg-[#F2F4F3] rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('price');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'price' ? 'bg-white text-[#111815] shadow-xs' : 'text-[#526058]'
              }`}
            >
              Cadastrar Preço
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('store');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'store' ? 'bg-white text-[#111815] shadow-xs' : 'text-[#526058]'
              }`}
            >
              Novo Mercado
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('product');
                setErrorMsg('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                mode === 'product' ? 'bg-white text-[#111815] shadow-xs' : 'text-[#526058]'
              }`}
            >
              Novo Produto
            </button>
          </div>
        </div>

        <div className="p-5">
          {errorMsg && (
            <div role="alert" className="mb-4 p-3 rounded-lg bg-[#FEF2F2] border border-[#FECACA] text-xs font-medium text-[#B91C1C]">
              {errorMsg}
            </div>
          )}

          {mode === 'price' && (
            <form onSubmit={handlePriceSubmit} className="space-y-4">
              <div>
                <label htmlFor="price-product" className="block text-xs font-medium text-[#526058] mb-1">
                  Produto da cesta básica
                </label>
                <select
                  id="price-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="price-store" className="block text-xs font-medium text-[#526058] mb-1">
                  Supermercado ou Mercadinho
                </label>
                <select
                  id="price-store"
                  value={storeId}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {s.neighborhood}
                    </option>
                  ))}
                </select>
              </div>

              {/* Previous price & regional average info card */}
              {(previousEntry || averageRegionalPrice !== null) && (
                <div className="bg-[#F7F8F7] border border-[#E2E7E4] rounded-xl p-3 space-y-1.5 text-xs">
                  {previousEntry && (
                    <div className="flex items-center justify-between text-[#111815]">
                      <span className="text-[#526058] flex items-center gap-1.5">
                        <span>🏷️</span>
                        <span>Preço anterior neste estabelecimento:</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums">
                        {formatBRL(previousEntry.price)}
                        <span className="text-[11px] font-normal text-[#526058] ml-1">
                          ({formatRelativeTime(previousEntry.createdAtMs)} por {previousEntry.reporterName})
                        </span>
                      </span>
                    </div>
                  )}
                  {averageRegionalPrice !== null && (
                    <div className="flex items-center justify-between text-[#111815]">
                      <span className="text-[#526058] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-[#15803D]" aria-hidden="true" />
                        <span>Preço médio regional ({regionalPrices.length} preços):</span>
                      </span>
                      <span className="font-mono font-bold tabular-nums text-[#15803D]">
                        {formatBRL(averageRegionalPrice)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="price-value" className="block text-xs font-medium text-[#526058] mb-1">
                    Preço encontrado (R$)
                  </label>
                  <input
                    id="price-value"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 23,90"
                    value={priceStr}
                    onChange={(e) => setPriceStr(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="price-reporter" className="block text-xs font-medium text-[#526058] mb-1">
                    Seu nome
                  </label>
                  <input
                    id="price-reporter"
                    type="text"
                    maxLength={60}
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-[#111815]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="accent-[#15803D] w-4 h-4"
                  />
                  <span>Produto disponível em estoque</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPromo}
                    onChange={(e) => setIsPromo(e.target.checked)}
                    className="accent-[#15803D] w-4 h-4"
                  />
                  <span>É uma promoção / oferta</span>
                </label>
              </div>

              {isPromo && (
                <div>
                  <label htmlFor="promo-label" className="block text-xs font-medium text-[#526058] mb-1">
                    Descrição da promoção (opcional)
                  </label>
                  <input
                    id="promo-label"
                    type="text"
                    maxLength={60}
                    placeholder="Ex: Oferta relâmpago de fim de semana"
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#526058] hover:text-[#111815] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                >
                  Publicar Preço em Tempo Real
                </button>
              </div>
            </form>
          )}

          {mode === 'store' && (
            <form onSubmit={handleStoreSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="store-name" className="block text-xs font-medium text-[#526058] mb-1">
                    Nome do estabelecimento
                  </label>
                  <input
                    id="store-name"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Mercadinho Esperança"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="store-type" className="block text-xs font-medium text-[#526058] mb-1">
                    Tipo
                  </label>
                  <select
                    id="store-type"
                    value={storeType}
                    onChange={(e) => setStoreType(e.target.value as StoreType)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  >
                    <option value="mercadinho">Mercadinho</option>
                    <option value="supermercado">Supermercado</option>
                    <option value="atacarejo">Atacarejo</option>
                    <option value="hortifruti">Hortifruti</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="store-street" className="block text-xs font-medium text-[#526058] mb-1">
                  Rua e número
                </label>
                <input
                  id="store-street"
                  type="text"
                  maxLength={120}
                  placeholder="Ex: Rua Frei Caneca, 540"
                  value={storeStreet}
                  onChange={(e) => setStoreStreet(e.target.value)}
                  required
                  className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="store-neighborhood" className="block text-xs font-medium text-[#526058] mb-1">
                    Bairro
                  </label>
                  <input
                    id="store-neighborhood"
                    type="text"
                    maxLength={80}
                    placeholder="Ex: Consolação"
                    value={storeNeighborhood}
                    onChange={(e) => setStoreNeighborhood(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="store-city" className="block text-xs font-medium text-[#526058] mb-1">
                    Cidade
                  </label>
                  <input
                    id="store-city"
                    type="text"
                    maxLength={80}
                    value={storeCity}
                    onChange={(e) => setStoreCity(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="store-hours" className="block text-xs font-medium text-[#526058] mb-1">
                    Horário
                  </label>
                  <input
                    id="store-hours"
                    type="text"
                    maxLength={60}
                    value={storeHours}
                    onChange={(e) => setStoreHours(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#526058] hover:text-[#111815] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                >
                  Salvar Estabelecimento
                </button>
              </div>
            </form>
          )}

          {mode === 'product' && (
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-prod-name" className="block text-xs font-medium text-[#526058] mb-1">
                    Nome do produto
                  </label>
                  <input
                    id="new-prod-name"
                    type="text"
                    maxLength={100}
                    placeholder="Ex: Manteiga com Sal"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="new-prod-category" className="block text-xs font-medium text-[#526058] mb-1">
                    Categoria
                  </label>
                  <select
                    id="new-prod-category"
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value as ProductCategory)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  >
                    <option value="grãos">Grãos e Massas</option>
                    <option value="laticínios">Laticínios e Ovos</option>
                    <option value="carnes">Carnes</option>
                    <option value="hortifruti">Hortifruti</option>
                    <option value="padaria">Padaria e Farinhas</option>
                    <option value="óleo_açúcar">Óleos e Açúcar</option>
                    <option value="bebidas">Bebidas e Café</option>
                    <option value="limpeza">Limpeza</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="new-prod-unit" className="block text-xs font-medium text-[#526058] mb-1">
                    Unidade
                  </label>
                  <input
                    id="new-prod-unit"
                    type="text"
                    maxLength={20}
                    placeholder="Ex: 200 g"
                    value={prodUnit}
                    onChange={(e) => setProdUnit(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="new-prod-brand" className="block text-xs font-medium text-[#526058] mb-1">
                    Marca
                  </label>
                  <input
                    id="new-prod-brand"
                    type="text"
                    maxLength={60}
                    placeholder="Ex: Aviação"
                    value={prodBrand}
                    onChange={(e) => setProdBrand(e.target.value)}
                    className="w-full h-10 px-3 text-sm bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
                <div>
                  <label htmlFor="new-prod-ref" className="block text-xs font-medium text-[#526058] mb-1">
                    Preço médio ref. (R$)
                  </label>
                  <input
                    id="new-prod-ref"
                    type="text"
                    inputMode="decimal"
                    placeholder="Ex: 11,50"
                    value={prodRefPrice}
                    onChange={(e) => setProdRefPrice(e.target.value)}
                    required
                    className="w-full h-10 px-3 text-sm font-mono tabular-nums bg-[#F7F8F7] border border-[#D4DBD7] rounded-lg text-[#111815]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-[#111815] cursor-pointer">
                <input
                  type="checkbox"
                  checked={prodEssential}
                  onChange={(e) => setProdEssential(e.target.checked)}
                  className="accent-[#15803D] w-4 h-4"
                />
                <span>Item essencial da cesta básica</span>
              </label>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-[#526058] hover:text-[#111815] rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
                >
                  Cadastrar Produto
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
