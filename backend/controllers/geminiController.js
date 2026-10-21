const { GoogleGenerativeAI } = require('@google/generative-ai');
const dietaPrompt = require('../prompts/dietaPrompt');
const treinoPrompt = require('../prompts/treinoPrompt');

// Executa o prompt nos modelos válidos e suportados da API Gemini
async function gerarComFallback(genAI, prompt) {
  const modelos = [
    'gemini-3-flash-preview'
  ];
  let ultimoErro = null;

  for (const nomeModelo of modelos) {
    try {
      const model = genAI.getGenerativeModel({ 
        model: nomeModelo,
        generationConfig: { responseMimeType: 'application/json' }
      });
      
      const result = await model.generateContent(prompt);
      return result;
    } catch (erro) {
      ultimoErro = erro;
      console.warn(`[Gemini] Falha no modelo ${nomeModelo}:`, erro.message);
    }
  }

  throw ultimoErro;
}

// Função auxiliar para remover marcações Markdown (```json) antes de converter para objeto
function extrairJSON(texto) {
  if (!texto) return {};
  const limpo = texto.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(limpo);
}

const geminiController = {
  async estimarDieta(req, res) {
    try {
      const { apiKey, refeicao } = req.body;

      if (!apiKey || !refeicao) {
        return res.status(400).json({ error: 'Chave da API e descrição da refeição são obrigatórias.' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const promptCompleto = `${dietaPrompt}\n\nRefeição informada pelo utilizador: "${refeicao}"`;
      
      const result = await gerarComFallback(genAI, promptCompleto);
      const responseText = result.response.text();

      const jsonNutricional = extrairJSON(responseText);
      return res.json(jsonNutricional);
    } catch (error) {
      console.error('[GeminiController Error - Dieta]:', error);
      return res.status(500).json({ error: `Erro na API Gemini: ${error.message || 'Falha interna'}` });
    }
  },

  async gerarTreino(req, res) {
    try {
      const { apiKey, anamnese } = req.body;

      if (!apiKey || !anamnese) {
        return res.status(400).json({ error: 'Chave da API e dados de anamnese são obrigatórios.' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const promptCompleto = `${treinoPrompt}\n\nDados da Anamnese:\n${JSON.stringify(anamnese, null, 2)}`;
      
      const result = await gerarComFallback(genAI, promptCompleto);
      const responseText = result.response.text();

      const jsonTreino = extrairJSON(responseText);
      return res.json(jsonTreino);
    } catch (error) {
      console.error('[GeminiController Error - Treino]:', error);
      return res.status(500).json({ error: `Erro na API Gemini: ${error.message || 'Falha interna'}` });
    }
  },

  // Calcula as metas nutricionais na Anamnese do Onboarding
  async calcularAnamnese(req, res) {
    try {
      const apiKey = req.headers['x-gemini-key'] || req.body.apiKey;
      const { idade, sexo, peso, altura, nivelAtividade, objetivo } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: 'Chave da API Gemini é obrigatória.' });
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const prompt = `
Atue como um nutricionista desportivo especialista. Com base nos dados fornecidos do utilizador, calcule as suas metas diárias exatas de calorias e macronutrientes.

Dados do Utilizador:
- Idade: ${idade} anos
- Sexo Biológico: ${sexo}
- Peso: ${peso} kg
- Altura: ${altura} cm
- Nível de Atividade Física: ${nivelAtividade}
- Objetivo Principal: ${objetivo}

Responda EXCLUSIVAMENTE num objeto JSON válido no seguinte formato e nada mais:
{
  "metaKcal": 2200,
  "metaProteinasG": 160,
  "metaCarboidratosG": 220,
  "metaGordurasG": 60,
  "resumoEstrategia": "Breve frase explicativa da estratégia calculada (máximo 20 palavras)."
}
`;

      const result = await gerarComFallback(genAI, prompt);
      const responseText = result.response.text();

      const jsonAnamnese = extrairJSON(responseText);
      return res.json(jsonAnamnese);
    } catch (error) {
      console.error('[GeminiController Error - Anamnese]:', error);
      return res.status(500).json({ error: `Erro na API Gemini: ${error.message || 'Falha interna'}` });
    }
  }
};

module.exports = geminiController;