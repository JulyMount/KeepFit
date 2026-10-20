/**
 * Utilitários para cálculos antropométricos e nutricionais.
 */

// Calculo de IMC (Índice de Massa Corporal)
function calcularIMC(pesoKg, alturaMetros) {
  if (!pesoKg || !alturaMetros) return 0;
  return Number((pesoKg / (alturaMetros * alturaMetros)).toFixed(1));
}

// Calculo de Percentual de Gordura (Protocolo da Marinha Americana - Masculino)
// Medidas em centímetros
function calcularPercentualGorduraMasculino(cinturaCm, pescocoCm, alturaCm) {
  if (!cinturaCm || !pescocoCm || !alturaCm || cinturaCm <= pescocoCm) return 0;

  const logCinturaPescoco = Math.log10(cinturaCm - pescocoCm);
  const logAltura = Math.log10(alturaCm);

  // Fórmula em métrica para homens
  const bodyFat = 495 / (1.0324 - 0.19077 * logCinturaPescoco + 0.15456 * logAltura) - 450;
  
  return Number(Math.max(0, bodyFat).toFixed(1));
}

// Divisão de Massa Magra e Massa Gorda em kg
function calcularComposicaoCorporal(pesoKg, percentualGordura) {
  if (!pesoKg || percentualGordura === undefined) {
    return { massaGordaKg: 0, massaMagraKg: 0 };
  }

  const massaGordaKg = pesoKg * (percentualGordura / 100);
  const massaMagraKg = pesoKg - massaGordaKg;

  return {
    massaGordaKg: Number(massaGordaKg.toFixed(1)),
    massaMagraKg: Number(massaMagraKg.toFixed(1))
  };
}

// Soma simples dos macronutrientes do dia
function somarMacros(listaRefeicoes) {
  return listaRefeicoes.reduce(
    (acc, ref) => ({
      calorias: acc.calorias + (ref.calorias_kcal || 0),
      proteinas: acc.proteinas + (ref.proteinas_g || 0),
      carboidratos: acc.carboidratos + (ref.carboidratos_g || 0),
      gorduras: acc.gorduras + (ref.gorduras_g || 0)
    }),
    { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0 }
  );
}