
import React, { useState, useEffect } from 'react';
import { Sparkles, Save, ShieldAlert, Loader2, Plus, Trash2, Tag, X, User } from 'lucide-react';
import { fetchDrugKnowledge } from '../services/geminiService';
import { DrugRecord, Product, DrugType, ProductCategory } from '../types';

interface DrugFormProps {
  onSave: (drug: DrugRecord) => void;
  onCancel: () => void;
  initialData?: DrugRecord | null;
}

const DrugForm: React.FC<DrugFormProps> = ({ onSave, onCancel, initialData }) => {
  const [activeIngredient, setActiveIngredient] = useState(initialData?.name || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const [newSymptom, setNewSymptom] = useState('');
  const [operatorName, setOperatorName] = useState('');
  
  const [formData, setFormData] = useState<Partial<DrugRecord>>({
    name: '',
    indications: '',
    contraindications: '',
    interactions: '',
    mechanismOfAction: '',
    symptoms: [],
    products: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      setOperatorName(initialData.lastEditedBy || initialData.verifiedBy || '');
    }
  }, [initialData]);

  const handleFetchAI = async () => {
    if (!activeIngredient) return;
    setIsLoading(true);
    try {
      const data = await fetchDrugKnowledge(activeIngredient);
      const generatedProducts: Product[] = data.commonTradeNames.map((p: any) => {
        let detectedType: DrugType = 'Comprimido';
        const rawType = p.type?.toLowerCase() || '';
        
        if (rawType.includes('xarope')) detectedType = 'Xarope';
        else if (rawType.includes('suspensão')) detectedType = 'Suspensão';
        else if (rawType.includes('líquido') || rawType.includes('gotas')) detectedType = 'Líquido';
        else if (rawType.includes('pomada') || rawType.includes('creme')) detectedType = 'Pomada';
        else if (rawType.includes('injetável')) detectedType = 'Injetável';
        else if (rawType.includes('cápsula')) detectedType = 'Cápsula';

        // Melhorando a captura de categoria
        let detectedCategory: ProductCategory = 'Similar';
        const rawCat = p.category?.toLowerCase() || '';
        if (rawCat.includes('referência') || rawCat.includes('referencia')) detectedCategory = 'Referência';
        else if (rawCat.includes('genérico') || rawCat.includes('generico')) detectedCategory = 'Genérico';

        return {
          id: Math.random().toString(36).substr(2, 9),
          tradeName: p.name,
          manufacturer: p.manufacturer || 'Desconhecido',
          type: detectedType,
          category: detectedCategory,
          dosage: '',
          quantity: '1 unidade',
          commonDosage: data.standardDosage,
          activeIngredientId: ''
        };
      });

      setFormData({
        ...formData,
        name: activeIngredient.toUpperCase(),
        indications: data.indications,
        contraindications: data.contraindications,
        interactions: data.interactions,
        mechanismOfAction: data.mechanismOfAction,
        symptoms: data.symptoms || [],
        products: generatedProducts
      });
    } catch (error) {
      console.error("Erro IA:", error);
      alert("Falha na IA. Verifique conexão.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (idx: number, field: keyof Product, value: any) => {
    const updated = [...(formData.products || [])];
    updated[idx] = { ...updated[idx], [field]: value };
    setFormData({ ...formData, products: updated });
  };

  const addSymptom = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newSymptom.trim()) {
      e.preventDefault();
      const s = newSymptom.trim().toLowerCase();
      if (!formData.symptoms?.includes(s)) {
        setFormData({ ...formData, symptoms: [...(formData.symptoms || []), s] });
      }
      setNewSymptom('');
    }
  };

  const removeSymptom = (s: string) => {
    setFormData({ ...formData, symptoms: formData.symptoms?.filter(sym => sym !== s) });
  };

  const addProduct = () => {
    const newProduct: Product = {
      id: Math.random().toString(36).substr(2, 9),
      tradeName: '',
      manufacturer: '',
      type: 'Comprimido',
      category: 'Referência',
      dosage: '',
      quantity: '',
      commonDosage: '',
      activeIngredientId: ''
    };
    setFormData({ ...formData, products: [...(formData.products || []), newProduct] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isReviewed || !operatorName.trim()) {
      alert("Por favor, informe seu nome e revise os dados.");
      return;
    }

    const record: DrugRecord = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || activeIngredient,
      indications: formData.indications || '',
      contraindications: formData.contraindications || '',
      interactions: formData.interactions || '',
      mechanismOfAction: formData.mechanismOfAction || '',
      symptoms: formData.symptoms || [],
      isVerified: true,
      verifiedBy: operatorName,
      createdBy: initialData?.createdBy || operatorName,
      lastEditedBy: initialData ? operatorName : undefined,
      lastUpdated: new Date().toISOString(),
      products: formData.products || []
    };

    onSave(record);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden max-w-4xl mx-auto mb-20">
      <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black uppercase tracking-widest">
            {initialData ? 'Editar Medicamento' : 'Novo Registro'}
          </h2>
        </div>
        <button onClick={onCancel} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        <div className="flex gap-4 items-end bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase text-slate-500 mb-2 tracking-widest">Princípio Ativo</label>
            <input 
              type="text"
              value={activeIngredient}
              onChange={(e) => setActiveIngredient(e.target.value)}
              placeholder="Ex: Nimesulida..."
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-accent outline-none text-sm font-bold uppercase"
            />
          </div>
          {!initialData && (
            <button 
              type="button"
              onClick={handleFetchAI}
              disabled={isLoading || !activeIngredient}
              className="flex items-center gap-2 bg-accent hover:bg-accent-hover disabled:bg-slate-300 text-white px-6 py-3.5 rounded-lg font-black uppercase text-xs transition-all shadow-lg shadow-accent/20"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />}
              Preencher com IA
            </button>
          )}
        </div>

        <div className="space-y-4">
          <label className="block text-[10px] font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
            <Tag size={14} className="text-accent" /> Sintomas e Tags
          </label>
          <div className="flex flex-wrap gap-2 p-3 border border-slate-200 dark:border-slate-700 rounded-xl min-h-[56px] items-center bg-white dark:bg-slate-900/30">
            {formData.symptoms?.map(s => (
              <span key={s} className="bg-accent-soft text-accent px-3 py-1.5 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-accent/20">
                {s} <button type="button" onClick={() => removeSymptom(s)} className="hover:text-red-500 transition-colors"><X size={12}/></button>
              </span>
            ))}
            <input 
              placeholder="Digite sintoma e Enter..."
              value={newSymptom}
              onChange={(e) => setNewSymptom(e.target.value)}
              onKeyDown={addSymptom}
              className="flex-1 min-w-[150px] outline-none bg-transparent text-xs font-bold dark:text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Indicações</label>
              <textarea 
                value={formData.indications}
                onChange={(e) => setFormData({...formData, indications: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white h-24 text-xs outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Ação Farmacológica</label>
              <textarea 
                value={formData.mechanismOfAction}
                onChange={(e) => setFormData({...formData, mechanismOfAction: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white h-24 text-xs outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase text-red-600 mb-1 tracking-widest">Contraindicações</label>
              <textarea 
                value={formData.contraindications}
                onChange={(e) => setFormData({...formData, contraindications: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-red-200 bg-red-50/30 text-red-900 dark:text-red-400 dark:bg-red-900/10 h-24 text-xs outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-500 mb-1 tracking-widest">Interações</label>
              <textarea 
                value={formData.interactions}
                onChange={(e) => setFormData({...formData, interactions: e.target.value})}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white h-24 text-xs outline-none focus:ring-2 focus:ring-accent"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b dark:border-slate-700 pb-2">
            <h3 className="font-black uppercase text-xs text-slate-800 dark:text-white tracking-widest">Apresentações Disponíveis</h3>
            <button type="button" onClick={addProduct} className="text-accent text-[10px] font-black uppercase flex items-center gap-1"><Plus size={16} /> Add Marca</button>
          </div>
          
          <div className="space-y-4">
            {formData.products?.map((prod, idx) => (
              <div key={prod.id} className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-slate-50 dark:bg-slate-900/40 p-5 rounded-xl relative border border-slate-200 dark:border-slate-700">
                <div className="md:col-span-1">
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Marca</label>
                  <input value={prod.tradeName} onChange={(e) => handleProductChange(idx, 'tradeName', e.target.value)} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold uppercase"/>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Tipo</label>
                  <select value={prod.type} onChange={(e) => handleProductChange(idx, 'type', e.target.value)} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold">
                    {['Comprimido', 'Líquido', 'Xarope', 'Suspensão', 'Pomada', 'Injetável', 'Cápsula', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Categoria</label>
                  <select value={prod.category} onChange={(e) => handleProductChange(idx, 'category', e.target.value)} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold">
                    {['Referência', 'Similar', 'Genérico'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Dosagem</label>
                  <input value={prod.dosage} onChange={(e) => handleProductChange(idx, 'dosage', e.target.value)} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"/>
                </div>
                <div>
                  <label className="block text-[8px] font-black text-slate-400 uppercase mb-1">Posologia</label>
                  <input value={prod.commonDosage} onChange={(e) => handleProductChange(idx, 'commonDosage', e.target.value)} className="w-full px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"/>
                </div>
                <button type="button" onClick={() => { const updated = [...(formData.products || [])]; updated.splice(idx, 1); setFormData({ ...formData, products: updated }); }} className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 shadow-lg"><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 w-full space-y-4">
             <div className="flex items-center gap-4 bg-accent/5 p-4 rounded-xl border border-accent/10">
                <User size={20} className="text-accent" />
                <div className="flex-1">
                  <label className="block text-[10px] font-black uppercase text-accent mb-1 tracking-widest">Seu Nome</label>
                  <input type="text" required value={operatorName} onChange={(e) => setOperatorName(e.target.value)} placeholder="Quem está salvando?" className="w-full bg-transparent border-none outline-none text-sm font-black dark:text-white uppercase placeholder:text-slate-400" />
                </div>
             </div>
             <label className="flex items-center gap-4 cursor-pointer">
              <input type="checkbox" checked={isReviewed} onChange={() => setIsReviewed(!isReviewed)} className="w-5 h-5 accent-accent" />
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Dados conferidos e precisos.</span>
             </label>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button type="button" onClick={onCancel} className="flex-1 px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest text-slate-500">Cancelar</button>
            <button type="submit" disabled={!isReviewed || !operatorName.trim()} className={`flex-1 px-12 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white shadow-xl ${isReviewed && operatorName.trim() ? 'bg-accent' : 'bg-slate-300'}`}>Salvar</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default DrugForm;
