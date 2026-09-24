/* ClasSos — fonctions partagées (formulaire étudiant + appli enseignant) */
(function () {
  'use strict';

  var PREFIX = 'CLASSOS1.';

  function toB64Url(str) {
    var bytes = new TextEncoder().encode(str);
    var bin = '';
    for (var i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function fromB64Url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    var bin = atob(s);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  /* Fiche étudiant -> texte compact (contenu du QR code) */
  function encodeFiche(f) {
    var o = {
      v: 1,
      n: f.nom, p: f.prenom, c: f.classe || '',
      x: f.matricule || '',
      b: f.sang || '', m: f.medical || '',
      k: f.contacts.map(function (c) { return [c.nom, c.lien, c.tel]; }),
      t: f.date || Date.now()
    };
    return PREFIX + toB64Url(JSON.stringify(o));
  }

  /* Texte du QR -> fiche étudiant (null si invalide) */
  function decodeFiche(text) {
    if (!text) return null;
    text = String(text).trim();
    var i = text.indexOf(PREFIX);
    if (i < 0) return null;
    try {
      var o = JSON.parse(fromB64Url(text.slice(i + PREFIX.length).split(/\s/)[0]));
      if (!o || o.v !== 1 || !o.n || !o.p || !Array.isArray(o.k) || !o.k.length) return null;
      var contacts = o.k
        .filter(function (c) { return Array.isArray(c) && c[2]; })
        .slice(0, 3)
        .map(function (c) { return { nom: clip(c[0], 60), lien: clip(c[1], 40), tel: clip(c[2], 25) }; });
      if (!contacts.length) return null;
      return {
        nom: clip(o.n, 60), prenom: clip(o.p, 60), classe: clip(o.c, 80),
        matricule: clip(o.x, 30), sang: clip(o.b, 8), medical: clip(o.m, 300),
        contacts: contacts, date: Number(o.t) || Date.now()
      };
    } catch (e) {
      return null;
    }
  }

  function clip(v, n) { return String(v == null ? '' : v).trim().slice(0, n); }

  /* Téléphone — par défaut Côte d'Ivoire (+225, numéros à 10 chiffres) */
  function phoneDigits(tel) { return String(tel || '').replace(/[^\d+]/g, ''); }

  function phoneIntl(tel) {
    var d = phoneDigits(tel);
    if (!d) return '';
    if (d.indexOf('+') === 0) return '+' + d.slice(1).replace(/\+/g, '');
    if (d.indexOf('00') === 0) return '+' + d.slice(2);
    if (d.length === 10) return '+225' + d;
    return d;
  }

  function phoneValid(tel) {
    var d = phoneDigits(tel).replace(/\+/g, '');
    return d.length >= 8 && d.length <= 15;
  }

  function phonePretty(tel) {
    var d = phoneDigits(tel);
    if (/^\d{10}$/.test(d)) return d.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    if (/^\+225\d{10}$/.test(d)) return '+225 ' + d.slice(4).replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    return tel;
  }

  function telHref(tel) { return 'tel:' + (phoneIntl(tel) || phoneDigits(tel)); }
  function waHref(tel) { return 'https://wa.me/' + phoneIntl(tel).replace('+', ''); }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* QR code -> <img> (bibliothèque qrcode-generator) */
  function qrImg(text, cell) {
    var qr = window.qrcode(0, 'M');
    qr.addData(text, 'Byte');
    qr.make();
    return qr.createImgTag(cell || 8, 16);
  }

  var I = {
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z"/></svg>',
    cross: '<svg viewBox="0 0 24 24" fill="#fff"><path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  };

  window.SOS = {
    encodeFiche: encodeFiche, decodeFiche: decodeFiche,
    phoneIntl: phoneIntl, phoneValid: phoneValid, phonePretty: phonePretty,
    telHref: telHref, waHref: waHref, esc: esc, qrImg: qrImg, icons: I, clip: clip
  };
})();
