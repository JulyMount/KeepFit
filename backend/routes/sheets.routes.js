const express = require('express');
const router = express.Router();
const sheetsController = require('../controllers/sheetsController');

router.get('/dieta', sheetsController.obterDieta);
router.post('/dieta', sheetsController.registrarDieta);
router.post('/treino', sheetsController.registrarTreino);
router.post('/medidas', sheetsController.registrarMedidas);

module.exports = router;