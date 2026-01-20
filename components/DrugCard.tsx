
import React, { useState } from 'react';
import { DrugRecord, Product, DrugType, ProductCategory } from '../types';
import { AlertCircle, Pill, Activity, ChevronDown, CheckCircle, User, Calendar, Trash2, Tag, Edit3, X, Bookmark } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<DrugType | 'Overview'>('Overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const productsByType = drug.products.reduce((acc, p) => {
    if (!acc[p.type]) acc[p.type] = [];
    acc[p.type].push(p);
    return acc;
  }, {} as Record<string, Product[]>);

  const types = Object.keys(productsByType) as DrugType[];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-all">
      <div className="p-6 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800 border-b border-slate-100 dark:border-slate-700">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{drug.name}</h2>
              {drug.isVerified && (
                <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                  <CheckCircle size={10} /> Verificado
                </span>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {drug.symptoms?.map((s, idx) => (
                <span key={idx} className="bg-accent-soft text-accent text-[10px] font-black uppercase px-2 py-0.5 rounded-lg flex items-center gap-1 border border-accent/20">
                  <Tag size={10} /> {s}
                </span>
              ))}
            </div>

            <p className="text-slate-600 dark:text-slate-400 line-clamp-2 italic text-sm">{drug.indications}</p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button onClick={() => onEdit?.(drug)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit3 size={18} /></button>
            {confirmDelete ? (
              <div className="flex items-center gap-2">
                <button onClick={() => onDelete?.(drug.id)} className="p-2 bg-red-500 text-white rounded-lg"><Trash2 size={16} /></button>
                <button onClick={() => setConfirmDelete(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
            )}
            <button onClick={() => setExpanded(!expanded)} className={`p-2 transition-all text-slate-400 ${expanded ? 'rotate-180' : ''}`}><ChevronDown size={20} /></button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-6 space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 border-b dark:border-slate-700 pb-4">
            <span className="flex items-center gap-1.5"><User size={12} className="text-accent" /> Criado: {drug.createdBy || 'Sistema'}</span>
            {drug.lastEditedBy && <span className="flex items-center gap-1.5"><Edit3 size={12} className="text-amber-500" /> Editado: {drug.lastEditedBy}</span>}
            <span className="flex items-center gap-1.5"><Calendar size={12} /> Atualizado: {new Date(drug.lastUpdated).toLocaleDateString()}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <section>
                <h4 className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 mb-2 text-[10px] uppercase tracking-widest"><Activity size={14} className="text-accent" /> Mecanismo</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{drug.mechanismOfAction}</p>
              </section>
              <section>
                <h4 className="flex items-center gap-2 font-black text-slate-700 dark:text-slate-300 mb-2 text-[10px] uppercase tracking-widest"><Pill size={14} className="text-accent" /> Interações</h4>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{drug.interactions}</p>
              </section>
            </div>
            <div className="bg-red-50/50 dark:bg-red-900/10 p-5 rounded-xl border border-red-100 dark:border-red-900/30">
              <h4 className="flex items-center gap-2 font-black text-red-700 dark:text-red-400 mb-3 text-[10px] uppercase tracking-widest"><AlertCircle size={16} /> CONTRAINDICAÇÕES</h4>
              <p className="text-sm text-red-800 dark:text-red-300 font-bold leading-relaxed">{drug.contraindications}</p>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4 border-b dark:border-slate-700 pb-2">Marcas no Balcão</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {drug.products.map(product => (
                <div key={product.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col justify-between hover:border-accent group">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-black text-slate-800 dark:text-white leading-tight uppercase text-xs">{product.tradeName}</span>
                      <span className={`text-[8px] uppercase font-black px-2 py-0.5 rounded-full ring-2 ring-offset-2 dark:ring-offset-slate-800 ${CATEGORY_STYLES[product.category || 'Referência']}`}>
                        {product.category || 'Referência'}
                      </span>
                    </div>
                    <p className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 mb-3">{product.manufacturer}</p>
                    <div className="flex items-center justify-between text-[10px] font-black mb-3">
                      <span className="text-accent">{product.dosage}</span>
                      <span className="text-slate-500 px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 uppercase">{product.type}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-[8px] text-slate-400 uppercase font-black mb-1">Posologia</p>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic">"{product.commonDosage}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DrugCard;
