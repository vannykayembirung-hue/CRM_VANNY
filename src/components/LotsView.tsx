import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Batch } from '../types';
import {
  Boxes,
  AlertTriangle,
  Clock,
  CheckCircle,
  Plus,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface LotsViewProps {
  filterProductId?: string;
}

export const LotsView: React.FC<LotsViewProps> = ({ filterProductId }) => {
  const { batches, products, suppliers, locations, markBatchWaste, addBatch } = useStore();

  const [selectedProduct, setSelectedProduct] = useState<string>(filterProductId || 'all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [wasteModalBatch, setWasteModalBatch] = useState<Batch | null>(null);
  const [wasteQty, setWasteQty] = useState<number>(1);
  const [wasteReason, setWasteReason] = useState<string>('DLC Dépassée - Retrait de la vente');

  // Add Batch Modal
  const [newBatchModalOpen, setNewBatchModalOpen] = useState(false);
  const [newProdId, setNewProdId] = useState(products[0]?.id || '');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newDlc, setNewDlc] = useState(
    new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [newQty, setNewQty] = useState<number>(10);
  const [newLocationId, setNewLocationId] = useState(locations[0]?.id || 'loc-01');

  // Filtered & FEFO sorted (earliest DLC first!)
  const sortedBatches = [...batches]
    .filter((b) => {
      if (selectedProduct !== 'all' && b.productId !== selectedProduct) return false;
      if (selectedStatus !== 'all' && b.status !== selectedStatus) return false;
      return true;
    })
    .sort((a, b) => new Date(a.dlcDate).getTime() - new Date(b.dlcDate).getTime());

  const getProductName = (id: string) => products.find((p) => p.id === id)?.name || 'Produit';
  const getSupplierName = (id: string) => suppliers.find((s) => s.id === id)?.name || 'Fournisseur';
  const getLocationName = (id: string) => locations.find((l) => l.id === id)?.name || 'Rayon';

  const handleConfirmWaste = () => {
    if (!wasteModalBatch) return;
    markBatchWaste(wasteModalBatch.id, wasteQty, wasteReason);
    setWasteModalBatch(null);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === newProdId);
    if (!prod) return;

    addBatch({
      productId: newProdId,
      batchNumber: newBatchNumber.trim() || `LOT-${Date.now().toString().slice(-6)}`,
      receptionDate: new Date().toISOString().split('T')[0],
      dlcDate: newDlc,
      initialQuantity: newQty,
      currentQuantity: newQty,
      unit: prod.unit,
      locationId: newLocationId,
      supplierId: prod.primarySupplierId,
      purchasePriceHt: prod.purchasePriceHt,
    });

    setNewBatchModalOpen(false);
    setNewBatchNumber('');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
              Gestion des Lots, Traçabilité & DLC / DDM
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
              Règle FEFO Active
            </span>
          </div>
          <p className="text-xs text-neutral-500">
            Contrôle des denrées périssables, rotation First Expired First Out et alertes péremption automatiques.
          </p>
        </div>

        <button
          onClick={() => {
            setNewBatchNumber(`LOT-${Date.now().toString().slice(-6)}`);
            setNewBatchModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Créer un Lot</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
          className="w-full md:w-auto px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
        >
          <option value="all">Tous les articles avec lots ({products.length})</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="w-full md:w-auto px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
        >
          <option value="all">Tous les statuts DLC</option>
          <option value="conforme">Conforme</option>
          <option value="alerte_proche">Alerte Proche (&lt; 7 jours)</option>
          <option value="perime">Périmé (À retirer)</option>
          <option value="retire">Épuisé / Retiré</option>
        </select>

        <div className="text-xs text-neutral-500 ml-auto font-mono">
          {sortedBatches.length} lots enregistrés
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Numéro de Lot</th>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Date Réception</th>
                <th className="px-4 py-3">DLC / DDM</th>
                <th className="px-4 py-3 text-right">Quantité Restante</th>
                <th className="px-4 py-3">Emplacement</th>
                <th className="px-4 py-3 text-center">Statut Fraîcheur</th>
                <th className="px-4 py-3 text-right">Action Démarque</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {sortedBatches.map((batch) => {
                const now = new Date().getTime();
                const dlcTime = new Date(batch.dlcDate).getTime();
                const daysRemaining = Math.ceil((dlcTime - now) / (1000 * 3600 * 24));

                const isExpired = daysRemaining <= 0 || batch.status === 'perime';
                const isUrgent = daysRemaining > 0 && daysRemaining <= 7;

                return (
                  <tr key={batch.id} className="hover:bg-neutral-50/70 transition-colors">
                    {/* Batch Number */}
                    <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                      <div className="flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-neutral-500" />
                        <span>{batch.batchNumber}</span>
                      </div>
                    </td>

                    {/* Product */}
                    <td className="px-4 py-3 font-semibold text-neutral-900">
                      {getProductName(batch.productId)}
                    </td>

                    {/* Reception */}
                    <td className="px-4 py-3 font-mono text-neutral-500">
                      {new Date(batch.receptionDate).toLocaleDateString('fr-FR')}
                    </td>

                    {/* DLC */}
                    <td className="px-4 py-3 font-mono font-bold">
                      <div
                        className={
                          isExpired
                            ? 'text-rose-700'
                            : isUrgent
                            ? 'text-amber-700'
                            : 'text-neutral-900'
                        }
                      >
                        {new Date(batch.dlcDate).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="text-[10px] font-sans font-normal text-neutral-400">
                        {isExpired
                          ? `Expiré il y a ${Math.abs(daysRemaining)} j.`
                          : `Reste ${daysRemaining} jours`}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                      {batch.currentQuantity} / {batch.initialQuantity} {batch.unit}
                    </td>

                    {/* Location */}
                    <td className="px-4 py-3 text-neutral-600">
                      {getLocationName(batch.locationId)}
                    </td>

                    {/* Status badge */}
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                          isExpired
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : isUrgent
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isExpired ? (
                          <AlertTriangle className="h-3 w-3" />
                        ) : isUrgent ? (
                          <Clock className="h-3 w-3" />
                        ) : (
                          <CheckCircle className="h-3 w-3" />
                        )}
                        {isExpired ? 'Périmé' : isUrgent ? 'Alerte DLC' : 'Conforme'}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      {batch.currentQuantity > 0 ? (
                        <button
                          onClick={() => {
                            setWasteModalBatch(batch);
                            setWasteQty(batch.currentQuantity);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                        >
                          Démarque / Perte
                        </button>
                      ) : (
                        <span className="text-[11px] text-neutral-400">Épuisé</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waste modal */}
      {wasteModalBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700">
              <ShieldAlert className="h-5 w-5" />
              <h3 className="text-sm font-bold text-neutral-900">
                Démarque / Sortie Perte de Stock
              </h3>
            </div>

            <div className="p-3 bg-neutral-50 rounded-lg text-xs space-y-1">
              <div>Article : <span className="font-semibold text-neutral-900">{getProductName(wasteModalBatch.productId)}</span></div>
              <div>Lot : <span className="font-mono">{wasteModalBatch.batchNumber}</span> (DLC : {wasteModalBatch.dlcDate})</div>
              <div>Disponible : <span className="font-mono font-bold">{wasteModalBatch.currentQuantity} {wasteModalBatch.unit}</span></div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantité à retirer du stock
              </label>
              <input
                type="number"
                step="0.01"
                max={wasteModalBatch.currentQuantity}
                value={wasteQty}
                onChange={(e) => setWasteQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono font-bold rounded border border-neutral-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Motif de la démarque
              </label>
              <select
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
              >
                <option value="DLC Dépassée - Retrait obligatoire">DLC Dépassée - Retrait obligatoire</option>
                <option value="Casse en rayon / emballage percé">Casse en rayon / emballage percé</option>
                <option value="Défaut organoleptique / altération">Défaut organoleptique / altération</option>
                <option value="Don caritatif / association">Don caritatif / association</option>
                <option value="Prélèvement personnel gérant">Prélèvement personnel gérant</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWasteModalBatch(null)}
                className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmWaste}
                className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md shadow-xs"
              >
                Valider Démarque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Batch Modal */}
      {newBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Créer un nouveau Lot de marchandise
            </h3>

            <form onSubmit={handleCreateBatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Article
                </label>
                <select
                  value={newProdId}
                  onChange={(e) => setNewProdId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Numéro de Lot Fournisseur
                </label>
                <input
                  type="text"
                  required
                  value={newBatchNumber}
                  onChange={(e) => setNewBatchNumber(e.target.value)}
                  placeholder="Ex: LOT-2026-F08"
                  className="w-full px-3 py-2 text-xs font-mono rounded border border-neutral-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Date Limite de Consommation (DLC)
                </label>
                <input
                  type="date"
                  required
                  value={newDlc}
                  onChange={(e) => setNewDlc(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono rounded border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={newQty}
                    onChange={(e) => setNewQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Emplacement
                  </label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewBatchModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs"
                >
                  Enregistrer le Lot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
