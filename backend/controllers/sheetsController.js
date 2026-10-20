const { google } = require('googleapis');

// Função auxiliar que busca uma planilha existente no Drive antes de criar uma nova
async function obterOuCriarPlanilha(auth, userSpreadsheetId) {
  let spreadsheetId = userSpreadsheetId || process.env.DEFAULT_SPREADSHEET_ID;

  if (spreadsheetId && !spreadsheetId.includes('seu_id') && spreadsheetId.trim() !== '') {
    return spreadsheetId;
  }

  // 1. Procura se a planilha "Fitness App - Dados" já existe no Google Drive do usuário
  const drive = google.drive({ version: 'v3', auth });
  const busca = await drive.files.list({
    q: "name = 'Fitness App - Dados' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false",
    fields: 'files(id, name)',
  });

  if (busca.data.files && busca.data.files.length > 0) {
    return busca.data.files[0].id; // Reutiliza a planilha original encontrada
  }

  // 2. Cria uma nova planilha apenas se realmente não existir nenhuma
  const sheets = google.sheets({ version: 'v4', auth });
  const novaPlanilha = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Fitness App - Dados' },
      sheets: [
        { properties: { title: 'Dieta_Diaria' } },
        { properties: { title: 'Historico_Treinos' } },
        { properties: { title: 'Historico_Medidas' } }
      ]
    }
  });

  return novaPlanilha.data.spreadsheetId;
}

const sheetsController = {
  // Buscar refeições
  async obterDieta(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.query.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Dieta_Diaria!A:F',
      });

      const rows = response.data.values || [];

      const refeicoes = rows.map((row, index) => ({
        id: index,
        dataHora: row[0] || '',
        descricao: row[1] || '',
        calorias_kcal: Number(row[2]) || 0,
        proteinas_g: Number(row[3]) || 0,
        carboidratos_g: Number(row[4]) || 0,
        gorduras_g: Number(row[5]) || 0
      }));

      return res.json(refeicoes);
    } catch (error) {
      console.error('[SheetsController Error - Obter Dieta]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  },

  // Registrar refeição
  async registrarDieta(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.body.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      const { dataHora, descricao, calorias_kcal, proteinas_g, carboidratos_g, gorduras_g } = req.body;
      const dataFormatada = dataHora || new Date().toLocaleString('pt-BR');

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Dieta_Diaria!A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[dataFormatada, descricao, calorias_kcal, proteinas_g, carboidratos_g, gorduras_g]]
        }
      });

      return res.json({ success: true, message: 'Refeição gravada no Google Sheets.', spreadsheetId });
    } catch (error) {
      console.error('[SheetsController Error - Dieta]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  },

  // Registrar treino
  async registrarTreino(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.body.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      const { dataHora, diaTreino, exercicio, series, repeticoes, carga_kg, observacoes } = req.body;
      const dataFormatada = dataHora || new Date().toLocaleString('pt-BR');

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Historico_Treinos!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[dataFormatada, diaTreino || '', exercicio || '', series || '', repeticoes || '', carga_kg || '', observacoes || '']]
        }
      });

      return res.json({ success: true, message: 'Treino registrado na planilha.', spreadsheetId });
    } catch (error) {
      console.error('[SheetsController Error - Treino]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  },

  // Registrar medidas
  async registrarMedidas(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.body.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      const { data, pesoKg, cinturaCm, pescocoCm, percentualGordura, massaMagraKg, massaGordaKg } = req.body;

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'Historico_Medidas!A:N',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [[data, pesoKg, cinturaCm, pescocoCm, '', '', '', '', '', '', '', percentualGordura, massaMagraKg, massaGordaKg]]
        }
      });

      return res.json({ success: true, message: 'Medição corporal registrada.', spreadsheetId });
    } catch (error) {
      console.error('[SheetsController Error - Medidas]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  }
};

module.exports = sheetsController;