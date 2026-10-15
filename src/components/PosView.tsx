import React, { useState } from 'react';
import { useStore } from '../services/storeContext';
import { Product, Customer } from '../types';
import {
  Search,
  Barcode,
  Scale,
  CreditCard,
  Banknote,
  Receipt,
  User,
  Plus,
  Minus,
  Trash2,
  CheckCircle,
  RotateCcw,
} from 'lucide-react';

export const PosView: React.FC = () => {
  const { products, categories, customers, processSale, currentUser } = useStore();

  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<
    {
      product: Product;
      quantity: number;
      weightKg: number;
      discountPercent: number;
    }[]
  >([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Weighable modal / weighing prompt state
  const [weighingProduct, setWeighingProduct] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState<string>('0.350'); // 350g default

  // Payment modal state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'carte' | 'especes' | 'titre_resto' | 'virement'>('carte');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [lastCompletedSale, setLastCompletedSale] = useState<any | null>(null);

  // Filtered products for touchscreen
  const filteredProducts = products.filter((p) => {
    if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcodes.some((b) => b.includes(q))
      );
    }
    return true;
  });

  const handleAddToCart = (product: Product) => {
    if (product.isWeighable) {
      setWeighingProduct(product);
      setWeightInput('0.450'); // default 450g
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1, weightKg: 1, discountPercent: 0 }];
    });
  };

  const handleConfirmWeighing = () => {
    if (!weighingProduct) return;
    const weight = parseFloat(weightInput) || 0.1;
    setCart((prev) => {
      return [
        ...prev,
        {
          product: weighingProduct,
          quantity: 1,
          weightKg: weight,
          discountPercent: 0,
        },
      ];
    });
    setWeighingProduct(null);
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean) as any
    );
  };

  const removeCartItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Calculations
  const cartTotals = cart.reduce(
    (acc, item) => {
      const isWeight = item.product.isWeighable;
      const basePrice = isWeight
        ? (item.product.pricePerKg || item.product.priceTtc) * item.weightKg
        : item.product.priceTtc * item.quantity;
      const finalTtc = basePrice * (1 - item.discountPercent / 100);
      const vatRate = item.product.vatRate;
      const finalHt = finalTtc / (1 + vatRate / 100);

      acc.totalTtc += finalTtc;
      acc.totalHt += finalHt;
      acc.vatTotal += finalTtc - finalHt;
      return acc;
    },
    { totalTtc: 0, totalHt: 0, vatTotal: 0 }
  );

  const roundedTtc = Math.round(cartTotals.totalTtc * 100) / 100;
  const changeDue = Math.max(0, cashGiven - roundedTtc);

  const handleFinishSale = () => {
    if (cart.length === 0) return;

    const saleLines = cart.map((item) => {
      const isWeight = item.product.isWeighable;
      const unitPriceHt = item.product.priceHt;
      const qty = isWeight ? item.weightKg : item.quantity;
      const lineHt = Math.round(qty * unitPriceHt * (1 - item.discountPercent / 100) * 100) / 100;
      const lineTtc = Math.round(lineHt * (1 + item.product.vatRate / 100) * 100) / 100;

      return {
        productId: item.product.id,
        productName: item.product.name,
        isWeighable: isWeight,
        quantity: item.quantity,
        weightKg: isWeight ? item.weightKg : undefined,
        unit: item.product.unit,
        unitPriceHt,
        vatRate: item.product.vatRate,
        discountPercent: item.discountPercent,
        totalHt: lineHt,
        totalTtc: lineTtc,
      };
    });

    const sale = processSale({
      lines: saleLines,
      customerId: selectedCustomer?.id,
      paymentMethod,
      cashGiven: paymentMethod === 'especes' ? cashGiven : undefined,
      changeReturned: paymentMethod === 'especes' ? changeDue : undefined,
    });

    setLastCompletedSale(sale);
    setCart([]);
    setSelectedCustomer(null);
    setPaymentModalOpen(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-neutral-100 overflow-hidden select-none">
      {/* Left Column: Product Touch Catalog */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden border-r border-neutral-200">
        {/* Search & Category Filter Bar */}
        <div className="space-y-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan code-barres douchette ou recherche rapide produit..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white shadow-2xs focus:border-amber-600 focus:outline-none"
              />
            </div>
            {/* Quick barcode simulation button */}
            <button
              onClick={() => {
                const sample = products[Math.floor(Math.random() * products.length)];
                if (sample) handleAddToCart(sample);
              }}
              title="Simuler un scan de code-barres douchette"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-800 transition-colors"
            >
              <Barcode className="h-4 w-4" />
              <span className="hidden sm:inline">Scan Douchette</span>
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                selectedCat === 'all'
                  ? 'bg-neutral-900 text-white shadow-2xs'
                  : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              Tous ({products.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap ${
                  selectedCat === c.id
                    ? 'bg-neutral-900 text-white shadow-2xs'
                    : 'bg-white text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Touch Grid */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 pr-1">
          {filteredProducts.map((p) => (
            <button
              key={p.id}
              onClick={() => handleAddToCart(p)}
              className="flex flex-col justify-between text-left p-3 rounded-xl bg-white border border-neutral-200 hover:border-amber-600 hover:shadow-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
              {p.isWeighable && (
                <span className="absolute top-2 right-2 p-1 rounded bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-0.5 z-10">
                  <Scale className="h-3 w-3" />
                  Pesée
                </span>
              )}

              {p.imageUrl ? (
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-24 w-full object-cover rounded-lg mb-2"
                />
              ) : (
                <div className="h-24 w-full rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-300 mb-2">
                  <Receipt className="h-8 w-8" />
                </div>
              )}

              <div>
                <div className="text-xs font-bold text-neutral-900 group-hover:text-amber-900 line-clamp-1">
                  {p.name}
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  Stock : {p.currentStock} {p.unit}
                </div>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-black font-mono text-neutral-900">
                  {p.priceTtc.toFixed(2)} €
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {p.isWeighable ? '/ kg' : `TVA ${p.vatRate}%`}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Ticket / Cart Terminal */}
      <div className="w-full md:w-96 bg-white border-l border-neutral-200 flex flex-col justify-between shadow-lg">
        {/* Ticket Header & Customer Link */}
        <div className="p-4 border-b border-neutral-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-1.5">
              <Receipt className="h-4 w-4" />
              Ticket de Caisse en cours
            </span>
            <span className="text-xs font-mono text-neutral-500">
              Opérateur : {currentUser.name.split(' ')[0]}
            </span>
          </div>

          {/* Customer select */}
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-neutral-400" />
            <select
              value={selectedCustomer?.id || ''}
              onChange={(e) => {
                const found = customers.find((c) => c.id === e.target.value);
                setSelectedCustomer(found || null);
              }}
              className="flex-1 text-xs px-2 py-1.5 rounded border border-neutral-200 bg-neutral-50 font-medium"
            >
              <option value="">Client de passage (Anonyme)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.firstName || ''} ({c.loyaltyPoints} pts · {c.loyaltyTier})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-neutral-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 text-xs py-12">
              <Receipt className="h-10 w-10 text-neutral-300 mb-2 stroke-[1.5]" />
              <span>Panier de caisse vide</span>
              <span className="text-[11px] text-neutral-400 mt-1">
                Touchez un produit ou scannez à la douchette.
              </span>
            </div>
          ) : (
            cart.map((item) => {
              const itemTotal = item.product.isWeighable
                ? (item.product.pricePerKg || item.product.priceTtc) * item.weightKg
                : item.product.priceTtc * item.quantity;

              return (
                <div key={item.product.id} className="pt-2 first:pt-0 flex items-center justify-between">
                  <div className="flex-1 pr-2">
                    <div className="text-xs font-semibold text-neutral-900">
                      {item.product.name}
                    </div>
                    <div className="text-[11px] text-neutral-500 font-mono">
                      {item.product.isWeighable ? (
                        <span>
                          {item.weightKg} kg × {(item.product.pricePerKg || item.product.priceTtc).toFixed(2)} €/kg
                        </span>
                      ) : (
                        <span>
                          {item.quantity} × {item.product.priceTtc.toFixed(2)} €
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex items-center gap-1.5">
                    {!item.product.isWeighable ? (
                      <>
                        <button
                          onClick={() => updateCartQty(item.product.id, -1)}
                          className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.product.id, 1)}
                          className="p-1 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-700"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-mono font-bold text-neutral-900 bg-neutral-100 px-2 py-0.5 rounded">
                        {item.weightKg} kg
                      </span>
                    )}

                    <span className="w-16 text-right font-mono font-bold text-xs text-neutral-900">
                      {itemTotal.toFixed(2)} €
                    </span>

                    <button
                      onClick={() => removeCartItem(item.product.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 transition-colors ml-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Ticket Summary & Checkout Button */}
        <div className="p-4 border-t border-neutral-200 bg-neutral-50 space-y-3">
          <div className="space-y-1 text-xs font-mono">
            <div className="flex justify-between text-neutral-600">
              <span>Sous-total HT :</span>
              <span>{cartTotals.totalHt.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>TVA collectée :</span>
              <span>{cartTotals.vatTotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-lg font-black text-neutral-900 pt-1 border-t border-neutral-200">
              <span>TOTAL TTC :</span>
              <span>{roundedTtc.toFixed(2)} €</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setCart([])}
              disabled={cart.length === 0}
              className="px-3 py-2 text-xs font-semibold text-neutral-600 bg-white border border-neutral-300 hover:bg-neutral-100 disabled:opacity-40 rounded-lg transition-colors"
            >
              Annuler Ticket
            </button>

            <button
              onClick={() => {
                setCashGiven(Math.ceil(roundedTtc));
                setPaymentModalOpen(true);
              }}
              disabled={cart.length === 0}
              className="px-4 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 rounded-lg shadow-md transition-colors"
            >
              Encaisser ({roundedTtc.toFixed(2)} €)
            </button>
          </div>
        </div>
      </div>

      {/* Weighing Modal (Balance) */}
      {weighingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl border border-neutral-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Scale className="h-5 w-5" />
              <h3 className="text-sm font-bold text-neutral-900">
                Pesée : {weighingProduct.name}
              </h3>
            </div>

            <div className="p-4 bg-amber-50 rounded-lg text-center">
              <div className="text-[11px] text-amber-800 uppercase font-semibold">
                Prix au Kilogramme
              </div>
              <div className="text-lg font-bold font-mono text-amber-950">
                {(weighingProduct.pricePerKg || weighingProduct.priceTtc).toFixed(2)} € TTC / kg
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Poids mesuré par la balance (en kg)
              </label>
              <input
                type="number"
                step="0.005"
                autoFocus
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                className="w-full text-center text-2xl font-mono font-bold py-2 rounded-lg border border-neutral-300 focus:border-amber-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
              {['0.150', '0.250', '0.500', '0.750', '1.000', '1.500'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWeightInput(val)}
                  className="py-1.5 rounded border border-neutral-200 hover:bg-neutral-100"
                >
                  {val} kg
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setWeighingProduct(null)}
                className="flex-1 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmWeighing}
                className="flex-1 py-2 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-xs"
              >
                Ajouter au ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment & Cash Register Modal */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-2xl border border-neutral-200 p-6 space-y-5">
            <div className="text-center">
              <div className="text-xs text-neutral-500 uppercase font-semibold">
                Montant Total à Encaisser
              </div>
              <div className="text-3xl font-black font-mono text-neutral-900 mt-1">
                {roundedTtc.toFixed(2)} €
              </div>
            </div>

            {/* Mode selection */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-2">
                Sélectionnez le mode de paiement
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('carte')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    paymentMethod === 'carte'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Carte Bancaire</span>
                </button>

                <button
                  onClick={() => setPaymentMethod('especes')}
                  className={`p-3 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
                    paymentMethod === 'especes'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  <Banknote className="h-4 w-4" />
                  <span>Espèces</span>
                </button>
              </div>
            </div>

            {/* Espèces & calcul de rendu monnaie */}
            {paymentMethod === 'especes' && (
              <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-neutral-700">Montant reçu client :</span>
                  <input
                    type="number"
                    step="0.01"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                    className="w-28 text-right font-mono font-bold px-2 py-1 border border-neutral-300 rounded bg-white"
                  />
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-neutral-900 pt-2 border-t border-neutral-200">
                  <span>Rendu de monnaie calculé :</span>
                  <span className="font-mono text-emerald-700 text-base">
                    {changeDue.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
              >
                Retour
              </button>
              <button
                type="button"
                onClick={handleFinishSale}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-md"
              >
                Valider Encaissement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sale Success Notification */}
      {lastCompletedSale && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-neutral-900 text-white rounded-xl shadow-2xl flex items-center gap-3 border border-neutral-700 max-w-sm">
          <CheckCircle className="h-6 w-6 text-emerald-400 shrink-0" />
          <div className="flex-1 text-xs">
            <div className="font-bold">Vente enregistrée avec succès !</div>
            <div className="text-neutral-400 font-mono">
              Ticket {lastCompletedSale.ticketNumber} · {lastCompletedSale.totalTtc.toFixed(2)} €
            </div>
          </div>
          <button
            onClick={() => setLastCompletedSale(null)}
            className="text-xs px-2 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-300"
          >
            Fermer
          </button>
        </div>
      )}
    </div>
  );
};
