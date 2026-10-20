const { GoogleGenerativeAI } = require('@google/generative-ai');
const dietaPrompt = require('../prompts/dietaPrompt');
const treinoPrompt = require('../prompts/treinoPrompt');

// Executa o prompt nos modelos válidos e suportados da API Gemini
async function gerarComFallback(genAI, prompt) {
  // Modelos oficiais e suportados da SDK do Gemini
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
  }
};

module.exports = geminiController;