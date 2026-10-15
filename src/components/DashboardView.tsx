import React, { useMemo } from 'react';
import { useStore } from '../services/storeContext';
import {
  TrendingUp,
  Package,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  Clock,
  ShoppingBag,
  FileText,
  Boxes,
  CheckCircle,
  Plus,
} from 'lucide-react';

interface DashboardViewProps {
  setActiveView: (view: string) => void;
  onOpenNewProduct: () => void;
  onOpenNewMovement: () => void;
  onOpenNewInvoice: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveView,
  onOpenNewProduct,
  onOpenNewMovement,
  onOpenNewInvoice,
}) => {
  const { products, batches, movements, invoices, sales, storeSettings } = useStore();

  // Metrics
  const stats = useMemo(() => {
    // Total inventory value HT
    const totalInventoryValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.purchasePriceHt,
      0
    );

    // Today / Recent sales
    const todaySales = sales.reduce((sum, s) => sum + s.totalTtc, 0);

    // Urgent perishable batches (< 7 days or expired)
    const now = new Date().getTime();
    const urgentBatches = batches.filter((b) => {
      if (b.currentQuantity <= 0) return false;
      const dlcTime = new Date(b.dlcDate).getTime();
      const diffDays = Math.ceil((dlcTime - now) / (1000 * 3600 * 24));
      return diffDays <= 7;
    });

    // Low stock products
    const lowStockProducts = products.filter((p) => p.currentStock <= p.minStock);

    // Unpaid invoices
    const pendingInvoicesTotal = invoices
      .filter((i) => i.paymentStatus === 'en_attente' || i.paymentStatus === 'en_retard')
      .reduce((sum, i) => sum + (i.totalTtc - i.paidAmount), 0);

    // Average margin
    const avgMargin =
      products.length > 0
        ? products.reduce((sum, p) => sum + p.marginPercent, 0) / products.length
        : 35;

    return {
      totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
      todaySales: Math.round(todaySales * 100) / 100,
      urgentBatches,
      lowStockProducts,
      pendingInvoicesTotal: Math.round(pendingInvoicesTotal * 100) / 100,
      avgMargin: Math.round(avgMargin * 10) / 10,
    };
  }, [products, batches, sales, invoices]);

  return (
    <div className="p-6 space-y-6">
      {/* Hero Strip with artisan store imagery */}
      <div className="relative rounded-2xl overflow-hidden border border-neutral-200 bg-neutral-900 text-white min-h-[160px] flex flex-col justify-end p-6">
        <img
          src="/src/assets/images/epicerie_fine_hero_1792022152102.jpg"
          alt="Boutique Saveurs & Terroirs"
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        <div className="relative z-10 max-w-2xl">
          <div className="text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1">
            CRM & ERP Commerce Alimentaire
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {storeSettings.brandName}
          </h1>
          <p className="text-xs text-neutral-300 mt-1 line-clamp-2">
            Gestion intégrée des denrées périssables, caisse tactile, rotation FEFO, facturation légale et conformité TVA française (5,5% / 10% / 20%).
          </p>
        </div>

        {/* Quick action buttons on hero */}
        <div className="relative z-10 mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveView('pos')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-colors shadow-xs"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            <span>Ouvrir la Caisse Tactile</span>
          </button>
          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Ajouter un Article</span>
          </button>
          <button
            onClick={onOpenNewMovement}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Mouvement Stock</span>
          </button>
          <button
            onClick={onOpenNewInvoice}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium backdrop-blur-2xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Éditer une Facture</span>
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Valeur du Stock HT</span>
            <Package className="h-4 w-4 text-neutral-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {stats.totalInventoryValue.toFixed(2)} €
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {products.length} références actives en rayon
          </div>
        </div>

        {/* Encaissements Jour */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Ventes de Caisse TTC</span>
            <ShoppingBag className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">
            {stats.todaySales.toFixed(2)} €
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {sales.length} tickets de caisse validés
          </div>
        </div>

        {/* Marge Moyenne */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Taux de Marge Moyen</span>
            <TrendingUp className="h-4 w-4 text-neutral-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {stats.avgMargin}%
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            Optimisé commerce alimentaire
          </div>
        </div>

        {/* Factures impayées */}
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs mb-1">
            <span>Encours Factures</span>
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-neutral-900">
            {stats.pendingInvoicesTotal.toFixed(2)} €
          </div>
          <div className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Échéancier sous contrôle
          </div>
        </div>
      </div>

      {/* Two Column Grid: Perishables Alert + Movements preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Perishables / DLC Alerts */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-rose-50 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900">
                Alertes DLC & Denrées Périssables ({stats.urgentBatches.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveView('lots')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Voir tous les lots →
            </button>
          </div>

          {stats.urgentBatches.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              Aucun lot en alerte DLC actuellement.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.urgentBatches.slice(0, 4).map((b) => {
                const prod = products.find((p) => p.id === b.productId);
                const now = new Date().getTime();
                const dlcTime = new Date(b.dlcDate).getTime();
                const diffDays = Math.ceil((dlcTime - now) / (1000 * 3600 * 24));
                const isExpired = diffDays <= 0;

                return (
                  <div
                    key={b.id}
                    className="p-3 rounded-lg border border-neutral-200 flex items-center justify-between bg-neutral-50/50"
                  >
                    <div>
                      <div className="text-xs font-bold text-neutral-900">
                        {prod?.name || 'Produit'}
                      </div>
                      <div className="text-[11px] font-mono text-neutral-500">
                        Lot {b.batchNumber} · Reste {b.currentQuantity} {b.unit}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                          isExpired
                            ? 'bg-rose-100 text-rose-900'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {isExpired ? 'Périmé !' : `DLC dans ${diffDays} j.`}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-50 text-amber-700">
                <Boxes className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-neutral-900">
                Réassort & Articles en Stock Bas ({stats.lowStockProducts.length})
              </h2>
            </div>
            <button
              onClick={() => setActiveView('articles')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold"
            >
              Gérer catalogue →
            </button>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div className="p-6 text-center text-xs text-neutral-400">
              Tous les stocks sont au-dessus des seuils d'alerte.
            </div>
          ) : (
            <div className="space-y-2">
              {stats.lowStockProducts.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-lg border border-neutral-200 flex items-center justify-between bg-neutral-50/50"
                >
                  <div>
                    <div className="text-xs font-bold text-neutral-900">{p.name}</div>
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Seuil min : {p.minStock} {p.unit}
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-sm font-bold text-rose-700">
                      {p.currentStock} {p.unit}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
