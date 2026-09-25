/* ClasSos — Console développeur : vue d'ensemble de la plateforme et gestion des comptes enseignants.
   Aucune donnée personnelle d'étudiant n'est affichée ni transmise ici. */
(function () {
  'use strict';
  var API = window.CLASSOS_API;
  var KEY = 'classos.dev.session';
  var $ = function (id) { return document.getElementById(id); };
  var esc = SOS.esc;
  var session = null;
  try { session = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  var data = null, q = '', sharedTried = false;
  /* Compte ClasSos sans mot de passe de ce téléphone : utilisé s'il a l'accès développeur */
  function sharedSession() {
    try { var a = JSON.parse(localStorage.getItem('classos.admin.session')); if (a && a.token) return { token: a.token, email: (a.teacher && a.teacher.name) || 'compte de ce téléphone', shared: true }; } catch (e) {}
    return null;
  }
  if (!session) { session = sharedSession(); sharedTried = !!session; }

  function api(method, path, body) {
    var h = { 'Content-Type': 'application/json' };
    if (session) h.Authorization = 'Bearer ' + session.token;
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if ((r.status === 401 || r.status === 403) && session) { logout(); throw { message: j.error || 'Accès refusé.' }; }
        if (!r.ok) throw { status: r.status, message: j.error || 'Erreur ' + r.status };
        return j;
      });
    }, function () { throw { message: 'Serveur injoignable. Vérifiez la connexion.' }; });
  }
  function logout() {
    if (session && !session.shared) fetch(API + '/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + session.token } }).catch(function () {});
    session = null; data = null;
    try { localStorage.removeItem(KEY); } catch (e) {}
    render();
  }
  function toast(msg, kind) {
    var t = document.querySelector('.toast'); if (t) t.remove();
    t = document.createElement('div'); t.className = 'toast ' + (kind || ''); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }
  function confirmModal(title, text, okLabel, onOk) {
    var root = $('modalRoot');
    root.innerHTML = '<div class="modal-back"><div class="modal" role="dialog" aria-modal="true"><h2>' + esc(title) + '</h2><p class="muted" style="margin:0 0 18px">' + text + '</p>' +
      '<div class="btn-row"><button class="btn btn-ghost" id="cfNo">Annuler</button><button class="btn btn-red" id="cfYes">' + esc(okLabel) + '</button></div></div></div>';
    $('cfNo').onclick = function () { root.innerHTML = ''; };
    $('cfYes').onclick = function () { root.innerHTML = ''; onOk(); };
  }
  var d = function (ts) { return ts ? new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'; };

  function renderLogin() {
    $('logoutBtn').hidden = true;
    $('view').innerHTML = '<div class="card" style="max-width:460px;margin:30px auto"><h2>Accès développeur</h2>' +
      (sharedTried
        ? '<p class="muted">Votre compte ClasSos est bien sur cet appareil, mais l’accès développeur n’est <b>pas encore activé</b>. Envoyez votre nom au développeur de l’appli pour l’activer, puis rouvrez cette page.</p>'
        : '<p class="muted">Aucun mot de passe n’est nécessaire.</p><ol class="muted" style="padding-left:20px;line-height:1.8;margin:0 0 14px"><li>Ouvrez la <a href="../admin/" style="font-weight:700">console administrateur</a> sur cet appareil.</li><li>Connectez-vous (avec Google ou votre nom).</li><li>Faites activer l’accès développeur, puis revenez sur cette page.</li></ol>' +
          '<a class="btn btn-primary btn-block btn-lg" href="../admin/">Ouvrir la console administrateur</a>') +
      (sharedTried ? '<button class="btn btn-primary btn-block btn-lg" id="retryDev" type="button">Réessayer</button>' : '') +
      '</div><p class="tiny" style="text-align:center">ClasSos · <b>' + SOS.SIGNATURE + '</b></p>';
    var rd = $('retryDev');
    if (rd) rd.onclick = function () { session = sharedSession(); if (session) load(); else renderLogin(); };
  }

  function load() {
    $('view').innerHTML = '<p class="muted" style="text-align:center;padding:40px">Chargement…</p>';
    api('GET', '/dev/overview').then(function (j) { data = j; render(); }, function (err) { if (session) $('view').innerHTML = '<div class="empty"><h3>Erreur</h3><p>' + esc(err.message) + '</p></div>'; });
  }

  function render() {
    if (!session) return renderLogin();
    if (!data) return load();
    $('logoutBtn').hidden = false;
    var t = data.totals || {};
    var list = data.teachers.filter(function (x) { var s = (x.name + ' ' + x.email + ' ' + (x.school || '')).toLowerCase(); return !q || s.indexOf(q.toLowerCase()) >= 0; });
    var html = '<div class="toolbar"><div><h2 style="margin:0;font-size:20px">Vue d’ensemble</h2><div class="tiny">API version ' + esc(data.version) + ' · connecté : ' + esc(session.email) + '</div></div>' +
      '<button class="btn btn-ghost" id="reload" style="margin-left:auto">Actualiser</button></div>' +
      '<div class="kpis">' +
      '<div class="kpi"><b>' + (t.teachers || 0) + '</b><span>enseignants</span><small>+' + (t.teachers7d || 0) + ' en 7 jours</small></div>' +
      '<div class="kpi"><b>' + (t.classes || 0) + '</b><span>classes</span><small style="color:var(--amber)">' + (t.paused || 0) + ' en pause</small></div>' +
      '<div class="kpi"><b>' + (t.students || 0) + '</b><span>fiches étudiants</span><small>+' + (t.students7d || 0) + ' en 7 jours</small></div>' +
      '<div class="kpi"><b>' + (t.teachers ? Math.round((t.students || 0) / t.teachers) : 0) + '</b><span>fiches par enseignant (moyenne)</span></div></div>' +
      '<div class="toolbar"><div class="search"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>' +
      '<input id="tq" type="search" placeholder="Rechercher un enseignant, un e-mail, un établissement…" value="' + esc(q) + '"></div></div>' +
      '<div class="tbl-wrap"><table class="dev"><thead><tr><th>Enseignant</th><th>Établissement</th><th style="text-align:right">Classes</th><th style="text-align:right">Fiches</th><th>Créé</th><th>Dernière connexion</th><th>Statut</th><th>Actions</th></tr></thead><tbody>' +
      (list.length ? list.map(function (x) {
        var isDev = x.role === 'dev';
        return '<tr><td><b>' + esc(((x.civ ? x.civ + ' ' : '') + x.name).trim()) + '</b><div class="tiny">' + (/@appareil.classos$/.test(x.email) ? 'Compte sans mot de passe (lié au téléphone)' : esc(x.email)) + '</div></td><td>' + esc(x.school || '—') + '</td>' +
          '<td class="num">' + x.classes + '</td><td class="num">' + x.students + '</td><td>' + d(x.created_at) + '</td><td>' + d(x.last_login) + '</td>' +
          '<td>' + (isDev ? '<span class="st st-dev">Développeur</span>' : '<span class="st st-' + x.status + '">' + (x.status === 'active' ? 'Actif' : 'Suspendu') + '</span>') + '</td>' +
          '<td>' + (isDev ? '' : '<div class="acts"><button class="btn btn-ghost" data-toggle="' + esc(x.id) + '">' + (x.status === 'active' ? 'Suspendre' : 'Réactiver') + '</button>' +
            '<button class="btn btn-danger-ghost" data-del="' + esc(x.id) + '">Supprimer</button></div>') + '</td></tr>';
      }).join('') : '<tr><td colspan="8" class="muted" style="text-align:center;padding:24px">Aucun enseignant.</td></tr>') +
      '</tbody></table></div>' +
      '<p class="dev-note">Confidentialité : cette console n’affiche aucune donnée personnelle d’étudiant (ni noms, ni contacts, ni santé). Seuls les enseignants voient les fiches de leurs propres classes.</p>' +
      '<p class="tiny" style="text-align:center">ClasSos · <b>' + SOS.SIGNATURE + '</b></p>';
    $('view').innerHTML = html;
    $('reload').onclick = load;
    $('tq').oninput = function () { q = $('tq').value; var pos = $('tq').selectionStart; render(); $('tq').focus(); $('tq').setSelectionRange(pos, pos); };
    document.querySelectorAll('[data-toggle]').forEach(function (b) {
      b.onclick = function () {
        var x = data.teachers.filter(function (t) { return t.id === b.dataset.toggle; })[0];
        var next = x.status === 'active' ? 'suspended' : 'active';
        var doIt = function () { api('PATCH', '/dev/teachers/' + x.id, { status: next }).then(function () { toast(next === 'suspended' ? 'Compte suspendu' : 'Compte réactivé', 'ok'); load(); }, function (e) { toast(e.message, 'err'); }); };
        if (next === 'suspended') confirmModal('Suspendre ce compte ?', '<b>' + esc(x.name) + '</b> ne pourra plus se connecter et ses liens d’inscription seront désactivés. Ses données sont conservées.', 'Suspendre', doIt); else doIt();
      };
    });
    document.querySelectorAll('[data-del]').forEach(function (b) {
      b.onclick = function () {
        var x = data.teachers.filter(function (t) { return t.id === b.dataset.del; })[0];
        confirmModal('Supprimer ce compte ?', 'Le compte de <b>' + esc(x.name) + '</b>, ses <b>' + x.classes + ' classe(s)</b> et ses <b>' + x.students + ' fiche(s)</b> seront supprimés définitivement.', 'Supprimer définitivement', function () {
          api('DELETE', '/dev/teachers/' + x.id).then(function () { toast('Compte supprimé', 'ok'); load(); }, function (e) { toast(e.message, 'err'); });
        });
      };
    });
  }

  $('logoutBtn').onclick = logout;
  render();
})();
