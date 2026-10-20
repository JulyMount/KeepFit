/**
 * Gerenciador de conectividade e sincronização de dados offline.
 */

const SyncOfflineService = {
  init() {
    // Escuta mudanças no status de conexão da janela
    window.addEventListener('online', () => this.handleStatusChange());
    window.addEventListener('offline', () => this.handleStatusChange());

    // Executa a verificação inicial ao carregar
    this.handleStatusChange();
  },

  isOnline() {
    return navigator.onLine;
  },

  handleStatusChange() {
    const badge = document.getElementById('user-status-badge');
    
    if (this.isOnline()) {
      if (badge) {
        badge.textContent = 'Online';
        badge.className = 'badge online';
      }
      // Tenta sincronizar a fila acumulada no localStorage assim que a internet volta
      this.flushQueue();
    } else {
      if (badge) {
        badge.textContent = 'Offline';
        badge.className = 'badge offline';
      }
    }
  },

  // Processa e envia os itens retidos durante a falta de internet
  async flushQueue() {
    if (!this.isOnline()) return;

    const queue = StorageService.getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`[Sync] Processando ${queue.length} item(ns) pendente(s)...`);

    const remainingItems = [];

    for (const item of queue) {
      try {
        // Direciona o registro salvo para o serviço correto com base na propriedade "type"
        if (item.type === 'MEAL') {
          await SheetsService.registrarRefeicao(item.payload);
        } else if (item.type === 'WORKOUT') {
          await SheetsService.registrarTreino(item.payload);
        } else if (item.type === 'MEASURE') {
          await SheetsService.registrarMedida(item.payload);
        }
      } catch (error) {
        console.error('[Sync] Falha ao sincronizar item:', item, error);
        // Em caso de erro na requisição, o item retorna à fila para tentar mais tarde
        remainingItems.push(item);
      }
    }

    if (remainingItems.length === 0) {
      StorageService.clearOfflineQueue();
      console.log('[Sync] Fila de sincronização totalmente esvaziada com sucesso!');
    } else {
      localStorage.setItem('fit_offline_sync_queue', JSON.stringify(remainingItems));
    }
  }
};

// Inicializa os ouvintes de rede quando o arquivo é carregado
document.addEventListener('DOMContentLoaded', () => {
  SyncOfflineService.init();
});