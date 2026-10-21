require('dotenv').config();
const express = require('express');
const cors = require('cors');

const geminiRoutes = require('./routes/gemini.routes');
const sheetsRoutes = require('./routes/sheets.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir os arquivos estáticos do PWA
app.use(express.static('../frontend'));

// Rotas da API (devem vir ANTES do fallback '*')
app.use('/api/gemini', geminiRoutes);
app.use('/api/sheets', sheetsRoutes);

// Rota fallback para o PWA (DEVE SER A ÚLTIMA ROTA GET)
app.get('*', (req, res) => {
  res.sendFile('index.html', { root: '../frontend' });
});

app.listen(PORT, () => {
  console.log(`[Servidor Rodando] Acesse http://localhost:${PORT}`);
});

module.exports = app;