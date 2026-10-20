document.addEventListener('DOMContentLoaded', () => {
  const navButtons = document.querySelectorAll('.nav-btn');
  const views = document.querySelectorAll('.view');
  const headerTitle = document.getElementById('header-title');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const targetTitle = button.getAttribute('data-title');

      // Remove a classe ativa de todos os botões e abas
      navButtons.forEach(btn => btn.classList.remove('active'));
      views.forEach(view => view.classList.remove('active'));

      // Ativa o botão clicado e a aba correspondente
      button.classList.add('active');
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add('active');
      }

      // Atualiza o título do cabeçalho
      if (headerTitle && targetTitle) {
        headerTitle.textContent = targetTitle;
      }
    });
  });
});