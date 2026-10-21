/**
 * Controlador de interface para a aba de Configurações / Ajustes.
 */

const ConfigView = {
  init() {
    const container = document.getElementById('config-container');
    if (!container) return;

    this.render(container);
    this.bindEvents();
  },

  render(container) {
    const keySalva = StorageService.getGeminiKey();
    const tokenSalvo = StorageService.getGoogleToken();

    container.innerHTML = `
      <div class="input-card">
        <h3>Chave da API Gemini (BYOK)</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 8px 0;">
          Obtenha sua chave gratuita no Google AI Studio e cole abaixo.
        </p>
        <div class="input-group">
          <input type="text" id="config-gemini-key" placeholder="AIzaSy..." value="${keySalva}">
          <button id="btn-salvar-gemini-key" class="btn btn-primary">Salvar Chave API</button>
        </div>
      </div>

      <div class="input-card">
        <h3>Autenticação Google Drive</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 8px 0;">
          Sua conta é usada para ler e gravar suas planilhas de forma isolada.
        </p>
        <button id="btn-login-google" class="btn ${tokenSalvo ? 'btn-primary' : 'btn-secondary'}" style="width: 100%;">
          ${tokenSalvo ? 'Conta Conectada ✓' : 'Conectar Conta Google'}
        </button>
      </div>

      <div class="input-card" style="margin-top: 15px;">
        <h3>Sincronização de Dados</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin: 8px 0;">
          Restaure suas metas, chave API e configurações diretamente do Google Sheets.
        </p>
        <button id="btn-sync-cloud" class="btn btn-secondary" style="width: 100%;">
          🔄 Sincronizar Dados da Planilha
        </button>
      </div>
    `;
  },

  bindEvents() {
    const btnSalvarKey = document.getElementById('btn-salvar-gemini-key');
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const btnSyncCloud = document.getElementById('btn-sync-cloud');

    if (btnSalvarKey) {
      btnSalvarKey.addEventListener('click', () => {
        const key = document.getElementById('config-gemini-key').value;
        if (!key.trim()) return alert('Insira uma chave válida.');

        StorageService.setGeminiKey(key);
        alert('Chave da API salva com sucesso!');
      });
    }

    if (btnLoginGoogle) {
      btnLoginGoogle.addEventListener('click', () => {
        AuthService.fazerLoginGoogle();
      });
    }

    if (btnSyncCloud) {
      btnSyncCloud.addEventListener('click', async () => {
        try {
          btnSyncCloud.disabled = true;
          btnSyncCloud.textContent = 'Sincronizando...';
          const perfilNuvem = await SheetsService.obterPerfil();

          if (perfilNuvem) {
            if (perfilNuvem.geminiKey) {
              StorageService.setGeminiKey(perfilNuvem.geminiKey);
            }
            if (perfilNuvem.metaKcal) {
              StorageService.setMetas({
                metaKcal: perfilNuvem.metaKcal,
                metaProteinasG: perfilNuvem.metaProteinasG,
                metaCarboidratosG: perfilNuvem.metaCarboidratosG,
                metaGordurasG: perfilNuvem.metaGordurasG
              });
            }
            StorageService.setPerfil(perfilNuvem);
            alert('Dados sincronizados da planilha com sucesso!');
            this.init();
          }
        } catch (err) {
          alert(`Erro ao sincronizar da nuvem: ${err.message}`);
        } finally {
          btnSyncCloud.disabled = false;
          btnSyncCloud.textContent = '🔄 Sincronizar Dados da Planilha';
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigView.init());