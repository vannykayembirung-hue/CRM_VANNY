import React from 'react';
import { useStore } from '../services/storeContext';
import { UserRole } from '../types';
import {
  Store,
  Database,
  UserRound,
  RotateCcw,
  Plus,
  ShoppingBag,
} from 'lucide-react';

interface HeaderProps {
  activeView: string;
  setActiveView: (view: string) => void;
  onOpenNewProduct: () => void;
  onOpenNewMovement: () => void;
  onOpenNewInvoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenNewProduct,
  onOpenNewMovement,
  onOpenNewInvoice,
}) => {
  const {
    currentUser,
    setCurrentUserRole,
    storeSettings,
    isNeonConnected,
    resetToSeeds,
  } = useStore();

  const roleLabels: Record<UserRole, { label: string; desc: string }> = {
    admin: { label: 'Administrateur', desc: 'Accès total' },
    gerant: { label: 'Gérant', desc: 'Gestion boutique & stock' },
    caissier: { label: 'Caissier', desc: 'Encaissement & caisse' },
    stock: { label: 'Responsable Stock', desc: 'Réceptions & inventaires' },
    comptable: { label: 'Comptable', desc: 'Factures & TVA' },
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-neutral-200 bg-white px-6">
      {/* Zone 1: Single text element wordmark with brand identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setActiveView('dashboard')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-700 text-white shadow-xs">
            <Store className="h-5 w-5" />
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-neutral-900 leading-none">
              {storeSettings.name}
            </span>
            <span className="text-[10px] text-rose-700 font-semibold">
              MODE DÉMO · Ne pas saisir de données réelles
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation status & quick actions */}
      <div className="hidden md:flex items-center gap-2">
        <button
          onClick={() => setActiveView('pos')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
            activeView === 'pos'
              ? 'bg-neutral-900 text-white'
              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          <span>Caisse Tactile</span>
        </button>

        <button
          onClick={onOpenNewProduct}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-500" />
          <span>Article</span>
        </button>

        <button
          onClick={onOpenNewMovement}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-500" />
          <span>Mouvement Stock</span>
        </button>

        <button
          onClick={onOpenNewInvoice}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
        >
          <Plus className="h-3.5 w-3.5 text-neutral-500" />
          <span>Facture</span>
        </button>
      </div>

      {/* Zone 3: Demo role selector & Neon DB status */}
      <div className="flex items-center gap-3">
        {/* Neon Database status button */}
        <button
          onClick={() => setActiveView('neon')}
          title="Configuration Neon PostgreSQL & Déploiement Vercel"
          className="flex items-center gap-1.5 rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
        >
          <Database className={`h-3.5 w-3.5 ${isNeonConnected ? 'text-emerald-600' : 'text-amber-600'}`} />
          <span className="hidden sm:inline">Neon DB</span>
          <span className={`h-1.5 w-1.5 rounded-full ${isNeonConnected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </button>

        {/* Demo role switcher — not authentication or authorization */}
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50/70 p-1 pl-2">
          <UserRound className="h-4 w-4 text-neutral-600" />
          <div className="text-left hidden lg:block">
            <div className="text-xs font-semibold text-neutral-900 leading-tight">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-neutral-500 leading-tight">
              Session démo
            </div>
          </div>
          <select
            value={currentUser.role}
            onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
            className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800 shadow-2xs focus:border-amber-600 focus:outline-none"
          >
            {(Object.keys(roleLabels) as UserRole[]).map((r) => (
              <option key={r} value={r}>
                {roleLabels[r].label}
              </option>
            ))}
          </select>
        </div>

        {/* Reset seeds button */}
        <button
          onClick={() => {
            if (confirm('Réinitialiser toutes les données aux valeurs de démonstration ?')) {
              resetToSeeds();
            }
          }}
          title="Réinitialiser les données de démo"
          className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
