import React, { useState } from 'react';
import type { MonthlySavingsAggregate, PricePoint } from '../types/market';
import { formatBRL } from '../utils/pricing';

interface PriceVariationChartProps {
  weeklySeries: PricePoint[];
  monthlySeries: PricePoint[];
  productName: string;
}

export const PriceVariationChart: React.FC<PriceVariationChartProps> = ({
  weeklySeries,
  monthlySeries,
  productName,
}) => {
  const [period, setPeriod] = useState<'weekly' | 'monthly'>('weekly');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const series = period === 'weekly' ? weeklySeries : monthlySeries;
  const width = 560;
  const height = 200;
  const padLeft = 54;
  const padRight = 18;
  const padTop = 18;
  const padBottom = 32;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const allVals = series.flatMap((p) => [p.lowestPrice, p.averagePrice]);
  const rawMin = allVals.length > 0 ? Math.min(...allVals) : 0;
  const rawMax = allVals.length > 0 ? Math.max(...allVals) : 10;
  const margin = Math.max(0.5, (rawMax - rawMin) * 0.2);
  const minVal = Math.max(0, rawMin - margin);
  const maxVal = rawMax + margin;
  const range = Math.max(0.01, maxVal - minVal);

  const xFor = (i: number) =>
    series.length <= 1 ? padLeft + plotW / 2 : padLeft + (i / (series.length - 1)) * plotW;
  const yFor = (val: number) => padTop + plotH - ((val - minVal) / range) * plotH;

  const lowPoints = series.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.lowestPrice).toFixed(1)}`).join(' ');
  const avgPoints = series.map((p, i) => `${xFor(i).toFixed(1)},${yFor(p.averagePrice).toFixed(1)}`).join(' ');

  const areaPath =
    series.length > 0
      ? `M ${xFor(0).toFixed(1)},${(padTop + plotH).toFixed(1)} ` +
        series.map((p, i) => `L ${xFor(i).toFixed(1)},${yFor(p.lowestPrice).toFixed(1)}`).join(' ') +
        ` L ${xFor(series.length - 1).toFixed(1)},${(padTop + plotH).toFixed(1)} Z`
      : '';

  const firstLow = series[0]?.lowestPrice || 0;
  const lastLow = series[series.length - 1]?.lowestPrice || 0;
  const deltaPct = firstLow > 0 ? (((lastLow - firstLow) / firstLow) * 100).toFixed(1) : '0.0';
  const isDrop = Number(deltaPct) <= 0;

  const activePoint = hoveredIdx !== null ? series[hoveredIdx] : series[series.length - 1];

  return (
    <div className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="font-display text-sm sm:text-base font-semibold text-[#111815]">
            Variação de Preço — {productName}
          </h4>
          <p className="text-xs text-[#526058] mt-0.5 tabular-nums">
            Menor preço atual: <strong className="text-[#111815] font-mono">{formatBRL(lastLow)}</strong>
            <span aria-hidden="true"> · </span>
            <span className={isDrop ? 'text-[#15803D] font-medium' : 'text-[#B91C1C] font-medium'}>
              {Number(deltaPct) > 0 ? `+${deltaPct}%` : `${deltaPct}%`} no período
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#F2F4F3] rounded-lg" role="group" aria-label="Período do gráfico">
          <button
            type="button"
            onClick={() => {
              setPeriod('weekly');
              setHoveredIdx(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              period === 'weekly'
                ? 'bg-white text-[#111815] shadow-xs'
                : 'text-[#526058] hover:text-[#111815]'
            }`}
          >
            Semanal (7d)
          </button>
          <button
            type="button"
            onClick={() => {
              setPeriod('monthly');
              setHoveredIdx(null);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              period === 'monthly'
                ? 'bg-white text-[#111815] shadow-xs'
                : 'text-[#526058] hover:text-[#111815]'
            }`}
          >
            Mensal (6m)
          </button>
        </div>
      </div>

      {/* Legend + Active Point Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#526058] border-y border-[#E2E7E4] py-2">
        <div className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#15803D] inline-block" aria-hidden="true" />
            Menor preço
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#94A39B] inline-block border-t border-dashed border-[#526058]" aria-hidden="true" />
            Média regional
          </span>
        </div>
        {activePoint && (
          <div className="font-mono tabular-nums text-[#111815]">
            {activePoint.label}: Menor {formatBRL(activePoint.lowestPrice)} · Média {formatBRL(activePoint.averagePrice)}
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label={`Gráfico de variação ${period === 'weekly' ? 'semanal' : 'mensal'} de preços para ${productName}`}
        >
          {/* Horizontal grid lines */}
          {[0, 0.5, 1].map((t) => {
            const val = minVal + t * range;
            const y = yFor(val);
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E7E4"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#526058] text-[10px] font-mono tabular-nums"
                >
                  {val.toFixed(2).replace('.', ',')}
                </text>
              </g>
            );
          })}

          {/* Shaded area under lowest price */}
          {areaPath && <path d={areaPath} fill="#15803D" fillOpacity="0.08" />}

          {/* Average line */}
          {avgPoints && (
            <polyline
              fill="none"
              stroke="#7A8981"
              strokeWidth="2"
              strokeDasharray="5 4"
              points={avgPoints}
            />
          )}

          {/* Lowest line */}
          {lowPoints && (
            <polyline
              fill="none"
              stroke="#15803D"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={lowPoints}
            />
          )}

          {/* Interactive nodes and X labels */}
          {series.map((p, idx) => {
            const cx = xFor(idx);
            const cyLow = yFor(p.lowestPrice);
            const cyAvg = yFor(p.averagePrice);
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={p.label}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={cx - 22}
                  y={padTop}
                  width={44}
                  height={plotH + 22}
                  fill="transparent"
                />
                {isHovered && (
                  <line
                    x1={cx}
                    y1={padTop}
                    x2={cx}
                    y2={padTop + plotH}
                    stroke="#CBD5CE"
                    strokeWidth="1"
                  />
                )}
                <circle
                  cx={cx}
                  cy={cyAvg}
                  r={isHovered ? 4 : 2.5}
                  fill="#7A8981"
                />
                <circle
                  cx={cx}
                  cy={cyLow}
                  r={isHovered ? 5 : 3.5}
                  fill="#15803D"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] ${
                    isHovered ? 'fill-[#111815] font-semibold' : 'fill-[#526058]'
                  }`}
                >
                  {p.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

interface MonthlySavingsChartProps {
  data: MonthlySavingsAggregate[];
}

export const MonthlySavingsChart: React.FC<MonthlySavingsChartProps> = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="bg-white border border-[#E2E7E4] rounded-xl p-6 text-center text-sm text-[#526058]">
        Nenhuma economia mensal registrada ainda. Finalize uma lista de compras para acompanhar sua economia.
      </div>
    );
  }

  const width = 560;
  const height = 210;
  const padLeft = 56;
  const padRight = 18;
  const padTop = 22;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const maxSaved = Math.max(20, ...data.map((d) => d.savedAmount)) * 1.15;
  const barStep = plotW / data.length;
  const barWidth = Math.min(48, barStep * 0.54);

  const active = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="bg-white border border-[#E2E7E4] rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="font-display text-sm sm:text-base font-semibold text-[#111815]">
            Histórico de Economia Mensal
          </h4>
          <p className="text-xs text-[#526058] mt-0.5">
            Diferença economizada escolhendo o menor preço da região vs. média dos mercados
          </p>
        </div>
        {active && (
          <div className="text-xs font-mono tabular-nums text-[#15803D] font-semibold">
            {active.label}: {formatBRL(active.savedAmount)} ({active.tripsCount}{' '}
            {active.tripsCount === 1 ? 'compra' : 'compras'})
          </div>
        )}
      </div>

      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          role="img"
          aria-label="Gráfico de barras do histórico de economia mensal"
        >
          {[0, 0.5, 1].map((t) => {
            const val = t * maxSaved;
            const y = padTop + plotH - t * plotH;
            return (
              <g key={t}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="#E2E7E4"
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#526058] text-[10px] font-mono tabular-nums"
                >
                  R$ {Math.round(val)}
                </text>
              </g>
            );
          })}

          {data.map((d, idx) => {
            const xCenter = padLeft + idx * barStep + barStep / 2;
            const barH = (d.savedAmount / maxSaved) * plotH;
            const x = xCenter - barWidth / 2;
            const y = padTop + plotH - barH;
            const isHovered = hoveredIdx === idx;
            return (
              <g
                key={d.monthKey}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(3, barH)}
                  rx={4}
                  fill={isHovered ? '#166534' : '#15803D'}
                  fillOpacity={isHovered ? 1 : 0.85}
                />
                <text
                  x={xCenter}
                  y={Math.max(12, y - 6)}
                  textAnchor="middle"
                  className="fill-[#111815] text-[10px] font-mono font-semibold tabular-nums"
                >
                  {formatBRL(d.savedAmount)}
                </text>
                <text
                  x={xCenter}
                  y={height - 10}
                  textAnchor="middle"
                  className={`text-[10px] ${
                    isHovered ? 'fill-[#111815] font-semibold' : 'fill-[#526058]'
                  }`}
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
