/* ClasSos — application enseignant (hors-ligne, données stockées sur l'appareil) */
(function () {
  'use strict';

  var KEY = 'classos.data';
  var $ = function (id) { return document.getElementById(id); };
  var esc = SOS.esc;
  var I = SOS.icons;

  var ICON = {
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    scan: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
    userplus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
    id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M15 9h3M15 13h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M12 7v6M9 10h6"/></svg>',
    down: '<svg class="acc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    paste: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>'
  };

  var DEFAULT_NUMBERS = [
    { label: 'SAMU', num: '185' },
    { label: 'Pompiers', num: '180' },
    { label: 'Police', num: '170' }
  ];

  var LIENS = ['Mère', 'Père', 'Tuteur / Tutrice', 'Conjoint(e)', 'Frère / Sœur', 'Oncle / Tante', 'Grand-parent', 'Ami(e)', 'Colocataire', 'Autre'];
  var SIG = '<p class="tiny" style="margin:28px 4px 0;max-width:180px;line-height:1.5">ClasSos · <b>' + SOS.SIGNATURE + '</b></p>';

  /* ======================= Données ======================= */
  var db = load();

  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
    if (!d || !Array.isArray(d.classes)) d = { v: 1, classes: [], settings: {}, lastBackup: 0 };
    d.settings = d.settings || {};
    if (!Array.isArray(d.settings.numbers) || !d.settings.numbers.length) d.settings.numbers = DEFAULT_NUMBERS.slice();
    return d;
  }
  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(db)); }
    catch (e) { toast("Impossible d'enregistrer sur cet appareil (mémoire pleine ?)", 'err'); }
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function getClass(id) { return db.classes.filter(function (c) { return c.id === id; })[0]; }
  function getStudent(cls, sid) { return cls && cls.students.filter(function (s) { return s.id === sid; })[0]; }
  function sortStudents(list) {
    return list.slice().sort(function (a, b) { return (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr'); });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function initials(s) { return ((s.prenom || '?')[0] + (s.nom || '?')[0]).toUpperCase(); }
  function fullName(s) { return s.prenom + ' ' + s.nom; }

  /* Ajoute ou met à jour (même nom + prénom = même étudiant) */
  function findStudent(cls, fiche) {
    var key = norm(fiche.nom) + '|' + norm(fiche.prenom);
    return cls.students.filter(function (s) { return norm(s.nom) + '|' + norm(s.prenom) === key; })[0];
  }

  /* Fiche envoyée par un étudiant (scan, lien, collage) : elle ne remplace JAMAIS une fiche existante.
     Seul l'enseignant peut modifier une fiche (saisie, modification, ou « Remplacer » explicite). */
  function addFromStudent(cls, fiche) {
    var existing = findStudent(cls, fiche);
    if (existing) return { student: existing, skipped: true };
    return upsertStudent(cls, fiche);
  }

  function upsertStudent(cls, fiche) {
    var existing = findStudent(cls, fiche);
    var data = {
      nom: fiche.nom, prenom: fiche.prenom, matricule: fiche.matricule || '',
      sang: fiche.sang || '', medical: fiche.medical || '', contacts: fiche.contacts,
      updated: Date.now()
    };
    if (existing) { Object.assign(existing, data); persist(); return { student: existing, updated: true }; }
    var s = Object.assign({ id: uid(), added: Date.now() }, data);
    cls.students.push(s); persist();
    return { student: s, updated: false };
  }

  /* ======================= UI helpers ======================= */
  var toastTimer;
  function toast(msg, kind) {
    var t = document.querySelector('.toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 2600);
  }

  function modal(html, onMount) {
    var root = $('modalRoot');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><button class="close-x" type="button" aria-label="Fermer">×</button>' + html + '</div></div>';
    var back = root.firstChild;
    var close = function () { root.innerHTML = ''; };
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelector('.close-x').onclick = close;
    if (onMount) onMount(back.querySelector('.modal'), close);
    return close;
  }

  /* Confirmation intégrée à l'appli (fonctionne aussi dans le navigateur de WhatsApp) */
  function confirmModal(title, text, okLabel, onOk) {
    modal('<h2>' + esc(title) + '</h2><p class="muted" style="margin:0 0 18px">' + text + '</p>' +
      '<div class="btn-row"><button class="btn btn-ghost" id="cfNo">Annuler</button><button class="btn btn-red" id="cfYes">' + esc(okLabel) + '</button></div>',
      function (m, close) {
        m.querySelector('#cfNo').onclick = close;
        m.querySelector('#cfYes').onclick = function () { close(); onOk(); };
      });
  }

  function deleteClass(cls) {
    var n = cls.students.length;
    confirmModal('Supprimer la classe ?', '« <b>' + esc(cls.name) + '</b> » et ses <b>' + n + ' fiche' + (n > 1 ? 's' : '') + '</b> seront effacées de ce téléphone. Cette action est définitive.', 'Supprimer la classe', function () {
      db.classes = db.classes.filter(function (c) { return c.id !== cls.id; });
      persist();
      if (location.hash === '' || location.hash === '#/' || location.hash === '#') route(); else go('/');
      toast('Classe supprimée');
    });
  }

  /* Bouton principal : toutes les façons d'ajouter des contacts d'urgence */
  var pendingChooser = null;
  function createContacts(cls) {
    var opt = function (id, ic, title, desc) {
      return '<button class="row" id="' + id + '" style="margin-bottom:10px"><div class="class-icon" style="background:var(--surface-2);color:var(--navy)">' + ic + '</div>' +
        '<div class="grow"><div class="title" style="white-space:normal">' + title + '</div><div class="meta">' + desc + '</div></div>' + ICON.chev + '</button>';
    };
    modal('<h2>Créer contacts étudiants d’urgence</h2><p class="muted">Classe : <b>' + esc(cls.name) + '</b>. Choisissez comment ajouter les étudiants.</p>' +
      opt('chInvite', ICON.qr, 'Inviter les étudiants', 'Ils remplissent leur fiche sur leur téléphone : QR code, WhatsApp ou SMS.') +
      opt('chScan', ICON.scan, 'Scanner les fiches', 'Scannez le QR code affiché sur le téléphone de chaque étudiant.') +
      opt('chManual', ICON.edit, 'Saisir moi-même', 'Vous remplissez la fiche d’un étudiant.') +
      opt('chPaste', ICON.paste, 'Coller une fiche reçue', 'Message WhatsApp ou SMS envoyé par un étudiant.') +
      opt('chPaper', ICON.print, 'Imprimer des formulaires papier', 'Pour les étudiants sans téléphone, à saisir ensuite.'),
      function (m, close) {
        m.querySelector('#chInvite').onclick = function () { close(); inviteModal(cls); };
        m.querySelector('#chScan').onclick = function () { close(); openScanner(cls); };
        m.querySelector('#chManual').onclick = function () { close(); studentForm(cls); };
        m.querySelector('#chPaste').onclick = function () { close(); pasteModal(cls); };
        m.querySelector('#chPaper').onclick = function () { close(); printBlank(cls); };
      });
  }

  /* Depuis l'accueil : choisir la classe (ou en créer une) */
  function createContactsPickClass() {
    if (!db.classes.length) { newClassModal(null, true); return; }
    if (db.classes.length === 1) { pendingChooser = db.classes[0].id; go('/c/' + db.classes[0].id); return; }
    modal('<h2>Pour quelle classe ?</h2><p class="muted">Choisissez la classe des étudiants.</p>' +
      db.classes.map(function (c) {
        return '<button class="row" data-pick="' + esc(c.id) + '" style="margin-bottom:10px"><div class="class-icon">' + esc((c.name[0] || '?').toUpperCase()) + '</div>' +
          '<div class="grow"><div class="title">' + esc(c.name) + '</div><div class="meta">' + c.students.length + ' étudiant' + (c.students.length > 1 ? 's' : '') + '</div></div>' + ICON.chev + '</button>';
      }).join('') +
      '<button class="btn btn-ghost btn-block" id="pickNew">' + ICON.plus + 'Nouvelle classe</button>',
      function (m, close) {
        m.querySelectorAll('[data-pick]').forEach(function (b) { b.onclick = function () { close(); pendingChooser = b.dataset.pick; go('/c/' + b.dataset.pick); }; });
        m.querySelector('#pickNew').onclick = function () { close(); newClassModal(null, true); };
      });
  }

  function setHeader(title, sub, back) {
    $('title').innerHTML = esc(title) + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '');
    $('backBtn').hidden = !back;
    $('homeBtn').hidden = !back;
    $('brandMark').hidden = !!back;
    document.title = (title === 'ClasSos' ? '' : title + ' — ') + 'ClasSos';
  }

  function go(hash) { location.hash = hash; }

  function daysSince(ts) { return ts ? Math.floor((Date.now() - ts) / 86400000) : Infinity; }
  function totalStudents() { return db.classes.reduce(function (n, c) { return n + c.students.length; }, 0); }

  /* ======================= Router ======================= */
  function route() {
    closeScanner();
    $('modalRoot').innerHTML = '';
    var h = location.hash.replace(/^#\/?/, '').split('/');
    var view = $('view');
    $('fab').hidden = false;
    window.scrollTo(0, 0);
    if (h[0] === 'c' && getClass(h[1])) return renderClass(view, getClass(h[1]));
    if (h[0] === 's' && getStudent(getClass(h[1]), h[2])) return renderSheet(view, getClass(h[1]), getStudent(getClass(h[1]), h[2]));
    if (h[0] === 'urgence') return renderUrgence(view);
    if (h[0] === 'repertoire') return renderRepertoire(view);
    if (h[0] === 'enseignant') return renderTeacher(view);
    if (h[0] === 'reglages') return renderSettings(view);
    if (h[0] === 'import') return importFiche(view, h.slice(1).join('/'));
    return renderHome(view);
  }
  window.addEventListener('hashchange', route);

  /* Retour : une fiche d'urgence revient à l'écran d'où on l'a ouverte (classe, répertoire, urgence) */
  var sheetFrom = '';
  window.addEventListener('hashchange', function (e) {
    var from = (e.oldURL || '').split('#')[1] || '';
    var to = location.hash.replace(/^#/, '');
    if (to.indexOf('/s/') === 0 && from && from.indexOf('/s/') !== 0) sheetFrom = from;
  });
  $('backBtn').onclick = function () {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 's') {
      if (sheetFrom === '/repertoire' || sheetFrom === '/urgence' || sheetFrom === '/c/' + h[1]) go(sheetFrom);
      else go('/c/' + h[1]);
      return;
    }
    go('/');
  };
  $('homeBtn').onclick = function () { go('/'); };
  $('settingsBtn').onclick = function () { go('/reglages'); };
  $('fab').onclick = function () { go('/urgence'); };

  /* ======================= Accueil ======================= */
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (!location.hash || location.hash === '#/') route(); });

  function renderHome(view) {
    setHeader('ClasSos', db.settings.school || "Contacts d'urgence", false);
    var total = totalStudents();
    var html = '';

    if (installEvt) {
      html += '<div class="notice"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span style="flex:1"><b>Installez ClasSos sur ce téléphone</b> pour l\'ouvrir en un geste, même sans Internet.</span><button class="btn btn-primary" id="installBtn" style="min-height:38px;padding:6px 14px">Installer</button></div>';
    }
    if (total > 0 && daysSince(db.lastBackup) > 14) {
      html += '<div class="notice warn">' + I.info + '<span style="flex:1"><b>Pensez à faire une sauvegarde.</b> Si ce téléphone est perdu ou réinitialisé, les fiches seront perdues. <a href="#/reglages" style="font-weight:700">Sauvegarder maintenant</a></span></div>';
    }

    /* Les 3 accès principaux, toujours visibles */
    var st = db.settings;
    var mainActions =
      '<button class="btn btn-red btn-block btn-lg" id="createBig">' + ICON.userplus + 'Créer contacts étudiants d’urgence</button>' +
      '<div class="home-tiles">' +
      '<button class="tile" id="repBtn"><span class="tile-ic tile-red">' + ICON.book + '</span><b>Répertoire d’urgence étudiant</b><span>' + (total ? total + ' étudiant' + (total > 1 ? 's' : '') : 'Aucune fiche pour l’instant') + '</span></button>' +
      '<button class="tile" id="teacherBtn"><span class="tile-ic">' + ICON.id + '</span><b>Informations de l’enseignant</b><span>' + (st.teacher ? esc(teacherLabel()) : 'À compléter') + '</span></button>' +
      '</div>';

    if (!db.classes.length) {
      html += '<div class="card" style="text-align:center"><h2 style="font-size:19px">Bienvenue dans ClasSos</h2>' +
        '<p class="muted" style="margin:6px 0 0">Collectez en quelques minutes les contacts à prévenir si un étudiant fait un malaise pendant votre cours — même quand son téléphone est éteint.</p></div>' +
        mainActions +
        '<div class="section-title">Comment ça marche</div>' +
        '<div class="card"><ol style="margin:0;padding-left:20px;line-height:1.8" class="muted">' +
        '<li>Appuyez sur <b>Créer contacts étudiants d’urgence</b> et nommez votre classe (ex. « Licence 2 — Groupe A »).</li>' +
        '<li><b>Affichez le QR code d\'invitation</b> au tableau : chaque étudiant remplit sa fiche en 1 minute sur son téléphone.</li>' +
        '<li><b>Scannez le QR code</b> de chaque étudiant. Les fiches sont enregistrées sur votre téléphone.</li>' +
        '<li>En cas de malaise : bouton rouge <b>URGENCE</b> → nom de l\'étudiant → <b>Appeler</b>.</li></ol></div>';
    } else {
      var withMed = db.classes.reduce(function (n, c) { return n + c.students.filter(function (s) { return s.medical; }).length; }, 0);
      html += '<div class="stats">' +
        '<div class="stat"><b>' + db.classes.length + '</b><span>classe' + (db.classes.length > 1 ? 's' : '') + '</span></div>' +
        '<div class="stat"><b>' + total + '</b><span>fiche' + (total > 1 ? 's' : '') + ' enregistrée' + (total > 1 ? 's' : '') + '</span></div>' +
        '<div class="stat"><b>' + withMed + '</b><span>info' + (withMed > 1 ? 's' : '') + ' médicale' + (withMed > 1 ? 's' : '') + '</span></div></div>';
      html += mainActions;
      html += '<div class="section-title">Mes classes</div><div class="list">';
      db.classes.forEach(function (c) {
        html += '<div class="row" data-cls="' + esc(c.id) + '" role="button" tabindex="0"><div class="class-icon">' + esc((c.name[0] || '?').toUpperCase()) + '</div>' +
          '<div class="grow"><div class="title">' + esc(c.name) + '</div><div class="meta">' + c.students.length + ' étudiant' + (c.students.length > 1 ? 's' : '') + '</div></div>' +
          '<button class="icon-act" type="button" data-edit="' + esc(c.id) + '" aria-label="Modifier la classe">' + ICON.edit + '</button>' +
          '<button class="icon-act danger" type="button" data-del="' + esc(c.id) + '" aria-label="Supprimer la classe">' + ICON.trash + '</button></div>';
      });
      html += '</div><div style="height:14px"></div><button class="btn btn-ghost btn-block" id="newClass">' + ICON.plus + 'Nouvelle classe</button>';
    }
    view.innerHTML = html + SIG;
    view.querySelectorAll('[data-cls]').forEach(function (b) {
      var open = function (e) { if (e.target.closest('.icon-act')) return; go('/c/' + b.dataset.cls); };
      b.onclick = open;
      b.onkeydown = function (e) { if (e.key === 'Enter') open(e); };
    });
    view.querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { newClassModal(getClass(b.dataset.edit)); }; });
    view.querySelectorAll('[data-del]').forEach(function (b) { b.onclick = function () { deleteClass(getClass(b.dataset.del)); }; });
    var cb = $('createBig'); if (cb) cb.onclick = createContactsPickClass;
    var rb = $('repBtn'); if (rb) rb.onclick = function () { go('/repertoire'); };
    var tb = $('teacherBtn'); if (tb) tb.onclick = function () { go('/enseignant'); };
    var nc = $('newClass'); if (nc) nc.onclick = function () { newClassModal(null); };
    var ib = $('installBtn'); if (ib) ib.onclick = function () { installEvt.prompt(); installEvt = null; };
  }

  /* Fiche reçue par lien (WhatsApp / SMS) : #/import/CLASSOS1.xxx */
  function importFiche(view, code) {
    var f = SOS.decodeFiche(code);
    try { history.replaceState(null, '', location.pathname + location.search + '#/'); } catch (e) {}
    renderHome(view);
    if (!f) { toast('Lien de fiche incomplet ou invalide. Demandez à l’étudiant de le renvoyer.', 'err'); return; }
    var match = db.classes.filter(function (c) { return f.classe && norm(c.name) === norm(f.classe); })[0];
    var opts = db.classes.map(function (c) { return '<option value="' + esc(c.id) + '"' + (match && match.id === c.id ? ' selected' : '') + '>' + esc(c.name) + '</option>'; }).join('');
    if (!match) opts = '<option value="__new" selected>+ Nouvelle classe : ' + esc(f.classe || 'Ma classe') + '</option>' + opts;
    modal('<h2>Fiche reçue</h2><p class="muted">Vérifiez puis ajoutez-la à une classe.</p>' +
      '<div class="card" style="margin-bottom:14px"><div style="font-weight:750;font-size:18px">' + esc(f.prenom + ' ' + f.nom) + '</div>' +
      (f.classe ? '<div class="tiny">' + esc(f.classe) + '</div>' : '') +
      '<div class="muted" style="margin-top:8px">' + f.contacts.map(function (c) { return esc(c.lien) + ' : ' + esc(c.nom) + ' — ' + esc(SOS.phonePretty(c.tel)); }).join('<br>') + '</div>' +
      (f.medical ? '<div class="badges" style="margin-top:8px"><span class="badge badge-red">⚠ ' + esc(f.medical) + '</span></div>' : '') + '</div>' +
      '<div class="field"><label for="impCls">Classe</label><select id="impCls">' + opts + '</select></div>' +
      '<button class="btn btn-primary btn-block btn-lg" id="impGo">Ajouter la fiche</button>',
      function (m, close) {
        m.querySelector('#impGo').onclick = function () {
          var id = m.querySelector('#impCls').value;
          var cls = getClass(id);
          if (cls && findStudent(cls, f)) {
            var who = esc(f.prenom + ' ' + f.nom);
            confirmModal('Fiche déjà enregistrée', '<b>' + who + '</b> est déjà dans « ' + esc(cls.name) + ' ». Les étudiants ne peuvent pas modifier leur fiche : vous seul décidez. Remplacer l’ancienne fiche par celle-ci ?', 'Remplacer la fiche', function () {
              upsertStudent(cls, f); go('/c/' + cls.id); toast('Fiche de ' + f.prenom + ' ' + f.nom + ' remplacée', 'ok');
            });
            return;
          }
          if (!cls) { cls = { id: uid(), name: f.classe || 'Ma classe', created: Date.now(), students: [] }; db.classes.push(cls); persist(); }
          var r = upsertStudent(cls, f);
          close(); go('/c/' + cls.id);
          toast(fullName(r.student) + ' ajouté(e) ✓', 'ok');
        };
      });
  }

  function newClassModal(existing, thenCreate) {
    var editing = existing && existing.id;
    modal('<h2>' + (editing ? 'Modifier la classe' : 'Nouvelle classe') + '</h2><p class="muted">Donnez un nom clair : les étudiants le verront sur leur fiche.</p>' +
      '<form id="clsForm"><div class="field"><label for="clsName">Nom de la classe</label><input id="clsName" maxlength="80" placeholder="Ex : Licence 2 Informatique — Groupe A" value="' + esc(editing ? existing.name : '') + '"><div class="err">Indiquez un nom.</div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">' + (editing ? 'Enregistrer' : 'Créer la classe') + '</button></form>',
      function (m, close) {
        var inp = m.querySelector('#clsName'); setTimeout(function () { inp.focus(); }, 50);
        m.querySelector('#clsForm').onsubmit = function (e) {
          e.preventDefault();
          var name = inp.value.trim();
          if (!name) { inp.closest('.field').classList.add('invalid'); return; }
          if (editing) { existing.name = name; persist(); close(); route(); toast('Classe modifiée', 'ok'); return; }
          var c = { id: uid(), name: name, created: Date.now(), students: [] };
          db.classes.push(c); persist(); close();
          if (thenCreate) pendingChooser = c.id;
          go('/c/' + c.id);
        };
      });
  }

  /* ======================= Classe ======================= */
  function renderClass(view, cls) {
    setHeader(cls.name, cls.students.length + ' fiche' + (cls.students.length > 1 ? 's' : ''), true);
    var html = '<button class="btn btn-red btn-block btn-lg" id="createBtn">' + ICON.userplus + 'Créer contacts étudiants d’urgence</button>' +
      '<div class="btn-row class-actions">' +
      '<button class="btn btn-ghost" id="scanBtn">' + ICON.scan + 'Scanner</button>' +
      '<button class="btn btn-ghost" id="renameBtn">' + ICON.edit + 'Modifier</button>' +
      '<button class="btn btn-danger-ghost" id="delClassBtn">' + ICON.trash + 'Supprimer</button></div>';

    if (!cls.students.length) {
      html += '<div class="empty">' + ICON.users + '<h3>Aucune fiche pour l\'instant</h3><p>Appuyez sur <b>Créer contacts étudiants d’urgence</b> : invitez les étudiants par QR code ou lien, ou saisissez leurs fiches vous-même.</p></div>';
    } else {
      html += '<div class="search">' + ICON.search + '<input id="q" type="search" placeholder="Rechercher un étudiant…" autocomplete="off"></div><div class="list" id="list"></div>';
    }
    html += '<div class="divider"></div><div class="btn-row">' +
      '<button class="btn btn-ghost" id="printBtn"' + (cls.students.length ? '' : ' disabled') + '>' + ICON.print + 'Liste papier</button>' +
      '<button class="btn btn-ghost" id="blankBtn">' + ICON.print + 'Formulaires vierges</button>' +
      '</div>' +
      '<p class="tiny" style="margin-top:10px">« Liste papier » imprime les contacts de la classe : gardez-en une copie dans la salle en cas de panne de téléphone. « Formulaires vierges » imprime 3 fiches à remplir à la main, pour les étudiants sans smartphone : saisissez-les ensuite avec « Saisie manuelle ».</p>';
    view.innerHTML = html;

    if (cls.students.length) {
      var draw = function () { $('list').innerHTML = studentRows(cls, filterStudents(cls.students, $('q').value)); bindRows($('list')); };
      $('q').oninput = draw; draw();
    }
    $('createBtn').onclick = function () { createContacts(cls); };
    $('scanBtn').onclick = function () { openScanner(cls); };
    $('printBtn').onclick = function () { printClass(cls); };
    $('blankBtn').onclick = function () { printBlank(cls); };
    $('renameBtn').onclick = function () { newClassModal(cls); };
    $('delClassBtn').onclick = function () { deleteClass(cls); };
    if (pendingChooser === cls.id) { pendingChooser = null; createContacts(cls); }
  }

  function filterStudents(list, q) {
    q = norm(q);
    var out = sortStudents(list);
    if (!q) return out;
    return out.filter(function (s) { return norm(s.prenom + ' ' + s.nom + ' ' + s.nom + ' ' + s.prenom + ' ' + s.matricule).indexOf(q) >= 0; });
  }

  function studentRows(cls, list, showClass) {
    if (!list.length) return '<p class="muted" style="text-align:center;padding:20px">Aucun étudiant trouvé.</p>';
    return list.map(function (s) {
      var c1 = s.contacts[0];
      var badges = '';
      if (s.medical) badges += '<span class="badge badge-red">⚠ Info médicale</span>';
      if (s.sang) badges += '<span class="badge badge-gray">' + esc(s.sang) + '</span>';
      if (s.contacts.length < 2) badges += '<span class="badge badge-amber">1 seul contact</span>';
      return '<div class="row" data-open="' + esc((s._cls || cls).id) + '/' + esc(s.id) + '" role="button" tabindex="0">' +
        '<div class="avatar">' + esc(initials(s)) + '</div>' +
        '<div class="grow"><div class="title">' + esc(fullName(s)) + '</div>' +
        '<div class="meta">' + (showClass ? esc((s._cls || cls).name) + ' · ' : '') + esc(c1.lien) + ' : ' + esc(c1.nom) + '</div>' +
        (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>' +
        '<a class="quick-call" href="' + esc(SOS.telHref(c1.tel)) + '" aria-label="Appeler ' + esc(c1.nom) + '" data-call="1">' + I.phone + '</a></div>';
    }).join('');
  }

  function bindRows(root) {
    root.querySelectorAll('[data-open]').forEach(function (r) {
      var open = function (e) { if (e.target.closest('[data-call]')) return; go('/s/' + r.dataset.open); };
      r.onclick = open;
      r.onkeydown = function (e) { if (e.key === 'Enter') open(e); };
    });
  }

  function inviteModal(cls) {
    var url = new URL('fiche.html', location.href);
    url.search = '?c=' + encodeURIComponent(cls.name);
    url.hash = '';
    var link = url.toString();
    var invite = 'Merci de remplir votre fiche contact d’urgence pour le cours « ' + cls.name + ' » (1 minute) : ' + link;
    modal('<h2>Inviter les étudiants</h2><p class="muted">Projetez ou montrez ce QR code : les étudiants le scannent avec l\'appareil photo de leur téléphone. <b>Ceux qui ne savent pas scanner</b> reçoivent le lien par WhatsApp ou SMS.</p>' +
      '<div class="qr-box">' + SOS.qrImg(link, 8) + '</div>' +
      '<div style="text-align:center;font-weight:750;margin:12px 0 2px">' + esc(cls.name) + '</div>' +
      '<p class="tiny" style="text-align:center;word-break:break-all;margin:0 0 14px">' + esc(link) + '</p>' +
      '<div class="btn-row"><a class="btn btn-green" href="https://wa.me/?text=' + encodeURIComponent(invite) + '" target="_blank" rel="noopener">' + I.wa + 'WhatsApp</a>' +
      '<a class="btn btn-ghost" href="sms:?&body=' + encodeURIComponent(invite) + '">SMS</a>' +
      '<button class="btn btn-ghost" id="copyLink">Copier le lien</button></div>' +
      '<p class="tiny" style="margin:10px 2px 0">Étudiant sans smartphone : il remplit sa fiche sur le téléphone d\'un camarade (option « Téléphone d\'une autre personne »), ou utilisez « Formulaires vierges ».</p>' +
      '<div style="height:10px"></div><button class="btn btn-red btn-block btn-lg" id="goScan">' + ICON.scan + 'C\'est fait : scanner les fiches</button>',
      function (m, close) {
        m.querySelector('#copyLink').onclick = function () {
          copyText(link).then(function () { toast('Lien copié', 'ok'); });
        };
        m.querySelector('#goScan').onclick = function () { close(); openScanner(cls); };
      });
  }

  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); return Promise.resolve();
  }

  function pasteModal(cls) {
    modal('<h2>Coller une fiche reçue</h2><p class="muted">Collez ici le message ou le lien reçu d’un étudiant (WhatsApp, SMS…). Vous pouvez en coller plusieurs d\'un coup.</p>' +
      '<textarea class="kbd-code" id="codeIn" placeholder="Collez le message reçu…"></textarea><div style="height:12px"></div>' +
      '<button class="btn btn-primary btn-block btn-lg" id="importCode">Ajouter à la classe</button>',
      function (m, close) {
        m.querySelector('#importCode').onclick = function () {
          var parts = m.querySelector('#codeIn').value.split(/\s+/).filter(Boolean);
          var added = 0, skipped = 0, bad = 0;
          parts.forEach(function (p) {
            if (p.indexOf('CLASSOS1.') < 0) return;
            var f = SOS.decodeFiche(p);
            if (!f) { bad++; return; }
            addFromStudent(cls, f).skipped ? skipped++ : added++;
          });
          if (!added && !skipped) { toast('Fiche non reconnue. Vérifiez que le message a été copié en entier.', 'err'); return; }
          close(); route();
          toast((added ? added + ' fiche(s) ajoutée(s)' : 'Aucune nouvelle fiche') + (skipped ? ' — ' + skipped + ' déjà enregistrée(s), non modifiée(s)' : '') + (bad ? ' — ' + bad + ' invalide(s)' : ''), added ? 'ok' : '');
        };
      });
  }

  /* ======================= Saisie / modification ======================= */
  function studentForm(cls, s) {
    var c = function (i, k) { return s && s.contacts[i] ? esc(s.contacts[i][k]) : ''; };
    var opts = function (i) {
      var cur = s && s.contacts[i] ? s.contacts[i].lien : '';
      return '<option value="">— Choisir —</option>' + LIENS.map(function (l) { return '<option' + (l === cur ? ' selected' : '') + '>' + l + '</option>'; }).join('') +
        (cur && LIENS.indexOf(cur) < 0 ? '<option selected>' + esc(cur) + '</option>' : '');
    };
    var sangs = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
    modal('<h2>' + (s ? 'Modifier la fiche' : 'Saisie manuelle') + '</h2><p class="muted">Les champs marqués * sont obligatoires.</p><form id="sf" novalidate>' +
      '<div class="grid-2"><div class="field"><label>Nom *</label><input name="nom" maxlength="60" value="' + (s ? esc(s.nom) : '') + '"><div class="err">Obligatoire.</div></div>' +
      '<div class="field"><label>Prénom(s) *</label><input name="prenom" maxlength="60" value="' + (s ? esc(s.prenom) : '') + '"><div class="err">Obligatoire.</div></div></div>' +
      '<div class="field"><label>Matricule <span class="opt">(facultatif)</span></label><input name="matricule" maxlength="30" value="' + (s ? esc(s.matricule) : '') + '"></div>' +
      [0, 1].map(function (i) {
        return '<fieldset class="fieldset"><legend>Contact ' + (i + 1) + (i ? ' <span class="tiny">(conseillé)</span>' : ' *') + '</legend>' +
          '<div class="grid-2"><div class="field"><label>Nom</label><input name="c' + i + 'nom" maxlength="60" value="' + c(i, 'nom') + '"><div class="err">Obligatoire.</div></div>' +
          '<div class="field"><label>Lien</label><select name="c' + i + 'lien">' + opts(i) + '</select><div class="err">Obligatoire.</div></div></div>' +
          '<div class="field"><label>Téléphone</label><input name="c' + i + 'tel" type="tel" inputmode="tel" maxlength="25" value="' + c(i, 'tel') + '"><div class="err">Numéro invalide.</div></div></fieldset>';
      }).join('') +
      '<div class="field"><label>Groupe sanguin</label><select name="sang">' + sangs.map(function (g) { return '<option value="' + g + '"' + (s && s.sang === g ? ' selected' : '') + '>' + (g || 'Non renseigné') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Info médicale utile <span class="opt">(facultatif)</span></label><textarea name="medical" maxlength="300">' + (s ? esc(s.medical) : '') + '</textarea></div>' +
      (s ? '' : '<label class="check"><input type="checkbox" name="consent"><span>L\'étudiant(e) a donné son accord pour que ces informations soient conservées à des fins d\'urgence.</span></label><div style="height:14px"></div>') +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Enregistrer</button></form>',
      function (m, close) {
        var f = m.querySelector('#sf');
        f.onsubmit = function (e) {
          e.preventDefault();
          var v = function (n) { return f.elements[n].value.trim(); };
          var bad = function (n, cond) { f.elements[n].closest('.field').classList.toggle('invalid', !!cond); return !cond; };
          var ok = bad('nom', !v('nom')) & bad('prenom', !v('prenom')) & bad('c0nom', !v('c0nom')) & bad('c0lien', !v('c0lien')) & bad('c0tel', !SOS.phoneValid(v('c0tel')));
          var c1any = v('c1nom') || v('c1tel') || v('c1lien');
          ok = ok & bad('c1nom', c1any && !v('c1nom')) & bad('c1lien', c1any && !v('c1lien')) & bad('c1tel', c1any && !SOS.phoneValid(v('c1tel')));
          if (!s && !f.elements.consent.checked) { toast("Cochez l'accord de l'étudiant(e)", 'err'); return; }
          if (!ok) return;
          var contacts = [{ nom: v('c0nom'), lien: v('c0lien'), tel: v('c0tel') }];
          if (c1any) contacts.push({ nom: v('c1nom'), lien: v('c1lien'), tel: v('c1tel') });
          var data = { nom: v('nom').toUpperCase(), prenom: v('prenom'), matricule: v('matricule'), sang: v('sang'), medical: v('medical'), contacts: contacts };
          if (s) { Object.assign(s, data, { updated: Date.now() }); persist(); close(); route(); toast('Fiche mise à jour', 'ok'); }
          else { var r = upsertStudent(cls, data); close(); route(); toast(fullName(r.student) + (r.updated ? ' : fiche mise à jour' : ' ajouté(e)'), 'ok'); }
        };
      });
  }

  /* ======================= Fiche d'urgence ======================= */
  function renderSheet(view, cls, s) {
    setHeader(fullName(s), cls.name, true);
    $('fab').hidden = true;
    var ns = db.settings.numbers;
    var html = '<div class="sos-head"><div class="who">' + esc(fullName(s)) + '</div><div class="cls">' + esc(cls.name) + (s.matricule ? ' · Matricule ' + esc(s.matricule) : '') + '</div>' +
      ((s.medical || s.sang) ? '<div class="med">' +
        (s.medical ? '<div><b>⚠ À signaler aux secours</b>' + esc(s.medical) + '</div>' : '') +
        (s.sang ? '<div><b>Groupe sanguin</b>' + esc(s.sang) + '</div>' : '') + '</div>' : '') + '</div>';

    s.contacts.forEach(function (c, i) {
      html += '<div class="contact-card"><div class="rank">Contact ' + (i + 1) + (i === 0 ? ' · à appeler en premier' : '') + '</div>' +
        '<div class="name">' + esc(c.nom) + '</div><div class="rel">' + esc(c.lien) + '</div>' +
        '<div class="num">' + esc(SOS.phonePretty(c.tel)) + '</div>' +
        '<a class="call-big" href="' + esc(SOS.telHref(c.tel)) + '">' + I.phone + 'Appeler · ' + esc(c.lien) + '</a>' +
        '<a class="wa-link" href="' + esc(SOS.waHref(c.tel)) + '" target="_blank" rel="noopener">' + I.wa + 'WhatsApp</a></div>';
    });

    html += '<div class="section-title">Numéros d\'urgence</div><div class="services">' +
      ns.map(function (n) { return '<a class="service" href="tel:' + esc(n.num) + '"><b>' + esc(n.num) + '</b><span>' + esc(n.label) + '</span></a>'; }).join('') + '</div>';

    var teacher = teacherLabel() || '[votre nom]';
    var school = db.settings.school ? ' à ' + db.settings.school : '';
    var c1 = s.contacts[0];
    html += '<div class="section-title">Que dire au téléphone</div><div class="card"><p style="margin:0;font-size:15px;line-height:1.55">« Bonjour, je suis <b>' + esc(teacher) + '</b>, enseignant(e) de <b>' + esc(s.prenom) + '</b>' + esc(school) + '. ' + esc(s.prenom) + ' a eu un malaise pendant le cours. [Décrire son état]. Les secours ont été / vont être appelés. Pouvez-vous venir ou nous rappeler ? »</p>' +
      '<p class="tiny" style="margin:10px 0 0">Si l\'étudiant est inconscient ou ne respire pas normalement, appelez d\'abord le <b>' + esc((ns[0] || {}).num || '185') + '</b> (' + esc((ns[0] || {}).label || 'SAMU') + '), puis ' + esc(c1.nom) + '.</p></div>';

    html += '<div class="divider"></div><div class="btn-row"><button class="btn btn-ghost" id="editS">Modifier la fiche</button><button class="btn btn-danger-ghost" id="delS">Supprimer</button></div>' +
      '<p class="tiny" style="margin-top:10px">Fiche ' + (s.updated && s.updated !== s.added ? 'mise à jour' : 'ajoutée') + ' le ' + new Date(s.updated || s.added).toLocaleDateString('fr-FR') + '.</p>';
    view.innerHTML = html;
    $('editS').onclick = function () { studentForm(cls, s); };
    $('delS').onclick = function () {
      confirmModal('Supprimer la fiche ?', 'La fiche de <b>' + esc(fullName(s)) + '</b> sera effacée de ce téléphone.', 'Supprimer la fiche', function () {
        cls.students = cls.students.filter(function (x) { return x.id !== s.id; }); persist(); go('/c/' + cls.id); toast('Fiche supprimée');
      });
    };
  }

  /* ======================= Informations de l'enseignant ======================= */
  function renderTeacher(view) {
    setHeader('Informations de l’enseignant', 'Vous seul pouvez les modifier', true);
    var st = db.settings;
    var f = function (name, label, val, attrs, hint) {
      return '<div class="field"><label for="t_' + name + '">' + label + '</label><input id="t_' + name + '" name="' + name + '" value="' + esc(val || '') + '" ' + (attrs || '') + '>' +
        (hint ? '<div class="hint">' + hint + '</div>' : '') + '<div class="err" id="t_' + name + 'Err"></div></div>';
    };
    view.innerHTML = '<form id="teacherForm" class="card" novalidate>' +
      '<p class="muted">Ces informations apparaissent dans le message à lire au téléphone en cas d’urgence et sur les documents imprimés.</p>' +
      '<div class="grid-2">' + f('civ', 'Civilité', st.civ, 'maxlength="12" placeholder="M., Mme, Dr…"') + f('teacher', 'Nom et prénom', st.teacher, 'maxlength="60" autocapitalize="words" placeholder="Ex : Kouassi Yao"') + '</div>' +
      f('subject', 'Matière enseignée', st.subject, 'maxlength="60" placeholder="Ex : Mathématiques"') +
      f('school', 'Établissement', st.school, 'maxlength="80" placeholder="Ex : Université Félix Houphouët-Boigny"') +
      f('tphone', 'Votre téléphone', st.tphone, 'type="tel" inputmode="tel" maxlength="22" placeholder="07 07 12 34 56"', 'Facultatif. Utile si un proche doit vous rappeler.') +
      f('temail', 'Votre e-mail', st.temail, 'type="email" inputmode="email" maxlength="80" placeholder="nom@exemple.com"', 'Facultatif.') +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Enregistrer</button></form>' +
      '<div class="notice">' + I.lock + '<span>Ces informations restent sur votre téléphone, comme les fiches des étudiants.</span></div>';
    var form = $('teacherForm');
    var tel = form.elements.tphone;
    tel.addEventListener('input', function () { if (tel.selectionStart === tel.value.length) tel.value = SOS.phoneFormat(tel.value); });
    form.onsubmit = function (e) {
      e.preventDefault();
      var v = function (n) { return form.elements[n].value.trim(); };
      var ok = true;
      var setErr = function (n, msg) { $('t_' + n + 'Err').textContent = msg || ''; form.elements[n].closest('.field').classList.toggle('invalid', !!msg); if (msg) ok = false; };
      setErr('teacher', v('teacher') ? '' : 'Indiquez votre nom.');
      setErr('tphone', v('tphone') && !SOS.phoneValid(v('tphone')) ? SOS.phoneCheck(v('tphone')).msg : '');
      setErr('temail', v('temail') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('temail')) ? 'Adresse e-mail invalide.' : '');
      if (!ok) { var first = form.querySelector('.field.invalid input'); if (first) first.focus(); return; }
      st.civ = v('civ'); st.teacher = v('teacher'); st.subject = v('subject'); st.school = v('school');
      st.tphone = v('tphone') ? SOS.phonePretty(v('tphone')) : ''; st.temail = v('temail');
      persist(); go('/'); toast('Informations enregistrées', 'ok');
    };
  }
  function teacherLabel() {
    var st = db.settings;
    return st.teacher ? ((st.civ ? st.civ + ' ' : '') + st.teacher) : '';
  }

  /* ======================= Répertoire d'urgence étudiant ======================= */
  var repState = { q: '', cls: '' };
  function renderRepertoire(view) {
    var total = totalStudents();
    setHeader('Répertoire d’urgence', total + ' étudiant' + (total > 1 ? 's' : ''), true);
    if (!total) {
      view.innerHTML = '<div class="empty">' + ICON.book + '<h3>Le répertoire est vide</h3><p>Ajoutez d’abord les fiches de vos étudiants.</p>' +
        '<button class="btn btn-red btn-lg" id="repCreate">' + ICON.userplus + 'Créer contacts étudiants d’urgence</button></div>';
      $('repCreate').onclick = createContactsPickClass;
      return;
    }
    if (repState.cls && !getClass(repState.cls)) repState.cls = '';
    var html = '<div class="search">' + ICON.search + '<input id="rq" type="search" placeholder="Rechercher un étudiant…" autocomplete="off" value="' + esc(repState.q) + '"></div>';
    if (db.classes.length > 1) {
      html += '<div class="rep-filter" role="tablist" aria-label="Filtrer par classe">' +
        '<button class="chip-f" data-f="" aria-pressed="' + (!repState.cls) + '">Toutes</button>' +
        db.classes.map(function (c) { return '<button class="chip-f" data-f="' + esc(c.id) + '" aria-pressed="' + (repState.cls === c.id) + '">' + esc(c.name) + '</button>'; }).join('') + '</div>';
    }
    html += '<div id="repList"></div>';
    view.innerHTML = html;

    var draw = function () {
      var all = [];
      db.classes.forEach(function (c) {
        if (repState.cls && c.id !== repState.cls) return;
        c.students.forEach(function (s) { all.push({ s: s, c: c }); });
      });
      var q = norm(repState.q);
      if (q) all = all.filter(function (x) { return norm(x.s.prenom + ' ' + x.s.nom + ' ' + x.s.nom + ' ' + x.s.prenom + ' ' + x.s.matricule).indexOf(q) >= 0; });
      all.sort(function (a, b) { return (a.s.nom + a.s.prenom).localeCompare(b.s.nom + b.s.prenom, 'fr'); });
      if (!all.length) { $('repList').innerHTML = '<p class="muted" style="text-align:center;padding:24px">Aucun étudiant trouvé.</p>'; return; }
      var out = '', letter = '';
      all.forEach(function (x) {
        var s = x.s, c = x.c;
        var L = norm(s.nom).charAt(0).toUpperCase() || '#';
        if (L !== letter) { letter = L; out += '<div class="rep-letter">' + esc(L) + '</div>'; }
        var body = '';
        if (s.medical || s.sang) {
          body += '<div class="rep-med">' + (s.medical ? '<div><b>⚠ À signaler aux secours</b>' + esc(s.medical) + '</div>' : '') +
            (s.sang ? '<div class="rep-sang"><b>Groupe sanguin</b>' + esc(s.sang) + '</div>' : '') + '</div>';
        }
        s.contacts.forEach(function (k, i) {
          body += '<div class="rep-contact"><div class="grow"><div class="tiny">Contact ' + (i + 1) + ' · ' + esc(k.lien) + '</div>' +
            '<div class="rep-cname">' + esc(k.nom) + '</div><div class="rep-num">' + esc(SOS.phonePretty(k.tel)) + '</div></div>' +
            '<a class="btn btn-green rep-call" href="' + esc(SOS.telHref(k.tel)) + '" aria-label="Appeler ' + esc(k.nom) + '">' + I.phone + 'Appeler</a>' +
            '<a class="icon-act rep-wa" href="' + esc(SOS.waHref(k.tel)) + '" target="_blank" rel="noopener" aria-label="WhatsApp ' + esc(k.nom) + '">' + I.wa + '</a></div>';
        });
        body += '<a class="rep-more" href="#/s/' + esc(c.id) + '/' + esc(s.id) + '">Voir la fiche d’urgence complète →</a>';
        var badges = (s.medical ? '<span class="badge badge-red">⚠ Info médicale</span>' : '') + (s.contacts.length < 2 ? '<span class="badge badge-amber">1 seul contact</span>' : '');
        out += '<div class="acc" data-id="' + esc(s.id) + '">' +
          '<button class="acc-head" type="button" aria-expanded="false" aria-controls="acc-' + esc(s.id) + '">' +
          '<div class="avatar">' + esc(initials(s)) + '</div>' +
          '<div class="grow"><div class="title">' + esc(fullName(s)) + '</div><div class="meta">' + esc(c.name) + '</div>' + (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>' +
          ICON.down + '</button>' +
          '<div class="acc-body" id="acc-' + esc(s.id) + '" hidden>' + body + '</div></div>';
      });
      $('repList').innerHTML = out;
      $('repList').querySelectorAll('.acc-head').forEach(function (h) {
        h.onclick = function () {
          var open = h.getAttribute('aria-expanded') === 'true';
          h.setAttribute('aria-expanded', open ? 'false' : 'true');
          h.nextElementSibling.hidden = open;
        };
      });
    };
    $('rq').oninput = function () { repState.q = $('rq').value; draw(); };
    view.querySelectorAll('.chip-f').forEach(function (b) {
      b.onclick = function () {
        repState.cls = b.dataset.f;
        view.querySelectorAll('.chip-f').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        draw();
      };
    });
    draw();
  }

  /* ======================= Mode urgence ======================= */
  function renderUrgence(view) {
    setHeader('Urgence', 'Qui a un malaise ?', true);
    $('fab').hidden = true;
    var all = [];
    db.classes.forEach(function (c) { c.students.forEach(function (s) { all.push(Object.assign({ _cls: c }, s)); }); });
    var ns = db.settings.numbers;
    var html = '<div class="services" style="margin-bottom:16px">' +
      ns.map(function (n) { return '<a class="service" style="background:var(--red)" href="tel:' + esc(n.num) + '"><b>' + esc(n.num) + '</b><span>' + esc(n.label) + '</span></a>'; }).join('') + '</div>';
    if (!all.length) {
      html += '<div class="empty"><h3>Aucune fiche enregistrée</h3><p>Appelez directement les secours avec les boutons ci-dessus. Pensez à collecter les fiches de vos étudiants dès que possible.</p></div>';
      view.innerHTML = html; return;
    }
    html += '<div class="search">' + ICON.search + '<input id="uq" type="search" placeholder="Tapez le nom ou le prénom…" autocomplete="off" style="font-size:18px;min-height:58px"></div><div class="list" id="ulist"></div>';
    view.innerHTML = html;
    var draw = function () { $('ulist').innerHTML = studentRows(null, filterStudents(all, $('uq').value), db.classes.length > 1); bindRows($('ulist')); };
    $('uq').oninput = draw; draw();
    setTimeout(function () { $('uq').focus(); }, 80);
  }

  /* ======================= Scanner ======================= */
  var scan = null;

  function openScanner(cls) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast("Caméra indisponible sur ce navigateur. Utilisez « Coller une fiche ».", 'err'); return;
    }
    var el = document.createElement('div');
    el.className = 'scanner';
    el.innerHTML = '<video playsinline muted></video><div class="frame" id="frame"></div>' +
      '<div class="top-msg">Visez le QR code de l\'étudiant</div>' +
      '<div class="bar"><div class="count" id="scanCount">0 fiche scannée</div>' +
      '<button class="btn btn-ghost btn-block btn-lg" id="scanDone">Terminer</button></div>';
    document.body.appendChild(el);
    var video = el.querySelector('video');
    var count = 0, lastCode = '', lastAt = 0;
    scan = { el: el, stream: null, timer: null };
    el.querySelector('#scanDone').onclick = function () { closeScanner(); route(); };

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(function (stream) {
        if (!scan) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        scan.stream = stream; video.srcObject = stream; return video.play();
      })
      .then(getDecoder)
      .then(function (decode) {
        if (!scan) return;
        var busy = false;
        scan.timer = setInterval(function () {
          if (busy || video.readyState < 2) return;
          busy = true;
          decode(video).then(function (text) {
            busy = false;
            if (!text || !scan) return;
            var now = Date.now();
            if (text === lastCode && now - lastAt < 4000) return;
            lastCode = text; lastAt = now;
            var f = SOS.decodeFiche(text);
            if (!f) { toast("Ce QR code n'est pas une fiche ClasSos", 'err'); return; }
            var r = addFromStudent(cls, f);
            if (r.skipped) { toast(fullName(r.student) + ' est déjà enregistré(e). Pour modifier sa fiche, ouvrez-la dans la classe.'); return; }
            count++;
            el.querySelector('#scanCount').textContent = count + ' fiche' + (count > 1 ? 's' : '') + ' scannée' + (count > 1 ? 's' : '') + ' · ' + cls.students.length + ' au total';
            var fr = el.querySelector('#frame'); fr.classList.remove('flash-ok'); void fr.offsetWidth; fr.classList.add('flash-ok');
            if (navigator.vibrate) navigator.vibrate(90);
            beep();
            toast('✓ ' + fullName(r.student), 'ok');
          }, function () { busy = false; });
        }, 180);
      })
      .catch(function (err) {
        closeScanner();
        var denied = err && (err.name === 'NotAllowedError' || err.name === 'SecurityError');
        toast(denied ? "Autorisez l'accès à la caméra pour scanner (ou utilisez « Coller une fiche »)." : "Impossible d'ouvrir la caméra.", 'err');
      });
  }

  function closeScanner() {
    if (!scan) return;
    clearInterval(scan.timer);
    if (scan.stream) scan.stream.getTracks().forEach(function (t) { t.stop(); });
    scan.el.remove(); scan = null;
  }

  var decoderPromise = null;
  function getDecoder() {
    if (decoderPromise) return decoderPromise;
    decoderPromise = (('BarcodeDetector' in window) ? window.BarcodeDetector.getSupportedFormats() : Promise.resolve([]))
      .then(function (formats) {
        if (formats.indexOf('qr_code') >= 0) {
          var det = new window.BarcodeDetector({ formats: ['qr_code'] });
          return function (video) { return det.detect(video).then(function (r) { return r.length ? r[0].rawValue : null; }); };
        }
        return loadScript('vendor/jsQR.js').then(function () {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          return function (video) {
            var w = video.videoWidth, h = video.videoHeight;
            if (!w) return Promise.resolve(null);
            var scale = Math.min(1, 800 / Math.max(w, h));
            canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale);
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            var img = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var res = window.jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
            return Promise.resolve(res ? res.data : null);
          };
        });
      })
      .catch(function (e) { decoderPromise = null; throw e; });
    return decoderPromise;
  }

  function loadScript(src) {
    return new Promise(function (ok, ko) {
      if (window.jsQR) return ok();
      var sc = document.createElement('script'); sc.src = src; sc.onload = ok; sc.onerror = ko; document.head.appendChild(sc);
    });
  }

  var actx = null;
  function beep() {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      var o = actx.createOscillator(), g = actx.createGain();
      o.frequency.value = 1046; g.gain.value = 0.08;
      o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime + 0.12);
    } catch (e) {}
  }

  /* ======================= Impression ======================= */
  function printClass(cls) {
    var rows = sortStudents(cls.students).map(function (s) {
      var c = s.contacts.map(function (x) { return esc(x.nom) + ' (' + esc(x.lien) + ') — <b>' + esc(SOS.phonePretty(x.tel)) + '</b>'; }).join('<br>');
      return '<tr><td><b>' + esc(s.nom) + '</b> ' + esc(s.prenom) + (s.matricule ? '<br><small>' + esc(s.matricule) + '</small>' : '') + '</td><td>' + c + '</td><td>' + esc(s.sang) + '</td><td>' + esc(s.medical) + '</td></tr>';
    }).join('');
    var ns = db.settings.numbers.map(function (n) { return n.label + ' : ' + n.num; }).join(' · ');
    $('printSheet').innerHTML = '<h1>Contacts d\'urgence — ' + esc(cls.name) + '</h1>' +
      '<div class="p-sub">' + esc(db.settings.school || '') + (teacherLabel() ? ' · Enseignant(e) : ' + esc(teacherLabel()) + (db.settings.subject ? ' (' + esc(db.settings.subject) + ')' : '') + (db.settings.tphone ? ' · ' + esc(db.settings.tphone) : '') : '') + ' · Édité le ' + new Date().toLocaleDateString('fr-FR') + ' · <b>' + esc(ns) + '</b></div>' +
      '<table><thead><tr><th style="width:24%">Étudiant</th><th style="width:40%">Personnes à prévenir</th><th style="width:8%">Groupe</th><th>Infos médicales</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="p-foot">Document CONFIDENTIEL — à usage exclusif en cas d\'urgence. Ne pas afficher. À détruire en fin d\'année. ClasSos — ' + SOS.SIGNATURE + '</div>';
    window.print();
  }

  function printBlank(cls) {
    var line = function (label) { return '<div class="b-line"><span>' + label + '</span><i></i></div>'; };
    var slip = '<div class="b-slip">' +
      '<div class="b-head"><b>Fiche contact d’urgence</b><span>' + esc(cls.name) + (db.settings.school ? ' · ' + esc(db.settings.school) : '') + '</span></div>' +
      '<div class="b-grid">' + line('Nom') + line('Prénom(s)') + '</div>' +
      '<div class="b-sub">Personne à prévenir n°1</div><div class="b-grid3">' + line('Nom complet') + line('Lien') + line('Téléphone') + '</div>' +
      '<div class="b-sub">Personne à prévenir n°2 (conseillé)</div><div class="b-grid3">' + line('Nom complet') + line('Lien') + line('Téléphone') + '</div>' +
      '<div class="b-grid">' + line('Groupe sanguin (facultatif)') + line('Allergie / maladie / traitement (facultatif)') + '</div>' +
      '<div class="b-consent">☐ J’accepte que mon enseignant conserve ces informations uniquement pour prévenir mes proches ou les secours en cas d’urgence. Je peux lui demander de les supprimer à tout moment.<span>Signature : ____________________</span></div>' +
      '</div>';
    $('printSheet').innerHTML = slip + slip + slip;
    window.print();
  }

  /* ======================= Réglages & sauvegarde ======================= */
  function renderSettings(view) {
    setHeader('Réglages', 'ClasSos', true);
    var st = db.settings;
    var html = '<button class="row" id="goTeacher" style="margin-bottom:14px"><div class="class-icon" style="background:var(--surface-2);color:var(--navy)">' + ICON.id + '</div>' +
      '<div class="grow"><div class="title">Informations de l’enseignant</div><div class="meta">' + (st.teacher ? esc(teacherLabel()) : 'À compléter') + '</div></div>' + ICON.chev + '</button>' +
      '<form id="setForm" class="card">' +
      '<h2>Numéros d\'urgence</h2><p class="muted">Par défaut : Côte d\'Ivoire. Ajoutez l\'infirmerie de l\'établissement si elle existe.</p>' +
      st.numbers.concat([{ label: '', num: '' }]).slice(0, 4).map(function (n, i) {
        return '<div class="grid-2"><div class="field"><label>Service ' + (i + 1) + '</label><input name="nl' + i + '" maxlength="24" value="' + esc(n.label) + '" placeholder="' + (i === 3 ? 'Ex : Infirmerie' : '') + '"></div>' +
          '<div class="field"><label>Numéro</label><input name="nn' + i + '" type="tel" maxlength="20" value="' + esc(n.num) + '"></div></div>';
      }).join('') +
      '<button class="btn btn-primary btn-block" type="submit">Enregistrer</button></form>';

    html += '<div class="card"><h2>Sauvegarde</h2><p class="muted">Les fiches sont stockées <b>uniquement sur ce téléphone</b>. Faites une sauvegarde protégée par mot de passe pour ne rien perdre, ou pour transférer vos classes sur un autre appareil.</p>' +
      '<p class="tiny" style="margin:-6px 0 12px">Dernière sauvegarde : ' + (db.lastBackup ? new Date(db.lastBackup).toLocaleDateString('fr-FR') : 'jamais') + '</p>' +
      '<div class="btn-row"><button class="btn btn-primary" id="backupBtn"' + (totalStudents() ? '' : ' disabled') + '>' + I.lock + 'Créer une sauvegarde</button>' +
      '<button class="btn btn-ghost" id="restoreBtn">Restaurer</button></div><input type="file" id="restoreFile" accept=".classos,application/json" hidden></div>';

    html += '<div class="card"><h2>Confidentialité</h2><p class="muted" style="margin:0 0 12px">ClasSos ne possède aucun serveur : aucune fiche n\'est envoyée sur Internet. Les informations servent uniquement à prévenir les proches ou les secours. Supprimez les classes en fin d\'année.</p>' +
      '<button class="btn btn-danger-ghost btn-block" id="wipeAll">Effacer toutes les données de ce téléphone</button></div>' +
      '<p class="tiny" style="text-align:center">ClasSos · version 1.5 · <b>' + SOS.SIGNATURE + '</b></p>';
    view.innerHTML = html;

    $('setForm').onsubmit = function (e) {
      e.preventDefault();
      var f = e.target;
      var nums = [];
      for (var i = 0; i < 4; i++) {
        var l = f.elements['nl' + i].value.trim(), n = f.elements['nn' + i].value.replace(/[^\d+]/g, '');
        if (l && n) nums.push({ label: l, num: n });
      }
      st.numbers = nums.length ? nums : DEFAULT_NUMBERS.slice();
      persist(); toast('Numéros d’urgence enregistrés', 'ok'); route();
    };
    $('goTeacher').onclick = function () { go('/enseignant'); };
    $('backupBtn').onclick = backupModal;
    $('restoreBtn').onclick = function () { $('restoreFile').click(); };
    $('restoreFile').onchange = function (e) { var file = e.target.files[0]; if (file) restoreModal(file); e.target.value = ''; };
    $('wipeAll').onclick = function () {
      confirmModal('Tout effacer ?', 'Toutes les classes et fiches de ce téléphone seront effacées définitivement. Faites une sauvegarde avant si besoin.', 'Tout effacer', function () {
        db = { v: 1, classes: [], settings: { numbers: DEFAULT_NUMBERS.slice() }, lastBackup: 0 }; persist(); go('/'); toast('Données effacées');
      });
    };
  }

  function b64(buf) { var b = new Uint8Array(buf), s = ''; for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]); return btoa(s); }
  function unb64(s) { var bin = atob(s), b = new Uint8Array(bin.length); for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b; }

  function deriveKey(pass, salt) {
    return crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']).then(function (k) {
      return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: 200000, hash: 'SHA-256' }, k, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
    });
  }

  function backupModal() {
    if (!window.crypto || !crypto.subtle) { toast('Sauvegarde chiffrée indisponible sur ce navigateur.', 'err'); return; }
    modal('<h2>Créer une sauvegarde</h2><p class="muted">Choisissez un mot de passe. Il sera demandé pour restaurer. <b>Notez-le</b> : sans lui, la sauvegarde est illisible.</p><form id="bk">' +
      '<div class="field"><label>Mot de passe (6 caractères minimum)</label><input name="p1" type="password" autocomplete="new-password"><div class="err">6 caractères minimum.</div></div>' +
      '<div class="field"><label>Confirmez le mot de passe</label><input name="p2" type="password" autocomplete="new-password"><div class="err">Les mots de passe ne correspondent pas.</div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Télécharger la sauvegarde</button></form>',
      function (m, close) {
        m.querySelector('#bk').onsubmit = function (e) {
          e.preventDefault();
          var f = e.target, p1 = f.elements.p1.value, p2 = f.elements.p2.value;
          f.elements.p1.closest('.field').classList.toggle('invalid', p1.length < 6);
          f.elements.p2.closest('.field').classList.toggle('invalid', p1 !== p2);
          if (p1.length < 6 || p1 !== p2) return;
          var salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
          var payload = JSON.stringify({ classes: db.classes, settings: db.settings });
          deriveKey(p1, salt).then(function (key) {
            return crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(payload));
          }).then(function (ct) {
            var file = JSON.stringify({ app: 'ClasSos', v: 1, created: new Date().toISOString(), salt: b64(salt), iv: b64(iv), data: b64(ct) });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob([file], { type: 'application/json' }));
            a.download = 'classos-sauvegarde-' + new Date().toISOString().slice(0, 10) + '.classos';
            document.body.appendChild(a); a.click(); a.remove();
            db.lastBackup = Date.now(); persist(); close(); route();
            toast('Sauvegarde téléchargée ✓', 'ok');
          }).catch(function () { toast('Échec de la sauvegarde', 'err'); });
        };
      });
  }

  function restoreModal(file) {
    modal('<h2>Restaurer une sauvegarde</h2><p class="muted">Fichier : <b>' + esc(file.name) + '</b><br>Les classes de la sauvegarde seront <b>ajoutées</b> à celles déjà présentes (une classe de même nom est mise à jour).</p><form id="rs">' +
      '<div class="field"><label>Mot de passe de la sauvegarde</label><input name="p" type="password" autocomplete="current-password"><div class="err">Mot de passe incorrect ou fichier invalide.</div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Restaurer</button></form>',
      function (m, close) {
        m.querySelector('#rs').onsubmit = function (e) {
          e.preventDefault();
          var inp = e.target.elements.p;
          file.text().then(function (txt) {
            var o = JSON.parse(txt);
            if (o.app !== 'ClasSos') throw new Error('bad');
            return deriveKey(inp.value, unb64(o.salt)).then(function (key) {
              return crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, key, unb64(o.data));
            });
          }).then(function (pt) {
            var data = JSON.parse(new TextDecoder().decode(pt));
            var nCls = 0, nStu = 0;
            (data.classes || []).forEach(function (src) {
              var dst = db.classes.filter(function (c) { return norm(c.name) === norm(src.name); })[0];
              if (!dst) { dst = { id: uid(), name: src.name, created: src.created || Date.now(), students: [] }; db.classes.push(dst); }
              nCls++;
              (src.students || []).forEach(function (s) { upsertStudent(dst, s); nStu++; });
            });
            if (data.settings && !db.settings.teacher && !db.settings.school) db.settings = data.settings;
            persist(); close(); go('/');
            toast(nCls + ' classe(s) et ' + nStu + ' fiche(s) restaurée(s) ✓', 'ok');
          }).catch(function () { inp.closest('.field').classList.add('invalid'); });
        };
      });
  }

  /* ======================= Démarrage ======================= */
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
  window.addEventListener('afterprint', function () { $('printSheet').innerHTML = ''; });
  route();
})();
