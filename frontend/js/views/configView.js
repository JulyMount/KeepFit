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
    `;
  },


  bindEvents() {
    const btnSalvarKey = document.getElementById('btn-salvar-gemini-key');
    const btnLoginGoogle = document.getElementById('btn-login-google');

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
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigView.init());