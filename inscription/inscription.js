/* ClasSos — Interface étudiant : inscription par le lien de la classe, sur son propre téléphone.
   L'étudiant peut modifier son inscription ou reprendre une saisie commencée. */
(function () {
  'use strict';
  var API = window.CLASSOS_API;
  var $ = function (id) { return document.getElementById(id); };
  var esc = SOS.esc;
  var LIENS = ['Mère', 'Père', 'Tuteur / Tutrice', 'Conjoint(e)', 'Frère / Sœur', 'Oncle / Tante', 'Grand-parent', 'Ami(e)', 'Colocataire', 'Autre'];
  var SANTE = ['Asthme', 'Diabète', 'Épilepsie', 'Drépanocytose', 'Allergie', 'Hypertension', 'Problème cardiaque', 'Évanouissements'];

  var token = (new URLSearchParams(location.search).get('c') || '').replace(/[^\w-]/g, '').slice(0, 64);
  var REG_KEY = 'classos.inscriptions';          // { token: [{ id, editToken, nom, prenom, at }] }
  var DRAFT_KEY = 'classos.brouillon.' + token;
  var info = null;          // infos de la classe
  var editing = null;       // inscription en cours de modification

  function readJSON(k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }
  function writeJSON(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function regs() { var all = readJSON(REG_KEY, {}); return Array.isArray(all[token]) ? all[token] : []; }
  function saveRegs(list) { var all = readJSON(REG_KEY, {}); all[token] = list; writeJSON(REG_KEY, all); }

  function api(method, path, body, editToken) {
    var h = { 'Content-Type': 'application/json' };
    if (editToken) h['X-Edit-Token'] = editToken;
    return fetch(API + path, { method: method, headers: h, body: body ? JSON.stringify(body) : undefined }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) { if (!r.ok) throw { status: r.status, message: j.error || 'Erreur ' + r.status }; return j; });
    }, function () { throw { status: 0, message: 'Pas de connexion Internet. Votre saisie est gardée sur ce téléphone : réessayez dès que le réseau revient.' }; });
  }

  function show(id) { ['loadView', 'msgView', 'doneView', 'formView'].forEach(function (v) { $(v).hidden = v !== id; }); window.scrollTo(0, 0); }
  function message(title, text, retry) { $('msgTitle').textContent = title; $('msgText').textContent = text; $('msgRetry').hidden = !retry; show('msgView'); }
  $('msgRetry').onclick = start;

  /* ---------- Formulaire ---------- */
  ['c1lien', 'c2lien'].forEach(function (id) { $(id).innerHTML = '<option value="">— Choisir —</option>' + LIENS.map(function (l) { return '<option>' + l + '</option>'; }).join(''); });
  $('chips').innerHTML = SANTE.map(function (s) { return '<button type="button" class="chip" aria-pressed="false">' + s + '</button>'; }).join('');
  function medTerms() { return $('medical').value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); }
  function syncChips() {
    var terms = medTerms().map(function (t) { return t.toLowerCase(); });
    document.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', terms.some(function (t) { return t.indexOf(c.textContent.toLowerCase()) === 0; }) ? 'true' : 'false'); });
  }
  document.querySelectorAll('.chip').forEach(function (c) {
    c.addEventListener('click', function () {
      var terms = medTerms();
      var i = terms.findIndex(function (t) { return t.toLowerCase().indexOf(c.textContent.toLowerCase()) === 0; });
      if (i >= 0) terms.splice(i, 1); else terms.push(c.textContent);
      $('medical').value = terms.join(', ').slice(0, 300);
      syncChips(); saveDraft();
    });
  });

  var FIELDS = ['nom', 'prenom', 'matricule', 'c1nom', 'c1lien', 'c1tel', 'c2nom', 'c2lien', 'c2tel', 'sang', 'medical'];
  function fill(d) {
    FIELDS.forEach(function (k) { $(k).value = d[k] || ''; });
    $('consent').checked = !!d.consent;
    syncChips();
  }
  function fromStudent(s) {
    var c = s.contacts || [];
    return { nom: s.nom, prenom: s.prenom, matricule: s.matricule, sang: s.sang, medical: s.medical, c1nom: (c[0] || {}).nom, c1lien: (c[0] || {}).lien, c1tel: (c[0] || {}).tel, c2nom: (c[1] || {}).nom, c2lien: (c[1] || {}).lien, c2tel: (c[1] || {}).tel, consent: true };
  }
  function current() { var d = {}; FIELDS.forEach(function (k) { d[k] = $(k).value; }); d.consent = $('consent').checked; return d; }

  /* Reprendre : la saisie est gardée sur le téléphone au fur et à mesure */
  function saveDraft() { if (!editing) writeJSON(DRAFT_KEY, current()); }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }
  document.querySelectorAll('#form input, #form select, #form textarea').forEach(function (el) {
    el.addEventListener('input', function () { var fl = el.closest('.field'); if (fl && el.type !== 'tel') fl.classList.remove('invalid'); saveDraft(); });
    el.addEventListener('change', saveDraft);
  });
  $('draftReset').onclick = function () { clearDraft(); $('form').reset(); syncChips(); $('draftNotice').hidden = true; $('nom').focus(); };

  ['c1tel', 'c2tel'].forEach(function (id) {
    var el = $(id);
    el.addEventListener('input', function () { if (el.selectionStart === el.value.length) { var f = SOS.phoneFormat(el.value); if (f !== el.value) el.value = f; } });
    el.addEventListener('blur', function () { if (el.value.trim()) checkTel(id); });
  });
  function setErr(id, bad) { $(id).closest('.field').classList.toggle('invalid', !!bad); return !bad; }
  function checkTel(id) { var r = SOS.phoneCheck($(id).value); $(id + 'Err').textContent = r.msg || ''; setErr(id, !r.ok); return r.ok; }

  function readForm() {
    var v = function (id) { return $(id).value.trim(); };
    var ok = true;
    ok = setErr('nom', !v('nom')) && ok;
    ok = setErr('prenom', !v('prenom')) && ok;
    ok = setErr('c1nom', !v('c1nom')) && ok;
    ok = setErr('c1lien', !v('c1lien')) && ok;
    ok = checkTel('c1tel') && ok;
    var c2any = v('c2nom') || v('c2tel') || v('c2lien');
    ok = setErr('c2nom', c2any && !v('c2nom')) && ok;
    ok = setErr('c2lien', c2any && !v('c2lien')) && ok;
    if (c2any) ok = checkTel('c2tel') && ok; else setErr('c2tel', false);
    if (c2any && SOS.samePhone(v('c1tel'), v('c2tel'))) { $('c2telErr').textContent = 'Même numéro que la personne n°1 : indiquez un autre numéro.'; setErr('c2tel', true); ok = false; }
    var consent = $('consent').checked;
    $('consentErr').style.display = consent ? 'none' : 'block';
    ok = consent && ok;
    if (!ok) { var first = document.querySelector('.field.invalid input, .field.invalid select') || $('consent'); first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); return null; }
    var contacts = [{ nom: v('c1nom'), lien: v('c1lien'), tel: v('c1tel') }];
    if (c2any) contacts.push({ nom: v('c2nom'), lien: v('c2lien'), tel: v('c2tel') });
    return { nom: v('nom'), prenom: v('prenom'), matricule: v('matricule'), sang: v('sang'), medical: v('medical'), contacts: contacts, consent: true };
  }

  $('form').addEventListener('submit', function (e) {
    e.preventDefault();
    $('formErr').textContent = '';
    var f = readForm();
    if (!f) return;
    var btn = $('submitBtn'); btn.disabled = true; btn.textContent = 'Envoi…';
    var req = editing ? api('PUT', '/join/' + token + '/me/' + editing.id, f, editing.editToken) : api('POST', '/join/' + token, f);
    req.then(function (r) {
      var list = regs().filter(function (x) { return !editing || x.id !== editing.id; });
      list.push({ id: editing ? editing.id : r.id, editToken: editing ? editing.editToken : r.editToken, nom: f.nom.toUpperCase(), prenom: f.prenom, at: Date.now() });
      saveRegs(list);
      clearDraft();
      var wasEdit = !!editing; editing = null;
      showDone(wasEdit ? 'Inscription modifiée ✓' : 'Inscription envoyée ✓');
    }, function (err) {
      $('formErr').textContent = err.message;
      if (err.status === 423) message('Inscriptions en pause', err.message, true);
    }).then(function () { btn.disabled = false; btn.textContent = editing ? 'Enregistrer la modification' : 'Envoyer mon inscription'; });
  });

  function openForm(reg) {
    editing = reg || null;
    $('editNotice').hidden = !editing;
    $('cancelEdit').hidden = !editing;
    $('submitBtn').textContent = editing ? 'Enregistrer la modification' : 'Envoyer mon inscription';
    $('formErr').textContent = '';
    document.querySelectorAll('.field.invalid').forEach(function (f) { f.classList.remove('invalid'); });
    if (editing) {
      $('draftNotice').hidden = true;
      show('loadView');
      api('GET', '/join/' + token + '/me/' + editing.id, null, editing.editToken).then(function (r) {
        fill(fromStudent(r.student)); show('formView');
      }, function (err) {
        if (err.status === 404) { saveRegs(regs().filter(function (x) { return x.id !== editing.id; })); editing = null; message('Inscription introuvable', 'Votre enseignant a peut-être supprimé cette fiche. Vous pouvez vous inscrire à nouveau.', false); setTimeout(function () { openForm(null); }, 2500); }
        else message('Impossible d’ouvrir votre inscription', err.message, true);
      });
      return;
    }
    $('form').reset();
    var draft = readJSON(DRAFT_KEY, null);
    if (draft && (draft.nom || draft.prenom || draft.c1nom || draft.c1tel)) { fill(draft); $('draftNotice').hidden = false; }
    else { $('draftNotice').hidden = true; syncChips(); }
    show('formView');
  }
  $('cancelEdit').onclick = function () { editing = null; showDone(); };

  function showDone(title) {
    var list = regs();
    if (!list.length) { openForm(null); return; }
    $('doneTitle').textContent = title || (list.length > 1 ? 'Inscriptions faites sur ce téléphone' : 'Vous êtes inscrit(e)');
    $('doneText').textContent = 'Votre fiche est chez votre enseignant' + (info && info.teacher ? ' (' + info.teacher + ')' : '') + ' pour « ' + (info ? info.className : '') + ' ». Vous pouvez la modifier à tout moment.';
    $('doneList').innerHTML = list.map(function (r, i) {
      return '<div class="card reg-item"><div class="grow"><b>' + esc(r.prenom + ' ' + r.nom) + '</b><span>Envoyée le ' + new Date(r.at).toLocaleDateString('fr-FR') + '</span></div>' +
        '<button class="btn btn-primary" data-edit="' + i + '" type="button">Modifier</button></div>';
    }).join('');
    var paused = info && info.status === 'paused';
    if (paused) {
      $('doneText').textContent += ' La classe est en pause : les modifications sont bloquées pour le moment.';
      $('doneList').querySelectorAll('[data-edit]').forEach(function (b) { b.hidden = true; });
    }
    $('addOther').hidden = !!paused;
    $('doneList').querySelectorAll('[data-edit]').forEach(function (b) { b.onclick = function () { openForm(regs()[Number(b.dataset.edit)]); }; });
    show('doneView');
  }
  $('addOther').onclick = function () { clearDraft(); openForm(null); };

  /* ---------- Démarrage ---------- */
  function start() {
    if (!token) { message('Lien incomplet', 'Ce lien d’inscription est incomplet. Demandez le bon lien à votre délégué ou à votre enseignant.', false); return; }
    show('loadView');
    api('GET', '/join/' + token).then(function (r) {
      info = r;
      $('hdrClass').textContent = r.className;
      $('introClass').textContent = r.className;
      $('introTeacher').textContent = [r.teacher, r.school].filter(Boolean).join(' · ');
      if (r.status === 'paused') {
        if (regs().length) { showDone(); return; }
        message('Inscriptions en pause', 'Votre enseignant a mis les inscriptions de « ' + r.className + ' » en pause. Réessayez plus tard.', true); return;
      }
      if (regs().length) showDone(); else openForm(null);
    }, function (err) {
      if (err.status === 404) message('Lien non valide', err.message, false);
      else message('Connexion impossible', err.message, true);
    });
  }
  start();
})();
