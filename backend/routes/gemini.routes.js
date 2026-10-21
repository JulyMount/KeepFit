const express = require('express');
const router = express.Router();
const geminiController = require('../controllers/geminiController');

router.post('/estimar-dieta', geminiController.estimarDieta);
router.post('/gerar-treino', geminiController.gerarTreino);
router.post('/anamnese', geminiController.calcularAnamnese);

module.exports = router;