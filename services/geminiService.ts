
import { GoogleGenAI, Type } from "@google/genai";
import { DrugRecord, Product } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const DRUG_DATA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    indications: { type: Type.STRING, description: "Principais usos e sintomas tratados." },
    contraindications: { type: Type.STRING, description: "Quem não deve usar este medicamento." },
    interactions: { type: Type.STRING, description: "Principais interações com outros remédios." },
    mechanismOfAction: { type: Type.STRING, description: "Como a substância age no organismo." },
    symptoms: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Lista de sintomas que este medicamento trata (ex: dor, febre, tosse)."
    },
    standardDosage: { type: Type.STRING, description: "Posologia comum recomendada." },
    commonTradeNames: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          manufacturer: { type: Type.STRING },
          type: { type: Type.STRING, description: "Comprimido, Líquido, Xarope, etc." },
          category: { type: Type.STRING, description: "DEVE ser 'Referência', 'Similar' ou 'Genérico'." }
        },
        required: ["name", "category"]
      }
    }
  },
  required: ["indications", "contraindications", "interactions", "mechanismOfAction", "commonTradeNames", "symptoms"]
};

export async function fetchDrugKnowledge(activeIngredient: string) {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Gere informações técnicas detalhadas para o princípio ativo farmacêutico: ${activeIngredient}. 
  Foque em ser preciso para uso em balcão de farmácia. 
  Importante: Classifique corretamente cada nome comercial como 'Referência', 'Similar' ou 'Genérico'. 
  Geralmente há apenas um de Referência (ex: Tylenol para Paracetamol), os outros são Similares ou Genéricos.
  Identifique claramente os sintomas tratados como palavras-chave únicas (ex: ["dor", "febre", "inflamação"]).`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: DRUG_DATA_SCHEMA,
    },
  });

  return JSON.parse(response.text);
}

export async function getPharmaChatResponse(history: { role: 'user' | 'model', parts: { text: string }[] }[], context: DrugRecord[]) {
  const model = 'gemini-3-flash-preview';
  
  const systemInstruction = `Você é um assistente farmacêutico experiente chamado PharmaChat da Farmácias Econômica. 
  Use o contexto dos medicamentos cadastrados no banco de dados para responder dúvidas de balconistas. 
  Seja conciso e técnico. 
  Sempre alerte para consultar o farmacêutico responsável em casos graves ou dúvidas críticas.
  Aqui está a base de conhecimento atual (Princípios Ativos): ${JSON.stringify(context.map(c => ({ name: c.name, indications: c.indications, symptoms: c.symptoms }))) }.`;

  const response = await ai.models.generateContent({
    model,
    contents: history.map(h => ({ role: h.role, parts: h.parts })),
    config: {
      systemInstruction,
    }
  });

  return response.text;
}
