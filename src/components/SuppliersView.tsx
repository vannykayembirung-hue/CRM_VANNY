import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Supplier, PurchaseOrder } from '../types';
import {
  Truck,
  Plus,
  PackageCheck,
  CheckCircle,
  Clock,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Boxes,
} from 'lucide-react';
import { RenameModal } from './RenameModal';

export const SuppliersView: React.FC = () => {
  const {
    suppliers,
    purchaseOrders,
    products,
    addSupplier,
    deleteSupplier,
    addPurchaseOrder,
    receivePurchaseOrder,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'suppliers' | 'orders'>('orders');
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  // New Supplier modal
  const [supModalOpen, setSupModalOpen] = useState(false);
  const [supName, setSupName] = useState('');
  const [supType, setSupType] = useState<Supplier['type']>('producteur');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supSiret, setSupSiret] = useState('');
  const [supPaymentTerms, setSupPaymentTerms] = useState(30);

  // New PO modal
  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poLines, setPoLines] = useState<
    { productId: string; qty: number; unitPriceHt: number }[]
  >([{ productId: products[0]?.id || '', qty: 10, unitPriceHt: products[0]?.purchasePriceHt || 5 }]);

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    addSupplier({
      name: supName.trim(),
      type: supType,
      contactName: supContact,
      email: supEmail,
      phone: supPhone,
      address: supAddress,
      siret: supSiret,
      paymentTermsDays: supPaymentTerms,
      rating: 5,
    });
    setSupModalOpen(false);
    setSupName('');
  };

  const handleCreatePo = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find((s) => s.id === poSupplierId);
    if (!sup) return;

    let subtotalHt = 0;
    const lines = poLines.map((l, i) => {
      const prod = products.find((p) => p.id === l.productId);
      const lineHt = Math.round(l.qty * l.unitPriceHt * 100) / 100;
      subtotalHt += lineHt;
      return {
        id: `pol-${Date.now()}-${i}`,
        productId: l.productId,
        productName: prod?.name || 'Produit',
        quantityOrdered: l.qty,
        quantityReceived: 0,
        unit: prod?.unit || 'piece',
        unitPriceHt: l.unitPriceHt,
        vatRate: prod?.vatRate || 5.5,
        totalHt: lineHt,
      };
    });

    const totalVat = Math.round(subtotalHt * 0.055 * 100) / 100;
    const totalTtc = Math.round((subtotalHt + totalVat) * 100) / 100;

    addPurchaseOrder({
      supplierId: sup.id,
      supplierName: sup.name,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'confirme',
      lines,
      subtotalHt,
      totalVat,
      totalTtc,
      createdBy: 'Responsable Achats',
    });

    setPoModalOpen(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Fournisseurs, Producteurs & Bons de Commande
          </h1>
          <p className="text-xs text-neutral-500">
            Gestion du référencement, réapprovisionnement et réception automatique en stock avec génération de lots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'suppliers' ? (
            <button
              onClick={() => setSupModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau Fournisseur</span>
            </button>
          ) : (
            <button
              onClick={() => setPoModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Nouveau Bon de Commande</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 gap-4">
        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'orders'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Bons de Commande & Réceptions ({purchaseOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'suppliers'
              ? 'border-neutral-900 text-neutral-900'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Répertoire Fournisseurs ({suppliers.length})
        </button>
      </div>

      {/* Tab: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700">
                <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">N° Bon Commande</th>
                    <th className="px-4 py-3">Fournisseur</th>
                    <th className="px-4 py-3">Date Commande</th>
                    <th className="px-4 py-3">Livraison Prévue</th>
                    <th className="px-4 py-3 text-right">Total HT</th>
                    <th className="px-4 py-3 text-right">Total TTC</th>
                    <th className="px-4 py-3 text-center">Statut</th>
                    <th className="px-4 py-3 text-right">Action Réception</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {purchaseOrders.map((po) => {
                    const isReceived = po.status === 'recu_total';
                    return (
                      <tr key={po.id} className="hover:bg-neutral-50/70 transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-neutral-900">
                          {po.orderNumber}
                        </td>
                        <td className="px-4 py-3 font-semibold text-neutral-900">
                          {po.supplierName}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500">
                          {new Date(po.orderDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 font-mono text-neutral-500">
                          {new Date(po.expectedDeliveryDate).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-600">
                          {po.subtotalHt.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                          {po.totalTtc.toFixed(2)} €
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                              isReceived
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : 'bg-blue-50 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {isReceived ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                            {isReceived ? 'Réceptionné' : 'Confirmé / En attente'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!isReceived ? (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    `Réceptionner la commande ${po.orderNumber} ? Cela créera automatiquement les lots et les entrées de stock.`
                                  )
                                ) {
                                  receivePurchaseOrder(po.id);
                                }
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors"
                            >
                              Réceptionner en stock
                            </button>
                          ) : (
                            <span className="text-[11px] font-mono text-neutral-400">
                              Lots générés ✓
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
      )}

      {/* Tab: Suppliers List */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suppliers.map((sup) => (
            <div
              key={sup.id}
              className="bg-white p-5 rounded-xl border border-neutral-200 shadow-2xs space-y-3 group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-neutral-900">{sup.name}</span>
                    <button
                      onClick={() => setRenameTarget({ id: sup.id, name: sup.name })}
                      title="Renommer le fournisseur"
                      className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-700 transition-opacity p-0.5"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="text-xs text-neutral-400 capitalize">{sup.type} · Note : {'★'.repeat(sup.rating)}</span>
                </div>

                <button
                  onClick={() => {
                    if (confirm(`Mettre le fournisseur "${sup.name}" en corbeille ?`)) {
                      deleteSupplier(sup.id);
                    }
                  }}
                  className="p-1 text-neutral-300 hover:text-rose-600 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-1 text-xs text-neutral-600">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{sup.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-neutral-400" />
                  <span>{sup.phone}</span>
                </div>
                <div className="text-[11px] text-neutral-400 pt-1">
                  Adresse : {sup.address} · SIRET : {sup.siret}
                </div>
                <div className="text-[11px] font-mono text-neutral-500">
                  Conditions de paiement : {sup.paymentTermsDays} jours
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Supplier Modal */}
      {supModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Ajouter un Fournisseur / Producteur
            </h3>
            <form onSubmit={handleCreateSupplier} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nom ou Raison Sociale <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  placeholder="Ex: Ferme Bio du Plateau"
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Type
                  </label>
                  <select
                    value={supType}
                    onChange={(e) => setSupType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
                  >
                    <option value="producteur">Producteur</option>
                    <option value="artisan">Artisan</option>
                    <option value="cooperative">Coopérative</option>
                    <option value="grossiste">Grossiste</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Contact Principal
                  </label>
                  <input
                    type="text"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    placeholder="Nom du responsable"
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    placeholder="contact@..."
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    placeholder="04..."
                    className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Adresse postale
                </label>
                <input
                  type="text"
                  value={supAddress}
                  onChange={(e) => setSupAddress(e.target.value)}
                  placeholder="Adresse complète"
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSupModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New PO Modal */}
      {poModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl border border-neutral-200 p-6 space-y-4">
            <h3 className="text-sm font-bold text-neutral-900">
              Nouveau Bon de Commande Fournisseur
            </h3>
            <form onSubmit={handleCreatePo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Fournisseur destinataire
                </label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTermsDays}j de délai)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Article à commander
                </label>
                <select
                  value={poLines[0].productId}
                  onChange={(e) => {
                    const prod = products.find((p) => p.id === e.target.value);
                    setPoLines([
                      {
                        productId: e.target.value,
                        qty: poLines[0].qty,
                        unitPriceHt: prod?.purchasePriceHt || 5,
                      },
                    ]);
                  }}
                  className="w-full px-3 py-2 text-xs rounded border border-neutral-300 bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Prix d'achat HT: {p.purchasePriceHt.toFixed(2)} €)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Quantité commandée
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={poLines[0].qty}
                    onChange={(e) =>
                      setPoLines([
                        {
                          ...poLines[0],
                          qty: parseFloat(e.target.value) || 1,
                        },
                      ])
                    }
                    className="w-full px-3 py-2 text-xs font-mono font-bold rounded border border-neutral-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Prix d'Achat Unitaire HT
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={poLines[0].unitPriceHt}
                    onChange={(e) =>
                      setPoLines([
                        {
                          ...poLines[0],
                          unitPriceHt: parseFloat(e.target.value) || 0,
                        },
                      ])
                    }
                    className="w-full px-3 py-2 text-xs font-mono rounded border border-neutral-300"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPoModalOpen(false)}
                  className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs"
                >
                  Créer le bon de commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Transversal Rename Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={true}
          onClose={() => setRenameTarget(null)}
          entityType="supplier"
          entityId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
    </div>
  );
};
