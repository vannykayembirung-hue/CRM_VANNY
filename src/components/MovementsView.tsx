import React, { useState, useMemo } from 'react';
import { useStore } from '../services/storeContext';
import { StockMovement, MovementType } from '../types';
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Download,
  Filter,
  TrendingUp,
  AlertCircle,
  PackageCheck,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';

interface MovementsViewProps {
  onOpenNewMovement: () => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({ onOpenNewMovement }) => {
  const { movements, products, categories } = useStore();
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<'7' | '14' | '30'>('30');

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      if (filterType !== 'all' && m.type !== filterType) return false;
      if (selectedProductId !== 'all' && m.productId !== selectedProductId) return false;
      return true;
    });
  }, [movements, filterType, selectedProductId]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    let totalInQty = 0;
    let totalInValue = 0;
    let totalOutQty = 0;
    let totalOutValue = 0;
    let wasteValue = 0;
    let expiredValue = 0;

    filteredMovements.forEach((m) => {
      if (m.type === 'entree') {
        totalInQty += m.quantity;
        totalInValue += m.totalValueHt;
      } else {
        const absQty = Math.abs(m.quantity);
        totalOutQty += absQty;
        totalOutValue += m.totalValueHt;
        if (m.type === 'perte_casse') wasteValue += m.totalValueHt;
        if (m.type === 'peremption') expiredValue += m.totalValueHt;
      }
    });

    const netBalanceQty = Math.round((totalInQty - totalOutQty) * 100) / 100;
    const netBalanceValue = Math.round((totalInValue - totalOutValue) * 100) / 100;

    // Estimated rotation & stock coverage
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.purchasePriceHt,
      0
    );
    const rotationRate = totalInventoryValue > 0 ? (totalOutValue / totalInventoryValue).toFixed(2) : '1.0';
    const coverageDays = totalOutValue > 0 ? Math.round((totalInventoryValue / (totalOutValue / 30))) : 24;

    return {
      totalInQty: Math.round(totalInQty * 10) / 10,
      totalInValue: Math.round(totalInValue * 100) / 100,
      totalOutQty: Math.round(totalOutQty * 10) / 10,
      totalOutValue: Math.round(totalOutValue * 100) / 100,
      netBalanceQty,
      netBalanceValue,
      wasteValue: Math.round(wasteValue * 100) / 100,
      expiredValue: Math.round(expiredValue * 100) / 100,
      rotationRate,
      coverageDays,
    };
  }, [filteredMovements, products]);

  // Timeline series for graph (daily aggregated points)
  const timelineData = useMemo(() => {
    const daysMap = new Map<string, { date: string; entries: number; sorties: number }>();
    const numDays = parseInt(timeRange, 10);
    const today = new Date();

    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      daysMap.set(key, { date: label, entries: 0, sorties: 0 });
    }

    movements.forEach((m) => {
      const dayKey = m.createdAt.split('T')[0];
      if (daysMap.has(dayKey)) {
        const item = daysMap.get(dayKey)!;
        if (m.type === 'entree') {
          item.entries += m.quantity;
        } else {
          item.sorties += Math.abs(m.quantity);
        }
      }
    });

    return Array.from(daysMap.values());
  }, [movements, timeRange]);

  // Category breakdown for stock movements
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { name: string; entries: number; sorties: number }>();
    categories.forEach((c) => map.set(c.id, { name: c.name, entries: 0, sorties: 0 }));

    movements.forEach((m) => {
      const prod = products.find((p) => p.id === m.productId);
      if (prod && map.has(prod.categoryId)) {
        const entry = map.get(prod.categoryId)!;
        if (m.type === 'entree') {
          entry.entries += m.totalValueHt;
        } else {
          entry.sorties += m.totalValueHt;
        }
      }
    });

    return Array.from(map.values()).filter((c) => c.entries > 0 || c.sorties > 0);
  }, [movements, products, categories]);

  // Reason breakdown
  const reasonBreakdown = useMemo(() => {
    const counts: Record<string, number> = {
      Ventes: 0,
      'Pertes & Casse': 0,
      'Péremptions DLC': 0,
      Ajustements: 0,
    };

    movements.forEach((m) => {
      if (m.type === 'sortie') counts['Ventes'] += m.totalValueHt;
      else if (m.type === 'perte_casse') counts['Pertes & Casse'] += m.totalValueHt;
      else if (m.type === 'peremption') counts['Péremptions DLC'] += m.totalValueHt;
      else if (m.type === 'ajustement') counts['Ajustements'] += m.totalValueHt;
    });

    return Object.entries(counts).map(([name, val]) => ({
      name,
      value: Math.round(val * 100) / 100,
    }));
  }, [movements]);

  // Max value for timeline scaling
  const maxTimelineVal = Math.max(
    ...timelineData.map((d) => Math.max(d.entries, d.sorties)),
    10
  );

  const exportMovementsCsv = () => {
    const headers = [
      'Date/Heure',
      'Type',
      'Article',
      'Lot N°',
      'Quantité',
      'Unité',
      'Prix Unitaire HT',
      'Valeur Totale HT',
      'Motif',
      'Référence',
      'Opérateur',
    ];
    const rows = filteredMovements.map((m) => [
      `"${new Date(m.createdAt).toLocaleString('fr-FR')}"`,
      `"${m.type}"`,
      `"${m.productName.replace(/"/g, '""')}"`,
      `"${m.batchNumber || ''}"`,
      m.quantity,
      m.unit,
      m.unitPriceHt.toFixed(2),
      m.totalValueHt.toFixed(2),
      `"${m.reason.replace(/"/g, '""')}"`,
      `"${m.referenceDoc || ''}"`,
      `"${m.createdBy}"`,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `mouvements_stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Gestion des Entrées & Sorties de Stock
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              Module Analytique
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Indicateurs de flux en temps réel, valorisation financière, rotation et motifs de perte.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportMovementsCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-neutral-500" />
            <span>Exporter Mouvements</span>
          </button>
          <button
            onClick={onOpenNewMovement}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouveau Mouvement</span>
          </button>
        </div>
      </div>

      {/* 6 Key KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Entrées */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Entrées Réception</span>
            <ArrowDownRight className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-700">
            +{kpis.totalInQty} u.
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {kpis.totalInValue.toFixed(2)} € HT
          </div>
        </div>

        {/* Sorties */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Sorties Ventes</span>
            <ArrowUpRight className="h-4 w-4 text-neutral-700" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900">
            -{kpis.totalOutQty} u.
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {kpis.totalOutValue.toFixed(2)} € HT
          </div>
        </div>

        {/* Solde Net */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Solde Net Flux</span>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </div>
          <div
            className={`text-lg font-bold font-mono tabular-nums ${
              kpis.netBalanceQty >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {kpis.netBalanceQty >= 0 ? `+${kpis.netBalanceQty}` : kpis.netBalanceQty} u.
          </div>
          <div className="text-[11px] font-mono text-neutral-400">
            {kpis.netBalanceValue >= 0 ? `+${kpis.netBalanceValue.toFixed(2)}` : kpis.netBalanceValue.toFixed(2)} € HT
          </div>
        </div>

        {/* Rotation */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Taux de Rotation</span>
            <PackageCheck className="h-4 w-4 text-neutral-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900">
            {kpis.rotationRate} x
          </div>
          <div className="text-[11px] text-neutral-400">
            Moyenne boutique
          </div>
        </div>

        {/* Couverture */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Couverture Stock</span>
            <Calendar className="h-4 w-4 text-neutral-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-neutral-900">
            {kpis.coverageDays} jours
          </div>
          <div className="text-[11px] text-neutral-400">
            Autonomie estimée
          </div>
        </div>

        {/* Démarque / Péremption */}
        <div className="bg-white p-3.5 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Pertes & DLC</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold font-mono tabular-nums text-rose-700">
            {(kpis.wasteValue + kpis.expiredValue).toFixed(2)} €
          </div>
          <div className="text-[11px] text-neutral-400">
            Démarque totale HT
          </div>
        </div>
      </div>

      {/* Main Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Chart: Entrées vs Sorties */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-neutral-900">
                Courbe Chronologique des Entrées vs Sorties
              </h2>
              <p className="text-xs text-neutral-500">
                Volumes journaliers superposés (unités de stock)
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Legend */}
              <div className="flex items-center gap-3 text-xs text-neutral-600 font-medium">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-emerald-600" />
                  <span>Entrées</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-xs bg-neutral-900" />
                  <span>Sorties</span>
                </div>
              </div>

              {/* Time selector */}
              <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md text-xs">
                {(['7', '14', '30'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      timeRange === r ? 'bg-white font-semibold text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    {r}j
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Bar Chart Visualization */}
          <div className="h-56 w-full flex items-end gap-2 pt-6 pb-2 px-2 border-b border-neutral-100">
            {timelineData.map((d, index) => {
              const inHeight = Math.min(100, Math.round((d.entries / maxTimelineVal) * 100));
              const outHeight = Math.min(100, Math.round((d.sorties / maxTimelineVal) * 100));

              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative"
                >
                  {/* Tooltip on hover */}
                  <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] py-1 px-2 rounded pointer-events-none whitespace-nowrap z-20 font-mono shadow-md">
                    {d.date} : +{d.entries} in / -{d.sorties} out
                  </div>

                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Entry Bar */}
                    <div
                      style={{ height: `${Math.max(inHeight, 3)}%` }}
                      className={`w-1/2 max-w-[12px] rounded-t transition-all ${
                        d.entries > 0 ? 'bg-emerald-600 group-hover:bg-emerald-500' : 'bg-neutral-100'
                      }`}
                    />
                    {/* Exit Bar */}
                    <div
                      style={{ height: `${Math.max(outHeight, 3)}%` }}
                      className={`w-1/2 max-w-[12px] rounded-t transition-all ${
                        d.sorties > 0 ? 'bg-neutral-800 group-hover:bg-neutral-700' : 'bg-neutral-100'
                      }`}
                    />
                  </div>

                  <span className="text-[10px] text-neutral-400 mt-2 font-mono">
                    {index % (timeRange === '30' ? 4 : 2) === 0 ? d.date : ''}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
            <span>Plafond : {maxTimelineVal.toFixed(0)} unités</span>
            <span>Flux synchronisé avec le journal de caisse & réceptions</span>
          </div>
        </div>

        {/* Motifs de sortie & Pertes */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="border-b border-neutral-100 pb-3">
            <h2 className="text-sm font-bold text-neutral-900">
              Ventilation des Sorties de Stock
            </h2>
            <p className="text-xs text-neutral-500">
              Répartition par valeur (€ HT)
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {reasonBreakdown.map((item) => {
              const totalVal = reasonBreakdown.reduce((s, r) => s + r.value, 0);
              const pct = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0;
              return (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-neutral-700">{item.name}</span>
                    <span className="font-mono tabular-nums text-neutral-900">
                      {item.value.toFixed(2)} € ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${
                        item.name === 'Ventes'
                          ? 'bg-neutral-900'
                          : item.name === 'Péremptions DLC'
                          ? 'bg-amber-600'
                          : 'bg-rose-600'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Alert box if losses exist */}
          {(kpis.wasteValue > 0 || kpis.expiredValue > 0) && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Vigilance Démarque</span>
                <span>
                  {(kpis.wasteValue + kpis.expiredValue).toFixed(2)} € HT de pertes enregistrées. Vous pouvez brader les lots proches de la DLC depuis l'onglet Lots.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movements History Table & Filter */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-900">
              Historique détaillé des mouvements
            </span>
            <span className="text-xs text-neutral-400 font-mono">
              ({filteredMovements.length} lignes)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Tous les types de mouvement</option>
              <option value="entree">Entrées (+)</option>
              <option value="sortie">Sorties (-)</option>
              <option value="perte_casse">Pertes & Casse</option>
              <option value="peremption">Péremptions</option>
            </select>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Tous les articles</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Date & Heure</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Lot Associé</th>
                <th className="px-4 py-3 text-right">Quantité</th>
                <th className="px-4 py-3 text-right">Valeur HT</th>
                <th className="px-4 py-3">Motif & Référence</th>
                <th className="px-4 py-3">Opérateur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredMovements.map((m) => {
                const isEntry = m.type === 'entree';
                return (
                  <tr key={m.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="px-4 py-3 font-mono tabular-nums text-neutral-500">
                      {new Date(m.createdAt).toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* Type badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                          isEntry
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : m.type === 'peremption'
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : m.type === 'perte_casse'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-neutral-100 text-neutral-800 border border-neutral-200'
                        }`}
                      >
                        {isEntry ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                        {m.type === 'entree'
                          ? 'Entrée'
                          : m.type === 'sortie'
                          ? 'Sortie'
                          : m.type === 'perte_casse'
                          ? 'Casse'
                          : 'Péremption'}
                      </span>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      {m.productName}
                    </td>

                    {/* Batch */}
                    <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                      {m.batchNumber || '—'}
                    </td>

                    {/* Quantity */}
                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums font-bold ${
                        isEntry ? 'text-emerald-700' : 'text-neutral-900'
                      }`}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity} {m.unit}
                    </td>

                    {/* Value */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-700">
                      {m.totalValueHt.toFixed(2)} €
                    </td>

                    {/* Reason */}
                    <td className="px-4 py-3 text-neutral-600">
                      <div>{m.reason}</div>
                      {m.referenceDoc && (
                        <div className="text-[10px] font-mono text-neutral-400">
                          Réf: {m.referenceDoc}
                        </div>
                      )}
                    </td>

                    {/* Created By */}
                    <td className="px-4 py-3 text-neutral-500">
                      {m.createdBy}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
