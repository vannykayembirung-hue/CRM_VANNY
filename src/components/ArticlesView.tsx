import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Product } from '../types';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Download,
  Filter,
  Layers,
  Leaf,
  Scale,
  Copy,
} from 'lucide-react';
import { RenameModal } from './RenameModal';

interface ArticlesViewProps {
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onViewLots: (productId?: string) => void;
}

export const ArticlesView: React.FC<ArticlesViewProps> = ({
  onOpenNewProduct,
  onEditProduct,
  onViewLots,
}) => {
  const { products, categories, suppliers, deleteProduct, addProduct } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [filterWeighable, setFilterWeighable] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) return false;
    if (filterLowStock && p.currentStock > p.minStock) return false;
    if (filterWeighable && !p.isWeighable) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchBarcodes = p.barcodes.some((b) => b.includes(q));
      const matchBrand = p.brand?.toLowerCase().includes(q);
      return matchName || matchSku || matchBarcodes || matchBrand;
    }
    return true;
  });

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'Général';
  };

  const getSupplierName = (supId: string) => {
    return suppliers.find((s) => s.id === supId)?.name || 'Inconnu';
  };

  const handleDuplicate = (p: Product) => {
    const copyData = {
      ...p,
      sku: `${p.sku}-CPY`,
      name: `${p.name} (Copie)`,
      barcodes: [],
    };
    // remove id and stock
    const { id, currentStock, version, ...rest } = copyData as any;
    addProduct(rest);
  };

  const exportCsv = () => {
    const headers = [
      'SKU',
      'Nom',
      'Catégorie',
      'Fournisseur',
      'Prix Achat HT',
      'TVA %',
      'Prix Vente HT',
      'Prix Vente TTC',
      'Stock Actuel',
      'Unité',
      'Vente Poids',
      'Bio',
    ];
    const rows = filteredProducts.map((p) => [
      `"${p.sku}"`,
      `"${p.name.replace(/"/g, '""')}"`,
      `"${getCategoryName(p.categoryId)}"`,
      `"${getSupplierName(p.primarySupplierId)}"`,
      p.purchasePriceHt.toFixed(2),
      p.vatRate,
      p.priceHt.toFixed(2),
      p.priceTtc.toFixed(2),
      p.currentStock,
      p.unit,
      p.isWeighable ? 'Oui' : 'Non',
      p.isBio ? 'Oui' : 'Non',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogue_articles_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            Catalogue & Fiches Articles
          </h1>
          <p className="text-xs text-neutral-500">
            Gestion intégrale des produits alimentaires, vente au poids, TVA ventilée et traçabilité des lots.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-md shadow-2xs transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-neutral-500" />
            <span>Exporter CSV</span>
          </button>
          <button
            onClick={onOpenNewProduct}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Nouvel Article</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par nom, SKU, code-barres EAN-13, marque..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-neutral-200 focus:border-amber-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-medium rounded-lg border border-neutral-200 bg-white text-neutral-800 focus:border-amber-600 focus:outline-none"
            >
              <option value="all">Toutes les catégories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                filterLowStock
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Stock Bas Seul</span>
            </button>

            <button
              onClick={() => setFilterWeighable(!filterWeighable)}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                filterWeighable
                  ? 'bg-neutral-900 border-neutral-900 text-white'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              }`}
            >
              <Scale className="h-3.5 w-3.5" />
              <span>Vente au Poids</span>
            </button>
          </div>
        </div>

        {/* Counter & quick metadata */}
        <div className="flex items-center justify-between text-xs text-neutral-500 pt-1 border-t border-neutral-100">
          <div>
            <span>{filteredProducts.length} articles affichés</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Total catalogue : {products.length} références</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Astuce : Cliquez sur l'icône crayon pour renommer immédiatement un article.
          </div>
        </div>
      </div>

      {/* Table of Articles */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-700">
            <thead className="border-b border-neutral-200 bg-neutral-50/75 text-[11px] font-semibold text-neutral-500 uppercase">
              <tr>
                <th className="px-4 py-3">Article</th>
                <th className="px-4 py-3">Catégorie & Marque</th>
                <th className="px-4 py-3 text-right">Prix Achat HT</th>
                <th className="px-4 py-3 text-right">TVA</th>
                <th className="px-4 py-3 text-right">Prix Vente TTC</th>
                <th className="px-4 py-3 text-center">Stock & Unité</th>
                <th className="px-4 py-3 text-center">Traçabilité</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-neutral-400">
                    Aucun article ne correspond à votre recherche.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isLow = product.currentStock <= product.minStock;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-neutral-50/70 transition-colors group"
                    >
                      {/* Name & Image */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.imageUrl ? (
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              className="h-10 w-10 rounded-lg object-cover border border-neutral-200 shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center shrink-0 text-neutral-400">
                              <Layers className="h-4 w-4" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-neutral-900 truncate">
                                {product.name}
                              </span>
                              <button
                                onClick={() => setRenameTarget({ id: product.id, name: product.name })}
                                title="Renommer l'article (Exigence transversale)"
                                className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-amber-700 transition-opacity p-0.5"
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-mono">
                              <span>{product.sku}</span>
                              {product.barcodes.length > 0 && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{product.barcodes[0]}</span>
                                </>
                              )}
                              {product.isBio && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-600 font-sans font-medium">Bio</span>
                                </>
                              )}
                              {product.isWeighable && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-amber-700 font-sans font-medium">Poids</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="px-4 py-3">
                        <div className="text-neutral-900 font-medium">
                          {getCategoryName(product.categoryId)}
                        </div>
                        <div className="text-[11px] text-neutral-400">
                          {product.brand || getSupplierName(product.primarySupplierId)}
                        </div>
                      </td>

                      {/* Purchase Price */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-600">
                        {product.purchasePriceHt.toFixed(2)} €
                      </td>

                      {/* VAT */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums text-neutral-500">
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium text-[11px]">
                          {product.vatRate}%
                        </span>
                      </td>

                      {/* Price TTC */}
                      <td className="px-4 py-3 text-right font-mono tabular-nums font-bold text-neutral-900">
                        {product.priceTtc.toFixed(2)} €
                        {product.isWeighable && product.pricePerKg && (
                          <div className="text-[10px] font-normal text-neutral-400">
                            {product.pricePerKg.toFixed(2)} € / kg
                          </div>
                        )}
                      </td>

                      {/* Current Stock */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span
                            className={`font-mono tabular-nums font-bold text-xs ${
                              isLow ? 'text-amber-700' : 'text-neutral-900'
                            }`}
                          >
                            {product.currentStock} {product.unit}
                          </span>
                          {isLow && (
                            <span className="text-[10px] text-amber-600 font-medium flex items-center gap-0.5">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Seuil {product.minStock}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Lots / Traçabilité */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onViewLots(product.id)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 transition-colors"
                        >
                          Lots & DLC
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleDuplicate(product)}
                            title="Dupliquer l'article"
                            className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => onEditProduct(product)}
                            title="Modifier la fiche complète"
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded transition-colors"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Déplacer l'article "${product.name}" vers la corbeille ?`)) {
                                deleteProduct(product.id);
                              }
                            }}
                            title="Mettre en corbeille"
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Universal Transversal Rename Modal */}
      {renameTarget && (
        <RenameModal
          isOpen={true}
          onClose={() => setRenameTarget(null)}
          entityType="product"
          entityId={renameTarget.id}
          currentName={renameTarget.name}
        />
      )}
    </div>
  );
};
