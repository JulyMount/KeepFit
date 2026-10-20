/**
 * Serviço de Autenticação OAuth 2.0 com Google Identity Services.
 */

const CLIENT_ID = '519061406018-mjsakf7vru7g6j4ontn4tha8uukgkomv.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file';

const AuthService = {
  tokenClient: null,

  init() {
    if (typeof google === 'undefined') return;

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response) => {
        if (response.access_token) {
          StorageService.setGoogleToken(response.access_token);
          alert('Conectado ao Google Drive com sucesso!');
          
          const badge = document.getElementById('user-status-badge');
          if (badge) {
            badge.textContent = 'Online';
            badge.className = 'badge online';
          }
        }
      },
    });
  },

  fazerLoginGoogle() {
    if (!this.tokenClient) {
      this.init();
    }
    
    if (this.tokenClient) {
      this.tokenClient.requestAccessToken();
    } else {
      alert('Biblioteca do Google ainda está carregando. Tente novamente em alguns segundos.');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  // Aguarda o carregamento da SDK do Google
  setTimeout(() => AuthService.init(), 1000);
});