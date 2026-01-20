
export type DrugType = 'Comprimido' | 'Líquido' | 'Xarope' | 'Suspensão' | 'Pomada' | 'Injetável' | 'Cápsula' | 'Outro';
export type ProductCategory = 'Referência' | 'Similar' | 'Genérico';

export interface Product {
  id: string;
  activeIngredientId: string;
  tradeName: string;
  manufacturer: string;
  type: DrugType;
  category: ProductCategory;
  dosage: string;
  quantity: string;
  commonDosage: string;
}

export interface ActiveIngredient {
  id: string;
  name: string;
  indications: string;
  contraindications: string;
  interactions: string;
  mechanismOfAction: string;
  symptoms: string[];
  isVerified: boolean;
  verifiedBy?: string;
  createdBy?: string;
  lastEditedBy?: string;
  lastUpdated: string;
}

export interface DrugRecord extends ActiveIngredient {
  products: Product[];
}

export interface SearchFilters {
  query: string;
  symptom: string;
  types: DrugType[];
}

export type AppTab = 'dashboard' | 'catalog' | 'settings' | 'add' | 'edit';

export type FontFamily = 'sans' | 'serif' | 'mono' | 'montserrat';

export interface AppSettings {
  darkMode: boolean;
  accentColor: 'blue' | 'emerald' | 'purple' | 'rose' | 'teal' | 'violet' | 'amber' | 'orange' | 'pink';
  fontFamily: FontFamily;
}
