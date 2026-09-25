/* ClasSos — Console administrateur (enseignant)
   Les fiches sont inscrites par les étudiants sur leur propre téléphone et arrivent ici automatiquement.
   Une copie du répertoire reste sur ce téléphone pour fonctionner sans Internet en cas d'urgence. */
(function () {
  'use strict';

  var API = window.CLASSOS_API;
  var SESSION_KEY = 'classos.admin.session';
  var LEGACY_KEY = 'classos.data';
  var $ = function (id) { return document.getElementById(id); };
  var esc = SOS.esc;
  var I = SOS.icons;

  var ICON = {
    qr: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M9 5v14M15 5v14"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg>',
    userplus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M19 8v6M22 11h-6"/></svg>',
    id: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2.5"/><path d="M5.5 16.5a3.5 3.5 0 0 1 7 0M15 9h3M15 13h3"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/><path d="M12 7v6M9 10h6"/></svg>',
    down: '<svg class="acc-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>',
    refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>'
  };

  var DEFAULT_NUMBERS = [{ label: 'SAMU', num: '185' }, { label: 'Pompiers', num: '180' }, { label: 'Police', num: '170' }];
  var LIENS = ['Mère', 'Père', 'Tuteur / Tutrice', 'Conjoint(e)', 'Frère / Sœur', 'Oncle / Tante', 'Grand-parent', 'Ami(e)', 'Colocataire', 'Autre'];
  var SIG = '<p class="tiny" style="margin:28px 4px 0;max-width:180px;line-height:1.5">ClasSos · <b>' + SOS.SIGNATURE + '</b></p>';

  /* ======================= Session, cache hors-ligne, API ======================= */
  var session = readJSON(SESSION_KEY);          // { token, teacher }
  var db = null;                                 // { teacher, classes:[{..., students:[]}], syncedAt }
  var online = true;

  function readJSON(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function cacheKey() { return 'classos.admin.cache.' + (session && session.teacher ? session.teacher.id : 'x'); }

  function api(method, path, body) {
    var headers = { 'Content-Type': 'application/json' };
    if (session && session.token) headers.Authorization = 'Bearer ' + session.token;
    return fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 401 && session) { logout(true); throw { status: 401, message: j.error || 'Session expirée.' }; }
          if (!r.ok) throw { status: r.status, message: j.error || 'Erreur ' + r.status };
          setOnline(true);
          return j;
        });
      }, function () { setOnline(false); throw { status: 0, message: 'Pas de connexion Internet. Réessayez dès que le réseau revient.' }; });
  }

  function setOnline(v) {
    online = v;
    var bar = $('netBar');
    if (!session) { bar.hidden = true; return; }
    if (v) { bar.hidden = true; return; }
    var when = db && db.syncedAt ? new Date(db.syncedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
    bar.innerHTML = '<b>Hors ligne</b> — répertoire enregistré sur ce téléphone' + (when ? ' (mis à jour le ' + esc(when) + ')' : '') + '. Les appels fonctionnent.';
    bar.hidden = false;
  }

  var syncing = null;
  function sync(silent) {
    if (!session) return Promise.resolve();
    if (syncing) return syncing;
    syncing = api('GET', '/directory').then(function (d) {
      var before = JSON.stringify(db && db.classes);
      db = d; writeJSON(cacheKey(), d);
      session.teacher = d.teacher; writeJSON(SESSION_KEY, session);
      if (JSON.stringify(d.classes) !== before) softRender();
    }, function (e) { if (!silent && e.status !== 401) toast(e.message, 'err'); })
      .then(function () { syncing = null; });
    return syncing;
  }

  var pendingRender = false;
  function softRender() {
    var a = document.activeElement;
    if ($('modalRoot').firstChild || (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))) { pendingRender = true; return; }
    pendingRender = false; route(true);
  }
  document.addEventListener('focusout', function () { if (pendingRender) setTimeout(softRender, 150); });

  function logout(expired) {
    if (session && !expired) api('POST', '/auth/logout').catch(function () {});
    try { localStorage.removeItem(cacheKey()); } catch (e) {}
    session = null; db = null;
    try { localStorage.removeItem(SESSION_KEY); } catch (e) {}
    go('/'); route();
    if (expired) toast('Session expirée : reconnectez-vous.', 'err');
  }

  /* ======================= Aides de données ======================= */
  function classes() { return db ? db.classes : []; }
  function getClass(id) { return classes().filter(function (c) { return c.id === id; })[0]; }
  function getStudent(cls, sid) { return cls && cls.students.filter(function (s) { return s.id === sid; })[0]; }
  function totalStudents() { return classes().reduce(function (n, c) { return n + c.students.length; }, 0); }
  function sortStudents(list) { return list.slice().sort(function (a, b) { return (a.nom + a.prenom).localeCompare(b.nom + b.prenom, 'fr'); }); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); }
  function initials(s) { return ((s.prenom || '?')[0] + (s.nom || '?')[0]).toUpperCase(); }
  function fullName(s) { return s.prenom + ' ' + s.nom; }
  function teacher() { return (db && db.teacher) || (session && session.teacher) || {}; }
  function teacherLabel() { var t = teacher(); return t.name ? ((t.civ ? t.civ + ' ' : '') + t.name) : ''; }
  function numbers() { var n = teacher().numbers; return n && n.length ? n : DEFAULT_NUMBERS; }
  function joinLink(cls) { return new URL('../inscription/?c=' + encodeURIComponent(cls.joinToken), location.href).toString(); }
  function fmtDate(ts) { return ts ? new Date(ts).toLocaleDateString('fr-FR') : ''; }
  function needOnline() { if (!online && !navigator.onLine) { toast('Action impossible hors ligne. Réessayez avec du réseau.', 'err'); return false; } return true; }

  /* ======================= Interface : utilitaires ======================= */
  var toastTimer;
  function toast(msg, kind) {
    var t = document.querySelector('.toast');
    if (t) t.remove();
    t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    document.body.appendChild(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.remove(); }, 3200);
  }
  function modal(html, onMount) {
    var root = $('modalRoot');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><button class="close-x" type="button" aria-label="Fermer">×</button>' + html + '</div></div>';
    var back = root.firstChild;
    var close = function () { root.innerHTML = ''; if (pendingRender) setTimeout(softRender, 50); };
    back.addEventListener('click', function (e) { if (e.target === back) close(); });
    back.querySelector('.close-x').onclick = close;
    if (onMount) onMount(back.querySelector('.modal'), close);
    return close;
  }
  function confirmModal(title, text, okLabel, onOk) {
    modal('<h2>' + esc(title) + '</h2><p class="muted" style="margin:0 0 18px">' + text + '</p>' +
      '<div class="btn-row"><button class="btn btn-ghost" id="cfNo">Annuler</button><button class="btn btn-red" id="cfYes">' + esc(okLabel) + '</button></div>',
      function (m, close) {
        m.querySelector('#cfNo').onclick = close;
        m.querySelector('#cfYes').onclick = function () { close(); onOk(); };
      });
  }
  function busy(btn, on) { if (!btn) return; btn.disabled = on; btn.style.opacity = on ? '.6' : ''; }
  function copyText(t) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(t);
    var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    ta.remove(); return Promise.resolve();
  }

  function setHeader(title, sub, back) {
    $('title').innerHTML = esc(title) + (sub ? '<span class="sub">' + esc(sub) + '</span>' : '');
    $('backBtn').hidden = !back;
    $('homeBtn').hidden = !back;
    $('brandMark').hidden = !!back;
    $('settingsBtn').hidden = !session;
    document.title = (title === 'ClasSos' ? '' : title + ' — ') + 'ClasSos';
  }
  function go(hash) { location.hash = hash; }

  /* ======================= Routeur ======================= */
  var sheetFrom = '';
  function route(keepScroll) {
    var y = window.scrollY;
    if (!keepScroll) $('modalRoot').innerHTML = '';
    var view = $('view');
    var h = location.hash.replace(/^#\/?/, '').split('/');
    if (!session) { $('fab').hidden = true; return renderLogin(view); }
    if (!db) db = readJSON(cacheKey()) || { teacher: session.teacher, classes: [], syncedAt: 0 };
    $('fab').hidden = false;
    if (!keepScroll) window.scrollTo(0, 0);
    if (h[0] === 'c' && getClass(h[1])) renderClass(view, getClass(h[1]));
    else if (h[0] === 's' && getStudent(getClass(h[1]), h[2])) renderSheet(view, getClass(h[1]), getStudent(getClass(h[1]), h[2]));
    else if (h[0] === 'urgence') renderUrgence(view);
    else if (h[0] === 'repertoire') renderRepertoire(view);
    else if (h[0] === 'enseignant') renderTeacher(view);
    else if (h[0] === 'reglages') renderSettings(view);
    else renderHome(view);
    if (keepScroll) window.scrollTo(0, y);
  }
  window.addEventListener('hashchange', function (e) {
    var from = (e.oldURL || '').split('#')[1] || '';
    var to = location.hash.replace(/^#/, '');
    if (to.indexOf('/s/') === 0 && from && from.indexOf('/s/') !== 0) sheetFrom = from;
    route();
  });
  $('backBtn').onclick = function () {
    var h = location.hash.replace(/^#\/?/, '').split('/');
    if (h[0] === 's') { go(sheetFrom === '/repertoire' || sheetFrom === '/urgence' || sheetFrom === '/c/' + h[1] ? sheetFrom : '/c/' + h[1]); return; }
    go('/');
  };
  $('homeBtn').onclick = function () { go('/'); };
  $('settingsBtn').onclick = function () { go('/reglages'); };
  $('fab').onclick = function () { go('/urgence'); };

  /* ======================= Connexion / création de compte ======================= */
  var loginMode = 'start';
  function renderLogin(view) {
    setHeader('ClasSos', 'Console administrateur', false);
    if (loginMode === 'start') return renderStart(view);
    var signup = loginMode === 'signup';
    view.innerHTML = '<h2 style="font-size:20px;text-align:center;margin:6px 0 14px">' + (signup ? 'Créer mon compte enseignant' : 'Connexion enseignant') + '</h2>' +
      '<form id="authForm" class="card" novalidate>' +
      (signup ? '<div class="field"><label for="a_name">Nom et prénom</label><input id="a_name" name="name" maxlength="60" autocomplete="name" autocapitalize="words"><div class="err">Indiquez votre nom.</div></div>' : '') +
      '<div class="field"><label for="a_email">E-mail</label><input id="a_email" name="email" type="email" inputmode="email" autocomplete="username" maxlength="120"><div class="err">Adresse e-mail invalide.</div></div>' +
      '<div class="field"><label for="a_pass">Mot de passe</label><input id="a_pass" name="password" type="password" autocomplete="' + (signup ? 'new-password' : 'current-password') + '" maxlength="200">' +
      (signup ? '<div class="hint">8 caractères minimum.</div>' : '') + '<div class="err">' + (signup ? '8 caractères minimum.' : 'Indiquez votre mot de passe.') + '</div></div>' +
      '<div class="err" id="authErr" style="display:block;color:var(--red);font-size:14px;margin:-4px 0 12px"></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">' + (signup ? 'Créer mon compte' : 'Se connecter') + '</button></form>' +
      '<p style="text-align:center"><button class="btn btn-ghost" id="switchMode" type="button">Retour</button></p>' + SIG;
    $('switchMode').onclick = function () { loginMode = 'start'; route(); };
    var f = $('authForm');
    f.onsubmit = function (e) {
      e.preventDefault();
      var v = function (n) { return f.elements[n] ? f.elements[n].value.trim() : ''; };
      var bad = function (n, cond) { f.elements[n].closest('.field').classList.toggle('invalid', !!cond); return !cond; };
      var ok = bad('email', !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) & bad('password', signup ? f.elements.password.value.length < 8 : !f.elements.password.value);
      if (signup) ok = ok & bad('name', !v('name'));
      if (!ok) return;
      var btn = f.querySelector('button[type=submit]'); busy(btn, true); $('authErr').textContent = '';
      var body = signup ? { email: v('email'), password: f.elements.password.value, name: v('name') } : { email: v('email'), password: f.elements.password.value };
      api('POST', signup ? '/auth/signup' : '/auth/login', body).then(function (r) {
        session = { token: r.token, teacher: r.teacher }; writeJSON(SESSION_KEY, session);
        db = readJSON(cacheKey()) || { teacher: r.teacher, classes: [], syncedAt: 0 };
        go('/'); route(); sync(true);
        toast(signup ? 'Compte créé. Bienvenue !' : 'Connecté(e)', 'ok');
      }, function (err) { busy(btn, false); $('authErr').textContent = err.message; });
    };
  }

  /* Démarrage sans mot de passe : juste le nom, le compte est lié à ce téléphone */
  function renderStart(view) {
    view.innerHTML = '<h2 style="font-size:20px;text-align:center;margin:6px 0 14px">Bienvenue sur ClasSos</h2>' +
      '<form id="startForm" class="card" novalidate>' +
      '<div class="field"><label for="s_name">Votre nom</label><input id="s_name" maxlength="60" autocomplete="name" autocapitalize="words" placeholder="Ex : M. Kouassi Yao"><div class="err">Indiquez votre nom.</div></div>' +
      '<div class="err" id="startErr" style="display:block;color:var(--red);font-size:14px;margin:-4px 0 12px"></div>' +
      '<button class="btn btn-red btn-block btn-lg" type="submit">Commencer</button></form>' +
      '<p class="tiny" style="text-align:center">Votre compte est enregistré sur ce téléphone : utilisez toujours le même téléphone.</p>' +
      SIG;
    var inp = $('s_name');
    $('startForm').onsubmit = function (e) {
      e.preventDefault();
      var name = inp.value.trim();
      inp.closest('.field').classList.toggle('invalid', !name);
      if (!name) return;
      var btn = $('startForm').querySelector('button[type=submit]'); busy(btn, true); $('startErr').textContent = '';
      api('POST', '/auth/start', { name: name }).then(function (r) {
        session = { token: r.token, teacher: r.teacher }; writeJSON(SESSION_KEY, session);
        db = { teacher: r.teacher, classes: [], syncedAt: 0 };
        go('/'); route(); sync(true);
        toast('Bienvenue ' + name + ' !', 'ok');
      }, function (err) { busy(btn, false); $('startErr').textContent = err.message; });
    };
  }

  /* ======================= Accueil ======================= */
  var installEvt = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (session && (!location.hash || location.hash === '#/')) route(true); });

  function legacyData() {
    var d = readJSON(LEGACY_KEY);
    if (!d || !Array.isArray(d.classes)) return null;
    var n = d.classes.reduce(function (s, c) { return s + ((c.students || []).length); }, 0);
    return n ? { data: d, count: n } : null;
  }

  function renderHome(view) {
    var t = teacher();
    setHeader('ClasSos', t.school || 'Console administrateur', false);
    var total = totalStudents();
    var html = '';
    if (installEvt) html += '<div class="notice">' + I.info + '<span style="flex:1"><b>Installez ClasSos sur ce téléphone</b> pour l’ouvrir en un geste, même sans Internet.</span><button class="btn btn-primary" id="installBtn" style="min-height:38px;padding:6px 14px">Installer</button></div>';
    var legacy = legacyData();
    if (legacy) html += '<div class="notice warn">' + I.info + '<span style="flex:1"><b>' + legacy.count + ' fiche' + (legacy.count > 1 ? 's' : '') + ' de l’ancienne version</b> sont sur ce téléphone. <a href="#/reglages" style="font-weight:700">Les importer dans mon compte</a></span></div>';

    html += '<button class="btn btn-red btn-block btn-lg" id="createBig">' + ICON.userplus + 'Créer contacts étudiants d’urgence</button>' +
      '<div class="home-tiles">' +
      '<button class="tile" id="repBtn"><span class="tile-ic tile-red">' + ICON.book + '</span><b>Répertoire d’urgence étudiant</b><span>' + (total ? total + ' étudiant' + (total > 1 ? 's' : '') : 'Aucune inscription pour l’instant') + '</span></button>' +
      '<button class="tile" id="teacherBtn"><span class="tile-ic">' + ICON.id + '</span><b>Informations de l’enseignant</b><span>' + (t.name ? esc(teacherLabel()) : 'À compléter') + '</span></button>' +
      '</div>';

    if (!classes().length) {
      html += '<div class="card" style="margin-top:14px"><ol style="margin:0;padding-left:20px;line-height:1.9" class="muted">' +
        '<li>Touchez le bouton rouge et nommez la classe.</li>' +
        '<li>Envoyez le lien au délégué.</li>' +
        '<li>Les étudiants s’inscrivent : le répertoire se remplit tout seul.</li></ol></div>';
    } else {
      html += '<div class="section-title" style="display:flex;align-items:center;justify-content:space-between">Mes classes<button class="icon-act" id="refreshBtn" aria-label="Actualiser" title="Actualiser">' + ICON.refresh + '</button></div><div class="list">';
      classes().forEach(function (c) {
        var paused = c.status === 'paused';
        html += '<div class="row" data-cls="' + esc(c.id) + '" role="button" tabindex="0"><div class="class-icon"' + (paused ? ' style="background:var(--ink-3)"' : '') + '>' + esc((c.name[0] || '?').toUpperCase()) + '</div>' +
          '<div class="grow"><div class="title">' + esc(c.name) + '</div><div class="meta">' + c.students.length + ' inscrit' + (c.students.length > 1 ? 's' : '') + '</div>' +
          (paused ? '<div class="badges"><span class="badge badge-amber">En pause</span></div>' : '') + '</div>' + ICON.chev + '</div>';
      });
      html += '</div>';
    }
    view.innerHTML = html + SIG;

    view.querySelectorAll('[data-cls]').forEach(function (b) {
      var open = function (e) { if (e.target.closest('.icon-act')) return; go('/c/' + b.dataset.cls); };
      b.onclick = open; b.onkeydown = function (e) { if (e.key === 'Enter') open(e); };
    });
    $('createBig').onclick = function () { classModal(null); };
    $('repBtn').onclick = function () { go('/repertoire'); };
    $('teacherBtn').onclick = function () { go('/enseignant'); };
    var rf = $('refreshBtn'); if (rf) rf.onclick = function () { sync().then(function () { toast('Répertoire à jour', 'ok'); }); };
    var ib = $('installBtn'); if (ib) ib.onclick = function () { installEvt.prompt(); installEvt = null; };
  }

  /* ======================= Classes ======================= */
  function classModal(existing) {
    var editing = !!existing;
    modal('<h2>' + (editing ? 'Modifier la classe' : 'Nouvelle classe') + '</h2><p class="muted">' + (editing ? 'Le lien d’inscription reste le même.' : 'Donnez un nom clair : les étudiants le verront en s’inscrivant.') + '</p>' +
      '<form id="clsForm"><div class="field"><label for="clsName">Nom de la classe</label><input id="clsName" maxlength="80" placeholder="Ex : Licence 2 Informatique — Amphi B" value="' + esc(editing ? existing.name : '') + '"><div class="err">Indiquez un nom.</div></div>' +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">' + (editing ? 'Enregistrer' : 'Créer la classe et obtenir le lien') + '</button></form>',
      function (m, close) {
        var inp = m.querySelector('#clsName'); setTimeout(function () { inp.focus(); }, 50);
        m.querySelector('#clsForm').onsubmit = function (e) {
          e.preventDefault();
          var name = inp.value.trim();
          if (!name) { inp.closest('.field').classList.add('invalid'); return; }
          if (!needOnline()) return;
          var btn = m.querySelector('button[type=submit]'); busy(btn, true);
          var req = editing ? api('PATCH', '/classes/' + existing.id, { name: name }) : api('POST', '/classes', { name: name });
          req.then(function (r) {
            close();
            sync(true).then(function () {
              if (editing) { toast('Classe modifiée', 'ok'); return; }
              go('/c/' + r.class.id);
              setTimeout(function () { var c = getClass(r.class.id); if (c) shareModal(c, true); }, 60);
            });
          }, function (err) { busy(btn, false); toast(err.message, 'err'); });
        };
      });
  }

  function togglePause(cls) {
    if (!needOnline()) return;
    var next = cls.status === 'paused' ? 'open' : 'paused';
    var doIt = function () {
      api('PATCH', '/classes/' + cls.id, { status: next }).then(function () {
        sync(true); toast(next === 'paused' ? 'Classe en pause : inscriptions et modifications bloquées' : 'Inscriptions rouvertes', 'ok');
      }, function (err) { toast(err.message, 'err'); });
    };
    if (next === 'paused') confirmModal('Mettre la classe en pause ?', 'Plus personne ne pourra s’inscrire ni modifier sa fiche dans « <b>' + esc(cls.name) + '</b> » jusqu’à la reprise. Le répertoire reste disponible.', 'Mettre en pause', doIt);
    else doIt();
  }

  function deleteClass(cls) {
    var n = cls.students.length;
    confirmModal('Supprimer la classe ?', '« <b>' + esc(cls.name) + '</b> » et ses <b>' + n + ' fiche' + (n > 1 ? 's' : '') + '</b> seront supprimées définitivement, et le lien d’inscription ne fonctionnera plus.', 'Supprimer la classe', function () {
      if (!needOnline()) return;
      api('DELETE', '/classes/' + cls.id).then(function () { go('/'); sync(true); toast('Classe supprimée'); }, function (err) { toast(err.message, 'err'); });
    });
  }

  /* Le lien unique à envoyer au délégué */
  function shareModal(cls, fresh) {
    var link = joinLink(cls);
    var msg = 'Bonjour, voici le lien ClasSos pour « ' + cls.name + ' ». Chaque étudiant l’ouvre sur SON téléphone et remplit sa fiche contact d’urgence (1 minute). Merci de le partager dans le groupe de la classe : ' + link;
    modal('<h2>' + (fresh ? 'Classe créée ✓' : 'Envoyer le lien') + '</h2>' +
      '<p class="muted">Envoyez ce lien au délégué de « ' + esc(cls.name) + ' ».</p>' +
      (cls.status === 'paused' ? '<div class="notice warn">' + I.info + '<span>Classe <b>en pause</b> : reprenez-la pour que le lien fonctionne.</span></div>' : '') +
      '<a class="btn btn-green btn-block btn-lg" target="_blank" rel="noopener" href="https://wa.me/?text=' + encodeURIComponent(msg) + '">' + I.wa + 'Envoyer par WhatsApp</a>' +
      '<div class="url-box" style="margin-top:10px"><code id="joinUrl">' + esc(link) + '</code><button class="btn btn-ghost" id="copyLink" type="button">Copier</button></div>' +
      '<details class="qr-more"><summary>Autres options</summary>' +
      '<a class="btn btn-ghost btn-block" style="margin-top:10px" href="sms:?&body=' + encodeURIComponent(msg) + '">Envoyer par SMS</a>' +
      '<div class="qr-box" style="margin-top:10px">' + SOS.qrImg(link, 7) + '</div>' +
      '<button class="btn btn-ghost btn-block" id="newLink" type="button" style="margin-top:10px">' + ICON.link + 'Nouveau lien (l’ancien ne marchera plus)</button></details>',
      function (m, close) {
        m.querySelector('#copyLink').onclick = function () { copyText(link).then(function () { toast('Lien copié', 'ok'); }); };
        m.querySelector('#newLink').onclick = function () {
          confirmModal('Générer un nouveau lien ?', 'L’ancien lien ne fonctionnera plus. Les étudiants déjà inscrits ne sont pas touchés.', 'Nouveau lien', function () {
            if (!needOnline()) return;
            api('POST', '/classes/' + cls.id + '/new-link').then(function () { sync(true).then(function () { shareModal(getClass(cls.id)); toast('Nouveau lien prêt', 'ok'); }); }, function (err) { toast(err.message, 'err'); });
          });
        };
      });
  }

  function renderClass(view, cls) {
    var paused = cls.status === 'paused';
    setHeader(cls.name, cls.students.length + ' inscrit' + (cls.students.length > 1 ? 's' : '') + (paused ? ' · en pause' : ''), true);
    var html = (paused ? '<div class="notice warn">' + ICON.pause + '<span style="flex:1"><b>Classe en pause.</b> Les inscriptions et les modifications des étudiants sont bloquées.</span></div>' : '') +
      '<button class="btn btn-red btn-block btn-lg" id="shareBtn">' + ICON.send + 'Envoyer le lien au délégué</button>' +
      '<div class="btn-row class-actions">' +
      '<button class="btn btn-ghost" id="pauseBtn">' + (paused ? ICON.play + 'Reprendre' : ICON.pause + 'Pause') + '</button>' +
      '<button class="btn btn-ghost" id="renameBtn">' + ICON.edit + 'Modifier</button>' +
      '<button class="btn btn-danger-ghost" id="delClassBtn">' + ICON.trash + 'Supprimer</button></div>';
    if (!cls.students.length) {
      html += '<div class="empty">' + ICON.users + '<h3>Aucune inscription pour l’instant</h3><p>Envoyez le lien au délégué : les fiches apparaîtront ici dès que les étudiants s’inscrivent.</p></div>';
    } else {
      html += '<div class="search">' + ICON.search + '<input id="q" type="search" placeholder="Rechercher un étudiant…" autocomplete="off"></div><div class="list" id="list"></div>';
    }
    html += '<details class="qr-more more-opts"><summary>Plus d’options</summary>' +
      '<button class="btn btn-ghost btn-block" id="manualBtn">' + ICON.plus + 'Ajouter un étudiant sans téléphone</button>' +
      '<button class="btn btn-ghost btn-block" id="printBtn"' + (cls.students.length ? '' : ' disabled') + '>' + ICON.print + 'Imprimer la liste des contacts</button>' +
      '<button class="btn btn-ghost btn-block" id="blankBtn">' + ICON.print + 'Imprimer des fiches papier vierges</button></details>';
    view.innerHTML = html;
    if (cls.students.length) {
      var draw = function () { $('list').innerHTML = studentRows(cls, filterStudents(cls.students, $('q').value)); bindRows($('list')); };
      $('q').oninput = draw; draw();
    }
    $('shareBtn').onclick = function () { shareModal(cls); };
    $('pauseBtn').onclick = function () { togglePause(cls); };
    $('renameBtn').onclick = function () { classModal(cls); };
    $('delClassBtn').onclick = function () { deleteClass(cls); };
    $('manualBtn').onclick = function () { studentForm(cls); };
    $('printBtn').onclick = function () { printClass(cls); };
    $('blankBtn').onclick = function () { printBlank(cls); };
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
      var c = s._cls || cls, c1 = s.contacts[0] || {};
      var badges = (s.medical ? '<span class="badge badge-red">⚠ Info médicale</span>' : '') + (s.sang ? '<span class="badge badge-gray">' + esc(s.sang) + '</span>' : '') +
        (s.contacts.length < 2 ? '<span class="badge badge-amber">1 seul contact</span>' : '');
      return '<div class="row" data-open="' + esc(c.id) + '/' + esc(s.id) + '" role="button" tabindex="0"><div class="avatar">' + esc(initials(s)) + '</div>' +
        '<div class="grow"><div class="title">' + esc(fullName(s)) + '</div><div class="meta">' + (showClass ? esc(c.name) + ' · ' : '') + esc(c1.lien || '') + ' : ' + esc(c1.nom || '') + '</div>' +
        (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>' +
        '<a class="quick-call" href="' + esc(SOS.telHref(c1.tel)) + '" aria-label="Appeler ' + esc(c1.nom || '') + '" data-call="1">' + I.phone + '</a></div>';
    }).join('');
  }
  function bindRows(root) {
    root.querySelectorAll('[data-open]').forEach(function (r) {
      var open = function (e) { if (e.target.closest('[data-call]')) return; go('/s/' + r.dataset.open); };
      r.onclick = open; r.onkeydown = function (e) { if (e.key === 'Enter') open(e); };
    });
  }

  /* ======================= Fiche : saisie / modification par l'enseignant ======================= */
  function studentForm(cls, s) {
    var c = function (i, k) { return s && s.contacts[i] ? esc(s.contacts[i][k]) : ''; };
    var opts = function (i) {
      var cur = s && s.contacts[i] ? s.contacts[i].lien : '';
      return '<option value="">— Choisir —</option>' + LIENS.map(function (l) { return '<option' + (l === cur ? ' selected' : '') + '>' + l + '</option>'; }).join('');
    };
    var sangs = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];
    modal('<h2>' + (s ? 'Modifier la fiche' : 'Ajouter un étudiant') + '</h2><p class="muted">' + (s ? 'Vous seul et l’étudiant pouvez modifier cette fiche.' : 'Pour un étudiant sans téléphone. Les champs * sont obligatoires.') + '</p><form id="sf" novalidate>' +
      '<div class="grid-2"><div class="field"><label>Nom *</label><input name="nom" maxlength="60" value="' + (s ? esc(s.nom) : '') + '"><div class="err">Obligatoire.</div></div>' +
      '<div class="field"><label>Prénom(s) *</label><input name="prenom" maxlength="60" value="' + (s ? esc(s.prenom) : '') + '"><div class="err">Obligatoire.</div></div></div>' +
      '<div class="field"><label>Matricule <span class="opt">(facultatif)</span></label><input name="matricule" maxlength="30" value="' + (s ? esc(s.matricule) : '') + '"></div>' +
      [0, 1].map(function (i) {
        return '<fieldset class="fieldset"><legend>Contact ' + (i + 1) + (i ? ' <span class="tiny">(conseillé)</span>' : ' *') + '</legend>' +
          '<div class="grid-2"><div class="field"><label>Nom</label><input name="c' + i + 'nom" maxlength="60" value="' + c(i, 'nom') + '"><div class="err">Obligatoire.</div></div>' +
          '<div class="field"><label>Lien</label><select name="c' + i + 'lien">' + opts(i) + '</select><div class="err">Obligatoire.</div></div></div>' +
          '<div class="field"><label>Téléphone</label><input name="c' + i + 'tel" type="tel" inputmode="tel" maxlength="22" value="' + c(i, 'tel') + '"><div class="err" data-tel="c' + i + 'tel">Numéro invalide.</div></div></fieldset>';
      }).join('') +
      '<div class="field"><label>Groupe sanguin</label><select name="sang">' + sangs.map(function (g) { return '<option value="' + g + '"' + (s && s.sang === g ? ' selected' : '') + '>' + (g || 'Non renseigné') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label>Info médicale utile <span class="opt">(facultatif)</span></label><textarea name="medical" maxlength="300">' + (s ? esc(s.medical) : '') + '</textarea></div>' +
      (s ? '' : '<label class="check"><input type="checkbox" name="consent"><span>L’étudiant(e) est d’accord pour que ces informations soient conservées uniquement en cas d’urgence.</span></label><div style="height:14px"></div>') +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Enregistrer</button></form>',
      function (m, close) {
        var f = m.querySelector('#sf');
        ['c0tel', 'c1tel'].forEach(function (n) { var el = f.elements[n]; el.addEventListener('input', function () { if (el.selectionStart === el.value.length) el.value = SOS.phoneFormat(el.value); }); });
        f.onsubmit = function (e) {
          e.preventDefault();
          var v = function (n) { return f.elements[n].value.trim(); };
          var bad = function (n, cond, msg) {
            f.elements[n].closest('.field').classList.toggle('invalid', !!cond);
            var er = f.querySelector('[data-tel="' + n + '"]'); if (er && msg) er.textContent = msg;
            return !cond;
          };
          var t0 = SOS.phoneCheck(v('c0tel'));
          var ok = bad('nom', !v('nom')) & bad('prenom', !v('prenom')) & bad('c0nom', !v('c0nom')) & bad('c0lien', !v('c0lien')) & bad('c0tel', !t0.ok, t0.msg);
          var c1any = v('c1nom') || v('c1tel') || v('c1lien');
          var t1 = SOS.phoneCheck(v('c1tel'));
          ok = ok & bad('c1nom', c1any && !v('c1nom')) & bad('c1lien', c1any && !v('c1lien')) & bad('c1tel', c1any && !t1.ok, t1.msg);
          if (c1any && t1.ok && SOS.samePhone(v('c0tel'), v('c1tel'))) ok = ok & bad('c1tel', true, 'Même numéro que le contact 1.');
          if (!s && !f.elements.consent.checked) { toast('Cochez l’accord de l’étudiant(e)', 'err'); return; }
          if (!ok) return;
          if (!needOnline()) return;
          var contacts = [{ nom: v('c0nom'), lien: v('c0lien'), tel: v('c0tel') }];
          if (c1any) contacts.push({ nom: v('c1nom'), lien: v('c1lien'), tel: v('c1tel') });
          var data = { nom: v('nom'), prenom: v('prenom'), matricule: v('matricule'), sang: v('sang'), medical: v('medical'), contacts: contacts, consent: true };
          var btn = f.querySelector('button[type=submit]'); busy(btn, true);
          (s ? api('PUT', '/students/' + s.id, data) : api('POST', '/classes/' + cls.id + '/students', data)).then(function () {
            close(); sync(true); toast(s ? 'Fiche mise à jour' : 'Étudiant ajouté', 'ok');
          }, function (err) { busy(btn, false); toast(err.message, 'err'); });
        };
      });
  }

  /* ======================= Fiche d'urgence ======================= */
  function renderSheet(view, cls, s) {
    setHeader(fullName(s), cls.name, true);
    $('fab').hidden = true;
    var ns = numbers();
    var html = '<div class="sos-head"><div class="who">' + esc(fullName(s)) + '</div><div class="cls">' + esc(cls.name) + (s.matricule ? ' · Matricule ' + esc(s.matricule) : '') + '</div>' +
      ((s.medical || s.sang) ? '<div class="med">' + (s.medical ? '<div><b>⚠ À signaler aux secours</b>' + esc(s.medical) + '</div>' : '') + (s.sang ? '<div><b>Groupe sanguin</b>' + esc(s.sang) + '</div>' : '') + '</div>' : '') + '</div>';
    s.contacts.forEach(function (c, i) {
      html += '<div class="contact-card"><div class="rank">Contact ' + (i + 1) + (i === 0 ? ' · à appeler en premier' : '') + '</div>' +
        '<div class="name">' + esc(c.nom) + '</div><div class="rel">' + esc(c.lien) + '</div><div class="num">' + esc(SOS.phonePretty(c.tel)) + '</div>' +
        '<a class="call-big" href="' + esc(SOS.telHref(c.tel)) + '">' + I.phone + 'Appeler · ' + esc(c.lien) + '</a>' +
        '<a class="wa-link" href="' + esc(SOS.waHref(c.tel)) + '" target="_blank" rel="noopener">' + I.wa + 'WhatsApp</a></div>';
    });
    html += '<div class="section-title">Numéros d’urgence</div><div class="services">' + ns.map(function (n) { return '<a class="service" href="tel:' + esc(n.num) + '"><b>' + esc(n.num) + '</b><span>' + esc(n.label) + '</span></a>'; }).join('') + '</div>';
    var t = teacher();
    html += '<div class="section-title">Que dire au téléphone</div><div class="card"><p style="margin:0;font-size:15px;line-height:1.55">« Bonjour, je suis <b>' + esc(teacherLabel() || '[votre nom]') + '</b>, enseignant(e) de <b>' + esc(s.prenom) + '</b>' + (t.school ? ' à ' + esc(t.school) : '') + '. ' + esc(s.prenom) + ' a eu un malaise pendant le cours. [Décrire son état]. Les secours ont été / vont être appelés. Pouvez-vous venir ou nous rappeler ? »</p>' +
      '<p class="tiny" style="margin:10px 0 0">Si l’étudiant est inconscient ou ne respire pas normalement, appelez d’abord le <b>' + esc((ns[0] || {}).num || '185') + '</b> (' + esc((ns[0] || {}).label || 'SAMU') + ').</p></div>';
    html += '<div class="divider"></div><div class="btn-row"><button class="btn btn-ghost" id="editS">Modifier la fiche</button><button class="btn btn-danger-ghost" id="delS">Supprimer</button></div>' +
      '<p class="tiny" style="margin-top:10px">' + (s.source === 'teacher' ? 'Ajoutée par l’enseignant' : 'Inscrite par l’étudiant') + ' · mise à jour le ' + fmtDate(s.updated) + '.</p>';
    view.innerHTML = html;
    $('editS').onclick = function () { studentForm(cls, s); };
    $('delS').onclick = function () {
      confirmModal('Supprimer la fiche ?', 'La fiche de <b>' + esc(fullName(s)) + '</b> sera supprimée définitivement.', 'Supprimer la fiche', function () {
        if (!needOnline()) return;
        api('DELETE', '/students/' + s.id).then(function () { go('/c/' + cls.id); sync(true); toast('Fiche supprimée'); }, function (err) { toast(err.message, 'err'); });
      });
    };
  }

  /* ======================= Mode URGENCE ======================= */
  function allStudents() {
    var all = [];
    classes().forEach(function (c) { c.students.forEach(function (s) { all.push(Object.assign({ _cls: c }, s)); }); });
    return all;
  }
  function renderUrgence(view) {
    setHeader('Urgence', 'Qui a un malaise ?', true);
    $('fab').hidden = true;
    var all = allStudents();
    var html = '<div class="services" style="margin-bottom:16px">' + numbers().map(function (n) { return '<a class="service" style="background:var(--red)" href="tel:' + esc(n.num) + '"><b>' + esc(n.num) + '</b><span>' + esc(n.label) + '</span></a>'; }).join('') + '</div>';
    if (!all.length) { view.innerHTML = html + '<div class="empty"><h3>Aucune fiche enregistrée</h3><p>Appelez directement les secours avec les boutons ci-dessus.</p></div>'; return; }
    html += '<div class="search">' + ICON.search + '<input id="uq" type="search" placeholder="Tapez le nom ou le prénom…" autocomplete="off" style="font-size:18px;min-height:58px"></div><div class="list" id="ulist"></div>';
    view.innerHTML = html;
    var draw = function () { $('ulist').innerHTML = studentRows(null, filterStudents(all, $('uq').value), classes().length > 1); bindRows($('ulist')); };
    $('uq').oninput = draw; draw();
    setTimeout(function () { $('uq').focus(); }, 80);
  }

  /* ======================= Répertoire d'urgence étudiant ======================= */
  var repState = { q: '', cls: '' };
  function renderRepertoire(view) {
    var total = totalStudents();
    setHeader('Répertoire d’urgence', total + ' étudiant' + (total > 1 ? 's' : ''), true);
    if (!total) {
      view.innerHTML = '<div class="empty">' + ICON.book + '<h3>Le répertoire est vide</h3><p>Créez une classe et envoyez le lien au délégué : les fiches arrivent ici automatiquement.</p>' +
        '<button class="btn btn-red btn-lg" id="repCreate">' + ICON.userplus + 'Créer contacts étudiants d’urgence</button></div>';
      $('repCreate').onclick = function () { classes().length ? go('/c/' + classes()[0].id) : classModal(null); };
      return;
    }
    if (repState.cls && !getClass(repState.cls)) repState.cls = '';
    var html = '<div class="search">' + ICON.search + '<input id="rq" type="search" placeholder="Rechercher un étudiant…" autocomplete="off" value="' + esc(repState.q) + '"></div>';
    if (classes().length > 1) {
      html += '<div class="rep-filter"><button class="chip-f" data-f="" aria-pressed="' + (!repState.cls) + '">Toutes</button>' +
        classes().map(function (c) { return '<button class="chip-f" data-f="' + esc(c.id) + '" aria-pressed="' + (repState.cls === c.id) + '">' + esc(c.name) + '</button>'; }).join('') + '</div>';
    }
    view.innerHTML = html + '<div id="repList"></div>';
    var draw = function () {
      var all = allStudents().filter(function (x) { return !repState.cls || x._cls.id === repState.cls; });
      var q = norm(repState.q);
      if (q) all = all.filter(function (s) { return norm(s.prenom + ' ' + s.nom + ' ' + s.nom + ' ' + s.prenom + ' ' + s.matricule).indexOf(q) >= 0; });
      all = sortStudents(all);
      if (!all.length) { $('repList').innerHTML = '<p class="muted" style="text-align:center;padding:24px">Aucun étudiant trouvé.</p>'; return; }
      var out = '', letter = '';
      all.forEach(function (s) {
        var c = s._cls, L = norm(s.nom).charAt(0).toUpperCase() || '#';
        if (L !== letter) { letter = L; out += '<div class="rep-letter">' + esc(L) + '</div>'; }
        var body = '';
        if (s.medical || s.sang) body += '<div class="rep-med">' + (s.medical ? '<div><b>⚠ À signaler aux secours</b>' + esc(s.medical) + '</div>' : '') + (s.sang ? '<div class="rep-sang"><b>Groupe sanguin</b>' + esc(s.sang) + '</div>' : '') + '</div>';
        s.contacts.forEach(function (k, i) {
          body += '<div class="rep-contact"><div class="grow"><div class="tiny">Contact ' + (i + 1) + ' · ' + esc(k.lien) + '</div><div class="rep-cname">' + esc(k.nom) + '</div><div class="rep-num">' + esc(SOS.phonePretty(k.tel)) + '</div></div>' +
            '<a class="btn btn-green rep-call" href="' + esc(SOS.telHref(k.tel)) + '">' + I.phone + 'Appeler</a>' +
            '<a class="icon-act rep-wa" href="' + esc(SOS.waHref(k.tel)) + '" target="_blank" rel="noopener" aria-label="WhatsApp">' + I.wa + '</a></div>';
        });
        body += '<a class="rep-more" href="#/s/' + esc(c.id) + '/' + esc(s.id) + '">Voir la fiche d’urgence complète →</a>';
        var badges = (s.medical ? '<span class="badge badge-red">⚠ Info médicale</span>' : '') + (s.contacts.length < 2 ? '<span class="badge badge-amber">1 seul contact</span>' : '');
        out += '<div class="acc"><button class="acc-head" type="button" aria-expanded="false"><div class="avatar">' + esc(initials(s)) + '</div>' +
          '<div class="grow"><div class="title">' + esc(fullName(s)) + '</div><div class="meta">' + esc(c.name) + '</div>' + (badges ? '<div class="badges">' + badges + '</div>' : '') + '</div>' + ICON.down + '</button>' +
          '<div class="acc-body" hidden>' + body + '</div></div>';
      });
      $('repList').innerHTML = out;
      $('repList').querySelectorAll('.acc-head').forEach(function (h) {
        h.onclick = function () { var open = h.getAttribute('aria-expanded') === 'true'; h.setAttribute('aria-expanded', open ? 'false' : 'true'); h.nextElementSibling.hidden = open; };
      });
    };
    $('rq').oninput = function () { repState.q = $('rq').value; draw(); };
    view.querySelectorAll('.chip-f').forEach(function (b) {
      b.onclick = function () { repState.cls = b.dataset.f; view.querySelectorAll('.chip-f').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); draw(); };
    });
    draw();
  }

  /* ======================= Informations de l'enseignant ======================= */
  function renderTeacher(view) {
    setHeader('Informations de l’enseignant', 'Vous seul pouvez les modifier', true);
    var t = teacher();
    var f = function (name, label, val, attrs, hint) {
      return '<div class="field"><label for="t_' + name + '">' + label + '</label><input id="t_' + name + '" name="' + name + '" value="' + esc(val || '') + '" ' + (attrs || '') + '>' +
        (hint ? '<div class="hint">' + hint + '</div>' : '') + '<div class="err" id="t_' + name + 'Err"></div></div>';
    };
    view.innerHTML = '<form id="teacherForm" class="card" novalidate><p class="muted">Ces informations apparaissent sur le lien d’inscription des étudiants, dans le message à lire au téléphone et sur les impressions.</p>' +
      '<div class="grid-2">' + f('civ', 'Civilité', t.civ, 'maxlength="12" placeholder="M., Mme, Dr…"') + f('name', 'Nom et prénom', t.name, 'maxlength="60" autocapitalize="words"') + '</div>' +
      f('subject', 'Matière enseignée', t.subject, 'maxlength="60" placeholder="Ex : Mathématiques"') +
      f('school', 'Établissement', t.school, 'maxlength="80" placeholder="Ex : Université Félix Houphouët-Boigny"') +
      f('phone', 'Votre téléphone', t.phone, 'type="tel" inputmode="tel" maxlength="22" placeholder="07 07 12 34 56"', 'Facultatif.') +
      (t.email ? '<div class="field"><label>E-mail du compte</label><input value="' + esc(t.email) + '" disabled></div>' : '') +
      '<button class="btn btn-primary btn-block btn-lg" type="submit">Enregistrer</button></form>';
    var form = $('teacherForm');
    var tel = form.elements.phone;
    tel.addEventListener('input', function () { if (tel.selectionStart === tel.value.length) tel.value = SOS.phoneFormat(tel.value); });
    form.onsubmit = function (e) {
      e.preventDefault();
      var v = function (n) { return form.elements[n].value.trim(); };
      var ok = true;
      var setErr = function (n, msg) { $('t_' + n + 'Err').textContent = msg || ''; form.elements[n].closest('.field').classList.toggle('invalid', !!msg); if (msg) ok = false; };
      setErr('name', v('name') ? '' : 'Indiquez votre nom.');
      setErr('phone', v('phone') && !SOS.phoneValid(v('phone')) ? SOS.phoneCheck(v('phone')).msg : '');
      if (!ok || !needOnline()) return;
      var btn = form.querySelector('button[type=submit]'); busy(btn, true);
      api('PUT', '/teacher', { civ: v('civ'), name: v('name'), subject: v('subject'), school: v('school'), phone: v('phone') }).then(function () {
        sync(true).then(function () { go('/'); toast('Informations enregistrées', 'ok'); });
      }, function (err) { busy(btn, false); toast(err.message, 'err'); });
    };
  }

  /* ======================= Réglages ======================= */
  function renderSettings(view) {
    setHeader('Réglages', 'Console administrateur', true);
    var t = teacher(), ns = numbers();
    var legacy = legacyData();
    var html = '<button class="row" id="goTeacher" style="margin-bottom:14px"><div class="class-icon" style="background:var(--surface-2);color:var(--navy)">' + ICON.id + '</div>' +
      '<div class="grow"><div class="title">Informations de l’enseignant</div><div class="meta">' + esc(teacherLabel() || 'À compléter') + '</div></div>' + ICON.chev + '</button>';
    if (legacy) {
      html += '<div class="card"><h2>Fiches de l’ancienne version</h2><p class="muted">' + legacy.count + ' fiche(s) enregistrée(s) sur ce téléphone avant la création des comptes. Importez-les dans votre compte pour les retrouver dans le répertoire.</p>' +
        '<button class="btn btn-primary btn-block" id="importLegacy">Importer dans mon compte</button></div>';
    }
    html += '<form id="numForm" class="card"><h2>Numéros d’urgence</h2><p class="muted">Par défaut : Côte d’Ivoire. Ajoutez l’infirmerie de l’établissement si elle existe.</p>' +
      ns.concat([{ label: '', num: '' }]).slice(0, 4).map(function (n, i) {
        return '<div class="grid-2"><div class="field"><label>Service ' + (i + 1) + '</label><input name="nl' + i + '" maxlength="24" value="' + esc(n.label) + '"' + (i === 3 ? ' placeholder="Ex : Infirmerie"' : '') + '></div>' +
          '<div class="field"><label>Numéro</label><input name="nn' + i + '" type="tel" maxlength="20" value="' + esc(n.num) + '"></div></div>';
      }).join('') + '<button class="btn btn-primary btn-block" type="submit">Enregistrer</button></form>';
    if (!t.device) html += '<form id="pwForm" class="card" novalidate><h2>Mot de passe</h2>' +
      '<div class="field"><label for="pw1">Mot de passe actuel</label><input id="pw1" type="password" autocomplete="current-password"></div>' +
      '<div class="field"><label for="pw2">Nouveau mot de passe</label><input id="pw2" type="password" autocomplete="new-password"><div class="hint">8 caractères minimum.</div></div>' +
      '<button class="btn btn-ghost btn-block" type="submit">Changer le mot de passe</button></form>';
    html += (t.device ? '<div class="card"><h2>Compte</h2><p class="muted" style="margin:0">Votre compte est lié à <b>ce téléphone</b>. N’effacez pas les données du navigateur et utilisez toujours ce téléphone pour ouvrir ClasSos.</p></div>' :
      '<div class="card"><h2>Compte</h2><p class="muted" style="margin:0 0 12px">Connecté(e) : <b>' + esc(t.email || '') + '</b>.</p>' +
      '<button class="btn btn-danger-ghost btn-block" id="logoutBtn">Se déconnecter de ce téléphone</button></div>') +
      '<p class="tiny" style="text-align:center">ClasSos · version 2.0 · <b>' + SOS.SIGNATURE + '</b></p>';
    view.innerHTML = html;
    $('goTeacher').onclick = function () { go('/enseignant'); };
    $('numForm').onsubmit = function (e) {
      e.preventDefault();
      var f = e.target, nums = [];
      for (var i = 0; i < 4; i++) { var l = f.elements['nl' + i].value.trim(), n = f.elements['nn' + i].value.replace(/[^\d+]/g, ''); if (l && n) nums.push({ label: l, num: n }); }
      if (!needOnline()) return;
      api('PUT', '/teacher', { civ: t.civ, name: t.name, subject: t.subject, school: t.school, phone: t.phone, numbers: nums.length ? nums : DEFAULT_NUMBERS })
        .then(function () { sync(true); toast('Numéros d’urgence enregistrés', 'ok'); }, function (err) { toast(err.message, 'err'); });
    };
    if ($('pwForm')) $('pwForm').onsubmit = function (e) {
      e.preventDefault();
      if ($('pw2').value.length < 8) { toast('Le nouveau mot de passe doit contenir au moins 8 caractères.', 'err'); return; }
      if (!needOnline()) return;
      api('POST', '/auth/password', { current: $('pw1').value, next: $('pw2').value }).then(function () { $('pw1').value = ''; $('pw2').value = ''; toast('Mot de passe changé', 'ok'); }, function (err) { toast(err.message, 'err'); });
    };
    if ($('logoutBtn')) $('logoutBtn').onclick = function () {
      confirmModal('Se déconnecter ?', 'La copie du répertoire sera effacée de ce téléphone. Vos fiches restent dans votre compte.', 'Se déconnecter', function () { logout(false); });
    };
    var il = $('importLegacy');
    if (il) il.onclick = function () {
      if (!needOnline()) return;
      busy(il, true);
      var payload = { classes: legacy.data.classes.map(function (c) { return { name: c.name, students: (c.students || []).map(function (s) { return { nom: s.nom, prenom: s.prenom, matricule: s.matricule, sang: s.sang, medical: s.medical, contacts: s.contacts }; }) }; }) };
      api('POST', '/import', payload).then(function (r) {
        try { localStorage.setItem(LEGACY_KEY + '.importe', localStorage.getItem(LEGACY_KEY)); localStorage.removeItem(LEGACY_KEY); } catch (e) {}
        sync(true).then(function () { go('/'); toast(r.students + ' fiche(s) importée(s)' + (r.skipped ? ', ' + r.skipped + ' déjà présente(s)' : ''), 'ok'); });
      }, function (err) { busy(il, false); toast(err.message, 'err'); });
    };
  }

  /* ======================= Impressions ======================= */
  function printClass(cls) {
    var rows = sortStudents(cls.students).map(function (s) {
      var c = s.contacts.map(function (x) { return esc(x.nom) + ' (' + esc(x.lien) + ') — <b>' + esc(SOS.phonePretty(x.tel)) + '</b>'; }).join('<br>');
      return '<tr><td><b>' + esc(s.nom) + '</b> ' + esc(s.prenom) + (s.matricule ? '<br><small>' + esc(s.matricule) + '</small>' : '') + '</td><td>' + c + '</td><td>' + esc(s.sang) + '</td><td>' + esc(s.medical) + '</td></tr>';
    }).join('');
    var t = teacher();
    $('printSheet').innerHTML = '<h1>Contacts d’urgence — ' + esc(cls.name) + '</h1>' +
      '<div class="p-sub">' + esc(t.school || '') + (teacherLabel() ? ' · Enseignant(e) : ' + esc(teacherLabel()) + (t.subject ? ' (' + esc(t.subject) + ')' : '') : '') + ' · Édité le ' + new Date().toLocaleDateString('fr-FR') + ' · <b>' + esc(numbers().map(function (n) { return n.label + ' : ' + n.num; }).join(' · ')) + '</b></div>' +
      '<table><thead><tr><th style="width:24%">Étudiant</th><th style="width:40%">Personnes à prévenir</th><th style="width:8%">Groupe</th><th>Infos médicales</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="p-foot">Document CONFIDENTIEL — à usage exclusif en cas d’urgence. Ne pas afficher. À détruire en fin d’année. ClasSos — ' + SOS.SIGNATURE + '</div>';
    window.print();
  }
  function printBlank(cls) {
    var line = function (label) { return '<div class="b-line"><span>' + label + '</span><i></i></div>'; };
    var t = teacher();
    var slip = '<div class="b-slip"><div class="b-head"><b>Fiche contact d’urgence</b><span>' + esc(cls.name) + (t.school ? ' · ' + esc(t.school) : '') + '</span></div>' +
      '<div class="b-grid">' + line('Nom') + line('Prénom(s)') + '</div>' +
      '<div class="b-sub">Personne à prévenir n°1</div><div class="b-grid3">' + line('Nom complet') + line('Lien') + line('Téléphone') + '</div>' +
      '<div class="b-sub">Personne à prévenir n°2 (conseillé)</div><div class="b-grid3">' + line('Nom complet') + line('Lien') + line('Téléphone') + '</div>' +
      '<div class="b-grid">' + line('Groupe sanguin (facultatif)') + line('Allergie / maladie / traitement (facultatif)') + '</div>' +
      '<div class="b-consent">☐ J’accepte que mon enseignant conserve ces informations uniquement pour prévenir mes proches ou les secours en cas d’urgence.<span>Signature : ____________________</span></div></div>';
    $('printSheet').innerHTML = slip + slip + slip;
    window.print();
  }
  window.addEventListener('afterprint', function () { $('printSheet').innerHTML = ''; });

  /* ======================= Démarrage ======================= */
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', function () { navigator.serviceWorker.register('../sw.js', { scope: '../' }).catch(function () {}); });
  }
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
  window.addEventListener('online', function () { sync(true); });
  window.addEventListener('offline', function () { setOnline(false); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden) sync(true); });
  setInterval(function () { if (!document.hidden && session) sync(true); }, 30000);

  route();
  if (session) sync(true);
})();
