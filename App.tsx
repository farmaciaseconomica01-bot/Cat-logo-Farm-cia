
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Database, Menu, X, Pill, 
  LayoutDashboard, Settings, TrendingUp, ShieldCheck, 
  Clock, Moon, Sun, Palette, Type, CheckCircle2, ChevronRight, Tag, Heart,
  Sparkles, MessageCircle, GitCompare, Info, Loader2, RefreshCcw
} from 'lucide-react';
import { DrugRecord, SearchFilters, DrugType, AppTab, AppSettings, FontFamily } from './types';
import DrugCard from './components/DrugCard';
import DrugForm from './components/DrugForm';
import { generateAIAssistance } from './services/geminiService';

const INITIAL_DATA: DrugRecord[] = [
  {
    id: '1',
    name: 'DIPIRONA SÓDICA',
    indications: 'Analgésico e antitérmico para tratamento de dor e febre.',
    contraindications: 'Alergia a pirazolonas, porfiria hepática, asma induzida por analgésicos.',
    interactions: 'Ciclosporina (diminuição de níveis séricos), álcool.',
    mechanismOfAction: 'Inibição da síntese de prostaglandinas no sistema nervoso central.',
    symptoms: ['dor', 'febre', 'dor de cabeça', 'enxaqueca'],
    isVerified: true,
    verifiedBy: 'Dr. Santos',
    createdBy: 'Sistema',
    lastUpdated: '2024-05-10T10:00:00Z',
    products: [
      {
        id: 'p1',
        tradeName: 'Novalgina',
        manufacturer: 'Sanofi',
        type: 'Xarope',
        category: 'Referência',
        dosage: '500mg/ml',
        quantity: '20ml',
        commonDosage: '40 a 80 gotas de 6/6h',
        activeIngredientId: '1'
      }
    ]
  }
];

const HEALTH_QUOTES = [
  "Cuidar da saúde do cliente é o nosso maior compromisso diário.",
  "A orientação correta salva vidas. Seja sempre técnico, preciso e humano.",
  "Um atendimento com empatia faz toda a diferença no sucesso do tratamento.",
  "Confira sempre a posologia; a segurança do paciente vem sempre em primeiro lugar.",
  "Medicamento é coisa séria. Transmita confiança, calma e conhecimento.",
  "Nosso conhecimento é a melhor ferramenta para o bem-estar da nossa comunidade.",
  "Sorriso no rosto e precisão técnica: a fórmula ideal do bom balconista.",
  "Atenção total às contraindicações. Proteção é a nossa prioridade absoluta.",
  "Excelência farmacêutica é garantir que o cliente saia com saúde e segurança.",
  "Trabalhamos para que cada cliente sinta-se acolhido, respeitado e bem orientado."
];

const DRUG_TYPES: DrugType[] = ['Comprimido', 'Líquido', 'Xarope', 'Suspensão', 'Pomada', 'Injetável', 'Cápsula'];

const ACCENT_COLORS: Record<string, { primary: string, hover: string, soft: string }> = {
  blue: { primary: '#2563eb', hover: '#1d4ed8', soft: '#dbeafe' },
  emerald: { primary: '#10b981', hover: '#059669', soft: '#d1fae5' },
  purple: { primary: '#8b5cf6', hover: '#7c3aed', soft: '#ede9fe' },
  rose: { primary: '#f43f5e', hover: '#e11d48', soft: '#ffe4e6' },
  teal: { primary: '#14b8a6', hover: '#0d9488', soft: '#ccfbf1' },
  violet: { primary: '#7c3aed', hover: '#6d28d9', soft: '#f5f3ff' },
  amber: { primary: '#f59e0b', hover: '#d97706', soft: '#fffbeb' },
  orange: { primary: '#f97316', hover: '#ea580c', soft: '#fff7ed' },
  pink: { primary: '#ec4899', hover: '#db2777', soft: '#fdf2f8' },
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [editingDrug, setEditingDrug] = useState<DrugRecord | null>(null);
  const [drugs, setDrugs] = useState<DrugRecord[]>(INITIAL_DATA);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    accentColor: 'blue',
    fontFamily: 'sans'
  });

  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    symptom: '',
    types: []
  });

  // IA Assistência State
  const [aiInput1, setAiInput1] = useState('');
  const [aiInput2, setAiInput2] = useState('');
  const [aiMode, setAiMode] = useState<'explain' | 'offer' | 'compare'>('explain');
  const [aiResult, setAiResult] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Rotação de frases
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HEALTH_QUOTES.length);
    }, 60000); // 1 minuto
    return () => clearInterval(interval);
  }, []);

  // Persistência
  useEffect(() => {
    const savedDrugs = localStorage.getItem('pharma_knowledge_db');
    const savedSettings = localStorage.getItem('pharma_settings');
    if (savedDrugs) setDrugs(JSON.parse(savedDrugs));
    if (savedSettings) setSettings(JSON.parse(savedSettings));
  }, []);

  useEffect(() => {
    localStorage.setItem('pharma_knowledge_db', JSON.stringify(drugs));
  }, [drugs]);

  useEffect(() => {
    localStorage.setItem('pharma_settings', JSON.stringify(settings));
    
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    const color = ACCENT_COLORS[settings.accentColor];
    document.documentElement.style.setProperty('--accent-primary', color.primary);
    document.documentElement.style.setProperty('--accent-hover', color.hover);
    document.documentElement.style.setProperty('--accent-soft', color.soft);
    
    document.body.style.fontFamily = `var(--font-${settings.fontFamily})`;
  }, [settings]);

  const availableSymptoms = useMemo(() => {
    const syms = new Set<string>();
    drugs.forEach(d => d.symptoms?.forEach(s => syms.add(s.toLowerCase())));
    return Array.from(syms).sort();
  }, [drugs]);

  const filteredDrugs = useMemo(() => {
    return drugs.filter(drug => {
      const matchQuery = !filters.query || 
        drug.name.toLowerCase().includes(filters.query.toLowerCase()) ||
        drug.products.some(p => p.tradeName.toLowerCase().includes(filters.query.toLowerCase()));
      
      const matchSymptom = !filters.symptom || 
        drug.symptoms?.some(s => s.toLowerCase() === filters.symptom.toLowerCase()) ||
        drug.indications.toLowerCase().includes(filters.symptom.toLowerCase());
      
      const matchType = filters.types.length === 0 || 
        drug.products.some(p => {
          if (filters.types.includes(p.type)) return true;
          if (filters.types.includes('Líquido') && (p.type === 'Xarope' || p.type === 'Suspensão')) return true;
          return false;
        });

      return matchQuery && matchSymptom && matchType;
    });
  }, [drugs, filters]);

  const stats = useMemo(() => ({
    total: drugs.length,
    verified: drugs.filter(d => d.isVerified).length,
    products: drugs.reduce((acc, d) => acc + d.products.length, 0),
    lastAdded: drugs.length > 0 ? drugs[0].name : 'Nenhum'
  }), [drugs]);

  const handleSaveDrug = (record: DrugRecord) => {
    if (editingDrug) {
      setDrugs(prev => prev.map(d => d.id === record.id ? record : d));
    } else {
      setDrugs(prev => [record, ...prev]);
    }
    setActiveTab('catalog');
    setEditingDrug(null);
  };

  const handleDeleteDrug = (id: string) => {
    setDrugs(prev => prev.filter(d => d.id !== id));
  };

  const handleEditDrug = (drug: DrugRecord) => {
    setEditingDrug(drug);
    setActiveTab('edit');
  };

  const toggleTypeFilter = (type: DrugType) => {
    setFilters(prev => ({
      ...prev,
      types: prev.types.includes(type) ? prev.types.filter(t => t !== type) : [...prev.types, type]
    }));
  };

  const handleGenerateAI = async () => {
    if (!aiInput1 || (aiMode === 'compare' && !aiInput2)) return;
    setIsAiLoading(true);
    setAiResult('');
    try {
      const res = await generateAIAssistance(aiMode, aiInput1, aiInput2);
      setAiResult(res || 'Sem resposta disponível.');
    } catch (e) {
      console.error(e);
      setAiResult('Erro de conexão com o servidor de IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={<Database className="text-accent" />} label="Princípios Ativos" value={stats.total} />
        <StatCard icon={<ShieldCheck className="text-emerald-500" />} label="Itens Verificados" value={stats.verified} />
        <StatCard icon={<Pill className="text-purple-500" />} label="Marcas em Base" value={stats.products} />
        <StatCard icon={<Clock className="text-amber-500" />} label="Recém Adicionado" value={stats.lastAdded} subtext="Último registro" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* IA Assistance Tool - Ultra Objective Version */}
          <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border-2 border-accent/20 dark:border-slate-700 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
                  <Sparkles size={24} className="text-accent animate-pulse" /> Assistência Rápida IA
                </h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Gere argumentos diretos para o cliente</p>
              </div>
              
              <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                <button 
                  onClick={() => { setAiMode('explain'); setAiResult(''); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'explain' ? 'bg-accent text-white shadow-lg' : 'text-slate-500'}`}
                >
                  O que é?
                </button>
                <button 
                  onClick={() => { setAiMode('offer'); setAiResult(''); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'offer' ? 'bg-accent text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Como vender?
                </button>
                <button 
                  onClick={() => { setAiMode('compare'); setAiResult(''); }}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${aiMode === 'compare' ? 'bg-accent text-white shadow-lg' : 'text-slate-500'}`}
                >
                  Comparar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
              <div className={`${aiMode === 'compare' ? 'md:col-span-5' : 'md:col-span-9'}`}>
                <input 
                  type="text" 
                  placeholder={aiMode === 'compare' ? "Remédio A..." : "Nome do medicamento..."}
                  value={aiInput1}
                  onChange={(e) => setAiInput1(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs font-bold dark:text-white focus:border-accent outline-none transition-all uppercase"
                />
              </div>
              {aiMode === 'compare' && (
                <div className="md:col-span-4">
                  <input 
                    type="text" 
                    placeholder="Remédio B..."
                    value={aiInput2}
                    onChange={(e) => setAiInput2(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-xs font-bold dark:text-white focus:border-accent outline-none transition-all uppercase"
                  />
                </div>
              )}
              <div className="md:col-span-3">
                <button 
                  onClick={handleGenerateAI}
                  disabled={isAiLoading || !aiInput1}
                  className="w-full h-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                >
                  {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <RefreshCcw size={18} />}
                  Gerar Texto
                </button>
              </div>
            </div>

            {aiResult && (
              <div className="mt-8 p-8 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-700 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="whitespace-pre-wrap text-slate-700 dark:text-slate-300 text-sm font-bold leading-relaxed font-mono">
                  {aiResult}
                </div>
                <div className="mt-6 pt-4 border-t dark:border-slate-700 flex justify-end">
                  <button onClick={() => setAiResult('')} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"><X size={14} /> Limpar</button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-2">
                <TrendingUp size={20} className="text-accent" /> Histórico Operacional
              </h3>
              <button onClick={() => setActiveTab('catalog')} className="text-[10px] font-black uppercase text-accent hover:underline tracking-widest">Abrir Catálogo</button>
            </div>
            <div className="space-y-4">
              {drugs.slice(0, 4).map(drug => (
                <div key={drug.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-accent/20 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent font-black">
                      {drug.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-800 dark:text-white text-xs uppercase tracking-tight">{drug.name}</p>
                      <p className="text-[9px] text-slate-400 uppercase font-black">Atualizado em {new Date(drug.lastUpdated).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => handleEditDrug(drug)} className="opacity-0 group-hover:opacity-100 p-2 text-slate-300 hover:text-accent transition-all">
                    <ChevronRight size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-accent p-8 rounded-3xl text-white shadow-2xl shadow-accent/20 flex flex-col justify-between min-h-[280px]">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Heart size={24} className="text-white fill-white/30" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter leading-tight">Nota de Cuidado</h3>
              <div className="h-[120px] flex items-center">
                <p className="text-white/90 text-sm font-bold italic leading-relaxed animate-in fade-in duration-1000" key={quoteIndex}>
                  "{HEALTH_QUOTES[quoteIndex]}"
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              {HEALTH_QUOTES.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${i === quoteIndex ? 'bg-white' : 'bg-white/20'}`} />
              ))}
            </div>
          </div>

          <button 
            onClick={() => { setEditingDrug(null); setActiveTab('add'); }}
            className="w-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black uppercase text-xs tracking-widest py-5 rounded-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl"
          >
            <Plus size={20} /> Novo Registro
          </button>
        </div>
      </div>
    </div>
  );

  const renderCatalog = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 flex items-center gap-2 tracking-widest">
              <Tag size={14} className="text-accent" /> Filtrar Sintoma
            </label>
            <select 
              value={filters.symptom}
              onChange={(e) => setFilters(prev => ({ ...prev, symptom: e.target.value }))}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-accent text-slate-800 dark:text-white transition-all"
            >
              <option value="">Todos os Sintomas</option>
              {availableSymptoms.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase mb-3 tracking-widest">Filtrar Apresentação</label>
            <div className="flex flex-wrap gap-2">
              {DRUG_TYPES.map(type => (
                <button 
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                    filters.types.includes(type) 
                    ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-accent'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-40">
        {filteredDrugs.length > 0 ? (
          filteredDrugs.map(drug => (
            <DrugCard key={drug.id} drug={drug} onDelete={handleDeleteDrug} onEdit={handleEditDrug} />
          ))
        ) : (
          <div className="col-span-full text-center py-32 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Pill size={48} className="mx-auto text-slate-200 dark:text-slate-600 mb-6" />
            <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[10px] tracking-[0.3em]">Base de dados vazia para este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-top-4 duration-500 pb-20">
      <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        <div className="p-10 border-b dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter flex items-center gap-3">
            <Settings className="text-accent" /> Preferências do Sistema
          </h2>
        </div>

        <div className="p-10 space-y-12">
          <section className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-accent shadow-inner">
                {settings.darkMode ? <Moon size={24} /> : <Sun size={24} />}
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Interface Visual</h4>
                <p className="text-[9px] font-black text-slate-500 uppercase opacity-60 tracking-wider">Alternar entre claro e escuro</p>
              </div>
            </div>
            <button 
              onClick={() => setSettings(s => ({ ...s, darkMode: !s.darkMode }))}
              className={`w-16 h-9 rounded-full relative transition-all duration-300 shadow-inner ${settings.darkMode ? 'bg-accent' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${settings.darkMode ? 'right-1' : 'left-1'}`} />
            </button>
          </section>

          <section className="space-y-6">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-accent shadow-inner">
                <Palette size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Identidade Visual</h4>
                <p className="text-[9px] font-black text-slate-500 uppercase opacity-60 tracking-wider">Selecione a cor de destaque da loja</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-5 pl-1">
              {Object.keys(ACCENT_COLORS).map((color: any) => (
                <button 
                  key={color}
                  onClick={() => setSettings(s => ({ ...s, accentColor: color }))}
                  title={color}
                  className={`w-12 h-12 rounded-2xl border-4 transition-all hover:scale-110 flex items-center justify-center relative ${
                    color === 'blue' ? 'bg-blue-500 border-blue-50' : 
                    color === 'emerald' ? 'bg-emerald-500 border-emerald-50' :
                    color === 'purple' ? 'bg-purple-500 border-purple-50' : 
                    color === 'teal' ? 'bg-teal-500 border-teal-50' :
                    color === 'violet' ? 'bg-violet-600 border-violet-50' :
                    color === 'amber' ? 'bg-amber-500 border-amber-50' :
                    color === 'orange' ? 'bg-orange-500 border-orange-50' :
                    color === 'pink' ? 'bg-pink-500 border-pink-50' :
                    'bg-rose-500 border-rose-50'
                  } ${settings.accentColor === color ? 'ring-4 ring-slate-900 dark:ring-white scale-110 opacity-100 shadow-lg' : 'opacity-40 grayscale-[0.3]'}`}
                >
                  {settings.accentColor === color && <div className="w-2 h-2 bg-white rounded-full animate-ping" />}
                </button>
              ))}
            </div>
          </section>

          <section className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-2xl text-accent shadow-inner">
                <Type size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-800 dark:text-white uppercase text-xs tracking-widest">Fonte do Catálogo</h4>
                <p className="text-[9px] font-black text-slate-500 uppercase opacity-60 tracking-wider">Estilo da tipografia para leitura</p>
              </div>
            </div>
            <select 
              value={settings.fontFamily}
              onChange={(e) => setSettings(s => ({ ...s, fontFamily: e.target.value as FontFamily }))}
              className="bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3 text-xs font-black uppercase text-slate-800 dark:text-white outline-none focus:ring-4 focus:ring-accent/20 transition-all"
            >
              <option value="sans">Modern Sans</option>
              <option value="serif">Classic Serif</option>
              <option value="mono">Technical Mono</option>
              <option value="montserrat">Montserrat Bold</option>
            </select>
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex bg-slate-50 dark:bg-slate-900 transition-colors duration-300 font-${settings.fontFamily}`}>
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-white z-40 transition-all duration-300 overflow-hidden ${isSidebarOpen ? 'w-64 shadow-2xl' : 'w-0 lg:w-20'}`}>
        <div className="flex flex-col h-full p-6">
          <div className="flex items-center gap-4 mb-16 mt-2">
            <div className="bg-teal-500 p-2.5 rounded-2xl shadow-xl shadow-teal-500/20">
              <Pill size={28} className="text-white" />
            </div>
            {isSidebarOpen && (
              <h1 className="font-black text-lg tracking-tighter uppercase leading-none text-teal-400">
                Farmácias<br/>Econômica
              </h1>
            )}
          </div>

          <nav className="flex-1 space-y-4">
            <NavItem icon={<LayoutDashboard size={20} />} label="Início" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} expanded={isSidebarOpen} />
            <NavItem icon={<Database size={20} />} label="Catálogo" active={activeTab === 'catalog'} onClick={() => setActiveTab('catalog')} expanded={isSidebarOpen} />
            <NavItem icon={<Settings size={20} />} label="Ajustes" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} expanded={isSidebarOpen} />
          </nav>

          <div className="mt-auto border-t border-slate-800 pt-8">
            <div className="flex items-center gap-4 bg-slate-800/50 p-3 rounded-2xl overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-teal-500 shrink-0 flex items-center justify-center font-black text-white">RT</div>
              {isSidebarOpen && (
                <div className="truncate">
                  <p className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Farmacêutico</p>
                  <p className="text-[10px] font-black text-white truncate">Responsável Técnico</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <header className="h-24 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl text-slate-500 transition-all">
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h2 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] hidden sm:block opacity-60">
              {activeTab === 'dashboard' ? 'Painel Interno' : 
               activeTab === 'catalog' ? 'Biblioteca de Fármacos' : 
               activeTab === 'settings' ? 'Preferências do App' : 
               activeTab === 'edit' ? 'Editar Registro' : 'Novo Cadastro'}
            </h2>
          </div>

          <div className="flex-1 max-w-xl mx-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Busca global de ativos..."
                value={filters.query}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, query: e.target.value }));
                  if (activeTab !== 'catalog') setActiveTab('catalog');
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-2xl py-3.5 pl-12 pr-6 outline-none focus:ring-4 focus:ring-accent/10 text-xs font-black uppercase tracking-widest dark:text-white placeholder:text-slate-400"
              />
            </div>
          </div>

          <button 
            onClick={() => { setEditingDrug(null); setActiveTab('add'); }}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
              activeTab === 'add' ? 'bg-slate-200 dark:bg-slate-800 text-slate-500' : 'bg-accent text-white hover:scale-105 shadow-accent/30 dark:shadow-none'
            }`}
          >
            <Plus size={18} />
            <span className="hidden lg:inline">Cadastrar</span>
          </button>
        </header>

        <div className="flex-1 p-8 md:p-12 overflow-x-hidden">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'catalog' && renderCatalog()}
          {activeTab === 'settings' && renderSettings()}
          {(activeTab === 'add' || activeTab === 'edit') && (
            <DrugForm 
              initialData={editingDrug}
              onSave={handleSaveDrug} 
              onCancel={() => { setEditingDrug(null); setActiveTab('dashboard'); }} 
            />
          )}
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick, expanded }: { icon: any, label: string, active: boolean, onClick: () => void, expanded: boolean }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all relative group ${
      active 
        ? 'bg-accent text-white shadow-2xl shadow-accent/40' 
        : 'text-slate-500 hover:text-white hover:bg-slate-800'
    }`}
  >
    <span className="shrink-0">{icon}</span>
    {expanded && <span className="font-black text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">{label}</span>}
    {active && <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse shadow-md" />}
  </button>
);

const StatCard = ({ icon, label, value, subtext }: { icon: any, label: string, value: string | number, subtext?: string }) => (
  <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
    <div className="flex justify-between items-start mb-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl text-accent shadow-inner">
        {icon}
      </div>
    </div>
    <div className="space-y-2">
      <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter uppercase">{value}</p>
      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none">{label}</p>
      {subtext && <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest pt-2 border-t border-slate-100 dark:border-slate-700/50">{subtext}</p>}
    </div>
  </div>
);

export default App;
