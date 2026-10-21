/**
 * Controlador de interface para a aba de Evolução Física e Nutricional.
 * Com suporte a resiliência de token e armazenamento offline.
 */

const EvolucaoView = {
  chartInstance: null,
  diasFiltro: 7,

  async init() {
    const container = document.getElementById('evolucao-container');
    if (!container) return;

    this.render(container);
    this.bindEvents();
    await this.carregarEExibirGrafico();
  },

  render(container) {
    container.innerHTML = `
      <!-- Container do Gráfico de Evolução (Eixo Duplo) -->
      <div class="card-evolucao" style="background: #ffffff; padding: 16px; border-radius: 12px; margin-bottom: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px;">
          <h3 style="font-size: 1rem; margin: 0; color: #333;">Evolução: Kcal vs Peso</h3>
          <div class="periodo-selector" style="display: flex; gap: 6px;">
            <button class="btn-filtro active" data-dias="7" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #007bff; background: #007bff; color: white; cursor: pointer;">7d</button>
            <button class="btn-filtro" data-dias="30" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; color: #333; cursor: pointer;">30d</button>
            <button class="btn-filtro" data-dias="90" style="padding: 4px 12px; font-size: 0.8rem; border-radius: 6px; border: 1px solid #ccc; background: #f8f9fa; color: #333; cursor: pointer;">90d</button>
          </div>
        </div>
        <div style="position: relative; height: 280px; width: 100%;">
          <canvas id="graficoEvolucao"></canvas>
        </div>
      </div>

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
    `;
  },

  bindEvents() {
    // 1. Configuração dos Botões de Filtro do Gráfico
    const botoes = document.querySelectorAll('.btn-filtro');
    botoes.forEach(btn => {
      btn.addEventListener('click', async (e) => {
        botoes.forEach(b => {
          b.classList.remove('active');
          b.style.background = '#f8f9fa';
          b.style.color = '#333';
          b.style.borderColor = '#ccc';
        });

        e.target.classList.add('active');
        e.target.style.background = '#007bff';
        e.target.style.color = 'white';
        e.target.style.borderColor = '#007bff';

        this.diasFiltro = parseInt(e.target.dataset.dias, 10);
        await this.carregarEExibirGrafico();
      });
    });

    // 2. Evento do Botão Salvar Medição (Com Suporte Offline - T08)
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

      // Executa os cálculos utilitários (funções globais do projeto)
      const bf = typeof calcularPercentualGorduraMasculino === 'function' 
        ? calcularPercentualGorduraMasculino(cintura, pescoco, altura) 
        : 0;

      const composicao = typeof calcularComposicaoCorporal === 'function'
        ? calcularComposicaoCorporal(peso, bf)
        : { massaMagraKg: 0, massaGordaKg: 0 };

      // Atualiza os cards de métrica imediatamente
      document.getElementById('eval-bf').textContent = `${bf}%`;
      document.getElementById('eval-massa-magra').textContent = `${composicao.massaMagraKg} kg`;

      const payload = {
        dataHora: new Date().toLocaleString('pt-BR'),
        pesoKg: peso,
        cinturaCm: cintura,
        pescocoCm: pescoco,
        percentualGordura: bf,
        massaMagraKg: composicao.massaMagraKg,
        massaGordaKg: composicao.massaGordaKg
      };

      const estaOnline = navigator.onLine;
      const temToken = typeof StorageService !== 'undefined' && StorageService.hasGoogleToken();

      // Trata modo offline ou falta de token Google
      if (!estaOnline || !temToken) {
        if (typeof StorageService !== 'undefined') {
          StorageService.addToOfflineQueue({ tipo: 'medidas', dados: payload });
          alert('Medição salva localmente (offline)! Será sincronizada assim que reconectar.');
        }
        return;
      }

      try {
        await SheetsService.registrarMedida(payload);
        alert('Medição registrada no Google Sheets!');
        await this.carregarEExibirGrafico();
      } catch (err) {
        console.warn('⚠️ Erro ao registrar medição na nuvem. Guardando na fila offline:', err.message);
        if (typeof StorageService !== 'undefined') {
          StorageService.addToOfflineQueue({ tipo: 'medidas', dados: payload });
          alert('Medição salva na fila offline para sincronização posterior.');
        }
      }
    });
  },

  async carregarEExibirGrafico() {
    // 1. Prevenção de Erros 401 (T01 / T02): Se não houver token do Google, suspende busca remota
    if (typeof StorageService !== 'undefined' && !StorageService.hasGoogleToken()) {
      console.warn('ℹ️ Carregamento do gráfico suspenso: Conta Google não conectada.');
      const dadosVazios = this.processarDados([], [], this.diasFiltro);
      this.renderizarGrafico(dadosVazios);
      return;
    }

    // 2. Modo Offline (T08): Se estiver sem internet, exibe a estrutura do gráfico sem requisições
    if (!navigator.onLine) {
      console.warn('📡 Dispositivo Offline. Exibindo gráfico sem novos dados da nuvem.');
      const dadosOff = this.processarDados([], [], this.diasFiltro);
      this.renderizarGrafico(dadosOff);
      return;
    }

    try {
      const fnDieta = SheetsService.obterRefeicoes || SheetsService.carregarRefeicoes || SheetsService.buscarRefeicoes || SheetsService.getRefeicoes;
      const fnAntropo = SheetsService.obterAntropometria || SheetsService.buscarMedidas || SheetsService.obterMedidas || SheetsService.carregarMedidas;

      const dietaHistorico = fnDieta ? await fnDieta.call(SheetsService) : [];
      const antropometriaHistorico = fnAntropo ? await fnAntropo.call(SheetsService) : [];

      const dadosProcessados = this.processarDados(dietaHistorico, antropometriaHistorico, this.diasFiltro);
      this.renderizarGrafico(dadosProcessados);
    } catch (erro) {
      console.error('❌ Erro ao carregar dados do gráfico de evolução:', erro);
    }
  },

  processarDados(dieta, antropometria, dias) {
    const mapaDatas = {};
    const hoje = new Date();

    for (let i = dias - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(hoje.getDate() - i);
      const dataChaveFull = d.toLocaleDateString('pt-BR');
      const dataLabelCurta = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      mapaDatas[dataChaveFull] = { label: dataLabelCurta, kcal: 0, peso: null };
    }

    if (Array.isArray(dieta)) {
      dieta.forEach(item => {
        const dataRaw = item.dataHora || item.DataHora || item.data || '';
        if (!dataRaw) return;
        const dataStr = dataRaw.split(',')[0].split(' ')[0].trim();
        if (mapaDatas[dataStr]) {
          mapaDatas[dataStr].kcal += Number(item.calorias_kcal || item.calorias || item.Calorias || item.kcal || 0);
        }
      });
    }

    if (Array.isArray(antropometria)) {
      antropometria.forEach(item => {
        const dataRaw = item.dataHora || item.DataHora || item.data || item.Data || '';
        if (!dataRaw) return;
        const dataStr = dataRaw.split(',')[0].split(' ')[0].trim();
        if (mapaDatas[dataStr]) {
          const valPeso = Number(item.pesoKg || item.peso || item.Peso || 0);
          if (valPeso > 0) mapaDatas[dataStr].peso = valPeso;
        }
      });
    }

    const keys = Object.keys(mapaDatas);
    const labels = keys.map(k => mapaDatas[k].label);
    const dataKcal = keys.map(k => mapaDatas[k].kcal);
    const dataPeso = keys.map(k => mapaDatas[k].peso);

    return { labels, dataKcal, dataPeso };
  },

  renderizarGrafico({ labels, dataKcal, dataPeso }) {
    const canvas = document.getElementById('graficoEvolucao');
    if (!canvas || typeof Chart === 'undefined') return;

    const cardPai = canvas.closest('.card-evolucao');
    if (cardPai) {
      cardPai.style.background = '#1e1e1e';
      cardPai.style.border = '1px solid #333';
    }

    const ctx = canvas.getContext('2d');
    if (this.chartInstance) this.chartInstance.destroy();

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Consumo (kcal)',
            data: dataKcal,
            borderColor: '#FF9800',
            backgroundColor: 'rgba(255, 152, 0, 0.15)',
            fill: true,
            yAxisID: 'yKcal',
            tension: 0.3
          },
          {
            label: 'Peso (kg)',
            data: dataPeso,
            borderColor: '#2196F3',
            backgroundColor: '#2196F3',
            spanGaps: true,
            yAxisID: 'yPeso',
            tension: 0.3,
            pointRadius: 5
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            labels: { color: '#e0e0e0', font: { size: 12 } }
          }
        },
        scales: {
          x: {
            ticks: { color: '#aaa', font: { size: 11 } },
            grid: { display: false }
          },
          yKcal: {
            type: 'linear',
            position: 'left',
            beginAtZero: true,
            title: { display: true, text: 'Kcal', color: '#FF9800' },
            ticks: { color: '#FF9800' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' }
          },
          yPeso: {
            type: 'linear',
            position: 'right',
            beginAtZero: false,
            title: { display: true, text: 'Peso (kg)', color: '#2196F3' },
            ticks: { color: '#2196F3' },
            grid: { display: false }
          }
        }
      }
    });
  }
};

document.addEventListener('DOMContentLoaded', () => EvolucaoView.init());