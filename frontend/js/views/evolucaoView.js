/**
 * Controlador de interface para a aba de Evolução Física.
 */

const EvolucaoView = {
  init() {
    const container = document.getElementById('evolucao-container');
    if (!container) return;

    this.render(container);
    this.bindEvents();
  },

  render(container) {
    container.innerHTML = `
      <!-- Dashboard de Composição Atual -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-title">% Gordura (BF)</div>
          <div class="metric-value" id="eval-bf">-- %</div>
        </div>
        <div class="metric-card">
          <div class="metric-title">Massa Magra</div>
          <div class="metric-value" id="eval-massa-magra">-- kg</div>
        </div>
      </div>

      <!-- Form de Nova Medição -->
      <div class="input-card">
        <h3 style="font-size: 0.95rem; margin-bottom: 12px;">Nova Avaliação Antropométrica</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>Peso (kg)</label>
            <input type="number" step="0.1" id="med-peso" placeholder="80.0">
          </div>
          <div class="form-field">
            <label>Altura (cm)</label>
            <input type="number" id="med-altura" placeholder="166">
          </div>
          <div class="form-field">
            <label>Cintura (cm)</label>
            <input type="number" step="0.1" id="med-cintura" placeholder="97.0">
          </div>
          <div class="form-field">
            <label>Pescoço (cm)</label>
            <input type="number" step="0.1" id="med-pescoco" placeholder="39.0">
          </div>
          <div class="form-field">
            <label>Braço Dir. (cm)</label>
            <input type="number" step="0.1" id="med-braco-dir" placeholder="35.0">
          </div>
          <div class="form-field">
            <label>Coxa Dir. (cm)</label>
            <input type="number" step="0.1" id="med-coxa-dir" placeholder="54.0">
          </div>
        </div>
        <button id="btn-salvar-medida" class="btn btn-primary" style="width: 100%; margin-top: 8px;">
          Calcular & Salvar Medição
        </button>
      </div>

      <!-- Container de Histórico Visual -->
      <div class="chart-container">
        <span>Histórico de Medições Gravado no Google Sheets</span>
      </div>
    `;
  },

  bindEvents() {
    const btnSalvar = document.getElementById('btn-salvar-medida');
    if (!btnSalvar) return;

    btnSalvar.addEventListener('click', async () => {
      const peso = Number(document.getElementById('med-peso').value);
      const altura = Number(document.getElementById('med-altura').value);
      const cintura = Number(document.getElementById('med-cintura').value);
      const pescoco = Number(document.getElementById('med-pescoco').value);

      if (!peso || !altura || !cintura || !pescoco) {
        return alert('Preencha ao menos Peso, Altura, Cintura e Pescoço.');
      }

      // Executa os cálculos utilitários
      const bf = calcularPercentualGorduraMasculino(cintura, pescoco, altura);
      const composicao = calcularComposicaoCorporal(peso, bf);

      // Atualiza interface
      document.getElementById('eval-bf').textContent = `${bf}%`;
      document.getElementById('eval-massa-magra').textContent = `${composicao.massaMagraKg} kg`;

      const payload = {
        pesoKg: peso,
        cinturaCm: cintura,
        pescocoCm: pescoco,
        percentualGordura: bf,
        massaMagraKg: composicao.massaMagraKg,
        massaGordaKg: composicao.massaGordaKg
      };

      try {
        await SheetsService.registrarMedida(payload);
        alert('Medição registrada no Google Sheets!');
      } catch (err) {
        alert(`Erro ao registrar medição: ${err.message}`);
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => EvolucaoView.init());