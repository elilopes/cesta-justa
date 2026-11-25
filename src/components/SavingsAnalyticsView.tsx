import React, { useMemo, useState } from 'react';
import type { PriceEntry, Product, SavingsLog, Store } from '../types/market';
import {
  aggregateMonthlySavings,
  formatBRL,
  getProductComparison,
} from '../utils/pricing';
import { MonthlySavingsChart, PriceVariationChart } from './PriceCharts';

interface SavingsAnalyticsViewProps {
  products: Product[];
  stores: Store[];
  entries: PriceEntry[];
  savingsLogs: SavingsLog[];
}

export const SavingsAnalyticsView: React.FC<SavingsAnalyticsViewProps> = ({
  products,
  stores,
  entries,
  savingsLogs,
}) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const comparison = useMemo(
    () =>
      selectedProduct
        ? getProductComparison(selectedProduct, stores, entries)
        : null,
    [selectedProduct, stores, entries]
  );

  const monthlyAgg = useMemo(() => aggregateMonthlySavings(savingsLogs), [savingsLogs]);

  const totalSavedAllTime = useMemo(
    () => savingsLogs.reduce((acc, l) => acc + l.savedAmount, 0),
    [savingsLogs]
  );
  const totalPaidAllTime = useMemo(
    () => savingsLogs.reduce((acc, l) => acc + l.paidTotal, 0),
    [savingsLogs]
  );

  return (
    <div className="space-y-6">
      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <span className="text-xs text-[#526058]">Economia acumulada</span>
          <div className="font-mono text-2xl font-bold text-[#15803D] tabular-nums mt-1">
            {formatBRL(totalSavedAllTime)}
          </div>
          <p className="text-xs text-[#526058] mt-1 tabular-nums">
            Em {savingsLogs.length} {savingsLogs.length === 1 ? 'compra registrada' : 'compras registradas'}
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <span className="text-xs text-[#526058]">Total gasto em compras</span>
          <div className="font-mono text-2xl font-bold text-[#111815] tabular-nums mt-1">
            {formatBRL(totalPaidAllTime)}
          </div>
          <p className="text-xs text-[#526058] mt-1">
            Soma das cestas registradas no histórico
          </p>
        </div>

        <div className="bg-white border border-[#E2E7E4] rounded-xl p-4">
          <span className="text-xs text-[#526058]">Redução média de gasto</span>
          <div className="font-mono text-2xl font-bold text-[#111815] tabular-nums mt-1">
            {totalPaidAllTime + totalSavedAllTime > 0
              ? `${((totalSavedAllTime / (totalPaidAllTime + totalSavedAllTime)) * 100).toFixed(1)}%`
              : '0,0%'}
          </div>
          <p className="text-xs text-[#526058] mt-1">
            Comparado ao preço médio regional
          </p>
        </div>
      </div>

      {/* Product Weekly & Monthly Price Chart */}
      <section className="space-y-3" aria-labelledby="trend-chart-heading">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 id="trend-chart-heading" className="font-display text-lg font-bold text-[#111815]">
              Variação de Preços Semanal e Mensal
            </h2>
            <p className="text-xs sm:text-sm text-[#526058]">
              Selecione qualquer item da cesta básica para acompanhar a evolução do menor preço e da média regional.
            </p>
          </div>
          <div className="sm:w-72">
            <label htmlFor="chart-product-select" className="sr-only">
              Selecionar produto para o gráfico
            </label>
            <select
              id="chart-product-select"
              value={selectedProduct?.id || ''}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full h-10 px-3 text-sm bg-white border border-[#D4DBD7] rounded-lg text-[#111815]"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {comparison && (
          <PriceVariationChart
            weeklySeries={comparison.weeklySeries}
            monthlySeries={comparison.monthlySeries}
            productName={comparison.product.name}
          />
        )}
      </section>

      {/* Monthly Savings Chart & Detailed Ledger */}
      <section className="space-y-4" aria-labelledby="savings-history-heading">
        <h2 id="savings-history-heading" className="font-display text-lg font-bold text-[#111815]">
          Histórico de Economia Mensal
        </h2>

        <MonthlySavingsChart data={monthlyAgg} />

        <div className="bg-white border border-[#E2E7E4] rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-[#E2E7E4] flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold text-[#111815]">
              Compras registradas ({savingsLogs.length})
            </h3>
            <span className="text-xs text-[#526058]">
              Registre novas compras na aba Lista &amp; Mapa
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2E7E4] text-xs text-[#526058] bg-[#F7F8F7]">
                  <th className="py-2.5 px-4 font-medium">Mês</th>
                  <th className="py-2.5 px-4 font-medium">Estabelecimento</th>
                  <th className="py-2.5 px-4 font-medium text-right">Itens</th>
                  <th className="py-2.5 px-4 font-medium text-right">Valor Pago</th>
                  <th className="py-2.5 px-4 font-medium text-right">Média Regional</th>
                  <th className="py-2.5 px-4 font-medium text-right">Economia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E7E4] text-sm">
                {[...savingsLogs]
                  .sort((a, b) => b.createdAtMs - a.createdAtMs)
                  .map((log) => (
                    <tr key={log.id} className="hover:bg-[#F7F8F7]/60">
                      <td className="py-3 px-4 font-mono text-xs tabular-nums text-[#526058]">
                        {log.monthKey}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#111815]">{log.storeName}</td>
                      <td className="py-3 px-4 text-right font-mono text-xs tabular-nums text-[#526058]">
                        {log.itemsCount}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#111815]">
                        {formatBRL(log.paidTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-[#526058]">
                        {formatBRL(log.averageMarketTotal)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums text-[#15803D]">
                        +{formatBRL(log.savedAmount)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};
