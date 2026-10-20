/**
 * Serviço de comunicação com os endpoints da API Gemini através do backend Node.js.
 */

const GeminiService = {
  // Endpoints da API do nosso servidor Node.js
  API_BASE_URL: '/api/gemini',

  /**
   * Envia a descrição textual de uma refeição para estimativa de macros.
   * @param {string} textoRefeicao - Ex: "2 fatias de pão integral com 2 ovos"
   * @returns {Promise<Object>} JSON com calorias, proteinas, carboidratos e gorduras
   */
  async estimarRefeicao(textoRefeicao) {
    const apiKey = StorageService.getGeminiKey();
    if (!apiKey) {
      throw new Error('Chave da API do Gemini não configurada. Insira sua chave nos Ajustes.');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/estimar-dieta`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          refeicao: textoRefeicao
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao processar alimentos com a IA.');
      }

      return await response.json();
    } catch (error) {
      console.error('[GeminiService] Erro ao estimar refeição:', error);
      throw error;
    }
  },

  /**
   * Envia os dados de anamnese do usuário para gerar uma nova ficha de treino.
   * @param {Object} dadosAnamnese - Dados de objetivo, dias, limitações e antropometria
   * @returns {Promise<Object>} JSON estruturado com o programa de treino
   */
  async gerarTreino(dadosAnamnese) {
    const apiKey = StorageService.getGeminiKey();
    if (!apiKey) {
      throw new Error('Chave da API do Gemini não configurada. Insira sua chave nos Ajustes.');
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/gerar-treino`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: apiKey,
          anamnese: dadosAnamnese
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao gerar treino com a IA.');
      }

      const treinoJSON = await response.json();
      // Salva o treino gerado localmente como a ficha ativa
      StorageService.setWorkoutPlan(treinoJSON);
      return treinoJSON;
    } catch (error) {
      console.error('[GeminiService] Erro ao gerar treino:', error);
      throw error;
    }
  }
};