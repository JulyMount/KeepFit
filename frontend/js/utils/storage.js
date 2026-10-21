/**
 * Gerenciador centralizado de persistência no localStorage.
 * Unificado para evitar dessincronização entre perfil, metas e estado offline.
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
    if (key) {
      const keyLimpa = key.trim();
      localStorage.setItem(KEYS.GEMINI_KEY, keyLimpa);
      
      // Sincroniza também no objeto de perfil
      const perfil = this.getPerfil() || {};
      perfil.geminiKey = keyLimpa;
      localStorage.setItem(KEYS.PERFIL_USUARIO, JSON.stringify(perfil));
    } else {
      localStorage.removeItem(KEYS.GEMINI_KEY);
    }
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
    if (token) {
      localStorage.setItem(KEYS.GOOGLE_TOKEN, token);
    } else {
      localStorage.removeItem(KEYS.GOOGLE_TOKEN);
    }
  },

  // Métodos de Validação de Estado
  hasGoogleToken() {
    return Boolean(this.getGoogleToken());
  },
  hasGeminiKey() {
    return Boolean(this.getGeminiKey());
  },
  hasMetas() {
    const metas = this.getMetas();
    return Boolean(metas && (metas.metaKcal || metas.meta_kcal));
  },

  // Metas Nutricionais (Sincronizado automaticamente com Perfil)
  getMetas() {
    const data = localStorage.getItem(KEYS.METAS_NUTRICIONAIS);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Erro ao ler fit_metas_nutricionais:', e);
      }
    }

    // Fallback: se a chave de metas não existir, tenta extrair do perfil (evita T05)
    const perfil = this.getPerfil();
    if (perfil && (perfil.metaKcal || perfil.meta_kcal)) {
      const metasExtraidas = {
        metaKcal: Number(perfil.metaKcal || perfil.meta_kcal || 0),
        metaProteinasG: Number(perfil.metaProteinasG || perfil.meta_proteinas || 0),
        metaCarboidratosG: Number(perfil.metaCarboidratosG || perfil.meta_carboidratos || 0),
        metaGordurasG: Number(perfil.metaGordurasG || perfil.meta_gorduras || 0)
      };
      this.setMetas(metasExtraidas);
      return metasExtraidas;
    }

    return null;
  },

  setMetas(metasObj) {
    if (!metasObj) return;

    const metasFormatadas = {
      metaKcal: Number(metasObj.metaKcal || metasObj.meta_kcal || 0),
      metaProteinasG: Number(metasObj.metaProteinasG || metasObj.meta_proteinas || 0),
      metaCarboidratosG: Number(metasObj.metaCarboidratosG || metasObj.meta_carboidratos || 0),
      metaGordurasG: Number(metasObj.metaGordurasG || metasObj.meta_gorduras || 0)
    };

    // 1. Salva na chave própria de metas
    localStorage.setItem(KEYS.METAS_NUTRICIONAIS, JSON.stringify(metasFormatadas));

    // 2. Garante a unificação dentro do objeto de perfil
    const perfilAtual = this.getPerfil() || {};
    const perfilAtualizado = {
      ...perfilAtual,
      ...metasFormatadas
    };
    localStorage.setItem(KEYS.PERFIL_USUARIO, JSON.stringify(perfilAtualizado));
  },

  // Perfil e Anamnese (Sincronizado automaticamente com Metas)
  getPerfil() {
    const data = localStorage.getItem(KEYS.PERFIL_USUARIO);
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Erro ao ler fit_perfil_usuario:', e);
      }
    }
    return null;
  },

  setPerfil(perfilObj) {
    if (!perfilObj) return;

    const perfilAtual = this.getPerfil() || {};
    const perfilAtualizado = { ...perfilAtual, ...perfilObj };

    localStorage.setItem(KEYS.PERFIL_USUARIO, JSON.stringify(perfilAtualizado));

    // Se o perfil contiver metas, atualiza automaticamente a chave de metas
    if (perfilObj.metaKcal || perfilObj.meta_kcal) {
      localStorage.setItem(KEYS.METAS_NUTRICIONAIS, JSON.stringify({
        metaKcal: Number(perfilObj.metaKcal || perfilObj.meta_kcal || 0),
        metaProteinasG: Number(perfilObj.metaProteinasG || perfilObj.meta_proteinas || 0),
        metaCarboidratosG: Number(perfilObj.metaCarboidratosG || perfilObj.meta_carboidratos || 0),
        metaGordurasG: Number(perfilObj.metaGordurasG || perfilObj.meta_gorduras || 0)
      }));
    }
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
    queue.push({
      ...item,
      idLocal: Date.now() + Math.random().toString(36).substring(2, 7),
      criadoEm: new Date().toISOString()
    });
    localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
  },
  removeFromOfflineQueue(idLocal) {
    const queue = this.getOfflineQueue().filter(i => i.idLocal !== idLocal);
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