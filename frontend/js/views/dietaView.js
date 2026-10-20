/**
 * Controlador de interface para a aba de Dieta com detecção dinâmica do SheetsService.
 */

function somarMacros(refeicoes) {
  return refeicoes.reduce((acc, ref) => {
    acc.calorias += Number(ref.calorias_kcal || ref.calorias || 0);
    acc.proteinas += Number(ref.proteinas_g || ref.proteinas || 0);
    acc.carboidratos += Number(ref.carboidratos_g || ref.carboidratos || 0);
    acc.gorduras += Number(ref.gorduras_g || ref.gorduras || 0);
    return acc;
  }, { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 });
}

const DietaView = {
  refeicoesDoDia: [],

  async init() {
    const container = document.getElementById('dieta-container');
    if (!container) return;

    this.render(container);
    this.fecharModal();
    this.bindEvents();
    await this.carregarRefeicoesDoDia();
  },

  render(container) {
    container.innerHTML = `
      <!-- Card de Progresso Calórico -->
      <div class="summary-card">
        <div class="calorie-progress">
          <div class="calorie-number" id="dieta-total-calorias">0</div>
          <div class="calorie-target">de 1.850 kcal diárias</div>
        </div>
        <div class="macros-grid">
          <div class="macro-item">
            <span class="macro-label">Proteínas</span>
            <span class="macro-value" id="dieta-total-proteinas">0g</span>
          </div>
          <div class="macro-item">
            <span class="macro-label">Carboidratos</span>
            <span class="macro-value" id="dieta-total-carbos">0g</span>
          </div>
          <div class="macro-item">
            <span class="macro-label">Gorduras</span>
            <span class="macro-value" id="dieta-total-gorduras">0g</span>
          </div>
        </div>
      </div>

      <!-- Formulário de Registro com IA -->
      <div class="input-card">
        <div class="input-group">
          <textarea id="input-refeicao-ia" rows="2" placeholder="Ex: Comi 2 fatias de pão integral com 2 ovos e 100g de frango..."></textarea>
          <div class="btn-group">
            <button id="btn-registrar-ia" class="btn btn-primary">Analisar com IA</button>
            <button id="btn-toggle-manual" class="btn btn-secondary">Manual</button>
          </div>
        </div>

        <!-- Painel de Registro Manual -->
        <div id="panel-manual" class="input-group" style="display: none; margin-top: 12px;">
          <input type="text" id="manual-descricao" placeholder="Descrição (Ex: Energético 473ml)">
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px;">
            <input type="number" id="manual-calorias" placeholder="Kcal">
            <input type="number" id="manual-proteinas" placeholder="Proteína (g)">
            <input type="number" id="manual-carbos" placeholder="Carbo (g)">
            <input type="number" id="manual-gorduras" placeholder="Gordura (g)">
          </div>
          <button id="btn-salvar-manual" class="btn btn-primary">Salvar Registro Manual</button>
        </div>
      </div>

      <!-- Lista do Dia -->
      <h3 style="font-size: 1rem; margin-bottom: 8px;">Refeições de Hoje</h3>
      <div class="meal-list" id="meal-list-container">
        <p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 12px;">
          Carregando refeições...
        </p>
      </div>
    `;
  },

  fecharModal() {
    const modal = document.getElementById('modalConfirmacao');
    if (modal) modal.style.display = 'none';
  },

  abrirModal() {
    const modal = document.getElementById('modalConfirmacao');
    if (modal) modal.style.display = 'flex';
  },

  async carregarRefeicoesDoDia() {
    console.log('🔄 Iniciando busca de dados...');

    if (typeof SheetsService === 'undefined') {
      console.error('❌ Erro: SheetsService não está carregado. Verifique a inclusão de sheetsService.js no index.html!');
      this.renderLista();
      return;
    }

    // Identifica dinamicamente a função de busca disponível no SheetsService
    const fnObter = SheetsService.obterRefeicoes || 
                    SheetsService.carregarRefeicoes || 
                    SheetsService.buscarRefeicoes || 
                    SheetsService.getRefeicoes;

    if (typeof fnObter !== 'function') {
      console.error('❌ Erro: Nenhuma função conhecida de busca foi encontrada dentro do SheetsService. Métodos disponíveis:', Object.keys(SheetsService));
      this.renderLista();
      return;
    }

    try {
      const refeicoesNuvem = await fnObter.call(SheetsService);
      console.log('📊 Resposta recebida do Google Sheets:', refeicoesNuvem);

      if (Array.isArray(refeicoesNuvem) && refeicoesNuvem.length > 0) {
        const hojeStr = new Date().toLocaleDateString('pt-BR');

        // 1. Mapeia os dados recebidos da nuvem preservando o campo dataHora
        const todasMapeadas = refeicoesNuvem.map(ref => ({
          dataHora: ref.dataHora || ref.DataHora || ref.data || '',
          descricao: ref.descricao || ref.Descrição || ref.prato || ref.alimento || 'Refeição',
          calorias_kcal: Math.round(ref.calorias_kcal || ref.calorias || ref.Calorias || ref.kcal || 0),
          proteinas_g: Math.round(ref.proteinas_g || ref.proteinas || ref.Proteinas || 0),
          carboidratos_g: Math.round(ref.carboidratos_g || ref.carboidratos || ref.Carboidratos || 0),
          gorduras_g: Math.round(ref.gorduras_g || ref.gorduras || ref.Gorduras || 0)
        }));

        // 2. Filtra apenas as refeições cujo dia corresponde à data de hoje
        this.refeicoesDoDia = todasMapeadas.filter(ref => {
          if (!ref.dataHora) return false;
          const dataApenas = ref.dataHora.split(',')[0].split(' ')[0].trim();
          return dataApenas === hojeStr;
        });

        this.atualizarTotais();
      } else {
        this.refeicoesDoDia = [];
      }
    } catch (err) {
      console.error('❌ Erro na chamada à nuvem:', err);
    } finally {
      this.renderLista();
    }
  },

  bindEvents() {
    const btnIa = document.getElementById('btn-registrar-ia');
    const btnToggleManual = document.getElementById('btn-toggle-manual');
    const panelManual = document.getElementById('panel-manual');
    const btnSalvarManual = document.getElementById('btn-salvar-manual');

    const modal = document.getElementById('modalConfirmacao');
    const btnModalSalvar = document.getElementById('btnSalvarModal');
    const btnModalCancelar = document.getElementById('btnCancelarModal');

    if (modal) {
      modal.onclick = (e) => {
        if (e.target === modal) this.fecharModal();
      };
    }

    if (btnToggleManual && panelManual) {
      btnToggleManual.onclick = () => {
        const estaOculto = panelManual.style.display === 'none';
        panelManual.style.display = estaOculto ? 'flex' : 'none';
      };
    }

    if (btnIa) {
      btnIa.onclick = async () => {
        const campoTexto = document.getElementById('input-refeicao-ia');
        const texto = campoTexto ? campoTexto.value.trim() : '';
        if (!texto) return alert('Digite o que você comeu.');

        btnIa.disabled = true;
        btnIa.textContent = 'Analisando...';

        try {
          const resultado = await GeminiService.estimarRefeicao(texto);
          
          const inputDesc = document.getElementById('editDescricao');
          const inputCal = document.getElementById('editKcal');
          const inputProt = document.getElementById('editProteinas');
          const inputCarb = document.getElementById('editCarbos');
          const inputGord = document.getElementById('editGorduras');

          if (inputDesc) inputDesc.value = resultado.prato || resultado.descricao || texto;
          if (inputCal) inputCal.value = Math.round(resultado.calorias_kcal || resultado.calorias || 0);
          if (inputProt) inputProt.value = Math.round(resultado.proteinas_g || resultado.proteinas || 0);
          if (inputCarb) inputCarb.value = Math.round(resultado.carboidratos_g || resultado.carboidratos || 0);
          if (inputGord) inputGord.value = Math.round(resultado.gorduras_g || resultado.gorduras || 0);

          this.abrirModal();
        } catch (err) {
          alert(`Erro na análise: ${err.message}`);
        } finally {
          btnIa.disabled = false;
          btnIa.textContent = 'Analisar com IA';
        }
      };
    }

    if (btnModalSalvar) {
      btnModalSalvar.onclick = async () => {
        const refeicaoFormatada = {
          descricao: document.getElementById('editDescricao')?.value.trim() || 'Refeição',
          calorias_kcal: Number(document.getElementById('editKcal')?.value) || 0,
          proteinas_g: Number(document.getElementById('editProteinas')?.value) || 0,
          carboidratos_g: Number(document.getElementById('editCarbos')?.value) || 0,
          gorduras_g: Number(document.getElementById('editGorduras')?.value) || 0
        };

        this.fecharModal();
        const campoTexto = document.getElementById('input-refeicao-ia');
        if (campoTexto) campoTexto.value = '';

        this.adicionarRefeicaoNaLista(refeicaoFormatada);

        const fnSalvar = SheetsService.registrarRefeicao || SheetsService.salvarRefeicao;
        if (typeof fnSalvar === 'function') {
          try {
            const resp = await fnSalvar.call(SheetsService, refeicaoFormatada);
            if (resp && resp.spreadsheetId && typeof StorageService !== 'undefined') {
              StorageService.setSpreadsheetId(resp.spreadsheetId);
            }
          } catch (errSheets) {
            console.warn('Falha na gravação em nuvem:', errSheets);
          }
        }
      };
    }

    if (btnModalCancelar) {
      btnModalCancelar.onclick = () => this.fecharModal();
    }

    if (btnSalvarManual) {
      btnSalvarManual.onclick = async () => {
        const desc = document.getElementById('manual-descricao').value.trim();
        const cal = Number(document.getElementById('manual-calorias').value) || 0;
        const prot = Number(document.getElementById('manual-proteinas').value) || 0;
        const carb = Number(document.getElementById('manual-carbos').value) || 0;
        const gord = Number(document.getElementById('manual-gorduras').value) || 0;

        if (!desc) return alert('Informe a descrição do alimento.');

        const dados = {
          descricao: desc,
          calorias_kcal: cal,
          proteinas_g: prot,
          carboidratos_g: carb,
          gorduras_g: gord
        };

        this.adicionarRefeicaoNaLista(dados);

        document.getElementById('manual-descricao').value = '';
        document.getElementById('manual-calorias').value = '';
        document.getElementById('manual-proteinas').value = '';
        document.getElementById('manual-carbos').value = '';
        document.getElementById('manual-gorduras').value = '';
        panelManual.style.display = 'none';

        const fnSalvar = SheetsService.registrarRefeicao || SheetsService.salvarRefeicao;
        if (typeof fnSalvar === 'function') {
          fnSalvar.call(SheetsService, dados).catch(err => console.warn(err));
        }
      };
    }
  },

  adicionarRefeicaoNaLista(refeicao) {
    this.refeicoesDoDia.push(refeicao);
    this.atualizarTotais();
    this.renderLista();
  },

  atualizarTotais() {
    const totais = somarMacros(this.refeicoesDoDia);
    const elCal = document.getElementById('dieta-total-calorias');
    const elProt = document.getElementById('dieta-total-proteinas');
    const elCarb = document.getElementById('dieta-total-carbos');
    const elGord = document.getElementById('dieta-total-gorduras');

    if (elCal) elCal.textContent = Math.round(totais.calorias);
    if (elProt) elProt.textContent = `${Math.round(totais.proteinas)}g`;
    if (elCarb) elCarb.textContent = `${Math.round(totais.carboidratos)}g`;
    if (elGord) elGord.textContent = `${Math.round(totais.gorduras)}g`;
  },

  renderLista() {
    const listContainer = document.getElementById('meal-list-container');
    if (!listContainer) return;

    if (this.refeicoesDoDia.length === 0) {
      listContainer.innerHTML = `<p style="color: var(--text-secondary); font-size: 0.85rem; text-align: center; padding: 12px;">Nenhuma refeição registrada hoje.</p>`;
      return;
    }

    listContainer.innerHTML = this.refeicoesDoDia.map(ref => `
      <div class="meal-item" style="background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
        <div class="meal-info">
          <h4 style="margin: 0 0 4px 0;">${ref.descricao}</h4>
          <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary, #aaa);">P: ${ref.proteinas_g}g | C: ${ref.carboidratos_g}g | G: ${ref.gorduras_g}g</p>
        </div>
        <div class="meal-calories" style="font-weight: bold; color: #2ecc71;">${ref.calorias_kcal} kcal</div>
      </div>
    `).join('');
  }
};

document.addEventListener('DOMContentLoaded', () => DietaView.init());