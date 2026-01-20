
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
  Classifique corretamente cada nome comercial como 'Referência', 'Similar' ou 'Genérico'. 
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

export async function generateAIAssistance(mode: 'explain' | 'offer' | 'compare', drug1: string, drug2?: string) {
  const model = 'gemini-3-flash-preview';
  
  let prompt = '';
  if (mode === 'explain') {
    prompt = `Explique objetivamente o que é e para que serve "${drug1}".`;
  } else if (mode === 'offer') {
    prompt = `Dê 3 argumentos rápidos e profissionais de venda para oferecer "${drug1}" ao cliente no balcão.`;
  } else if (mode === 'compare') {
    prompt = `Compare brevemente "${drug1}" e "${drug2}". Liste apenas as diferenças principais e quando preferir um ao outro.`;
  }

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction: `Você é um consultor farmacêutico direto e prático. 
      REGRAS CRÍTICAS: 
      1. NÃO use saudações como "Olá", "Entendi", "Aqui está". 
      2. Vá direto ao ponto, comece a resposta imediatamente com a informação. 
      3. USE APENAS TEXTO PURO. NÃO use asteriscos (**), hashtags (#), hífens (-) como marcadores ou tabelas. 
      4. Se precisar listar algo, use apenas números ou quebras de linha simples. 
      5. Seja extremamente objetivo, focado em leitura rápida de 5 segundos.`,
    }
  });

  return response.text;
}

export async function getPharmaChatResponse(history: any[], drugs: DrugRecord[]) {
  const model = 'gemini-3-flash-preview';
  const drugsContext = drugs.length > 0 
    ? drugs.map(d => `- ${d.name}: ${d.indications.substring(0, 80)}...`).join('\n')
    : "Nenhum medicamento no catálogo.";

  const response = await ai.models.generateContent({
    model,
    contents: history,
    config: {
      systemInstruction: `Você é um assistente técnico. Seja curto e use apenas texto puro sem markdown.`,
    }
  });

  return response.text || "Erro na geração.";
}
