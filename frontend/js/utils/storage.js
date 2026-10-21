/**
 * Gerenciador centralizado de persistência no localStorage.
 */

const KEYS = {
  GEMINI_KEY: 'fit_gemini_api_key',
  GOOGLE_TOKEN: 'fit_google_access_token',
  WORKOUT_PLAN: 'fit_active_workout_plan',
  OFFLINE_QUEUE: 'fit_offline_sync_queue',
  USER_CONFIG: 'fit_user_config',
  METAS_NUTRICIONAIS: 'fit_metas_nutricionais',
  PERFIL_USUARIO: 'fit_perfil_usuario'
};

const StorageService = {
  // Chave da API do Gemini (BYOK)
  getGeminiKey() {
    return localStorage.getItem(KEYS.GEMINI_KEY) || '';
  },
  setGeminiKey(key) {
    localStorage.setItem(KEYS.GEMINI_KEY, key.trim());
  },

  getSpreadsheetId() {
    return localStorage.getItem('spreadsheetId') || '';
  },

  setSpreadsheetId(id) {
    if (id) {
      localStorage.setItem('spreadsheetId', id);
    }
  },

  // Token do Google OAuth
  getGoogleToken() {
    return localStorage.getItem(KEYS.GOOGLE_TOKEN) || '';
  },
  setGoogleToken(token) {
    localStorage.setItem(KEYS.GOOGLE_TOKEN, token);
  },

  // Metas Nutricionais
  getMetas() {
    const data = localStorage.getItem(KEYS.METAS_NUTRICIONAIS);
    return data ? JSON.parse(data) : null;
  },
  setMetas(metasObj) {
    localStorage.setItem(KEYS.METAS_NUTRICIONAIS, JSON.stringify(metasObj));
  },

  // Perfil e Anamnese
  getPerfil() {
    const data = localStorage.getItem(KEYS.PERFIL_USUARIO);
    return data ? JSON.parse(data) : null;
  },
  setPerfil(perfilObj) {
    localStorage.setItem(KEYS.PERFIL_USUARIO, JSON.stringify(perfilObj));
  },

  // Plano de Treino Atual
  getWorkoutPlan() {
    const data = localStorage.getItem(KEYS.WORKOUT_PLAN);
    return data ? JSON.parse(data) : null;
  },
  setWorkoutPlan(planObject) {
    localStorage.setItem(KEYS.WORKOUT_PLAN, JSON.stringify(planObject));
  },

  // Fila de Sincronização Offline
  getOfflineQueue() {
    const data = localStorage.getItem(KEYS.OFFLINE_QUEUE);
    return data ? JSON.parse(data) : [];
  },
  addToOfflineQueue(item) {
    const queue = this.getOfflineQueue();
    queue.push(item);
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },
  clearOfflineQueue() {
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
  },  

  // Limpeza geral (Logout)
  clearAll() {
    localStorage.clear();
  }
};