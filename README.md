# ClasSos — Contacts d'urgence de la classe

Application web (PWA) pour les enseignants qui interdisent le téléphone en cours :
les contacts à prévenir en cas de malaise d'un étudiant, accessibles en un geste, même sans Internet.

- `index.html` — application enseignant (classes, scan des fiches, mode URGENCE, sauvegarde chiffrée, fiche papier)
- `fiche.html` — formulaire étudiant (génère un QR code à montrer à l'enseignant)

Aucun serveur : les fiches sont stockées uniquement sur le téléphone de l'enseignant.
Bibliothèques incluses : `vendor/qrcode.js` (qrcode-generator, MIT), `vendor/jsQR.js` (jsQR, Apache-2.0).
