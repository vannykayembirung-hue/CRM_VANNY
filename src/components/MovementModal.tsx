import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { MovementType } from '../types';
import { X, Check, ArrowDownRight, ArrowUpRight, AlertOctagon, HelpCircle } from 'lucide-react';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProductId?: string;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  defaultProductId,
}) => {
  const { products, batches, locations, addMovement } = useStore();

  const [productId, setProductId] = useState(defaultProductId || products[0]?.id || '');
  const [type, setType] = useState<MovementType>('entree');
  const [quantity, setQuantity] = useState<number>(1);
  const [batchId, setBatchId] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [referenceDoc, setReferenceDoc] = useState<string>('');
  const [sourceLocation, setSourceLocation] = useState<string>('');
  const [targetLocation, setTargetLocation] = useState<string>('');

  if (!isOpen) return null;

  const selectedProduct = products.find((p) => p.id === productId);
  const availableBatches = batches.filter((b) => b.productId === productId && b.currentQuantity > 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) return;

    addMovement({
      type,
      productId,
      batchId: batchId || undefined,
      quantity,
      reason: reason.trim() || (type === 'entree' ? 'Entrée manuelle' : 'Sortie manuelle'),
      referenceDoc: referenceDoc.trim() || undefined,
      sourceLocation: sourceLocation || undefined,
      targetLocation: targetLocation || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${type === 'entree' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {type === 'entree' ? <ArrowDownRight className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
            </div>
            <h3 className="text-sm font-bold text-neutral-900">
              Enregistrer un Mouvement de Stock
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Movement Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Type d'opération <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-100 rounded-lg text-xs font-medium">
              <button
                type="button"
                onClick={() => setType('entree')}
                className={`py-1.5 rounded-md text-center transition-colors ${
                  type === 'entree' ? 'bg-white text-emerald-800 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                + Entrée
              </button>
              <button
                type="button"
                onClick={() => setType('sortie')}
                className={`py-1.5 rounded-md text-center transition-colors ${
                  type === 'sortie' ? 'bg-white text-neutral-900 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                - Sortie
              </button>
              <button
                type="button"
                onClick={() => setType('perte_casse')}
                className={`py-1.5 rounded-md text-center transition-colors ${
                  type === 'perte_casse' ? 'bg-white text-rose-800 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Casse
              </button>
              <button
                type="button"
                onClick={() => setType('peremption')}
                className={`py-1.5 rounded-md text-center transition-colors ${
                  type === 'peremption' ? 'bg-white text-amber-800 shadow-2xs font-semibold' : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Péremption
              </button>
            </div>
          </div>

          {/* Article selection */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Article concerné <span className="text-rose-500">*</span>
            </label>
            <select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setBatchId('');
              }}
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentStock} {p.unit} en stock)
                </option>
              ))}
            </select>
          </div>

          {/* Batch selection */}
          {selectedProduct?.hasBatchManagement && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-neutral-700">
                  Numéro de Lot & DLC (FEFO)
                </label>
                <span className="text-[10px] text-neutral-400">
                  Auto FEFO si non renseigné
                </span>
              </div>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-neutral-50"
              >
                <option value="">Sélection automatique FEFO (Lot le plus proche de la DLC)</option>
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.batchNumber} · DLC: {b.dlcDate} ({b.currentQuantity} {b.unit} restants)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Quantité <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                />
                <span className="absolute right-3 top-2 text-xs text-neutral-400">
                  {selectedProduct?.unit || 'unités'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Référence / Pièce Jointe
              </label>
              <input
                type="text"
                value={referenceDoc}
                onChange={(e) => setReferenceDoc(e.target.value)}
                placeholder="Ex: BL-4891, Ticket 104..."
                className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Motif du mouvement <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Réassort fournisseur, Casse bouteille rayon, Don caritatif..."
              className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
            >
              <Check className="h-4 w-4" />
              <span>Valider le mouvement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
