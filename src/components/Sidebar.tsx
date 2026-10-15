import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  Boxes,
  FileText,
  ShoppingBag,
  Truck,
  Users,
  ClipboardList,
  History,
  Database,
  Trash2,
} from 'lucide-react';
import { useStore } from '../services/storeContext';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { batches, trashItems, invoices, products } = useStore();

  // Counts for alerts
  const urgentBatchesCount = batches.filter(
    (b) => b.status === 'alerte_proche' || b.status === 'perime'
  ).length;

  const lowStockProductsCount = products.filter(
    (p) => p.currentStock <= p.minStock
  ).length;

  const unpaidInvoicesCount = invoices.filter(
    (i) => i.paymentStatus === 'en_attente' || i.paymentStatus === 'en_retard'
  ).length;

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      badge: undefined,
    },
    {
      id: 'articles',
      label: 'Articles & Catalogue',
      icon: Package,
      badge: lowStockProductsCount > 0 ? `${lowStockProductsCount} bas` : undefined,
      badgeColor: 'text-amber-700 bg-amber-50',
    },
    {
      id: 'movements',
      label: 'Entrées & Sorties',
      icon: ArrowLeftRight,
      badge: undefined,
    },
    {
      id: 'lots',
      label: 'Lots & DLC / DDM',
      icon: Boxes,
      badge: urgentBatchesCount > 0 ? `${urgentBatchesCount} alertes` : undefined,
      badgeColor: 'text-rose-700 bg-rose-50',
    },
    {
      id: 'invoices',
      label: 'Factures & Devis',
      icon: FileText,
      badge: unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} dus` : undefined,
      badgeColor: 'text-blue-700 bg-blue-50',
    },
    {
      id: 'pos',
      label: 'Caisse Tactile (POS)',
      icon: ShoppingBag,
      badge: undefined,
    },
    {
      id: 'suppliers',
      label: 'Fournisseurs & Achats',
      icon: Truck,
      badge: undefined,
    },
    {
      id: 'customers',
      label: 'Clients & Fidélité',
      icon: Users,
      badge: undefined,
    },
    {
      id: 'inventory',
      label: 'Inventaire de stock',
      icon: ClipboardList,
      badge: undefined,
    },
    {
      id: 'audit',
      label: 'Audit & Corbeille',
      icon: History,
      badge: trashItems.length > 0 ? `${trashItems.length}` : undefined,
      badgeColor: 'text-neutral-600 bg-neutral-100',
    },
    {
      id: 'neon',
      label: 'Neon DB & Vercel',
      icon: Database,
      badge: 'SQL',
      badgeColor: 'text-emerald-700 bg-emerald-50',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-neutral-200 bg-white flex flex-col justify-between select-none">
      <div className="p-3">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Menu Principal
        </div>
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-white' : 'text-neutral-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium font-mono ${
                      isActive ? 'bg-neutral-800 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer with store info */}
      <div className="p-4 border-t border-neutral-100 text-[11px] text-neutral-500 space-y-1">
        <div className="flex justify-between items-center text-neutral-600">
          <span className="font-medium">Version</span>
          <span className="font-mono">v2.4 Pro</span>
        </div>
        <div className="flex justify-between items-center text-neutral-600">
          <span className="font-medium">TVA Active</span>
          <span className="font-mono">5.5% · 10% · 20%</span>
        </div>
        <div className="pt-2 text-[10px] text-neutral-400">
          Conformité légale facturation FR (Art. 242 nonies A du CGI)
        </div>
      </div>
    </aside>
  );
};
