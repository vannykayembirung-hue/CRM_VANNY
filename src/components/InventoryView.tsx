import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Product } from '../types';
import { ClipboardList, CheckCircle, Plus, AlertCircle, RotateCcw } from 'lucide-react';

export const InventoryView: React.FC = () => {
  const { products, updateProduct, addMovement, currentUser } = useStore();

  const [countedQuantities, setCountedQuantities] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    products.forEach((p) => {
      map[p.id] = p.currentStock;
    });
    return map;
  });

  const [sessionValidated, setSessionValidated] = useState(false);

  const handleQtyChange = (prodId: string, value: number) => {
    setCountedQuantities((prev) => ({
      ...prev,
      [prodId]: value,
    }));
  };

  const handleValidateInventory = () => {
    if (!confirm('Valider la session d\'inventaire ? Les stocks physiques seront réajustés et les écarts tracés dans le journal des mouvements.')) {
      return;
    }

    products.forEach((p) => {
      const counted = countedQuantities[p.id] ?? p.currentStock;
      const diff = Math.round((counted - p.currentStock) * 100) / 100;

      if (diff !== 0) {
        // Record adjustment movement
        addMovement({
          type: 'ajustement',
          productId: p.id,
          quantity: diff,
          reason: `Ajustement inventaire physique (${diff > 0 ? `+${diff}` : diff} ${p.unit})`,
          referenceDoc: `INV-${new Date().toISOString().split('T')[0]}`,
        });
      }
    });

    setSessionValidated(true);
  };

  // Compute total variance
  const totalDifferenceValue = products.reduce((acc, p) => {
    const counted = countedQuantities[p.id] ?? p.currentStock;
    const diff = counted - p.currentStock;
    return acc + diff * p.purchasePriceHt;
  }, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Session d'Inventaire Physique de Stock
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-800 border border-neutral-200">
              Session active
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Saisie de comptage sur le terrain, calcul automatique des écarts en quantité et valeur HT.
          </p>
        </div>

        <button
          onClick={handleValidateInventory}
          disabled={sessionValidated}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-colors"
        >
          <CheckCircle className="h-4 w-4 text-emerald-400" />
          <span>{sessionValidated ? 'Inventaire Validé ✓' : 'Valider & Ajuster les Stocks'}</span>
        </button>
      </div>

      {/* Variance summary banner */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-neutral-100 text-neutral-700">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-neutral-900 block">
              Écart Total de Valorisation
            </span>
            <span className="text-[11px] text-neutral-500">
              Impact financier calculé au coût moyen d'achat HT
            </span>
          </div>
        </div>

        <div className="text-right">
          <div
            className={`text-lg font-bold font-mono tabular-nums ${
              totalDifferenceValue === 0
                ? 'text-neutral-900'
                : totalDifferenceValue > 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {totalDifferenceValue >= 0 ? `+${totalDifferenceValue.toFixed(2)}` : totalDifferenceValue.toFixed(2)} € HT
          </div>
          <div className="text-[10px] text-neutral-400">
            {totalDifferenceValue === 0 ? 'Aucun écart constaté' : 'Ajustement net à passer'}
          </div>
        </div>
      </div>

      {/* Inventory Count Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3 text-right">Stock Théorique</th>
                <th className="px-4 py-3 text-center w-36">Stock Compté Réel</th>
                <th className="px-4 py-3 text-right">Écart Quantité</th>
                <th className="px-4 py-3 text-right">Écart Valeur HT</th>
                <th className="px-4 py-3 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {products.map((p) => {
                const counted = countedQuantities[p.id] ?? p.currentStock;
                const diffQty = Math.round((counted - p.currentStock) * 100) / 100;
                const diffVal = Math.round(diffQty * p.purchasePriceHt * 100) / 100;

                return (
                  <tr key={p.id} className="hover:bg-neutral-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-neutral-900">{p.name}</div>
                      <div className="text-[11px] font-mono text-neutral-400">{p.sku}</div>
                    </td>

                    <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-600 font-semibold">
                      {p.currentStock} {p.unit}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        step="0.01"
                        value={counted}
                        onChange={(e) => handleQtyChange(p.id, parseFloat(e.target.value) || 0)}
                        className="w-24 text-center px-2 py-1 text-xs font-mono font-bold rounded border border-neutral-300 focus:border-amber-600 focus:outline-none"
                      />
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums font-bold ${
                        diffQty === 0
                          ? 'text-neutral-400'
                          : diffQty > 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {diffQty > 0 ? `+${diffQty}` : diffQty} {p.unit}
                    </td>

                    <td
                      className={`px-4 py-3 text-right font-mono tabular-nums font-semibold ${
                        diffVal === 0
                          ? 'text-neutral-400'
                          : diffVal > 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {diffVal > 0 ? `+${diffVal.toFixed(2)}` : diffVal.toFixed(2)} €
                    </td>

                    <td className="px-4 py-3 text-center">
                      {diffQty === 0 ? (
                        <span className="text-[11px] font-medium text-neutral-400">
                          Parfait ✓
                        </span>
                      ) : (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            diffQty > 0
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}
                        >
                          {diffQty > 0 ? 'Surplus' : 'Manquant'}
                        </span>
                      )}
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
