/* ClasSos — API (Cloudflare Worker + D1)
   Trois espaces : étudiant (inscription par lien), enseignant (console admin), développeur (console dev).
   Chaque enseignant ne voit que ses propres classes. La console dev ne voit aucune donnée personnelle d'étudiant. */

const VERSION = '2.0.0';
const SESSION_DAYS = 90;
const PBKDF2_ITER = 30000;

/* ======================= Utilitaires ======================= */
const enc = new TextEncoder();
const now = () => Date.now();

function b64url(bytes) {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function randomToken(n = 24) { return b64url(crypto.getRandomValues(new Uint8Array(n))); }
function uid() { return randomToken(12); }
async function sha256(str) { return b64url(new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(str)))); }
async function hashPassword(pass, salt) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: enc.encode(salt), iterations: PBKDF2_ITER, hash: 'SHA-256' }, key, 256);
  return b64url(new Uint8Array(bits));
}
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}
const clip = (v, n) => String(v == null ? '' : v).trim().slice(0, n);
const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
const fail = (status, msg) => { throw new HttpError(status, msg); };

/* Téléphone : Côte d'Ivoire (10 chiffres, 01/05/07/21/25/27) ou international (+ / 00) */
function phoneOk(tel) {
  const raw = String(tel || '').trim();
  if (!raw || /[^\d+\s.\-()]/.test(raw)) return false;
  const d = raw.replace(/[^\d+]/g, '');
  const intl = d.startsWith('+') || d.startsWith('00');
  let n = d.replace(/^\+|^00/, '').replace(/\+/g, '');
  if (intl) { if (n.startsWith('225')) n = n.slice(3); else return n.length >= 8 && n.length <= 15; }
  return n.length === 10 && /^(01|05|07|21|25|27)/.test(n);
}
function phonePretty(tel) {
  const d = String(tel || '').replace(/[^\d+]/g, '');
  if (/^\d{10}$/.test(d)) return d.replace(/(\d{2})(?=\d)/g, '$1 ');
  if (/^\+225\d{10}$/.test(d)) return '+225 ' + d.slice(4).replace(/(\d{2})(?=\d)/g, '$1 ');
  return clip(tel, 22);
}
const LIENS = ['Mère', 'Père', 'Tuteur / Tutrice', 'Conjoint(e)', 'Frère / Sœur', 'Oncle / Tante', 'Grand-parent', 'Ami(e)', 'Colocataire', 'Autre'];
const SANGS = ['', 'A+', 'A−', 'B+', 'B−', 'AB+', 'AB−', 'O+', 'O−'];

/* Validation d'une fiche (même règles pour l'étudiant et l'enseignant) */
function validateFiche(b) {
  const f = {
    nom: clip(b.nom, 60).toUpperCase(), prenom: clip(b.prenom, 60), matricule: clip(b.matricule, 30),
    sang: SANGS.includes(b.sang) ? b.sang : '', medical: clip(b.medical, 300)
  };
  if (!f.nom) fail(400, 'Indiquez le nom.');
  if (!f.prenom) fail(400, 'Indiquez le prénom.');
  const contacts = (Array.isArray(b.contacts) ? b.contacts : []).slice(0, 2).map((c) => ({
    nom: clip(c && c.nom, 60), lien: LIENS.includes(c && c.lien) ? c.lien : 'Autre', tel: phonePretty(c && c.tel)
  })).filter((c) => c.nom || c.tel);
  if (!contacts.length) fail(400, 'Indiquez au moins une personne à prévenir.');
  contacts.forEach((c, i) => {
    if (!c.nom) fail(400, 'Indiquez le nom de la personne n°' + (i + 1) + '.');
    if (!phoneOk(c.tel)) fail(400, 'Le numéro de la personne n°' + (i + 1) + ' est invalide.');
  });
  if (contacts[1] && contacts[0].tel.replace(/\D/g, '').slice(-10) === contacts[1].tel.replace(/\D/g, '').slice(-10)) fail(400, 'Les deux personnes ont le même numéro.');
  f.contacts = contacts;
  return f;
}

/* Limitation des tentatives (anti-abus) */
async function limit(env, key, max, windowMs) {
  const t = now();
  const row = await env.DB.prepare('SELECT n, reset_at FROM attempts WHERE k = ?').bind(key).first();
  if (!row || row.reset_at < t) {
    await env.DB.prepare('INSERT OR REPLACE INTO attempts (k, n, reset_at) VALUES (?, 1, ?)').bind(key, t + windowMs).run();
    return;
  }
  if (row.n >= max) fail(429, 'Trop de tentatives. Réessayez dans quelques minutes.');
  await env.DB.prepare('UPDATE attempts SET n = n + 1 WHERE k = ?').bind(key).run();
}

/* ======================= Sessions ======================= */
const DEVICE_DOMAIN = '@appareil.classos';
const isDevice = (t) => String(t.email || '').endsWith(DEVICE_DOMAIN);
const DEVICE_SESSION_DAYS = 3650; // compte sans mot de passe : le téléphone est la clé

async function createSession(env, teacherId, days) {
  const token = randomToken(32);
  const t = now();
  await env.DB.prepare('INSERT INTO sessions (token_hash, teacher_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256(token), teacherId, t, t + (days || SESSION_DAYS) * 86400000).run();
  await env.DB.prepare('UPDATE teachers SET last_login = ? WHERE id = ?').bind(t, teacherId).run();
  return token;
}
async function auth(env, req, role) {
  const h = req.headers.get('Authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  if (!token) fail(401, 'Connexion requise.');
  const s = await env.DB.prepare('SELECT s.teacher_id, s.expires_at, t.* FROM sessions s JOIN teachers t ON t.id = s.teacher_id WHERE s.token_hash = ?')
    .bind(await sha256(token)).first();
  if (!s || s.expires_at < now()) fail(401, 'Session expirée. Reconnectez-vous.');
  if (s.status !== 'active') fail(403, 'Ce compte est suspendu. Contactez le support ClasSos.');
  if (role === 'dev' && s.role !== 'dev') fail(403, 'Accès réservé au développeur.');
  /* Session glissante : prolongée tant que le compte est utilisé */
  const days = isDevice(s) ? DEVICE_SESSION_DAYS : SESSION_DAYS;
  if (s.expires_at - now() < (days / 2) * 86400000) {
    await env.DB.prepare('UPDATE sessions SET expires_at = ? WHERE token_hash = ?').bind(now() + days * 86400000, await sha256(token)).run();
  }
  return s;
}
function teacherPublic(t) {
  let numbers = [];
  try { numbers = JSON.parse(t.numbers || '[]'); } catch (e) {}
  const device = isDevice(t);
  return { id: t.id, email: device ? '' : t.email, device, role: t.role, civ: t.civ, name: t.name, subject: t.subject, school: t.school, phone: t.phone, numbers };
}
function studentOut(s) {
  let contacts = [];
  try { contacts = JSON.parse(s.contacts); } catch (e) {}
  return { id: s.id, classId: s.class_id, nom: s.nom, prenom: s.prenom, matricule: s.matricule, sang: s.sang, medical: s.medical, contacts, source: s.source, created: s.created_at, updated: s.updated_at };
}
function classOut(c) { return { id: c.id, name: c.name, status: c.status, joinToken: c.join_token, created: c.created_at, updated: c.updated_at }; }

async function ownClass(env, teacherId, classId) {
  const c = await env.DB.prepare('SELECT * FROM classes WHERE id = ? AND teacher_id = ?').bind(classId, teacherId).first();
  if (!c) fail(404, 'Classe introuvable.');
  return c;
}

/* ======================= Routes ======================= */
async function handle(req, env) {
  const url = new URL(req.url);
  const p = url.pathname.replace(/\/+$/, '');
  const m = req.method;
  const ip = req.headers.get('CF-Connecting-IP') || 'local';
  const body = async () => { try { return await req.json(); } catch (e) { fail(400, 'Requête invalide.'); } };
  const seg = p.split('/').filter(Boolean); // ['api', ...]
  if (seg[0] !== 'api') fail(404, 'Introuvable.');
  const r = seg.slice(1);

  if (r[0] === 'health') {
    const row = await env.DB.prepare('SELECT COUNT(*) AS n FROM teachers').first();
    return { ok: true, version: VERSION, db: row ? 'ok' : 'ko' };
  }

  /* ---------- Espace étudiant (public, par lien de classe) ---------- */
  if (r[0] === 'join' && r[1]) {
    const c = await env.DB.prepare('SELECT c.*, t.civ, t.name AS tname, t.school, t.status AS tstatus FROM classes c JOIN teachers t ON t.id = c.teacher_id WHERE c.join_token = ?').bind(r[1]).first();
    if (!c || c.tstatus !== 'active') fail(404, 'Ce lien d’inscription n’est pas valide. Demandez le bon lien à votre délégué ou à votre enseignant.');
    const info = { className: c.name, teacher: ((c.civ ? c.civ + ' ' : '') + c.tname).trim(), school: c.school, status: c.status };

    if (r.length === 2 && m === 'GET') return info;

    if (r.length === 2 && m === 'POST') {
      if (c.status !== 'open') fail(423, 'Les inscriptions de cette classe sont en pause. Réessayez plus tard ou contactez votre enseignant.');
      await limit(env, 'join:' + ip + ':' + c.id, 40, 3600000);
      const b = await body();
      if (b.consent !== true) fail(400, 'L’accord de l’étudiant est obligatoire.');
      const f = validateFiche(b);
      const key = norm(f.nom) + '|' + norm(f.prenom);
      const dup = await env.DB.prepare('SELECT id FROM students WHERE class_id = ? AND name_key = ?').bind(c.id, key).first();
      if (dup) fail(409, 'Une inscription existe déjà à ce nom dans cette classe. Si c’est vous, utilisez « Modifier mon inscription » sur le téléphone où vous vous êtes inscrit(e), ou demandez à votre enseignant.');
      const id = uid(), editToken = randomToken(24), t = now();
      await env.DB.prepare('INSERT INTO students (id, class_id, teacher_id, nom, prenom, name_key, matricule, sang, medical, contacts, edit_hash, source, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, c.id, c.teacher_id, f.nom, f.prenom, key, f.matricule, f.sang, f.medical, JSON.stringify(f.contacts), await sha256(editToken), 'student', t, t, t).run();
      return { ok: true, id, editToken, class: info };
    }

    /* Consulter / modifier sa propre inscription : /api/join/:token/me/:id  (en-tête X-Edit-Token) */
    if (r[2] === 'me' && r[3]) {
      const s = await env.DB.prepare('SELECT * FROM students WHERE id = ? AND class_id = ?').bind(r[3], c.id).first();
      const et = req.headers.get('X-Edit-Token') || '';
      if (!s || !s.edit_hash || !safeEqual(await sha256(et), s.edit_hash)) fail(404, 'Inscription introuvable sur ce téléphone.');
      if (m === 'GET') return { student: studentOut(s), class: info };
      if (m === 'PUT') {
        if (c.status !== 'open') fail(423, 'La classe est en pause : les modifications sont bloquées pour le moment.');
        await limit(env, 'edit:' + ip + ':' + s.id, 30, 3600000);
        const b = await body();
        if (b.consent !== true) fail(400, 'L’accord de l’étudiant est obligatoire.');
        const f = validateFiche(b);
        const key = norm(f.nom) + '|' + norm(f.prenom);
        const dup = await env.DB.prepare('SELECT id FROM students WHERE class_id = ? AND name_key = ? AND id != ?').bind(c.id, key, s.id).first();
        if (dup) fail(409, 'Un autre étudiant de la classe est déjà inscrit à ce nom.');
        await env.DB.prepare('UPDATE students SET nom = ?, prenom = ?, name_key = ?, matricule = ?, sang = ?, medical = ?, contacts = ?, consent_at = ?, updated_at = ? WHERE id = ?')
          .bind(f.nom, f.prenom, key, f.matricule, f.sang, f.medical, JSON.stringify(f.contacts), now(), now(), s.id).run();
        return { ok: true };
      }
    }
    fail(404, 'Introuvable.');
  }

  /* ---------- Authentification enseignant / développeur ---------- */
  if (r[0] === 'auth') {
    /* Démarrage sans mot de passe : le compte est lié au téléphone (jeton de session longue durée) */
    if (r[1] === 'start' && m === 'POST') {
      await limit(env, 'start:' + ip, 10, 3600000);
      const b = await body();
      const name = clip(b.name, 60);
      if (!name) fail(400, 'Indiquez votre nom.');
      const id = uid();
      await env.DB.prepare('INSERT INTO teachers (id, email, pass_hash, pass_salt, name, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .bind(id, 'compte-' + id.toLowerCase() + DEVICE_DOMAIN, randomToken(32), randomToken(16), name, now()).run();
      const t = await env.DB.prepare('SELECT * FROM teachers WHERE id = ?').bind(id).first();
      return { token: await createSession(env, id, DEVICE_SESSION_DAYS), teacher: teacherPublic(t) };
    }
    if (r[1] === 'signup' && m === 'POST') {
      await limit(env, 'signup:' + ip, 8, 3600000);
      const b = await body();
      const email = clip(b.email, 120).toLowerCase();
      const pass = String(b.password || '');
      const name = clip(b.name, 60);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, 'Adresse e-mail invalide.');
      if (pass.length < 8) fail(400, 'Le mot de passe doit contenir au moins 8 caractères.');
      if (!name) fail(400, 'Indiquez votre nom.');
      if (await env.DB.prepare('SELECT id FROM teachers WHERE email = ?').bind(email).first()) fail(409, 'Un compte existe déjà avec cette adresse. Connectez-vous.');
      const id = uid(), salt = randomToken(16);
      await env.DB.prepare('INSERT INTO teachers (id, email, pass_hash, pass_salt, civ, name, school, subject, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(id, email, await hashPassword(pass, salt), salt, clip(b.civ, 12), name, clip(b.school, 80), clip(b.subject, 60), now()).run();
      const t = await env.DB.prepare('SELECT * FROM teachers WHERE id = ?').bind(id).first();
      return { token: await createSession(env, id), teacher: teacherPublic(t) };
    }
    if (r[1] === 'login' && m === 'POST') {
      const b = await body();
      const email = clip(b.email, 120).toLowerCase();
      await limit(env, 'login:' + ip + ':' + email, 10, 900000);
      const t = await env.DB.prepare('SELECT * FROM teachers WHERE email = ?').bind(email).first();
      if (!t || !safeEqual(await hashPassword(String(b.password || ''), t.pass_salt), t.pass_hash)) fail(401, 'E-mail ou mot de passe incorrect.');
      if (t.status !== 'active') fail(403, 'Ce compte est suspendu. Contactez le support ClasSos.');
      return { token: await createSession(env, t.id), teacher: teacherPublic(t) };
    }
    if (r[1] === 'logout' && m === 'POST') {
      const h = req.headers.get('Authorization') || '';
      if (h.startsWith('Bearer ')) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(h.slice(7))).run();
      return { ok: true };
    }
    if (r[1] === 'password' && m === 'POST') {
      const t = await auth(env, req);
      const b = await body();
      if (!safeEqual(await hashPassword(String(b.current || ''), t.pass_salt), t.pass_hash)) fail(401, 'Mot de passe actuel incorrect.');
      if (String(b.next || '').length < 8) fail(400, 'Le nouveau mot de passe doit contenir au moins 8 caractères.');
      const salt = randomToken(16);
      await env.DB.prepare('UPDATE teachers SET pass_hash = ?, pass_salt = ? WHERE id = ?').bind(await hashPassword(b.next, salt), salt, t.id).run();
      return { ok: true };
    }
    fail(404, 'Introuvable.');
  }

  /* ---------- Console administrateur (enseignant) ---------- */
  if (r[0] === 'teacher') {
    const t = await auth(env, req);
    if (m === 'GET' && r.length === 1) return { teacher: teacherPublic(t) };
    if (m === 'PUT' && r.length === 1) {
      const b = await body();
      const name = clip(b.name, 60);
      if (!name) fail(400, 'Indiquez votre nom.');
      if (b.phone && !phoneOk(b.phone)) fail(400, 'Votre numéro de téléphone est invalide.');
      let numbers = Array.isArray(b.numbers) ? b.numbers.slice(0, 4).map((n) => ({ label: clip(n.label, 24), num: String(n.num || '').replace(/[^\d+]/g, '').slice(0, 20) })).filter((n) => n.label && n.num) : null;
      await env.DB.prepare('UPDATE teachers SET civ = ?, name = ?, subject = ?, school = ?, phone = ?' + (numbers ? ', numbers = ?' : '') + ' WHERE id = ?')
        .bind(...[clip(b.civ, 12), name, clip(b.subject, 60), clip(b.school, 80), b.phone ? phonePretty(b.phone) : ''].concat(numbers ? [JSON.stringify(numbers)] : [], [t.id])).run();
      return { teacher: teacherPublic(await env.DB.prepare('SELECT * FROM teachers WHERE id = ?').bind(t.id).first()) };
    }
    fail(404, 'Introuvable.');
  }

  if (r[0] === 'directory' && m === 'GET') {
    const t = await auth(env, req);
    const cls = await env.DB.prepare('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at').bind(t.id).all();
    const stu = await env.DB.prepare('SELECT * FROM students WHERE teacher_id = ?').bind(t.id).all();
    const byClass = {};
    (stu.results || []).forEach((s) => { (byClass[s.class_id] = byClass[s.class_id] || []).push(studentOut(s)); });
    return {
      teacher: teacherPublic(t),
      classes: (cls.results || []).map((c) => Object.assign(classOut(c), { students: byClass[c.id] || [] })),
      syncedAt: now()
    };
  }

  if (r[0] === 'classes') {
    const t = await auth(env, req);
    if (r.length === 1 && m === 'POST') {
      const b = await body();
      const name = clip(b.name, 80);
      if (!name) fail(400, 'Indiquez le nom de la classe.');
      const count = await env.DB.prepare('SELECT COUNT(*) AS n FROM classes WHERE teacher_id = ?').bind(t.id).first();
      if (count && count.n >= 200) fail(400, 'Nombre maximal de classes atteint.');
      const id = uid(), tk = randomToken(12), ts = now();
      await env.DB.prepare('INSERT INTO classes (id, teacher_id, name, join_token, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, t.id, name, tk, 'open', ts, ts).run();
      return { class: classOut({ id, name, join_token: tk, status: 'open', created_at: ts, updated_at: ts }) };
    }
    if (r[1]) {
      const c = await ownClass(env, t.id, r[1]);
      if (r.length === 2 && m === 'PATCH') {
        const b = await body();
        const name = b.name != null ? clip(b.name, 80) : c.name;
        const status = b.status === 'paused' || b.status === 'open' ? b.status : c.status;
        if (!name) fail(400, 'Indiquez le nom de la classe.');
        await env.DB.prepare('UPDATE classes SET name = ?, status = ?, updated_at = ? WHERE id = ?').bind(name, status, now(), c.id).run();
        return { class: classOut(Object.assign({}, c, { name, status })) };
      }
      if (r.length === 2 && m === 'DELETE') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM students WHERE class_id = ?').bind(c.id),
          env.DB.prepare('DELETE FROM classes WHERE id = ?').bind(c.id)
        ]);
        return { ok: true };
      }
      if (r[2] === 'new-link' && m === 'POST') {
        const tk = randomToken(12);
        await env.DB.prepare('UPDATE classes SET join_token = ?, updated_at = ? WHERE id = ?').bind(tk, now(), c.id).run();
        return { class: classOut(Object.assign({}, c, { join_token: tk })) };
      }
      if (r[2] === 'students' && m === 'POST') {
        const b = await body();
        const f = validateFiche(b);
        const key = norm(f.nom) + '|' + norm(f.prenom);
        if (await env.DB.prepare('SELECT id FROM students WHERE class_id = ? AND name_key = ?').bind(c.id, key).first()) fail(409, 'Un étudiant de cette classe porte déjà ce nom.');
        const id = uid(), ts = now();
        await env.DB.prepare('INSERT INTO students (id, class_id, teacher_id, nom, prenom, name_key, matricule, sang, medical, contacts, edit_hash, source, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)')
          .bind(id, c.id, t.id, f.nom, f.prenom, key, f.matricule, f.sang, f.medical, JSON.stringify(f.contacts), 'teacher', ts, ts, ts).run();
        return { ok: true, id };
      }
    }
    fail(404, 'Introuvable.');
  }

  if (r[0] === 'students' && r[1]) {
    const t = await auth(env, req);
    const s = await env.DB.prepare('SELECT * FROM students WHERE id = ? AND teacher_id = ?').bind(r[1], t.id).first();
    if (!s) fail(404, 'Fiche introuvable.');
    if (m === 'PUT') {
      const f = validateFiche(await body());
      const key = norm(f.nom) + '|' + norm(f.prenom);
      if (await env.DB.prepare('SELECT id FROM students WHERE class_id = ? AND name_key = ? AND id != ?').bind(s.class_id, key, s.id).first()) fail(409, 'Un autre étudiant de la classe porte déjà ce nom.');
      await env.DB.prepare('UPDATE students SET nom = ?, prenom = ?, name_key = ?, matricule = ?, sang = ?, medical = ?, contacts = ?, updated_at = ? WHERE id = ?')
        .bind(f.nom, f.prenom, key, f.matricule, f.sang, f.medical, JSON.stringify(f.contacts), now(), s.id).run();
      return { ok: true };
    }
    if (m === 'DELETE') {
      await env.DB.prepare('DELETE FROM students WHERE id = ?').bind(s.id).run();
      return { ok: true };
    }
    fail(404, 'Introuvable.');
  }

  /* Import des fiches de l'ancienne version (stockées sur le téléphone de l'enseignant) */
  if (r[0] === 'import' && m === 'POST') {
    const t = await auth(env, req);
    const b = await body();
    let nc = 0, ns = 0, skipped = 0;
    for (const src of (Array.isArray(b.classes) ? b.classes : []).slice(0, 50)) {
      const name = clip(src.name, 80);
      if (!name) continue;
      let c = await env.DB.prepare('SELECT * FROM classes WHERE teacher_id = ? AND name = ?').bind(t.id, name).first();
      if (!c) {
        const id = uid(), ts = now();
        await env.DB.prepare('INSERT INTO classes (id, teacher_id, name, join_token, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').bind(id, t.id, name, randomToken(12), 'open', ts, ts).run();
        c = { id }; nc++;
      }
      for (const s of (Array.isArray(src.students) ? src.students : []).slice(0, 500)) {
        let f;
        try { f = validateFiche(s); } catch (e) { skipped++; continue; }
        const key = norm(f.nom) + '|' + norm(f.prenom);
        if (await env.DB.prepare('SELECT id FROM students WHERE class_id = ? AND name_key = ?').bind(c.id, key).first()) { skipped++; continue; }
        const ts = now();
        await env.DB.prepare('INSERT INTO students (id, class_id, teacher_id, nom, prenom, name_key, matricule, sang, medical, contacts, edit_hash, source, consent_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?)')
          .bind(uid(), c.id, t.id, f.nom, f.prenom, key, f.matricule, f.sang, f.medical, JSON.stringify(f.contacts), 'teacher', ts, ts, ts).run();
        ns++;
      }
    }
    return { ok: true, classes: nc, students: ns, skipped };
  }

  /* ---------- Console développeur (aucune donnée personnelle d'étudiant) ---------- */
  if (r[0] === 'dev') {
    await auth(env, req, 'dev');
    if (r[1] === 'overview' && m === 'GET') {
      const since = now() - 7 * 86400000;
      const tot = await env.DB.prepare(`SELECT
        (SELECT COUNT(*) FROM teachers WHERE role = 'teacher') AS teachers,
        (SELECT COUNT(*) FROM classes) AS classes,
        (SELECT COUNT(*) FROM classes WHERE status = 'paused') AS paused,
        (SELECT COUNT(*) FROM students) AS students,
        (SELECT COUNT(*) FROM students WHERE created_at > ?) AS students7d,
        (SELECT COUNT(*) FROM teachers WHERE role = 'teacher' AND created_at > ?) AS teachers7d`).bind(since, since).first();
      const list = await env.DB.prepare(`SELECT t.id, t.email, t.civ, t.name, t.school, t.role, t.status, t.created_at, t.last_login,
        (SELECT COUNT(*) FROM classes c WHERE c.teacher_id = t.id) AS classes,
        (SELECT COUNT(*) FROM students s WHERE s.teacher_id = t.id) AS students
        FROM teachers t ORDER BY t.created_at DESC LIMIT 500`).all();
      return { version: VERSION, totals: tot, teachers: list.results || [] };
    }
    if (r[1] === 'teachers' && r[2]) {
      const target = await env.DB.prepare('SELECT * FROM teachers WHERE id = ?').bind(r[2]).first();
      if (!target) fail(404, 'Compte introuvable.');
      if (target.role === 'dev') fail(400, 'Le compte développeur ne peut pas être modifié ici.');
      if (m === 'PATCH') {
        const b = await body();
        const status = b.status === 'suspended' ? 'suspended' : 'active';
        await env.DB.prepare('UPDATE teachers SET status = ? WHERE id = ?').bind(status, target.id).run();
        if (status === 'suspended') await env.DB.prepare('DELETE FROM sessions WHERE teacher_id = ?').bind(target.id).run();
        return { ok: true, status };
      }
      if (m === 'DELETE') {
        await env.DB.batch([
          env.DB.prepare('DELETE FROM students WHERE teacher_id = ?').bind(target.id),
          env.DB.prepare('DELETE FROM classes WHERE teacher_id = ?').bind(target.id),
          env.DB.prepare('DELETE FROM sessions WHERE teacher_id = ?').bind(target.id),
          env.DB.prepare('DELETE FROM teachers WHERE id = ?').bind(target.id)
        ]);
        return { ok: true };
      }
    }
    fail(404, 'Introuvable.');
  }

  fail(404, 'Introuvable.');
}

/* ======================= Point d'entrée ======================= */
export default {
  async fetch(req, env) {
    const origin = req.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim());
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Edit-Token',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin'
    };
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    const headers = Object.assign({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' }, cors);
    try {
      const out = await handle(req, env);
      return new Response(JSON.stringify(out), { status: 200, headers });
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e && e.stack || e);
      return new Response(JSON.stringify({ error: status === 500 ? 'Erreur du serveur. Réessayez.' : e.message }), { status, headers });
    }
  }
};
