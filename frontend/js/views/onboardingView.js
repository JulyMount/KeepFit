/**
 * Controlador da Tela / Modal de Onboarding (Anamnese por IA ou Entrada Manual).
 */
const OnboardingView = {
  init() {
    this.renderModal();
    this.bindEvents();
  },

  renderModal() {
    if (document.getElementById('onboarding-overlay')) return;

    const overlay = document.createElement('div');
    overlay.id = 'onboarding-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(5px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 20px;
    `;

    overlay.innerHTML = `
      <div style="background: #1e1e1e; border: 1px solid #333; border-radius: 16px; padding: 24px; max-width: 480px; width: 100%; color: #fff; max-height: 90vh; overflow-y: auto; position: relative;">
        
        <!-- Botão Fechar -->
        <button id="btn-fechar-onboarding" style="position: absolute; top: 16px; right: 16px; background: transparent; border: none; color: #888; font-size: 1.2rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;">✖</button>

        <h2 style="margin-top: 0; color: #38ef7d; font-size: 1.4rem; padding-right: 30px;">👋 Bem-vindo ao KeepFit!</h2>
        <p style="color: #aaa; font-size: 0.9rem; margin-bottom: 20px;">
          Para começar, defina as suas metas nutricionais diárias. Pode utilizar o cálculo personalizado por IA ou inserir os seus valores manualmente.
        </p>

        <!-- Seletor de Modo -->
        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
          <button id="onb-tab-ia" type="button" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #38ef7d; background: #38ef7d; color: #000; font-weight: bold; cursor: pointer;">
            🤖 Calcular com IA
          </button>
          <button id="onb-tab-manual" type="button" style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid #444; background: #2b2b2b; color: #fff; font-weight: bold; cursor: pointer;">
            ✏️ Definir Manualmente
          </button>
        </div>

        <!-- FORMULÁRIO IA (ANAMNESE) -->
        <form id="onb-form-ia" style="display: block;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <label style="font-size: 0.8rem; color: #ccc;">
              Idade:
              <input type="number" id="onb-idade" value="25" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
            <label style="font-size: 0.8rem; color: #ccc;">
              Sexo Biológico:
              <select id="onb-sexo" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;">
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
              </select>
            </label>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 12px;">
            <label style="font-size: 0.8rem; color: #ccc;">
              Peso (kg):
              <input type="number" id="onb-peso" value="70" step="0.1" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
            <label style="font-size: 0.8rem; color: #ccc;">
              Altura (cm):
              <input type="number" id="onb-altura" value="175" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
          </div>

          <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 12px;">
            Nível de Atividade Física:
            <select id="onb-atividade" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;">
              <option value="sedentario">Sedentário (pouco ou nenhum exercício)</option>
              <option value="leve">Leve (exercício 1 a 3 dias/semana)</option>
              <option value="moderado" selected>Moderado (exercício 3 a 5 dias/semana)</option>
              <option value="intenso">Intenso (exercício 6 a 7 dias/semana)</option>
            </select>
          </label>

          <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 12px;">
            Objetivo Principal:
            <select id="onb-objetivo" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;">
              <option value="emagrecimento">Perda de Gordura / Emagrecimento</option>
              <option value="manutencao">Manutenção do Peso</option>
              <option value="hipertrofia">Ganho de Massa Muscular (Hipertrofia)</option>
            </select>
          </label>

          <button type="submit" id="btn-calcular-ia" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #11998e, #38ef7d); border: none; color: #000; font-weight: bold; border-radius: 8px; cursor: pointer; margin-top: 10px;">
            Calcular Metas com IA ✨
          </button>
        </form>

        <!-- FORMULÁRIO MANUAL / REVISÃO -->
        <form id="onb-form-metas" style="display: none; margin-top: 15px;">
          <p id="onb-resumo-ia" style="font-size: 0.85rem; color: #38ef7d; background: #142e1d; padding: 10px; border-radius: 8px; margin-bottom: 15px; display: none;"></p>

          <label style="display: block; font-size: 0.8rem; color: #ccc; margin-bottom: 8px;">
            Meta Calórica (kcal):
            <input type="number" id="onb-meta-kcal" placeholder="Ex: 2000" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
          </label>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 15px;">
            <label style="font-size: 0.75rem; color: #ccc;">
              Proteínas (g):
              <input type="number" id="onb-meta-prot" placeholder="150" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
            <label style="font-size: 0.75rem; color: #ccc;">
              Carbos (g):
              <input type="number" id="onb-meta-carb" placeholder="200" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
            <label style="font-size: 0.75rem; color: #ccc;">
              Gorduras (g):
              <input type="number" id="onb-meta-gord" placeholder="60" style="width: 100%; padding: 8px; background: #2b2b2b; border: 1px solid #444; color: #fff; border-radius: 6px; margin-top: 4px;" required>
            </label>
          </div>

          <button type="submit" id="btn-salvar-metas" style="width: 100%; padding: 12px; background: #00c853; border: none; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer;">
            Salvar e Iniciar App 🚀
          </button>
        </form>

        <div style="text-align: center; margin-top: 15px;">
          <button id="btn-onboarding-ajustes" type="button" style="background: transparent; border: none; color: #38ef7d; font-size: 0.85rem; cursor: pointer; text-decoration: underline;">
            ⚙️ Ir para Ajustes (Configurar Chaves)
          </button>
        </div>

      </div>
    `;

    document.body.appendChild(overlay);
  },

  bindEvents() {
    const tabIa = document.getElementById('onb-tab-ia');
    const tabManual = document.getElementById('onb-tab-manual');
    const formIa = document.getElementById('onb-form-ia');
    const formMetas = document.getElementById('onb-form-metas');
    const btnFechar = document.getElementById('btn-fechar-onboarding');
    const btnIrAjustes = document.getElementById('btn-onboarding-ajustes');

    btnFechar?.addEventListener('click', () => this.fecharModal());

    btnIrAjustes?.addEventListener('click', () => {
      this.fecharModal();
      if (typeof Navigation !== 'undefined') {
        Navigation.mudarAba('view-config', 'Ajustes');
      }
    });

    tabIa?.addEventListener('click', () => {
      tabIa.style.background = '#38ef7d';
      tabIa.style.color = '#000';
      tabManual.style.background = '#2b2b2b';
      tabManual.style.color = '#fff';
      formIa.style.display = 'block';
      formMetas.style.display = 'none';
    });

    tabManual?.addEventListener('click', () => {
      tabManual.style.background = '#38ef7d';
      tabManual.style.color = '#000';
      tabIa.style.background = '#2b2b2b';
      tabIa.style.color = '#fff';
      formIa.style.display = 'none';
      formMetas.style.display = 'block';
      document.getElementById('onb-resumo-ia').style.display = 'none';
    });

    formIa?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const apiKey = StorageService.getGeminiKey();

      if (!apiKey) {
        alert('Chave da API Gemini não configurada! Clique no botão abaixo para ir para Ajustes.');
        return;
      }

      const btnIa = document.getElementById('btn-calcular-ia');
      btnIa.disabled = true;
      btnIa.textContent = 'A calcular metas com a IA...';

      const dadosForm = {
        idade: Number(document.getElementById('onb-idade').value),
        sexo: document.getElementById('onb-sexo').value,
        peso: Number(document.getElementById('onb-peso').value),
        altura: Number(document.getElementById('onb-altura').value),
        nivelAtividade: document.getElementById('onb-atividade').value,
        objetivo: document.getElementById('onb-objetivo').value
      };

      try {
        const res = await fetch('/api/gemini/anamnese', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-gemini-key': apiKey
          },
          body: JSON.stringify(dadosForm)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.erro || data.detalhes || 'Erro ao comunicar com a IA.');

        document.getElementById('onb-meta-kcal').value = data.metaKcal || 2000;
        document.getElementById('onb-meta-prot').value = data.metaProteinasG || 150;
        document.getElementById('onb-meta-carb').value = data.metaCarboidratosG || 200;
        document.getElementById('onb-meta-gord').value = data.metaGordurasG || 60;

        const resumoEl = document.getElementById('onb-resumo-ia');
        if (data.resumoEstrategia) {
          resumoEl.innerText = `💡 Sugestão da IA: ${data.resumoEstrategia}`;
          resumoEl.style.display = 'block';
        }

        StorageService.setPerfil(dadosForm);

        formIa.style.display = 'none';
        formMetas.style.display = 'block';

      } catch (err) {
        alert(`Falha ao calcular metas: ${err.message}`);
      } finally {
        btnIa.disabled = false;
        btnIa.textContent = 'Calcular Metas com IA ✨';
      }
    });

    formMetas?.addEventListener('submit', async (e) => {
      e.preventDefault();

      const metas = {
        metaKcal: Number(document.getElementById('onb-meta-kcal').value),
        metaProteinasG: Number(document.getElementById('onb-meta-prot').value),
        metaCarboidratosG: Number(document.getElementById('onb-meta-carb').value),
        metaGordurasG: Number(document.getElementById('onb-meta-gord').value)
      };

      StorageService.setMetas(metas);

      try {
        const perfilLocal = StorageService.getPerfil() || {};
        await SheetsService.registrarPerfil({
          geminiKey: StorageService.getGeminiKey(),
          ...metas,
          ...perfilLocal
        });
      } catch (err) {
        console.warn('Metas salvas localmente, mas falhou envio para Sheets:', err.message);
      }

      this.fecharModal();
      if (typeof Navigation !== 'undefined') {
        Navigation.verificarEInicializar();
      }
    });
  },

  abrirModal() {
    this.renderModal();
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'flex';
  },

  fecharModal() {
    const overlay = document.getElementById('onboarding-overlay');
    if (overlay) overlay.style.display = 'none';
  }
};

document.addEventListener('DOMContentLoaded', () => OnboardingView.init());