import React, { useState, useEffect } from 'react';
import { useStore } from '../services/storeContext';
import { Product } from '../types';
import { X, Check, Barcode, Sparkles, Tag, ShieldAlert, Scale, Calculator } from 'lucide-react';

interface ArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const COMMON_ALLERGENS = [
  'Lait',
  'Gluten',
  'Œufs',
  'Fruits à coque',
  'Arachides',
  'Soja',
  'Poissons',
  'Crustacés',
  'Mollusques',
  'Céleri',
  'Moutarde',
  'Sésame',
  'Sulfites',
  'Lupin',
];

export const ArticleModal: React.FC<ArticleModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, suppliers, addProduct, updateProduct } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'stock' | 'quality' | 'nutrition'>('general');

  // Form states
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brand, setBrand] = useState('');
  const [primarySupplierId, setPrimarySupplierId] = useState('');
  const [unit, setUnit] = useState<Product['unit']>('piece');
  const [unitWeightKg, setUnitWeightKg] = useState(1);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [barcodes, setBarcodes] = useState<string[]>([]);
  const [purchasePriceHt, setPurchasePriceHt] = useState<number>(5.0);
  const [vatRate, setVatRate] = useState<5.5 | 10 | 20>(5.5);
  const [priceHt, setPriceHt] = useState<number>(7.58);
  const [priceTtc, setPriceTtc] = useState<number>(8.0);
  const [marginPercent, setMarginPercent] = useState<number>(34.0);
  const [isWeighable, setIsWeighable] = useState(false);
  const [pricePerKg, setPricePerKg] = useState<number>(8.0);
  const [isBio, setIsBio] = useState(false);
  const [isLocal, setIsLocal] = useState(true);
  const [isAop, setIsAop] = useState(false);
  const [originCountry, setOriginCountry] = useState('France');
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dlcDdmDefaultDays, setDlcDdmDefaultDays] = useState(30);
  const [minStock, setMinStock] = useState(5);
  const [maxStock, setMaxStock] = useState(40);
  const [reorderPoint, setReorderPoint] = useState(10);
  const [hasBatchManagement, setHasBatchManagement] = useState(true);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setDescription(productToEdit.description || '');
      setImageUrl(productToEdit.imageUrl || '');
      setCategoryId(productToEdit.categoryId);
      setBrand(productToEdit.brand || '');
      setPrimarySupplierId(productToEdit.primarySupplierId);
      setUnit(productToEdit.unit);
      setUnitWeightKg(productToEdit.unitWeightKg || 1);
      setBarcodes(productToEdit.barcodes || []);
      setPurchasePriceHt(productToEdit.purchasePriceHt);
      setVatRate(productToEdit.vatRate);
      setPriceHt(productToEdit.priceHt);
      setPriceTtc(productToEdit.priceTtc);
      setMarginPercent(productToEdit.marginPercent);
      setIsWeighable(productToEdit.isWeighable);
      setPricePerKg(productToEdit.pricePerKg || productToEdit.priceTtc);
      setIsBio(productToEdit.isBio);
      setIsLocal(productToEdit.isLocal);
      setIsAop(productToEdit.isAop);
      setOriginCountry(productToEdit.originCountry);
      setAllergens(productToEdit.allergens || []);
      setDlcDdmDefaultDays(productToEdit.dlcDdmDefaultDays);
      setMinStock(productToEdit.minStock);
      setMaxStock(productToEdit.maxStock);
      setReorderPoint(productToEdit.reorderPoint);
      setHasBatchManagement(productToEdit.hasBatchManagement);
    } else {
      // Default reset
      const randomSku = `ART-${Math.floor(1000 + Math.random() * 9000)}`;
      setSku(randomSku);
      setName('');
      setDescription('');
      setImageUrl('/src/assets/images/product_fromage_comte_1792022152742.jpg');
      setCategoryId(categories[0]?.id || 'cat-01');
      setBrand('');
      setPrimarySupplierId(suppliers[0]?.id || 'sup-01');
      setUnit('piece');
      setUnitWeightKg(1);
      setBarcodes([`376${Math.floor(100000000 + Math.random() * 900000000)}`]);
      setPurchasePriceHt(5.0);
      setVatRate(5.5);
      setPriceHt(7.58);
      setPriceTtc(8.0);
      setMarginPercent(34.0);
      setIsWeighable(false);
      setPricePerKg(8.0);
      setIsBio(false);
      setIsLocal(true);
      setIsAop(false);
      setOriginCountry('France');
      setAllergens([]);
      setDlcDdmDefaultDays(30);
      setMinStock(5);
      setMaxStock(40);
      setReorderPoint(10);
      setHasBatchManagement(true);
    }
  }, [productToEdit, isOpen, categories, suppliers]);

  if (!isOpen) return null;

  // Calculs auto TVA & Marges
  const handlePriceHtChange = (newHt: number) => {
    setPriceHt(newHt);
    const ttc = Math.round(newHt * (1 + vatRate / 100) * 100) / 100;
    setPriceTtc(ttc);
    if (newHt > 0) {
      const margin = Math.round(((newHt - purchasePriceHt) / newHt) * 1000) / 10;
      setMarginPercent(margin);
    }
    if (isWeighable && unitWeightKg > 0) {
      setPricePerKg(Math.round((ttc / unitWeightKg) * 100) / 100);
    }
  };

  const handlePriceTtcChange = (newTtc: number) => {
    setPriceTtc(newTtc);
    const ht = Math.round((newTtc / (1 + vatRate / 100)) * 100) / 100;
    setPriceHt(ht);
    if (ht > 0) {
      const margin = Math.round(((ht - purchasePriceHt) / ht) * 1000) / 10;
      setMarginPercent(margin);
    }
    if (isWeighable && unitWeightKg > 0) {
      setPricePerKg(Math.round((newTtc / unitWeightKg) * 100) / 100);
    }
  };

  const handleVatRateChange = (newRate: 5.5 | 10 | 20) => {
    setVatRate(newRate);
    const ttc = Math.round(priceHt * (1 + newRate / 100) * 100) / 100;
    setPriceTtc(ttc);
  };

  const handlePurchasePriceChange = (newPurchase: number) => {
    setPurchasePriceHt(newPurchase);
    if (priceHt > 0) {
      const margin = Math.round(((priceHt - newPurchase) / priceHt) * 1000) / 10;
      setMarginPercent(margin);
    }
  };

  const generateBarcode = () => {
    // Generate valid EAN-13 starting with 376 (France)
    const prefix = '376';
    let code = prefix;
    for (let i = 0; i < 9; i++) {
      code += Math.floor(Math.random() * 10).toString();
    }
    // Calculate EAN-13 checksum
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(code[i], 10) * (i % 2 === 0 ? 1 : 3);
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    const finalBarcode = code + checkDigit;
    setBarcodes([...barcodes, finalBarcode]);
  };

  const handleAddBarcodeFromInput = () => {
    if (barcodeInput.trim() && !barcodes.includes(barcodeInput.trim())) {
      setBarcodes([...barcodes, barcodeInput.trim()]);
      setBarcodeInput('');
    }
  };

  const toggleAllergen = (item: string) => {
    if (allergens.includes(item)) {
      setAllergens(allergens.filter((a) => a !== item));
    } else {
      setAllergens([...allergens, item]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload = {
      sku: sku.trim() || `SKU-${Date.now()}`,
      name: name.trim(),
      description,
      imageUrl,
      categoryId,
      brand,
      primarySupplierId,
      unit,
      unitWeightKg,
      barcodes,
      priceHt,
      vatRate,
      priceTtc,
      purchasePriceHt,
      marginPercent,
      pricePerKg: isWeighable ? (pricePerKg || priceTtc) : undefined,
      isWeighable,
      isBio,
      isLocal,
      isAop,
      originCountry,
      allergens,
      dlcDdmDefaultDays,
      minStock,
      maxStock,
      reorderPoint,
      hasBatchManagement,
      active: true,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, payload);
    } else {
      addProduct(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 overflow-y-auto">
      <div className="w-full max-w-3xl my-8 rounded-xl bg-white shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/50">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              {productToEdit ? `Modifier l'article : ${productToEdit.name}` : "Ajouter un nouvel article au catalogue"}
            </h3>
            <p className="text-xs text-neutral-500">
              Fiche article complète avec TVA française, vente au poids, gestion des lots et traçabilité.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200 bg-white px-6 gap-2 pt-2">
          {[
            { id: 'general', label: '1. Informations Générales' },
            { id: 'pricing', label: '2. Tarification & TVA (5.5/10/20%)' },
            { id: 'stock', label: '3. Lots, DLC & Seuils' },
            { id: 'quality', label: '4. Origine & Qualité' },
            { id: 'nutrition', label: '5. Allergènes & Nutrition' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-2.5 px-3 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-neutral-900 text-neutral-900 font-semibold'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Code Article (SKU) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="Ex: FRO-COMTE-18M"
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Nom Commercial de l'Article <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Comté AOP Affinage 18 Mois"
                    className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description détaillée / Notes de dégustation
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Notes aromatiques, méthode de fabrication, conseils de conservation..."
                  className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Marque / Producteur
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Ferme des Hautes Combes"
                    className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Fournisseur Référencé
                  </label>
                  <select
                    value={primarySupplierId}
                    onChange={(e) => setPrimarySupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Codes Barres & EAN-13 */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Barcode className="h-4 w-4 text-neutral-700" />
                    <span className="text-xs font-semibold text-neutral-800">
                      Codes-Barres EAN-13 & Scanner Douchette
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={generateBarcode}
                    className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-amber-900 bg-amber-100 hover:bg-amber-200 rounded transition-colors"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Générer EAN-13 valide</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Saisir ou scanner avec la douchette..."
                    className="flex-1 px-3 py-1.5 text-xs font-mono rounded border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddBarcodeFromInput}
                    className="px-3 py-1.5 text-xs font-medium text-neutral-700 bg-white border border-neutral-300 hover:bg-neutral-100 rounded"
                  >
                    Ajouter
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {barcodes.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-neutral-200 text-xs font-mono text-neutral-800"
                    >
                      {code}
                      <button
                        type="button"
                        onClick={() => setBarcodes(barcodes.filter((b) => b !== code))}
                        className="text-neutral-400 hover:text-rose-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Image URL / Selection */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Photo de l'article (URL ou asset local)
                </label>
                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="/src/assets/images/product_fromage_comte_..."
                    className="flex-1 px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt="Aperçu"
                      className="h-10 w-10 object-cover rounded-md border border-neutral-200"
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-5">
              {/* Vente au poids */}
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-amber-700" />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">
                      Article vendu au poids (pesée en caisse / balance)
                    </span>
                    <span className="text-[11px] text-neutral-500">
                      Calcul automatique du montant lors de la saisie des grammes ou kilos en caisse.
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isWeighable}
                  onChange={(e) => setIsWeighable(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Unité de vente
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  >
                    <option value="piece">À la pièce / Unité</option>
                    <option value="kg">Au Kilogramme (kg)</option>
                    <option value="g">Au Gramme (g)</option>
                    <option value="litre">Au Litre (L)</option>
                    <option value="cl">Au Centilitre (cl)</option>
                    <option value="barquette">Barquette</option>
                    <option value="lot">Lot de plusieurs unités</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Poids net moyen unitaire (en kg)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitWeightKg}
                    onChange={(e) => setUnitWeightKg(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                </div>
              </div>

              {/* Taux TVA & Calculatrice */}
              <div className="border border-neutral-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-neutral-700" />
                    <span className="text-xs font-bold text-neutral-900">
                      TVA Française & Décomposition des Prix
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-500">
                    Arrondi légal à 2 décimales
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Prix d'Achat Fournisseur HT
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={purchasePriceHt}
                        onChange={(e) => handlePurchasePriceChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-neutral-400">€ HT</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Taux de TVA Français
                    </label>
                    <select
                      value={vatRate}
                      onChange={(e) => handleVatRateChange(parseFloat(e.target.value) as any)}
                      className="w-full px-3 py-2 text-xs font-mono font-medium rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none bg-neutral-50"
                    >
                      <option value={5.5}>5.5% (Alimentation courante / bio)</option>
                      <option value={10}>10% (Consommation immédiate / traiteur)</option>
                      <option value={20}>20% (Alcools / confiseries / non-alim)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Prix de Vente HT
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={priceHt}
                        onChange={(e) => handlePriceHtChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-neutral-400">€ HT</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-900 mb-1">
                      Prix de Vente TTC (affiché client)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        value={priceTtc}
                        onChange={(e) => handlePriceTtcChange(parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-xs font-mono font-bold rounded-md border border-neutral-400 bg-amber-50/40 text-amber-950 focus:border-amber-600 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-neutral-500 font-bold">€ TTC</span>
                    </div>
                  </div>
                </div>

                {/* Recap marge */}
                <div className="flex items-center justify-between text-xs pt-2 border-t border-neutral-100 text-neutral-600 font-mono">
                  <div>
                    Marge Brute Unitaire :{' '}
                    <span className="font-semibold text-neutral-900">
                      {(priceHt - purchasePriceHt).toFixed(2)} € HT
                    </span>
                  </div>
                  <div>
                    Taux de Marque :{' '}
                    <span className="font-semibold text-emerald-700">
                      {marginPercent.toFixed(1)}%
                    </span>
                  </div>
                  {isWeighable && (
                    <div>
                      Prix au kilo calculé :{' '}
                      <span className="font-semibold text-neutral-900">
                        {pricePerKg.toFixed(2)} € TTC / kg
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'stock' && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-neutral-900 block">
                    Gestion stricte des Lots et Dates (DLC / DDM)
                  </span>
                  <span className="text-[11px] text-neutral-500">
                    Active le suivi unitaire par numéro de lot avec rotation FEFO (First Expired, First Out).
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hasBatchManagement}
                  onChange={(e) => setHasBatchManagement(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Durée de conservation typique (en jours après réception)
                </label>
                <input
                  type="number"
                  value={dlcDdmDefaultDays}
                  onChange={(e) => setDlcDdmDefaultDays(parseInt(e.target.value) || 30)}
                  placeholder="Ex: 45 pour un fromage, 4 pour du pain, 365 pour une conserve"
                  className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-neutral-500">
                  Cette durée pré-calcule automatiquement la DLC lors des réceptions de bons de commande.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Minimum d'Alerte
                  </label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400">Déclenche alerte rupture</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Point de Réapprovisionnement
                  </label>
                  <input
                    type="number"
                    value={reorderPoint}
                    onChange={(e) => setReorderPoint(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400">Suggestion commande fournisseur</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">
                    Stock Maximum (Capacité)
                  </label>
                  <input
                    type="number"
                    value={maxStock}
                    onChange={(e) => setMaxStock(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-neutral-400">Évite le surstockage périssable</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'quality' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isBio}
                    onChange={(e) => setIsBio(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">Certifié Bio (AB)</span>
                    <span className="text-[10px] text-neutral-500">Agriculture biologique</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isLocal}
                    onChange={(e) => setIsLocal(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-amber-600 focus:ring-amber-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">Producteur Local</span>
                    <span className="text-[10px] text-neutral-500">Circuit court (&lt; 100 km)</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3.5 rounded-lg border border-neutral-200 cursor-pointer hover:bg-neutral-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={isAop}
                    onChange={(e) => setIsAop(e.target.checked)}
                    className="h-4 w-4 rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="text-xs font-semibold text-neutral-900 block">AOP / AOC / IGP</span>
                    <span className="text-[10px] text-neutral-500">Appellation protégée</span>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Pays / Région d'Origine
                </label>
                <input
                  type="text"
                  value={originCountry}
                  onChange={(e) => setOriginCountry(e.target.value)}
                  placeholder="Ex: France (Jura)"
                  className="w-full px-3 py-2 text-xs rounded-md border border-neutral-300 focus:border-amber-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeTab === 'nutrition' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldAlert className="h-4 w-4 text-amber-700" />
                  <label className="text-xs font-bold text-neutral-900">
                    Allergènes Réglementaires (Règlement INCO 1169/2011)
                  </label>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COMMON_ALLERGENS.map((item) => {
                    const isChecked = allergens.includes(item);
                    return (
                      <button
                        type="button"
                        key={item}
                        onClick={() => toggleAllergen(item)}
                        className={`text-left px-2.5 py-1.5 rounded text-xs border transition-colors flex items-center justify-between ${
                          isChecked
                            ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                            : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{item}</span>
                        {isChecked && <Check className="h-3 w-3 text-rose-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-md transition-colors"
            >
              Annuler
            </button>
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 hover:bg-neutral-800 rounded-md shadow-xs transition-colors"
              >
                <Check className="h-4 w-4" />
                <span>{productToEdit ? "Enregistrer les modifications" : "Créer l'article"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
