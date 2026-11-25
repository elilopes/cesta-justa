import type {
  FavoriteAlert,
  PriceEntry,
  Product,
  SavingsLog,
  ShoppingList,
  Store,
} from '../types/market';

export const SEED_STORES: Store[] = [
  {
    id: 'store_bom_preco',
    name: 'Supermercado Bom Preço',
    type: 'supermercado',
    street: 'Rua Augusta, 1420',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    lat: -23.5564,
    lng: -46.6589,
    hours: '07:00 – 22:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_mercadinho_praca',
    name: 'Mercadinho da Praça',
    type: 'mercadinho',
    street: 'Rua Treze de Maio, 480',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    lat: -23.5592,
    lng: -46.6476,
    hours: '07:30 – 20:30',
    createdBy: 'seed_community',
  },
  {
    id: 'store_atacadao_centro',
    name: 'Atacarejo Central',
    type: 'atacarejo',
    street: 'Avenida Brigadeiro Luís Antônio, 910',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    lat: -23.5561,
    lng: -46.6428,
    hours: '07:00 – 21:30',
    createdBy: 'seed_community',
  },
  {
    id: 'store_emp_pinheiros',
    name: 'Empório & Mercado Pinheiros',
    type: 'supermercado',
    street: 'Rua Teodoro Sampaio, 1650',
    neighborhood: 'Pinheiros',
    city: 'São Paulo',
    lat: -23.5624,
    lng: -46.6821,
    hours: '08:00 – 22:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_quitanda_vila',
    name: 'Mercadinho São José',
    type: 'mercadinho',
    street: 'Rua Domingos de Morais, 780',
    neighborhood: 'Vila Mariana',
    city: 'São Paulo',
    lat: -23.5835,
    lng: -46.6382,
    hours: '07:00 – 21:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_horti_consolacao',
    name: 'Hortifruti & Cia Consolação',
    type: 'hortifruti',
    street: 'Rua da Consolação, 2140',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    lat: -23.5536,
    lng: -46.6608,
    hours: '07:30 – 21:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_liberdade_plus',
    name: 'Supermercado Oriente',
    type: 'supermercado',
    street: 'Rua Galvão Bueno, 312',
    neighborhood: 'Liberdade',
    city: 'São Paulo',
    lat: -23.5579,
    lng: -46.6349,
    hours: '08:00 – 21:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_mercadinho_consolacao',
    name: 'Mercadinho Frei Caneca',
    type: 'mercadinho',
    street: 'Rua Frei Caneca, 620',
    neighborhood: 'Consolação',
    city: 'São Paulo',
    lat: -23.5549,
    lng: -46.6542,
    hours: '07:00 – 21:30',
    createdBy: 'seed_community',
  },
  {
    id: 'store_campinas_cambui_1',
    name: 'Supermercado Cambuí',
    type: 'supermercado',
    street: 'Rua Coronel Quirino, 1180',
    neighborhood: 'Cambuí',
    city: 'Campinas',
    lat: -22.8935,
    lng: -47.0518,
    hours: '07:30 – 22:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_campinas_cambui_2',
    name: 'Mercadinho Vila Cambuí',
    type: 'mercadinho',
    street: 'Rua Maria Monteiro, 740',
    neighborhood: 'Cambuí',
    city: 'Campinas',
    lat: -22.8971,
    lng: -47.0554,
    hours: '07:00 – 20:30',
    createdBy: 'seed_community',
  },
  {
    id: 'store_bh_savassi_1',
    name: 'Supermercado Savassi',
    type: 'supermercado',
    street: 'Rua Pernambuco, 1070',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    lat: -19.9369,
    lng: -43.9366,
    hours: '07:00 – 22:00',
    createdBy: 'seed_community',
  },
  {
    id: 'store_bh_savassi_2',
    name: 'Empório & Mercadinho Minas',
    type: 'mercadinho',
    street: 'Rua Fernandes Tourinho, 515',
    neighborhood: 'Savassi',
    city: 'Belo Horizonte',
    lat: -19.9388,
    lng: -43.9342,
    hours: '07:30 – 21:00',
    createdBy: 'seed_community',
  },
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'prod_arroz_5kg',
    name: 'Arroz Branco Tipo 1',
    category: 'grãos',
    unit: '5 kg',
    brand: 'Tio João / Camil',
    isEssentialBasket: true,
    referencePrice: 28.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_feijao_1kg',
    name: 'Feijão Carioca Tipo 1',
    category: 'grãos',
    unit: '1 kg',
    brand: 'Kicaldo',
    isEssentialBasket: true,
    referencePrice: 8.6,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_oleo_900ml',
    name: 'Óleo de Soja Refinado',
    category: 'óleo_açúcar',
    unit: '900 ml',
    brand: 'Soya',
    isEssentialBasket: true,
    referencePrice: 7.2,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_acucar_5kg',
    name: 'Açúcar Cristal Especial',
    category: 'óleo_açúcar',
    unit: '5 kg',
    brand: 'União',
    isEssentialBasket: true,
    referencePrice: 21.5,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_cafe_500g',
    name: 'Café Torrado e Moído',
    category: 'bebidas',
    unit: '500 g',
    brand: 'Pilão',
    isEssentialBasket: true,
    referencePrice: 19.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_leite_1l',
    name: 'Leite Integral UHT',
    category: 'laticínios',
    unit: '1 L',
    brand: 'Italac',
    isEssentialBasket: true,
    referencePrice: 5.4,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_macarrao_500g',
    name: 'Macarrão Espaguete Sêmola',
    category: 'grãos',
    unit: '500 g',
    brand: 'Renata',
    isEssentialBasket: true,
    referencePrice: 4.5,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_farinha_1kg',
    name: 'Farinha de Trigo Tradicional',
    category: 'padaria',
    unit: '1 kg',
    brand: 'Dona Benta',
    isEssentialBasket: true,
    referencePrice: 5.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_carne_acem_1kg',
    name: 'Carne Bovina Acém Resfriado',
    category: 'carnes',
    unit: '1 kg',
    brand: 'Friboi',
    isEssentialBasket: true,
    referencePrice: 35.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_ovos_12un',
    name: 'Ovos Brancos Grandes',
    category: 'laticínios',
    unit: '12 un',
    brand: 'Mantiqueira',
    isEssentialBasket: true,
    referencePrice: 11.8,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_tomate_1kg',
    name: 'Tomate Italiano Maduro',
    category: 'hortifruti',
    unit: '1 kg',
    brand: 'Seleção Local',
    isEssentialBasket: true,
    referencePrice: 8.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_banana_1kg',
    name: 'Banana Prata Selecionada',
    category: 'hortifruti',
    unit: '1 kg',
    brand: 'Seleção Local',
    isEssentialBasket: true,
    referencePrice: 7.4,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_pao_frances_1kg',
    name: 'Pão Francês Fresquinho',
    category: 'padaria',
    unit: '1 kg',
    brand: 'Padaria Própria',
    isEssentialBasket: true,
    referencePrice: 15.9,
    createdBy: 'seed_community',
  },
  {
    id: 'prod_sabao_16kg',
    name: 'Sabão em Pó Lavagem Perfeita',
    category: 'limpeza',
    unit: '1,6 kg',
    brand: 'Omo',
    isEssentialBasket: false,
    referencePrice: 22.9,
    createdBy: 'seed_community',
  },
];

export function buildSeedPriceEntries(nowMs: number = Date.now()): PriceEntry[] {
  const day = 24 * 60 * 60 * 1000;
  const hour = 60 * 60 * 1000;
  const min = 60 * 1000;

  const currentMatrix: {
    productId: string;
    storeId: string;
    price: number;
    isPromo?: boolean;
    promoLabel?: string;
    inStock?: boolean;
    reporterName: string;
    agoMs: number;
  }[] = [
    // Arroz 5kg
    { productId: 'prod_arroz_5kg', storeId: 'store_atacadao_centro', price: 24.49, isPromo: true, promoLabel: 'Oferta do dia', reporterName: 'Marcos V.', agoMs: 18 * min },
    { productId: 'prod_arroz_5kg', storeId: 'store_bom_preco', price: 26.9, reporterName: 'Juliana S.', agoMs: 42 * min },
    { productId: 'prod_arroz_5kg', storeId: 'store_mercadinho_praca', price: 27.5, reporterName: 'Carlos R.', agoMs: 2 * hour },
    { productId: 'prod_arroz_5kg', storeId: 'store_emp_pinheiros', price: 29.8, reporterName: 'Fernanda L.', agoMs: 3 * hour },
    { productId: 'prod_arroz_5kg', storeId: 'store_quitanda_vila', price: 26.4, isPromo: true, promoLabel: 'Leve + pague -', reporterName: 'Rafael M.', agoMs: 4 * hour },
    { productId: 'prod_arroz_5kg', storeId: 'store_liberdade_plus', price: 28.2, reporterName: 'Kenji T.', agoMs: 5 * hour },

    // Feijão 1kg
    { productId: 'prod_feijao_1kg', storeId: 'store_mercadinho_praca', price: 6.89, isPromo: true, promoLabel: 'Queima de estoque', reporterName: 'Carlos R.', agoMs: 25 * min },
    { productId: 'prod_feijao_1kg', storeId: 'store_atacadao_centro', price: 7.29, reporterName: 'Marcos V.', agoMs: 1 * hour },
    { productId: 'prod_feijao_1kg', storeId: 'store_bom_preco', price: 7.9, reporterName: 'Ana P.', agoMs: 2 * hour },
    { productId: 'prod_feijao_1kg', storeId: 'store_emp_pinheiros', price: 8.75, reporterName: 'Fernanda L.', agoMs: 4 * hour },
    { productId: 'prod_feijao_1kg', storeId: 'store_quitanda_vila', price: 7.6, reporterName: 'Rafael M.', agoMs: 6 * hour },

    // Óleo 900ml
    { productId: 'prod_oleo_900ml', storeId: 'store_bom_preco', price: 5.99, isPromo: true, promoLabel: 'Semana da economia', reporterName: 'Ana P.', agoMs: 31 * min },
    { productId: 'prod_oleo_900ml', storeId: 'store_atacadao_centro', price: 6.19, reporterName: 'Marcos V.', agoMs: 2 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_mercadinho_praca', price: 6.8, reporterName: 'Carlos R.', agoMs: 3 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_emp_pinheiros', price: 7.49, reporterName: 'Beatriz C.', agoMs: 4 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_quitanda_vila', price: 6.5, reporterName: 'Rafael M.', agoMs: 5 * hour },

    // Açúcar 5kg
    { productId: 'prod_acucar_5kg', storeId: 'store_atacadao_centro', price: 18.9, reporterName: 'Marcos V.', agoMs: 50 * min },
    { productId: 'prod_acucar_5kg', storeId: 'store_bom_preco', price: 19.7, reporterName: 'Juliana S.', agoMs: 2 * hour },
    { productId: 'prod_acucar_5kg', storeId: 'store_mercadinho_praca', price: 21.4, reporterName: 'Carlos R.', agoMs: 5 * hour },
    { productId: 'prod_acucar_5kg', storeId: 'store_quitanda_vila', price: 20.2, reporterName: 'Rafael M.', agoMs: 7 * hour },

    // Café 500g
    { productId: 'prod_cafe_500g', storeId: 'store_bom_preco', price: 16.49, isPromo: true, promoLabel: 'Café em oferta', reporterName: 'Lucas M.', agoMs: 14 * min },
    { productId: 'prod_cafe_500g', storeId: 'store_atacadao_centro', price: 17.2, reporterName: 'Marcos V.', agoMs: 2 * hour },
    { productId: 'prod_cafe_500g', storeId: 'store_mercadinho_praca', price: 18.9, reporterName: 'Carlos R.', agoMs: 3 * hour },
    { productId: 'prod_cafe_500g', storeId: 'store_emp_pinheiros', price: 20.5, reporterName: 'Fernanda L.', agoMs: 4 * hour },
    { productId: 'prod_cafe_500g', storeId: 'store_liberdade_plus', price: 17.8, reporterName: 'Kenji T.', agoMs: 6 * hour },

    // Leite 1L
    { productId: 'prod_leite_1l', storeId: 'store_mercadinho_praca', price: 4.39, isPromo: true, promoLabel: 'Preço de bairro', reporterName: 'Carlos R.', agoMs: 12 * min },
    { productId: 'prod_leite_1l', storeId: 'store_bom_preco', price: 4.69, reporterName: 'Juliana S.', agoMs: 1 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_atacadao_centro', price: 4.49, reporterName: 'Marcos V.', agoMs: 2 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_emp_pinheiros', price: 5.59, reporterName: 'Beatriz C.', agoMs: 3 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_quitanda_vila', price: 4.89, reporterName: 'Rafael M.', agoMs: 4 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_horti_consolacao', price: 4.95, reporterName: 'Sofia A.', agoMs: 5 * hour },

    // Macarrão 500g
    { productId: 'prod_macarrao_500g', storeId: 'store_atacadao_centro', price: 3.69, reporterName: 'Marcos V.', agoMs: 1 * hour },
    { productId: 'prod_macarrao_500g', storeId: 'store_bom_preco', price: 3.99, reporterName: 'Ana P.', agoMs: 2 * hour },
    { productId: 'prod_macarrao_500g', storeId: 'store_mercadinho_praca', price: 4.4, reporterName: 'Carlos R.', agoMs: 4 * hour },
    { productId: 'prod_macarrao_500g', storeId: 'store_liberdade_plus', price: 4.15, reporterName: 'Kenji T.', agoMs: 6 * hour },

    // Farinha 1kg
    { productId: 'prod_farinha_1kg', storeId: 'store_bom_preco', price: 4.89, reporterName: 'Juliana S.', agoMs: 3 * hour },
    { productId: 'prod_farinha_1kg', storeId: 'store_atacadao_centro', price: 4.99, reporterName: 'Marcos V.', agoMs: 4 * hour },
    { productId: 'prod_farinha_1kg', storeId: 'store_mercadinho_praca', price: 5.6, reporterName: 'Carlos R.', agoMs: 5 * hour },

    // Carne Acém 1kg
    { productId: 'prod_carne_acem_1kg', storeId: 'store_atacadao_centro', price: 31.9, isPromo: true, promoLabel: 'Quarta da carne', reporterName: 'Marcos V.', agoMs: 55 * min },
    { productId: 'prod_carne_acem_1kg', storeId: 'store_bom_preco', price: 33.9, reporterName: 'Lucas M.', agoMs: 2 * hour },
    { productId: 'prod_carne_acem_1kg', storeId: 'store_emp_pinheiros', price: 37.5, reporterName: 'Fernanda L.', agoMs: 3 * hour },
    { productId: 'prod_carne_acem_1kg', storeId: 'store_mercadinho_praca', price: 34.9, inStock: false, reporterName: 'Carlos R.', agoMs: 5 * hour },

    // Ovos 12un
    { productId: 'prod_ovos_12un', storeId: 'store_horti_consolacao', price: 9.49, isPromo: true, promoLabel: 'Direto da granja', reporterName: 'Sofia A.', agoMs: 22 * min },
    { productId: 'prod_ovos_12un', storeId: 'store_bom_preco', price: 10.9, reporterName: 'Ana P.', agoMs: 2 * hour },
    { productId: 'prod_ovos_12un', storeId: 'store_mercadinho_praca', price: 10.5, reporterName: 'Carlos R.', agoMs: 3 * hour },
    { productId: 'prod_ovos_12un', storeId: 'store_quitanda_vila', price: 9.9, reporterName: 'Rafael M.', agoMs: 4 * hour },

    // Tomate 1kg
    { productId: 'prod_tomate_1kg', storeId: 'store_horti_consolacao', price: 6.49, isPromo: true, promoLabel: 'Feira da manhã', reporterName: 'Sofia A.', agoMs: 35 * min },
    { productId: 'prod_tomate_1kg', storeId: 'store_quitanda_vila', price: 7.2, reporterName: 'Rafael M.', agoMs: 2 * hour },
    { productId: 'prod_tomate_1kg', storeId: 'store_bom_preco', price: 8.49, reporterName: 'Juliana S.', agoMs: 3 * hour },
    { productId: 'prod_tomate_1kg', storeId: 'store_emp_pinheiros', price: 9.6, reporterName: 'Fernanda L.', agoMs: 5 * hour },

    // Banana 1kg
    { productId: 'prod_banana_1kg', storeId: 'store_horti_consolacao', price: 5.49, reporterName: 'Sofia A.', agoMs: 40 * min },
    { productId: 'prod_banana_1kg', storeId: 'store_quitanda_vila', price: 5.99, reporterName: 'Rafael M.', agoMs: 2 * hour },
    { productId: 'prod_banana_1kg', storeId: 'store_bom_preco', price: 6.89, reporterName: 'Ana P.', agoMs: 4 * hour },
    { productId: 'prod_banana_1kg', storeId: 'store_mercadinho_praca', price: 6.2, reporterName: 'Carlos R.', agoMs: 5 * hour },

    // Pão Francês 1kg
    { productId: 'prod_pao_frances_1kg', storeId: 'store_mercadinho_praca', price: 13.5, reporterName: 'Carlos R.', agoMs: 1 * hour },
    { productId: 'prod_pao_frances_1kg', storeId: 'store_bom_preco', price: 14.9, reporterName: 'Juliana S.', agoMs: 3 * hour },
    { productId: 'prod_pao_frances_1kg', storeId: 'store_emp_pinheiros', price: 17.2, reporterName: 'Beatriz C.', agoMs: 5 * hour },

    // Sabão em pó 1,6kg
    { productId: 'prod_sabao_16kg', storeId: 'store_atacadao_centro', price: 18.4, isPromo: true, promoLabel: 'Combo limpeza', reporterName: 'Marcos V.', agoMs: 1 * hour },
    { productId: 'prod_sabao_16kg', storeId: 'store_bom_preco', price: 21.5, reporterName: 'Ana P.', agoMs: 3 * hour },
    { productId: 'prod_sabao_16kg', storeId: 'store_emp_pinheiros', price: 23.9, reporterName: 'Fernanda L.', agoMs: 6 * hour },

    // Mercadinho Frei Caneca (São Paulo - Consolação) para comparação dentro do bairro Consolação
    { productId: 'prod_arroz_5kg', storeId: 'store_mercadinho_consolacao', price: 25.8, isPromo: true, promoLabel: 'Oferta da semana', reporterName: 'Paula G.', agoMs: 28 * min },
    { productId: 'prod_feijao_1kg', storeId: 'store_mercadinho_consolacao', price: 7.45, reporterName: 'Paula G.', agoMs: 45 * min },
    { productId: 'prod_oleo_900ml', storeId: 'store_mercadinho_consolacao', price: 6.35, reporterName: 'Diego N.', agoMs: 2 * hour },
    { productId: 'prod_acucar_5kg', storeId: 'store_mercadinho_consolacao', price: 19.2, isPromo: true, promoLabel: 'Preço vizinhança', reporterName: 'Diego N.', agoMs: 90 * min },
    { productId: 'prod_cafe_500g', storeId: 'store_mercadinho_consolacao', price: 17.9, reporterName: 'Paula G.', agoMs: 3 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_mercadinho_consolacao', price: 4.49, isPromo: true, promoLabel: 'Leve 6+', reporterName: 'Paula G.', agoMs: 19 * min },
    { productId: 'prod_macarrao_500g', storeId: 'store_mercadinho_consolacao', price: 3.85, reporterName: 'Diego N.', agoMs: 2 * hour },
    { productId: 'prod_farinha_1kg', storeId: 'store_mercadinho_consolacao', price: 5.15, reporterName: 'Paula G.', agoMs: 4 * hour },
    { productId: 'prod_carne_acem_1kg', storeId: 'store_mercadinho_consolacao', price: 34.5, reporterName: 'Diego N.', agoMs: 3 * hour },
    { productId: 'prod_pao_frances_1kg', storeId: 'store_mercadinho_consolacao', price: 13.9, isPromo: true, promoLabel: 'Fornada da tarde', reporterName: 'Paula G.', agoMs: 35 * min },
    { productId: 'prod_sabao_16kg', storeId: 'store_mercadinho_consolacao', price: 20.4, reporterName: 'Diego N.', agoMs: 5 * hour },

    // Campinas - Cambuí
    { productId: 'prod_arroz_5kg', storeId: 'store_campinas_cambui_1', price: 25.49, isPromo: true, promoLabel: 'Fim de semana Cambuí', reporterName: 'Renato C.', agoMs: 20 * min },
    { productId: 'prod_arroz_5kg', storeId: 'store_campinas_cambui_2', price: 26.8, reporterName: 'Camila F.', agoMs: 2 * hour },
    { productId: 'prod_feijao_1kg', storeId: 'store_campinas_cambui_2', price: 7.1, isPromo: true, promoLabel: 'Safra nova', reporterName: 'Camila F.', agoMs: 32 * min },
    { productId: 'prod_feijao_1kg', storeId: 'store_campinas_cambui_1', price: 7.89, reporterName: 'Renato C.', agoMs: 3 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_campinas_cambui_1', price: 6.09, reporterName: 'Renato C.', agoMs: 1 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_campinas_cambui_2', price: 6.49, reporterName: 'Camila F.', agoMs: 4 * hour },
    { productId: 'prod_acucar_5kg', storeId: 'store_campinas_cambui_1', price: 19.4, reporterName: 'Renato C.', agoMs: 2 * hour },
    { productId: 'prod_cafe_500g', storeId: 'store_campinas_cambui_2', price: 16.9, isPromo: true, promoLabel: 'Café da manhã', reporterName: 'Camila F.', agoMs: 48 * min },
    { productId: 'prod_cafe_500g', storeId: 'store_campinas_cambui_1', price: 18.2, reporterName: 'Renato C.', agoMs: 3 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_campinas_cambui_2', price: 4.45, reporterName: 'Camila F.', agoMs: 25 * min },
    { productId: 'prod_leite_1l', storeId: 'store_campinas_cambui_1', price: 4.79, reporterName: 'Renato C.', agoMs: 2 * hour },
    { productId: 'prod_macarrao_500g', storeId: 'store_campinas_cambui_1', price: 3.95, reporterName: 'Renato C.', agoMs: 5 * hour },
    { productId: 'prod_ovos_12un', storeId: 'store_campinas_cambui_2', price: 9.8, reporterName: 'Camila F.', agoMs: 1 * hour },
    { productId: 'prod_tomate_1kg', storeId: 'store_campinas_cambui_1', price: 6.9, reporterName: 'Renato C.', agoMs: 2 * hour },

    // Belo Horizonte - Savassi
    { productId: 'prod_arroz_5kg', storeId: 'store_bh_savassi_2', price: 24.9, isPromo: true, promoLabel: 'Oferta Savassi', reporterName: 'Thiago B.', agoMs: 16 * min },
    { productId: 'prod_arroz_5kg', storeId: 'store_bh_savassi_1', price: 27.2, reporterName: 'Larissa M.', agoMs: 2 * hour },
    { productId: 'prod_feijao_1kg', storeId: 'store_bh_savassi_1', price: 6.79, isPromo: true, promoLabel: 'Feijão em conta', reporterName: 'Larissa M.', agoMs: 38 * min },
    { productId: 'prod_feijao_1kg', storeId: 'store_bh_savassi_2', price: 7.39, reporterName: 'Thiago B.', agoMs: 3 * hour },
    { productId: 'prod_oleo_900ml', storeId: 'store_bh_savassi_2', price: 5.89, reporterName: 'Thiago B.', agoMs: 45 * min },
    { productId: 'prod_oleo_900ml', storeId: 'store_bh_savassi_1', price: 6.29, reporterName: 'Larissa M.', agoMs: 2 * hour },
    { productId: 'prod_cafe_500g', storeId: 'store_bh_savassi_1', price: 15.99, isPromo: true, promoLabel: 'Clube do café', reporterName: 'Larissa M.', agoMs: 15 * min },
    { productId: 'prod_cafe_500g', storeId: 'store_bh_savassi_2', price: 17.4, reporterName: 'Thiago B.', agoMs: 4 * hour },
    { productId: 'prod_leite_1l', storeId: 'store_bh_savassi_1', price: 4.29, isPromo: true, promoLabel: 'Direto de MG', reporterName: 'Larissa M.', agoMs: 21 * min },
    { productId: 'prod_leite_1l', storeId: 'store_bh_savassi_2', price: 4.59, reporterName: 'Thiago B.', agoMs: 3 * hour },
    { productId: 'prod_carne_acem_1kg', storeId: 'store_bh_savassi_1', price: 30.9, reporterName: 'Larissa M.', agoMs: 2 * hour },
    { productId: 'prod_pao_frances_1kg', storeId: 'store_bh_savassi_2', price: 12.9, reporterName: 'Thiago B.', agoMs: 1 * hour },
  ];

  const entries: PriceEntry[] = currentMatrix.map((item, idx) => ({
    id: `seed_curr_${idx + 1}`,
    productId: item.productId,
    storeId: item.storeId,
    price: item.price,
    isPromo: Boolean(item.isPromo),
    promoLabel: item.promoLabel || '',
    inStock: item.inStock ?? true,
    reportedBy: 'seed_community',
    reporterName: item.reporterName,
    createdAtMs: nowMs - item.agoMs,
  }));

  // Historical points across past 6 days + past 5 months so weekly/monthly variation charts have rich curves
  const historyOffsets = [
    { daysAgo: 1, factorLow: 1.03, factorHigh: 1.05 },
    { daysAgo: 2, factorLow: 1.04, factorHigh: 1.06 },
    { daysAgo: 3, factorLow: 1.01, factorHigh: 1.04 },
    { daysAgo: 4, factorLow: 1.06, factorHigh: 1.08 },
    { daysAgo: 5, factorLow: 1.05, factorHigh: 1.07 },
    { daysAgo: 6, factorLow: 1.07, factorHigh: 1.09 },
    { daysAgo: 32, factorLow: 1.09, factorHigh: 1.12 },
    { daysAgo: 62, factorLow: 1.05, factorHigh: 1.09 },
    { daysAgo: 93, factorLow: 1.11, factorHigh: 1.15 },
    { daysAgo: 124, factorLow: 1.08, factorHigh: 1.11 },
    { daysAgo: 155, factorLow: 1.13, factorHigh: 1.17 },
  ];

  let histCounter = 1;
  const regionGroups = new Map<string, Set<string>>();
  for (const store of SEED_STORES) {
    const key = `${store.city}__${store.neighborhood}`;
    if (!regionGroups.has(key)) {
      regionGroups.set(key, new Set<string>());
    }
    regionGroups.get(key)!.add(store.id);
  }

  for (const prod of SEED_PRODUCTS) {
    for (const [regionKey, storeIdSet] of regionGroups.entries()) {
      const regCurrent = entries.filter(
        (e) => e.productId === prod.id && e.inStock && storeIdSet.has(e.storeId)
      );
      if (regCurrent.length === 0) continue;

      const minCurr = regCurrent.reduce((m, e) => (e.price < m.price ? e : m), regCurrent[0]);
      const maxCurr = regCurrent.reduce((m, e) => (e.price > m.price ? e : m), regCurrent[0]);
      const slug = regionKey.toLowerCase().replace(/[^a-z0-9]+/g, '_');

      for (const h of historyOffsets) {
        entries.push({
          id: `seed_hist_reg_${slug}_${prod.id}_${h.daysAgo}_min_${histCounter++}`,
          productId: prod.id,
          storeId: minCurr.storeId,
          price: Number((minCurr.price * h.factorLow).toFixed(2)),
          isPromo: false,
          promoLabel: '',
          inStock: true,
          reportedBy: 'seed_community',
          reporterName: 'Histórico Regional',
          createdAtMs: nowMs - h.daysAgo * day,
        });
        if (maxCurr.storeId !== minCurr.storeId) {
          entries.push({
            id: `seed_hist_reg_${slug}_${prod.id}_${h.daysAgo}_max_${histCounter++}`,
            productId: prod.id,
            storeId: maxCurr.storeId,
            price: Number((maxCurr.price * h.factorHigh).toFixed(2)),
            isPromo: false,
            promoLabel: '',
            inStock: true,
            reportedBy: 'seed_community',
            reporterName: 'Histórico Regional',
            createdAtMs: nowMs - h.daysAgo * day,
          });
        }
      }
    }
  }

  return entries;
}

export const SEED_SHOPPING_LIST: ShoppingList = {
  id: 'list_cesta_semanal',
  userId: 'local_guest',
  name: 'Cesta Básica da Semana',
  neighborhoodFilter: 'Consolação',
  items: [
    { productId: 'prod_arroz_5kg', productName: 'Arroz Branco Tipo 1', quantity: 1, checked: false, targetPrice: 26.0 },
    { productId: 'prod_feijao_1kg', productName: 'Feijão Carioca Tipo 1', quantity: 2, checked: false, targetPrice: 7.5 },
    { productId: 'prod_oleo_900ml', productName: 'Óleo de Soja Refinado', quantity: 2, checked: false, targetPrice: 6.2 },
    { productId: 'prod_cafe_500g', productName: 'Café Torrado e Moído', quantity: 1, checked: false, targetPrice: 17.5 },
    { productId: 'prod_leite_1l', productName: 'Leite Integral UHT', quantity: 6, checked: false, targetPrice: 4.8 },
  ],
  updatedAtMs: Date.now(),
};

export const SEED_FAVORITES: FavoriteAlert[] = [
  {
    id: 'fav_arroz',
    userId: 'local_guest',
    productId: 'prod_arroz_5kg',
    desiredMaxPrice: 25.5,
    notifyOnPromo: true,
    notifyOnLowest: true,
    updatedAtMs: Date.now(),
  },
  {
    id: 'fav_cafe',
    userId: 'local_guest',
    productId: 'prod_cafe_500g',
    desiredMaxPrice: 17.0,
    notifyOnPromo: true,
    notifyOnLowest: true,
    updatedAtMs: Date.now(),
  },
  {
    id: 'fav_leite',
    userId: 'local_guest',
    productId: 'prod_leite_1l',
    desiredMaxPrice: 4.5,
    notifyOnPromo: true,
    notifyOnLowest: true,
    updatedAtMs: Date.now(),
  },
];

export function buildSeedSavingsLogs(nowMs: number = Date.now()): SavingsLog[] {
  const day = 24 * 60 * 60 * 1000;
  const baseDate = new Date(nowMs);
  const mk = (monthsAgo: number) => {
    const d = new Date(baseDate.getFullYear(), baseDate.getMonth() - monthsAgo, 10);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  return [
    {
      id: 'sav_1',
      userId: 'local_guest',
      monthKey: mk(4),
      storeId: 'store_atacadao_centro',
      storeName: 'Atacarejo Central',
      paidTotal: 268.4,
      averageMarketTotal: 312.9,
      savedAmount: 44.5,
      itemsCount: 14,
      createdAtMs: nowMs - 122 * day,
    },
    {
      id: 'sav_2',
      userId: 'local_guest',
      monthKey: mk(3),
      storeId: 'store_bom_preco',
      storeName: 'Supermercado Bom Preço',
      paidTotal: 294.2,
      averageMarketTotal: 356.8,
      savedAmount: 62.6,
      itemsCount: 16,
      createdAtMs: nowMs - 92 * day,
    },
    {
      id: 'sav_3',
      userId: 'local_guest',
      monthKey: mk(2),
      storeId: 'store_mercadinho_praca',
      storeName: 'Mercadinho da Praça',
      paidTotal: 241.0,
      averageMarketTotal: 299.5,
      savedAmount: 58.5,
      itemsCount: 13,
      createdAtMs: nowMs - 61 * day,
    },
    {
      id: 'sav_4',
      userId: 'local_guest',
      monthKey: mk(1),
      storeId: 'store_atacadao_centro',
      storeName: 'Atacarejo Central',
      paidTotal: 278.5,
      averageMarketTotal: 361.4,
      savedAmount: 82.9,
      itemsCount: 17,
      createdAtMs: nowMs - 31 * day,
    },
    {
      id: 'sav_5',
      userId: 'local_guest',
      monthKey: mk(0),
      storeId: 'store_bom_preco',
      storeName: 'Supermercado Bom Preço',
      paidTotal: 189.6,
      averageMarketTotal: 238.1,
      savedAmount: 48.5,
      itemsCount: 11,
      createdAtMs: nowMs - 5 * day,
    },
  ];
}
