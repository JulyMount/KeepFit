/**
 * Serviço de integração com a API do Google Sheets.
 */
const SheetsService = {
  API_BASE_URL: '/api/sheets',

  async _enviarRequisicao(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('fit_google_access_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || `Erro HTTP ${response.status}`);
    }
    return await response.json();
  },

  async obterRefeicoes() {
    return await this._enviarRequisicao('/dieta', 'GET');
  },

  async registrarRefeicao(dados) {
    return await this._enviarRequisicao('/dieta', 'POST', dados);
  },

  async registrarTreino(dados) {
    return await this._enviarRequisicao('/treino', 'POST', dados);
  },

  async registrarMedida(dados) {
    return await this._enviarRequisicao('/medidas', 'POST', dados);
  },

  async obterPerfil() {
    return await this._enviarRequisicao('/perfil', 'GET');
  },

  async registrarPerfil(dados) {
    return await this._enviarRequisicao('/perfil', 'POST', dados);
  }
};