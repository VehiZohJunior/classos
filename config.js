/* ClasSos — adresse du serveur (API) */
window.CLASSOS_API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? 'http://127.0.0.1:8787/api'
  : 'https://classos-api.classos-api.workers.dev/api';
/* Connexion Google : identifiant client OAuth (public). Vide = bouton Google masqué. */
window.CLASSOS_GOOGLE_ID = '';
