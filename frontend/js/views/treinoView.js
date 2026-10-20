/**
 * Controlador de interface para a aba de Treino.
 */

const TreinoView = {
  planoAtivo: null,
  diaSelecionadoIndex: 0,

  init() {
    const container = document.getElementById('treino-container');
    if (!container) return;

    this.planoAtivo = StorageService.getWorkoutPlan();
    this.render(container);
    this.bindEvents();
  },

  render(container) {
    if (!this.planoAtivo || !this.planoAtivo.dias) {
      container.innerHTML = `
        <div class="summary-card" style="text-align: center; padding: 24px;">
          <h3>Nenhum Treino Encontrado</h3>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 12px 0;">
            Gere uma ficha personalizada com IA ou importe seu treino atual.
          </p>
          <div class="btn-group" style="flex-direction: column;">
            <button id="btn-abrir-anamnese" class="btn btn-primary">Gerar Treino com IA</button>
            <button id="btn-importar-json" class="btn btn-secondary">Carregar Arquivo JSON</button>
          </div>
        </div>

        <!-- Container Modal Anamnese -->
        <div id="anamnese-modal" class="input-card" style="display: none; margin-top: 16px;">
          <h3>Anamnese para Treino IA</h3>
          <div class="input-group" style="margin-top: 12px;">
            <input type="text" id="ana-objetivo" placeholder="Objetivo (Ex: Hipertrofia, Emagrecimento)">
            <input type="text" id="ana-dias" placeholder="Dias por semana (Ex: 5 dias)">
            <input type="text" id="ana-limitacoes" placeholder="Lesões/Restrições (Ex: Dor no joelho direito ou Nenhuma)">
            <button id="btn-gerar-treino-confirm" class="btn btn-primary">Criar Treino Agora</button>
          </div>
        </div>
      `;
      return;
    }

    const diaAtual = this.planoAtivo.dias[this.diaSelecionadoIndex] || this.planoAtivo.dias[0];

    container.innerHTML = `
      <!-- Seletor de Dias -->
      <div class="day-selector">
        ${this.planoAtivo.dias.map((d, i) => `
          <button class="day-chip ${i === this.diaSelecionadoIndex ? 'active' : ''}" data-index="${i}">
            ${d.dia_semana} -${d.foco}
          </button>
        `).join('')}
      </div>

      <!-- Lista de Exercícios do Dia -->
      <div id="exercicios-lista">
        ${diaAtual.exercicios.map((ex, exIdx) => `
          <div class="exercise-card">
            <div class="exercise-header">
              <span class="exercise-title">${ex.nome}</span>
              <span class="exercise-meta">${ex.series}x (${ex.repeticoes} reps)</span>
            </div>
            ${ex.observacoes ? `<p style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 8px;">${ex.observacoes}</p>` : ''}
            
            <div class="sets-table">
              ${Array.from({ length: ex.series }).map((_, sIdx) => `
                <div class="set-row">
                  <span class="set-label">Série ${sIdx + 1}</span>
                  <div class="set-input-group">
                    <input type="number" class="carga-input" data-ex="${exIdx}" data-set="${sIdx}" placeholder="kg">
                    <input type="checkbox" class="checkbox-done">
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <button id="btn-finalizar-treino" class="btn btn-primary btn-finish-workout">Finalizar Treino</button>
    `;
  },

  bindEvents() {
    const btnAbrirAna = document.getElementById('btn-abrir-anamnese');
    const modalAna = document.getElementById('anamnese-modal');
    const btnGerarConfirm = document.getElementById('btn-gerar-treino-confirm');
    const btnFinalizar = document.getElementById('btn-finalizar-treino');

    if (btnAbrirAna && modalAna) {
      btnAbrirAna.addEventListener('click', () => {
        modalAna.style.display = modalAna.style.display === 'none' ? 'block' : 'none';
      });
    }

    if (btnGerarConfirm) {
      btnGerarConfirm.addEventListener('click', async () => {
        const obj = document.getElementById('ana-objetivo').value.trim();
        const dias = document.getElementById('ana-dias').value.trim();
        const lim = document.getElementById('ana-limitacoes').value.trim();

        if (!obj || !dias) return alert('Preencha objetivo e dias disponíveis.');

        btnGerarConfirm.disabled = true;
        btnGerarConfirm.textContent = 'Criando Ficha...';

        try {
          const dadosAnamnese = { objetivo: obj, diasDisponiveis: dias, limitacoes: lim };
          this.planoAtivo = await GeminiService.gerarTreino(dadosAnamnese);
          this.render(document.getElementById('treino-container'));
          this.bindEvents();
        } catch (err) {
          alert(`Erro ao criar treino: ${err.message}`);
        } finally {
          btnGerarConfirm.disabled = false;
          btnGerarConfirm.textContent = 'Criar Treino Agora';
        }
      });
    }

    // Cliques nos chips de dia
    document.querySelectorAll('.day-chip').forEach(chip => {
      chip.addEventListener('click', (e) => {
        this.diaSelecionadoIndex = Number(e.target.getAttribute('data-index'));
        this.render(document.getElementById('treino-container'));
        this.bindEvents();
      });
    });

    // Finalizar Treino
    if (btnFinalizar) {
      btnFinalizar.addEventListener('click', async () => {
        const diaAtual = this.planoAtivo.dias[this.diaSelecionadoIndex];
        
        btnFinalizar.disabled = true;
        btnFinalizar.textContent = 'Registrando...';

        try {
          await SheetsService.registrarTreino({
            diaTreino: diaAtual.foco,
            status: 'Concluído'
          });
          alert('Treino concluído e registrado no seu Google Drive!');
        } catch (err) {
          alert(`Erro ao registrar: ${err.message}`);
        } finally {
          btnFinalizar.disabled = false;
          btnFinalizar.textContent = 'Finalizar Treino';
        }
      });
    }
  }
};

document.addEventListener('DOMContentLoaded', () => TreinoView.init());