const { google } = require('googleapis');

// Garante que uma aba específica exista na planilha
async function garantirAbaExistente(sheets, spreadsheetId, nomeAba) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const abasExistentes = meta.data.sheets.map(s => s.properties.title);

    if (!abasExistentes.includes(nomeAba)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: nomeAba }
              }
            }
          ]
        }
      });
      console.log(`[Google Sheets] Aba "${nomeAba}" criada com sucesso.`);
    }
  } catch (error) {
    console.warn(`[Google Sheets] Erro ao verificar/criar aba "${nomeAba}":`, error.message);
  }
}

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

  // 2. Cria uma nova planilha do zero se não existir nenhuma
  const sheets = google.sheets({ version: 'v4', auth });
  const novaPlanilha = await sheets.spreadsheets.create({
    requestBody: {
      properties: { title: 'Fitness App - Dados' },
      sheets: [
        { properties: { title: 'Dieta_Diaria' } },
        { properties: { title: 'Historico_Treinos' } },
        { properties: { title: 'Historico_Medidas' } },
        { properties: { title: 'Perfil' } }
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
      }).catch(() => null);

      const rows = response?.data?.values || [];

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
  },

  // Obter Perfil da aba "Perfil"
  async obterPerfil(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.query.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      // Garante a existência da aba 'Perfil'
      await garantirAbaExistente(sheets, spreadsheetId, 'Perfil');

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Perfil!A1:B10',
      }).catch(() => null);

      const rows = response?.data?.values || [];
      const perfilObj = {};
      rows.forEach(row => {
        if (row[0]) perfilObj[row[0]] = row[1] || '';
      });

      return res.json({
        geminiKey: perfilObj.gemini_key || '',
        metaKcal: Number(perfilObj.meta_kcal) || 0,
        metaProteinasG: Number(perfilObj.meta_proteinas) || 0,
        metaCarboidratosG: Number(perfilObj.meta_carboidratos) || 0,
        metaGordurasG: Number(perfilObj.meta_gorduras) || 0,
        idade: Number(perfilObj.idade) || null,
        peso: Number(perfilObj.peso) || null,
        altura: Number(perfilObj.altura) || null,
        objetivo: perfilObj.objetivo || ''
      });
    } catch (error) {
      console.error('[SheetsController Error - Obter Perfil]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  },

  // Salvar ou Atualizar Perfil na aba "Perfil"
  async registrarPerfil(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ error: 'Token de acesso não fornecido.' });

      const token = authHeader.replace('Bearer ', '');
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: token });

      const spreadsheetId = await obterOuCriarPlanilha(auth, req.body.spreadsheetId);
      const sheets = google.sheets({ version: 'v4', auth });

      // Garante a existência da aba 'Perfil'
      await garantirAbaExistente(sheets, spreadsheetId, 'Perfil');

      const { geminiKey, metaKcal, metaProteinasG, metaCarboidratosG, metaGordurasG, idade, peso, altura, objetivo } = req.body;

      const values = [
        ['gemini_key', geminiKey || ''],
        ['meta_kcal', metaKcal || 0],
        ['meta_proteinas', metaProteinasG || 0],
        ['meta_carboidratos', metaCarboidratosG || 0],
        ['meta_gorduras', metaGordurasG || 0],
        ['idade', idade || ''],
        ['peso', peso || ''],
        ['altura', altura || ''],
        ['objetivo', objetivo || ''],
        ['ultima_atualizacao', new Date().toLocaleString('pt-BR')]
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Perfil!A1:B10',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values }
      });

      return res.json({ success: true, message: 'Perfil gravado no Google Sheets.', spreadsheetId });
    } catch (error) {
      console.error('[SheetsController Error - Registrar Perfil]:', error);
      return res.status(500).json({ error: `Erro na planilha: ${error.message}` });
    }
  }
};

module.exports = sheetsController;