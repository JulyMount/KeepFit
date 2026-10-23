/**
 * Controlador de interface para a aba de Configurações / Ajustes.
 * Gerencia edição de Metas Nutricionais, Chave Gemini e Sincronização Inteligente (Push vs Pull).
 */

const ConfigView = {
  init() {
    const container = document.getElementById('config-container');
    if (!container) return;

    this.render(container);
    this.bindEvents();
    this.bindModalsEvents();
  },

  render(container) {
    const keySalva = StorageService.getGeminiKey();
    const tokenSalvo = StorageService.getGoogleToken();
    const metasSalvas = StorageService.getMetas() || {};

    const metaKcal = metasSalvas.metaKcal || 2000;
    const metaProt = metasSalvas.metaProteinasG || 150;
    const metaCarb = metasSalvas.metaCarboidratosG || 200;
    const metaGord = metasSalvas.metaGordurasG || 60;

    container.innerHTML = `
      <!-- Card de Metas Nutricionais -->
      <div class="input-card">
        <h3>Metas Nutricionais Diárias</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary, #aaa); margin: 8px 0;">
          Ajuste os seus alvos diários de calorias e distribuição de macronutrientes.
        </p>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 12px;">
          <div>
            <label style="font-size: 0.78rem; color: var(--text-secondary, #aaa); display: block; margin-bottom: 4px;">Calorias (kcal)</label>
            <input type="number" id="config-meta-kcal" value="${metaKcal}" placeholder="2000">
          </div>
          <div>
            <label style="font-size: 0.78rem; color: var(--text-secondary, #aaa); display: block; margin-bottom: 4px;">Proteínas (g)</label>
            <input type="number" id="config-meta-prot" value="${metaProt}" placeholder="150">
          </div>
          <div>
            <label style="font-size: 0.78rem; color: var(--text-secondary, #aaa); display: block; margin-bottom: 4px;">Carboidratos (g)</label>
            <input type="number" id="config-meta-carb" value="${metaCarb}" placeholder="200">
          </div>
          <div>
            <label style="font-size: 0.78rem; color: var(--text-secondary, #aaa); display: block; margin-bottom: 4px;">Gorduras (g)</label>
            <input type="number" id="config-meta-gord" value="${metaGord}" placeholder="60">
          </div>
        </div>
        <button id="btn-salvar-metas" class="btn btn-primary" style="width: 100%;">
          Guardar Metas Nutricionais
        </button>
      </div>

      <!-- Card Chave Gemini -->
      <div id="card-gemini-key" class="input-card" style="margin-top: 15px;">
        <h3>Chave da API Gemini (BYOK)</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary, #aaa); margin: 8px 0;">
          Obtenha a sua chave gratuita no Google AI Studio e cole abaixo.
        </p>
        <div class="input-group" style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input type="text" id="config-gemini-key" placeholder="AIzaSy..." value="${keySalva}" style="flex: 1; padding: 10px; background: #2b2b2b; border: 1px solid #333; color: white; border-radius: 8px;">
          <button id="btn-salvar-gemini-key" class="btn btn-primary" style="padding: 10px 14px; background: #00e676; border: none; color: black; font-weight: bold; border-radius: 8px; cursor: pointer;">Guardar</button>
        </div>
        <button id="btn-abrir-wizard-gemini" style="width: 100%; padding: 8px; background: transparent; border: 1px dashed #00e676; color: #00e676; font-size: 0.82rem; font-weight: 600; border-radius: 8px; cursor: pointer;">
          ✨ Não sabe como pegar a chave? Clique aqui (30s)
        </button>
      </div>

      <!-- Card Autenticação Google -->
      <div id="card-google-auth" class="input-card" style="margin-top: 15px;">
        <h3>Autenticação Google Drive</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary, #aaa); margin: 8px 0;">
          A sua conta é usada para ler e gravar as suas folhas de cálculo de forma isolada.
        </p>
        <button id="btn-login-google" class="btn ${tokenSalvo ? 'btn-primary' : 'btn-secondary'}" style="width: 100%; padding: 12px; background: ${tokenSalvo ? '#00e676' : '#333'}; color: ${tokenSalvo ? '#000' : '#fff'}; border: none; font-weight: bold; border-radius: 8px; cursor: pointer;">
          ${tokenSalvo ? 'Conta Conectada ✓' : 'Conectar Conta Google'}
        </button>
      </div>

      <!-- Card Sincronização Inteligente -->
      <div class="input-card" style="margin-top: 15px;">
        <h3>Sincronização de Dados</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary, #aaa); margin: 8px 0;">
          Compara os dados locais com a folha de cálculo no Google Sheets e permite escolher qual versão manter.
        </p>
        <button id="btn-sync-cloud" class="btn btn-secondary" style="width: 100%; padding: 12px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 8px; cursor: pointer;">
          🔄 Sincronizar Dados da Folha de Cálculo
        </button>
      </div>

      <!-- Container do Modal de Sincronização Inteligente -->
      <div id="modalSyncInteligente" class="modal-overlay" style="position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: none; align-items: center; justify-content: center; z-index: 1000; padding: 16px;">
        <div style="background: #1e1e1e; padding: 20px; border-radius: 12px; width: 100%; max-width: 440px; color: white; border: 1px solid #333; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <h3 style="margin-top:0; font-size: 1.1rem; color: #fff;">Divergência de Dados Detetada ⚖️</h3>
          <p style="font-size: 0.82rem; color: #ccc; margin: 8px 0 16px 0;">
            Os dados locais da aplicação são diferentes das informações guardadas na folha de cálculo:
          </p>
          
          <div id="sync-comparativo-body" style="background: #2b2b2b; padding: 12px; border-radius: 8px; font-size: 0.8rem; margin-bottom: 20px;">
            <!-- Conteúdo montado via JS -->
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            <button id="btn-sync-push" style="padding: 10px; background: #007bff; border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
              ☁️⬆️ Enviar para a Nuvem (Push)
            </button>
            <button id="btn-sync-pull" style="padding: 10px; background: #28a745; border: none; color: white; border-radius: 8px; cursor: pointer; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px;">
              ☁️⬇️ Baixar da Nuvem (Pull)
            </button>
            <button id="btn-sync-cancelar" style="padding: 8px; background: transparent; border: 1px solid #555; color: #aaa; border-radius: 8px; cursor: pointer; margin-top: 4px;">
              Cancelar
            </button>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const btnSalvarMetas = document.getElementById('btn-salvar-metas');
    const btnSalvarKey = document.getElementById('btn-salvar-gemini-key');
    const btnLoginGoogle = document.getElementById('btn-login-google');
    const btnSyncCloud = document.getElementById('btn-sync-cloud');
    const btnAbrirWizard = document.getElementById('btn-abrir-wizard-gemini');

    // 1. Salvar Metas Nutricionais na Aplicação
    if (btnSalvarMetas) {
      btnSalvarMetas.addEventListener('click', async () => {
        const kcal = Number(document.getElementById('config-meta-kcal').value) || 0;
        const prot = Number(document.getElementById('config-meta-prot').value) || 0;
        const carb = Number(document.getElementById('config-meta-carb').value) || 0;
        const gord = Number(document.getElementById('config-meta-gord').value) || 0;

        if (!kcal) return alert('Por favor, informe uma meta calórica válida.');

        const novasMetas = {
          metaKcal: kcal,
          metaProteinasG: prot,
          metaCarboidratosG: carb,
          metaGordurasG: gord
        };

        StorageService.setMetas(novasMetas);

        const estaOnline = navigator.onLine;
        const temToken = StorageService.hasGoogleToken();

        if (estaOnline && temToken) {
          try {
            btnSalvarMetas.disabled = true;
            btnSalvarMetas.textContent = 'Guardando na Nuvem...';

            const perfilCompleto = StorageService.getPerfil() || {};
            const fnSalvarPerfil = SheetsService.registrarPerfil || SheetsService.salvarPerfil;
            if (typeof fnSalvarPerfil === 'function') {
              await fnSalvarPerfil.call(SheetsService, perfilCompleto);
            }
            alert('Metas salvas e sincronizadas na folha de cálculo!');
          } catch (err) {
            console.warn('⚠️ Falha ao salvar perfil na nuvem, mantido localmente:', err);
            alert('Metas salvas localmente!');
          } finally {
            btnSalvarMetas.disabled = false;
            btnSalvarMetas.textContent = 'Guardar Metas Nutricionais';
          }
        } else {
          alert('Metas salvas localmente!');
        }
      });
    }

    // 2. Salvar Chave Gemini
    if (btnSalvarKey) {
      btnSalvarKey.addEventListener('click', () => {
        const key = document.getElementById('config-gemini-key').value;
        if (!key.trim()) return alert('Insira uma chave válida.');

        StorageService.setGeminiKey(key);
        alert('Chave da API salva com sucesso!');
        if (typeof Navigation !== 'undefined' && Navigation.verificarEInicializar) {
          Navigation.verificarEInicializar();
        }
      });
    }

    // 3. Abrir Wizard do Gemini
    if (btnAbrirWizard) {
      btnAbrirWizard.addEventListener('click', () => {
        const modalGemini = document.getElementById('modalGeminiWizard');
        if (modalGemini) modalGemini.classList.remove('hidden');
      });
    }

    // 4. Login Google
    if (btnLoginGoogle) {
      btnLoginGoogle.addEventListener('click', () => {
        AuthService.fazerLoginGoogle();
      });
    }

    // 5. Sincronização Inteligente (Push vs Pull)
    if (btnSyncCloud) {
      btnSyncCloud.addEventListener('click', async () => {
        try {
          btnSyncCloud.disabled = true;
          btnSyncCloud.textContent = 'Analisando nuvem...';

          const perfilNuvem = await SheetsService.obterPerfil();
          const perfilLocal = StorageService.getPerfil() || {};
          const keyLocal = StorageService.getGeminiKey() || '';

          const localKcal = Number(perfilLocal.metaKcal || 0);
          const nuvemKcal = Number(perfilNuvem?.metaKcal || 0);

          const localProt = Number(perfilLocal.metaProteinasG || 0);
          const nuvemProt = Number(perfilNuvem?.metaProteinasG || 0);

          const localCarb = Number(perfilLocal.metaCarboidratosG || 0);
          const nuvemCarb = Number(perfilNuvem?.metaCarboidratosG || 0);

          const localGord = Number(perfilLocal.metaGordurasG || 0);
          const nuvemGord = Number(perfilNuvem?.metaGordurasG || 0);

          const temDiferenca = 
            localKcal !== nuvemKcal ||
            localProt !== nuvemProt ||
            localCarb !== nuvemCarb ||
            localGord !== nuvemGord;

          if (!temDiferenca && perfilNuvem) {
            alert('Tudo atualizado! Os seus dados locais já estão idênticos aos da folha de cálculo. 👍');
            return;
          }

          // Se houver diferenças, exibe o modal comparativo
          this.exibirModalSincronizacao(perfilLocal, perfilNuvem, keyLocal);

        } catch (err) {
          alert(`Erro ao verificar sincronização: ${err.message}`);
        } finally {
          btnSyncCloud.disabled = false;
          btnSyncCloud.textContent = '🔄 Sincronizar Dados da Folha de Cálculo';
        }
      });
    }
  },

  bindModalsEvents() {
    // --- Modal Reautenticação Google ---
    const modalReauth = document.getElementById('modalReauthGoogle');
    const btnReconectarModal = document.getElementById('btnReconectarGoogleModal');
    const btnFecharReauthModal = document.getElementById('btnFecharReauthModal');

    if (btnReconectarModal) {
      btnReconectarModal.onclick = () => {
        if (modalReauth) modalReauth.classList.add('hidden');
        AuthService.fazerLoginGoogle();
      };
    }

    if (btnFecharReauthModal) {
      btnFecharReauthModal.onclick = () => {
        if (modalReauth) modalReauth.classList.add('hidden');
      };
    }

    // --- Modal Wizard do Gemini & Validação Instantânea ---
    const modalGemini = document.getElementById('modalGeminiWizard');
    const btnFecharGemini = document.getElementById('btnFecharGeminiModal');
    const inputGeminiModal = document.getElementById('geminiKeyInputModal');
    const validationBadge = document.getElementById('geminiKeyValidationBadge');
    const btnSalvarGeminiModal = document.getElementById('btnSalvarGeminiKeyModal');
    const statusTextModal = document.getElementById('geminiKeyStatusModal');

    if (btnFecharGemini) {
      btnFecharGemini.onclick = () => {
        if (modalGemini) modalGemini.classList.add('hidden');
      };
    }

    if (inputGeminiModal) {
      const validarChaveInput = () => {
        const val = inputGeminiModal.value.trim();
        const eValida = val.startsWith('AIzaSy') && val.length >= 35;

        if (eValida) {
          inputGeminiModal.classList.add('valid');
          if (validationBadge) validationBadge.classList.remove('hidden');
          if (btnSalvarGeminiModal) btnSalvarGeminiModal.disabled = false;
          if (statusTextModal) {
            statusTextModal.textContent = 'Formato de chave válido!';
            statusTextModal.style.color = '#00e676';
          }
        } else {
          inputGeminiModal.classList.remove('valid');
          if (validationBadge) validationBadge.classList.add('hidden');
          if (btnSalvarGeminiModal) btnSalvarGeminiModal.disabled = true;
          if (statusTextModal) {
            statusTextModal.textContent = val.length > 0 ? 'A chave deve começar com "AIzaSy..."' : '';
            statusTextModal.style.color = '#a0a0a0';
          }
        }
      };

      inputGeminiModal.addEventListener('input', validarChaveInput);
      inputGeminiModal.addEventListener('paste', () => setTimeout(validarChaveInput, 100));
    }

    if (btnSalvarGeminiModal) {
      btnSalvarGeminiModal.onclick = () => {
        const key = inputGeminiModal.value.trim();
        if (!key) return;

        StorageService.setGeminiKey(key);

        const inputConfig = document.getElementById('config-gemini-key');
        if (inputConfig) inputConfig.value = key;

        if (modalGemini) modalGemini.classList.add('hidden');
        alert('Chave da API Gemini ativada com sucesso!');

        if (typeof Navigation !== 'undefined' && Navigation.verificarEInicializar) {
          Navigation.verificarEInicializar();
        }
      };
    }
  },

  exibirModalSincronizacao(local, nuvem, keyLocal) {
    const modal = document.getElementById('modalSyncInteligente');
    const containerComparativo = document.getElementById('sync-comparativo-body');
    const btnPush = document.getElementById('btn-sync-push');
    const btnPull = document.getElementById('btn-sync-pull');
    const btnCancelar = document.getElementById('btn-sync-cancelar');

    if (!modal || !containerComparativo) return;

    containerComparativo.innerHTML = `
      <table style="width: 100%; border-collapse: collapse; color: #eee; font-size: 0.8rem;">
        <thead>
          <tr style="border-bottom: 1px solid #444; text-align: left;">
            <th style="padding: 4px;">Métrica</th>
            <th style="padding: 4px; color: #007bff;">Local (App)</th>
            <th style="padding: 4px; color: #28a745;">Nuvem (Planilha)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Calorias</td>
            <td style="padding: 4px;">${local.metaKcal || 0} kcal</td>
            <td style="padding: 4px;">${nuvem?.metaKcal || 0} kcal</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Proteínas</td>
            <td style="padding: 4px;">${local.metaProteinasG || 0} g</td>
            <td style="padding: 4px;">${nuvem?.metaProteinasG || 0} g</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Carboidratos</td>
            <td style="padding: 4px;">${local.metaCarboidratosG || 0} g</td>
            <td style="padding: 4px;">${nuvem?.metaCarboidratosG || 0} g</td>
          </tr>
          <tr>
            <td style="padding: 4px; font-weight: bold;">Gorduras</td>
            <td style="padding: 4px;">${local.metaGordurasG || 0} g</td>
            <td style="padding: 4px;">${nuvem?.metaGordurasG || 0} g</td>
          </tr>
        </tbody>
      </table>
    `;

    modal.style.display = 'flex';

    // Ação PUSH: Envia dados do app para o Google Sheets
    btnPush.onclick = async () => {
      try {
        btnPush.disabled = true;
        btnPush.textContent = 'Enviando...';
        const perfilAEnviar = StorageService.getPerfil() || {};
        await SheetsService.registrarPerfil(perfilAEnviar);
        alert('Sucesso! Dados locais salvos na folha de cálculo no Google Sheets.');
        modal.style.display = 'none';
      } catch (e) {
        alert(`Erro ao enviar para a nuvem: ${e.message}`);
      } finally {
        btnPush.disabled = false;
        btnPush.textContent = '☁️⬆️ Enviar para a Nuvem (Push)';
      }
    };

    // Ação PULL: Sobrescreve dados do app com as informações da planilha
    btnPull.onclick = () => {
      if (nuvem) {
        if (nuvem.geminiKey) StorageService.setGeminiKey(nuvem.geminiKey);
        if (nuvem.metaKcal) {
          StorageService.setMetas({
            metaKcal: nuvem.metaKcal,
            metaProteinasG: nuvem.metaProteinasG,
            metaCarboidratosG: nuvem.metaCarboidratosG,
            metaGordurasG: nuvem.metaGordurasG
          });
        }
        StorageService.setPerfil(nuvem);
        alert('Sucesso! Aplicativo atualizado com os dados da folha de cálculo.');
        modal.style.display = 'none';
        this.init();
      }
    };

    btnCancelar.onclick = () => {
      modal.style.display = 'none';
    };
  }
};

document.addEventListener('DOMContentLoaded', () => ConfigView.init());