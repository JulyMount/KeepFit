/**
 * Gerenciador de conectividade e sincronização de dados offline.
 * Trata descontinuidade de rede e processa a fila acumulada no localStorage.
 */

const SyncOfflineService = {
  init() {
    window.addEventListener('online', () => this.handleStatusChange());
    window.addEventListener('offline', () => this.handleStatusChange());

    // Executa a verificação inicial ao carregar a página
    this.handleStatusChange();
  },

  isOnline() {
    return navigator.onLine;
  },

  handleStatusChange() {
    const badge = document.getElementById('user-status-badge');
    const estaOnline = this.isOnline();
    
    if (badge) {
      if (estaOnline) {
        badge.textContent = 'Online';
        badge.className = 'badge online';
      } else {
        badge.textContent = 'Offline';
        badge.className = 'badge offline';
      }
    }

    if (estaOnline) {
      this.flushQueue();
    }
  },

  // Processa e envia os itens retidos durante a falta de internet (T08)
  async flushQueue() {
    if (!this.isOnline()) return;

    // Se não houver token do Google, evita disparar requisições que resultem em 401 (T01/T02)
    if (typeof StorageService !== 'undefined' && !StorageService.hasGoogleToken()) {
      return;
    }

    if (typeof StorageService === 'undefined') return;

    const queue = StorageService.getOfflineQueue() || [];
    if (queue.length === 0) return;

    console.log(`[Sync] Processando ${queue.length} item(ns) pendente(s) da fila offline...`);

    const remainingItems = [];

    for (const item of queue) {
      try {
        const tipo = item.tipo || item.type;
        const payload = item.dados || item.payload;

        if (tipo === 'dieta' || tipo === 'MEAL') {
          const fnSalvar = SheetsService.registrarRefeicao || SheetsService.salvarRefeicao;
          if (typeof fnSalvar === 'function') {
            await fnSalvar.call(SheetsService, payload);
          }
        } else if (tipo === 'treino' || tipo === 'WORKOUT') {
          const fnSalvar = SheetsService.registrarTreino || SheetsService.salvarTreino;
          if (typeof fnSalvar === 'function') {
            await fnSalvar.call(SheetsService, payload);
          }
        } else if (tipo === 'medidas' || tipo === 'MEASURE') {
          const fnSalvar = SheetsService.registrarMedidas || SheetsService.salvarMedidas;
          if (typeof fnSalvar === 'function') {
            await fnSalvar.call(SheetsService, payload);
          }
        }
      } catch (error) {
        console.error('[Sync] Falha ao sincronizar item:', item, error);
        remainingItems.push(item);
      }
    }

    if (remainingItems.length === 0) {
      StorageService.clearOfflineQueue();
      console.log('[Sync] Fila offline totalmente sincronizada com o Google Sheets!');
    } else {
      localStorage.setItem('fit_offline_sync_queue', JSON.stringify(remainingItems));
    }

    // Atualiza a vista da Dieta se estiver ativa
    if (typeof DietaView !== 'undefined' && typeof DietaView.carregarRefeicoesDoDia === 'function') {
      DietaView.carregarRefeicoesDoDia();
    }
  }
};

// Inicializa os ouvintes de rede quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  SyncOfflineService.init();
});