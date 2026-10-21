/**
 * Gerenciador de Navegação e Guarda de Acesso.
 */
const Navigation = {
  init() {
    this.bindEvents();
    this.verificarEInicializar();
  },

  bindEvents() {
    const navButtons = document.querySelectorAll('.nav-btn');

    navButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetId = button.getAttribute('data-target');
        const targetTitle = button.getAttribute('data-title');

        // Se tentar ir para outra aba sem estar autenticado/configurado, bloqueia
        if (targetId !== 'view-config' && !this.validarRequisitosAcesso()) {
          return;
        }

        this.mudarAba(targetId, targetTitle);
      });
    });
  },

  mudarAba(targetId, targetTitle) {
    const navButtons = document.querySelectorAll('.nav-btn');
    const views = document.querySelectorAll('.view');
    const headerTitle = document.getElementById('header-title');

    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-target') === targetId);
    });

    views.forEach(view => {
      view.classList.toggle('active', view.id === targetId);
    });

    if (headerTitle && targetTitle) {
      headerTitle.textContent = targetTitle;
    }

    // Inicializa a view selecionada
    if (targetId === 'view-dieta' && typeof DietaView !== 'undefined' && DietaView.init) DietaView.init();
    if (targetId === 'view-treino' && typeof TreinoView !== 'undefined' && TreinoView.init) TreinoView.init();
    if (targetId === 'view-evolucao' && typeof EvolucaoView !== 'undefined' && EvolucaoView.init) EvolucaoView.init();
    if (targetId === 'view-config' && typeof ConfigView !== 'undefined' && ConfigView.init) ConfigView.init();
  },

  validarRequisitosAcesso() {
    const googleToken = StorageService.getGoogleToken();
    const geminiKey = StorageService.getGeminiKey();

    if (!googleToken) {
      this.exibirTelaBloqueio(
        '🔑',
        'Conta Google Não Conectada',
        'Conecte a sua conta Google na aba Ajustes para sincronizar as suas refeições e treinos.'
      );
      return false;
    }

    if (!geminiKey) {
      this.exibirTelaBloqueio(
        '⚡',
        'Chave da API Gemini Ausente',
        'Cadastre a sua chave gratuita do Gemini na aba Ajustes para libertar os cálculos e análises por IA.'
      );
      return false;
    }

    return true;
  },

  verificarEInicializar() {
    // 1 e 2. Valida Google Token e Gemini Key
    if (!this.validarRequisitosAcesso()) return;

    // Remove qualquer ecrã de bloqueio que possa estar visível
    const bloqueioEl = document.getElementById('lock-screen-container');
    if (bloqueioEl) bloqueioEl.remove();

    // 3. Valida Metas Nutricionais
    const metas = StorageService.getMetas();
    if (!metas) {
      if (typeof OnboardingView !== 'undefined' && OnboardingView.abrirModal) {
        OnboardingView.abrirModal();
      }
      return;
    }

    // Se estiver tudo OK, garante a exibição da vista ativa
    const btnAtivo = document.querySelector('.nav-btn.active');
    const targetId = btnAtivo ? btnAtivo.getAttribute('data-target') : 'view-dieta';
    const targetTitle = btnAtivo ? btnAtivo.getAttribute('data-title') : 'Dieta';
    this.mudarAba(targetId, targetTitle);
  },

  exibirTelaBloqueio(icone, titulo, mensagem) {
    let container = document.getElementById('lock-screen-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'lock-screen-container';
      container.style.cssText = `
        position: fixed;
        top: 60px;
        left: 0;
        right: 0;
        bottom: 60px;
        background: #121212;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 999;
        padding: 20px;
      `;
      document.body.appendChild(container);
    }

    container.innerHTML = `
      <div style="background: #1e1e1e; border: 1px solid #333; border-radius: 16px; padding: 30px; max-width: 380px; width: 100%; text-align: center; color: #fff;">
        <div style="font-size: 3rem; margin-bottom: 15px;">${icone}</div>
        <h3 style="margin-top: 0; margin-bottom: 10px; font-size: 1.2rem;">${titulo}</h3>
        <p style="color: #aaa; font-size: 0.9rem; line-height: 1.4; margin-bottom: 20px;">${mensagem}</p>
        <button id="btn-ir-ajustes" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #11998e, #38ef7d); border: none; color: #000; font-weight: bold; border-radius: 8px; cursor: pointer;">
          ⚙️ Ir para Ajustes
        </button>
      </div>
    `;

    document.getElementById('btn-ir-ajustes')?.addEventListener('click', () => {
      if (container) container.remove();
      this.mudarAba('view-config', 'Ajustes');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => Navigation.init());