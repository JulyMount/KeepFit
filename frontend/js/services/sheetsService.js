/**
 * Serviço de integração com a API do Google Sheets.
 * Trata a expiração automática de tokens e credenciais inválidas.
 */
const SheetsService = {
  API_BASE_URL: '/api/sheets',

  async _enviarRequisicao(endpoint, method = 'GET', body = null) {
    const token = typeof StorageService !== 'undefined' 
      ? StorageService.getGoogleToken() 
      : localStorage.getItem('fit_google_access_token');

    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const options = { method, headers };
    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}${endpoint}`, options);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        const mensagemErro = err.message || err.error || `Erro HTTP ${response.status}`;

        // Trata tokens expirados, revogados ou credenciais inválidas do Google (T01/T02)
        if (
          response.status === 401 || 
          mensagemErro.includes('Invalid Credentials') || 
          mensagemErro.includes('invalid_grant') || 
          mensagemErro.includes('Token de acesso não fornecido')
        ) {
          console.warn('⚠️ Token do Google expirado ou inválido. A remover credenciais locais...');
          
          if (typeof StorageService !== 'undefined') {
            StorageService.setGoogleToken('');
          } else {
            localStorage.removeItem('fit_google_access_token');
          }

          // Atualiza o estado da interface se os serviços estiverem disponíveis
          if (typeof SyncOfflineService !== 'undefined' && typeof SyncOfflineService.handleStatusChange === 'function') {
            SyncOfflineService.handleStatusChange();
          }

          // Redireciona para a ecrã de ligação do Google se a navegação estiver ativa
          if (typeof Navigation !== 'undefined' && typeof Navigation.verificarEInicializar === 'function') {
            Navigation.verificarEInicializar();
          }
        }

        throw new Error(mensagemErro);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
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