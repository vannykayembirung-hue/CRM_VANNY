import React, { useState, useEffect } from 'react';
import { useStore } from '../services/storeContext';
import { Edit2, X, Check } from 'lucide-react';

interface RenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: string;
  entityId: string;
  currentName: string;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  onClose,
  entityType,
  entityId,
  currentName,
}) => {
  const { renameEntity } = useStore();
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    renameEntity(entityType, entityId, name.trim());
    onClose();
  };

  const getEntityLabel = () => {
    switch (entityType) {
      case 'product':
        return 'Article / Produit';
      case 'category':
        return 'Catégorie';
      case 'supplier':
        return 'Fournisseur';
      case 'customer':
        return 'Client';
      case 'store':
        return 'Enseigne de la Boutique';
      default:
        return 'Élément';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 overflow-hidden">
        <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
              <Edit2 className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-semibold text-neutral-900">
              Renommer {getEntityLabel()}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              Nom ou Libellé actuel
            </label>
            <div className="text-xs text-neutral-400 font-mono bg-neutral-50 px-3 py-2 rounded-md border border-neutral-200">
              {currentName}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Nouveau Nom / Libellé <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Comté Affinage 24 Mois..."
              className="w-full px-3 py-2 text-sm rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none shadow-2xs"
            />
            <p className="mt-1 text-[11px] text-neutral-500">
              Le renommage conserve l'ensemble des historiques de vente, lots et traçabilité.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim() || name === currentName}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-md shadow-xs transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Enregistrer le renommage</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
