// Tests de bout en bout de l'API ClasSos (serveur local : npx wrangler dev --port 8787)
const B = process.env.API || 'http://127.0.0.1:8787/api';
let pass = 0, failN = 0;
const ok = (cond, label) => { if (cond) { pass++; } else { failN++; console.log('ÉCHEC :', label); } };
async function call(method, path, body, headers = {}) {
  const r = await fetch(B + path, { method, headers: Object.assign({ 'Content-Type': 'application/json', Origin: process.env.ORIGIN || 'http://localhost:5210' }, headers), body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch (e) {}
  return { status: r.status, body: j, cors: r.headers.get('access-control-allow-origin') };
}
const tag = Date.now().toString(36);
const A = { email: 'prof.a.' + tag + '@test.ci', password: 'motdepasse-A1', name: 'Kouassi Yao', civ: 'M.', school: 'Lycée Test' };
const Bt = { email: 'prof.b.' + tag + '@test.ci', password: 'motdepasse-B1', name: 'Traoré Awa' };
const fiche = { nom: 'Konan', prenom: 'Aïcha', matricule: '22-01', sang: 'O+', medical: 'Asthme', consent: true, contacts: [{ nom: 'Konan Marie', lien: 'Mère', tel: '0707123456' }, { nom: 'Yao Serge', lien: 'Oncle / Tante', tel: '+2250505998877' }] };

let r = await call('POST', '/auth/signup', { email: 'bad', password: 'x', name: '' }); ok(r.status === 400, 'signup invalide refusé');
r = await call('POST', '/auth/signup', A); ok(r.status === 200 && r.body.token, 'signup A'); const tA = r.body.token; ok(r.cors === (process.env.ORIGIN || 'http://localhost:5210'), 'CORS origine autorisée');
r = await call('POST', '/auth/signup', A); ok(r.status === 409, 'doublon e-mail refusé');
r = await call('POST', '/auth/signup', Bt); const tB = r.body.token; ok(!!tB, 'signup B');
r = await call('POST', '/auth/login', { email: A.email, password: 'mauvais' }); ok(r.status === 401, 'mauvais mot de passe refusé');
r = await call('POST', '/auth/login', { email: A.email.toUpperCase(), password: A.password }); ok(r.status === 200, 'login A (e-mail insensible à la casse)');
const HA = { Authorization: 'Bearer ' + tA }, HB = { Authorization: 'Bearer ' + tB };

r = await call('GET', '/directory'); ok(r.status === 401, 'annuaire sans connexion refusé');
r = await call('POST', '/classes', { name: 'Licence 2 — Groupe A' }, HA); ok(r.status === 200, 'création classe'); const cls = r.body.class;
r = await call('GET', '/join/' + cls.joinToken); ok(r.body.className === 'Licence 2 — Groupe A' && r.body.teacher === 'M. Kouassi Yao', 'infos classe publiques');
r = await call('GET', '/join/inconnu'); ok(r.status === 404, 'lien invalide');

r = await call('POST', '/join/' + cls.joinToken, Object.assign({}, fiche, { consent: false })); ok(r.status === 400, 'accord obligatoire');
r = await call('POST', '/join/' + cls.joinToken, Object.assign({}, fiche, { contacts: [{ nom: 'X', lien: 'Mère', tel: '0907123456' }] })); ok(r.status === 400, 'numéro invalide refusé');
r = await call('POST', '/join/' + cls.joinToken, fiche); ok(r.status === 200 && r.body.editToken, 'inscription étudiante'); const sId = r.body.id, eTok = r.body.editToken;
r = await call('POST', '/join/' + cls.joinToken, Object.assign({}, fiche, { prenom: 'aicha' })); ok(r.status === 409, 'doublon de nom refusé (accents/casse)');

r = await call('GET', '/join/' + cls.joinToken + '/me/' + sId, null, { 'X-Edit-Token': eTok }); ok(r.body.student && r.body.student.prenom === 'Aïcha', 'étudiant relit sa fiche');
r = await call('GET', '/join/' + cls.joinToken + '/me/' + sId, null, { 'X-Edit-Token': 'faux' }); ok(r.status === 404, 'mauvais jeton de modification refusé');
r = await call('PUT', '/join/' + cls.joinToken + '/me/' + sId, Object.assign({}, fiche, { medical: 'Asthme, allergie pénicilline' }), { 'X-Edit-Token': eTok }); ok(r.status === 200, 'étudiant modifie sa fiche');

r = await call('GET', '/directory', null, HA); ok(r.body.classes.length === 1 && r.body.classes[0].students[0].medical.includes('pénicilline'), 'répertoire consolidé chez A');
r = await call('GET', '/directory', null, HB); ok(r.body.classes.length === 0, 'B ne voit pas les classes de A');
r = await call('PATCH', '/classes/' + cls.id, { status: 'paused' }, HB); ok(r.status === 404, 'B ne peut pas modifier la classe de A');
r = await call('PUT', '/students/' + sId, fiche, HB); ok(r.status === 404, 'B ne peut pas modifier une fiche de A');

r = await call('PATCH', '/classes/' + cls.id, { status: 'paused' }, HA); ok(r.body.class && r.body.class.status === 'paused', 'mise en pause');
r = await call('POST', '/join/' + cls.joinToken, Object.assign({}, fiche, { nom: 'Bamba', prenom: 'Moussa' })); ok(r.status === 423, 'inscription bloquée en pause');
r = await call('PUT', '/join/' + cls.joinToken + '/me/' + sId, fiche, { 'X-Edit-Token': eTok }); ok(r.status === 423, 'modification étudiante bloquée en pause');
r = await call('PATCH', '/classes/' + cls.id, { status: 'open', name: 'Licence 2 — A' }, HA); ok(r.body.class && r.body.class.status === 'open' && r.body.class.name === 'Licence 2 — A', 'reprise + renommage');

r = await call('POST', '/classes/' + cls.id + '/students', { nom: 'Diallo', prenom: 'Fatou', contacts: [{ nom: 'Diallo Aminata', lien: 'Mère', tel: '0102030405' }] }, HA); ok(r.status === 200, 'ajout manuel enseignant');
r = await call('PUT', '/students/' + sId, Object.assign({}, fiche, { sang: 'A+' }), HA); ok(r.status === 200, 'enseignant modifie une fiche');
r = await call('POST', '/classes/' + cls.id + '/new-link', null, HA); const newTok = r.body.class && r.body.class.joinToken; ok(newTok && newTok !== cls.joinToken, 'nouveau lien');
r = await call('GET', '/join/' + cls.joinToken); ok(r.status === 404, 'ancien lien désactivé');

r = await call('PUT', '/teacher', { civ: 'M.', name: 'Kouassi Yao', subject: 'Maths', school: 'Lycée Test', phone: '0707000000', numbers: [{ label: 'SAMU', num: '185' }] }, HA); ok(r.body.teacher && r.body.teacher.subject === 'Maths' && r.body.teacher.numbers.length === 1, 'infos enseignant');
r = await call('POST', '/import', { classes: [{ name: 'Ancienne classe', students: [fiche, fiche] }] }, HA); ok(r.body.classes === 1 && r.body.students === 1 && r.body.skipped === 1, 'import ancienne version (doublon ignoré)');

r = await call('GET', '/dev/overview', null, HA); ok(r.status === 403, 'console dev refusée à un enseignant');

r = await call('DELETE', '/students/' + sId, null, HA); ok(r.status === 200, 'suppression fiche');
r = await call('DELETE', '/classes/' + cls.id, null, HA); ok(r.status === 200, 'suppression classe');
r = await call('GET', '/directory', null, HA); ok(r.body.classes.length === 1 && r.body.classes[0].name === 'Ancienne classe', 'classe supprimée avec ses fiches');
r = await call('POST', '/auth/logout', null, HB); r = await call('GET', '/directory', null, HB); ok(r.status === 401, 'déconnexion invalide la session');

// Démarrage sans mot de passe (compte lié au téléphone)
r = await call('POST', '/auth/start', { name: '' }); ok(r.status === 400, 'start sans nom refusé');
r = await call('POST', '/auth/start', { name: 'Prof Sans MDP' }); ok(r.status === 200 && r.body.token && r.body.teacher.device === true && r.body.teacher.email === '', 'start sans mot de passe');
const HS = { Authorization: 'Bearer ' + r.body.token };
r = await call('POST', '/classes', { name: 'Classe sans MDP' }, HS); ok(r.status === 200, 'compte sans mot de passe crée une classe');
r = await call('GET', '/directory', null, HS); ok(r.body.classes.length === 1, 'compte sans mot de passe isolé');
r = await call('GET', '/directory', null, HA); ok(!r.body.classes.some(function (c) { return c.name === 'Classe sans MDP'; }), 'A ne voit pas la classe du compte sans mot de passe');
// Code de connexion : retrouver son compte ailleurs
r = await call('POST', '/auth/start', { name: 'Prof Code' }); const code1 = r.body.code; const tC = r.body.token;
ok(/^[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{2}$/.test(code1 || ''), 'code de connexion fourni à la création');
r = await call('POST', '/classes', { name: 'Classe du code' }, { Authorization: 'Bearer ' + tC });
r = await call('POST', '/auth/code', { code: code1.toLowerCase().replace(/-/g, ' ') }); ok(r.status === 200 && r.body.teacher.name === 'Prof Code', 'retrouver le compte avec le code (minuscules, espaces)');
r = await call('GET', '/directory', null, { Authorization: 'Bearer ' + r.body.token }); ok(r.body.classes.length === 1 && r.body.classes[0].name === 'Classe du code', 'répertoire retrouvé sur un autre téléphone');
r = await call('POST', '/auth/code', { code: 'AAAA-BBBB-CC' }); ok(r.status === 401, 'mauvais code refusé');
r = await call('POST', '/teacher/code', null, { Authorization: 'Bearer ' + tC }); const code2 = r.body.code; ok(code2 && code2 !== code1, 'nouveau code');
r = await call('POST', '/auth/code', { code: code1 }); ok(r.status === 401, 'ancien code désactivé');
r = await call('POST', '/auth/code', { code: code2 }); ok(r.status === 200, 'nouveau code accepté');
r = await call('POST', '/auth/login', { email: 'compte-x@appareil.classos', password: '' }); ok(r.status === 401, 'impossible de se connecter par e-mail à un compte sans mot de passe');
// Connexion Google : un faux jeton est toujours refusé
r = await call('POST', '/auth/google', { credential: 'faux.jeton.google' }); ok([400, 401, 503].includes(r.status) && !r.body.token, 'faux jeton Google refusé');
r = await call('POST', '/auth/google', {}); ok([400, 503].includes(r.status), 'connexion Google sans jeton refusée');
console.log(JSON.stringify({ devCandidate: A.email, tokenA: tA }));
console.log(pass + ' réussis, ' + failN + ' échoué(s)');
process.exit(failN ? 1 : 0);
