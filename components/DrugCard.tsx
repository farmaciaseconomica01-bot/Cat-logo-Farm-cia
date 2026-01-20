
import React, { useState } from 'react';
import { DrugRecord, Product, DrugType, ProductCategory } from '../types';
import { AlertCircle, Pill, Activity, ChevronDown, CheckCircle, User, Calendar, Trash2, Tag, Edit3, X, Bookmark, ExternalLink } from 'lucide-react';

interface DrugCardProps {
  drug: DrugRecord;
  onDelete?: (id: string) => void;
  onEdit?: (drug: DrugRecord) => void;
}

const CATEGORY_STYLES: Record<ProductCategory, string> = {
  'Referência': 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ring-slate-200',
  'Similar': 'bg-blue-600 text-white ring-blue-100',
  'Genérico': 'bg-amber-400 text-slate-900 ring-amber-100 font-black'
};

const DrugCard: React.FC<DrugCardProps> = ({ drug, onDelete, onEdit }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Grouping symptoms for compact view
  const displaySymptoms = drug.symptoms?.slice(0, 3) || [];

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-xl hover:border-accent transition-all duration-300 flex flex-col h-full ${expanded ? 'col-span-full md:col-span-full lg:col-span-full' : ''}`}>
      {/* Compact Main Section */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4">
          <div className="bg-accent-soft p-3 rounded-2xl text-accent">
            <Pill size={24} />
          </div>
          <div className="flex gap-1">
            <button onClick={() => onEdit?.(drug)} className="p-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" title="Editar">
              <Edit3 size={18} />
            </button>
            {confirmDelete ? (
              <div className="flex gap-1 animate-in slide-in-from-right-2">
                <button onClick={() => onDelete?.(drug.id)} className="p-2 bg-red-500 text-white rounded-xl shadow-lg"><Trash2 size={16} /></button>
                <button onClick={() => setConfirmDelete(false)} className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" title="Excluir">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2 line-clamp-2">{drug.name}</h2>
          <div className="flex flex-wrap gap-1.5">
            {displaySymptoms.map((s, idx) => (
              <span key={idx} className="bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                {s}
              </span>
            ))}
            {drug.symptoms && drug.symptoms.length > 3 && (
              <span className="text-[9px] font-black text-slate-400 px-1">+{drug.symptoms.length - 3}</span>
            )}
          </div>
        </div>

        <p className="text-slate-500 dark:text-slate-400 text-xs italic leading-relaxed line-clamp-3 mb-6 flex-1">
          {drug.indications}
        </p>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{drug.products.length} Marcas</span>
            {drug.isVerified && <CheckCircle size={14} className="text-emerald-500" />}
          </div>
          <button 
            onClick={() => setExpanded(!expanded)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${expanded ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-accent hover:text-white'}`}
          >
            {expanded ? 'Recolher' : 'Detalhes'}
            <ChevronDown size={14} className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Expanded Section */}
      {expanded && (
        <div className="px-8 pb-8 space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-slate-700 pt-8">
            <div className="space-y-6">
              <section>
                <h4 className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 mb-3 text-[10px] uppercase tracking-widest">
                  <Activity size={14} className="text-accent" /> Mecanismo de Ação
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">{drug.mechanismOfAction}</p>
              </section>
              <section>
                <h4 className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 mb-3 text-[10px] uppercase tracking-widest">
                  <ExternalLink size={14} className="text-accent" /> Interações Importantes
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl">{drug.interactions}</p>
              </section>
            </div>
            
            <div className="bg-red-50/50 dark:bg-red-900/10 p-6 rounded-3xl border border-red-100 dark:border-red-900/30">
              <h4 className="flex items-center gap-2 font-black text-red-700 dark:text-red-400 mb-4 text-[10px] uppercase tracking-widest">
                <AlertCircle size={18} /> CONTRAINDICAÇÕES CRÍTICAS
              </h4>
              <p className="text-sm text-red-800 dark:text-red-300 font-bold leading-relaxed">{drug.contraindications}</p>
            </div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-6 border-b dark:border-slate-700 pb-3">Estoque e Marcas Disponíveis</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {drug.products.map(product => (
                <div key={product.id} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col justify-between hover:border-accent hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-black text-slate-800 dark:text-white leading-tight uppercase text-xs">{product.tradeName}</span>
                      <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ring-2 ring-offset-2 dark:ring-offset-slate-900 ${CATEGORY_STYLES[product.category || 'Referência']}`}>
                        {product.category || 'Referência'}
                      </span>
                    </div>
                    <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 mb-3 tracking-widest">{product.manufacturer}</p>
                    <div className="flex items-center justify-between text-[10px] font-black">
                      <span className="text-accent">{product.dosage || 'Dosagem N/A'}</span>
                      <span className="text-slate-500 px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 uppercase tracking-tighter">{product.type}</span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Posologia Padrão</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">"{product.commonDosage}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-t dark:border-slate-700 pt-6">
            <span className="flex items-center gap-1.5"><User size={12} className="text-accent" /> RT: {drug.verifiedBy || 'Sistema'}</span>
            <span className="flex items-center gap-1.5"><Calendar size={12} /> Última Atualização: {new Date(drug.lastUpdated).toLocaleDateString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugCard;
