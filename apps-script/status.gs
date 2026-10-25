/**
 * FI307 rack progress — shared "vertical / horizontal cabling done" marks.
 *
 * Add this as a NEW FILE (e.g. "status.gs") in the SAME Apps Script project that
 * already receives the access log. It only adds doGet(); your existing doPost()
 * (the access log) is untouched. If that project already has a doGet(), tell Claude.
 *
 * One-time setup (Project Settings → Script properties → Add):
 *   ADMIN_PIN    your admin PIN (only you know it; at least 6 characters)
 *   SITE_ANSWER  the answer to the tool's "Who am I?" question (case is ignored)
 * Then: Deploy → Manage deployments → (your web app) → Edit → Version: New version → Deploy.
 * The web-app URL stays the same, so the page needs no change.
 *
 * Marks are stored in Script Properties (not in the sheet). If the project is bound
 * to a spreadsheet, every mark/clear is also appended to a "Progress" tab as a log.
 */

var ST_PREFIX = 'st:';
var ST_CATS = ['V', 'H'];          // V = vertical, H = horizontal
var MAX_PIN_FAILS = 5;             // then locked for 15 minutes

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try { out = statusHandle_(p); }
  catch (err) { out = { ok: false, err: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function statusHandle_(p) {
  var props = PropertiesService.getScriptProperties();
  var site = String(props.getProperty('SITE_ANSWER') || '').trim().toLowerCase();
  if (!site) return { ok: false, err: 'not-configured' };
  // The page sends SHA-256 of the site answer, so only people who unlocked the tool can read or mark.
  if (String(p.k || '') !== sha256hex_(site)) return { ok: false, err: 'denied' };

  var a = String(p.a || 'list');
  if (a === 'list') return { ok: true, st: readAll_(props) };
  if (a === 'admin') return checkAdmin_(props, p.pin);

  var id = String(p.id || ''), cat = String(p.cat || '');
  if (!/^[^\n|]{1,40}\|[^\n|]{1,40}$/.test(id) || ST_CATS.indexOf(cat) < 0) return { ok: false, err: 'bad-request' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var key = ST_PREFIX + id + '|' + cat;
    if (a === 'mark') {
      if (!props.getProperty(key)) {
        props.setProperty(key, new Date().toISOString());
        logProgress_('mark', id, cat);
      }
    } else if (a === 'clear') {
      var adm = checkAdmin_(props, p.pin);
      if (!adm.ok) return { ok: false, err: adm.err === 'locked' ? 'locked' : 'admin-only' };
      props.deleteProperty(key);
      logProgress_('clear', id, cat);
    } else {
      return { ok: false, err: 'bad-action' };
    }
    return { ok: true, st: readAll_(props) };
  } finally {
    lock.releaseLock();
  }
}

function readAll_(props) {
  var all = props.getProperties(), st = {};
  for (var k in all) if (k.indexOf(ST_PREFIX) === 0) st[k.slice(ST_PREFIX.length)] = all[k];
  return st;
}

function checkAdmin_(props, pin) {
  var cache = CacheService.getScriptCache();
  var fails = Number(cache.get('pinfails') || 0);
  if (fails >= MAX_PIN_FAILS) return { ok: false, err: 'locked' };
  var want = String(props.getProperty('ADMIN_PIN') || '');
  if (want.length >= 4 && String(pin || '') === want) { cache.remove('pinfails'); return { ok: true }; }
  cache.put('pinfails', String(fails + 1), 900);
  return { ok: false, err: 'bad-pin' };
}

function sha256hex_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, s, Utilities.Charset.UTF_8)
    .map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('');
}

function logProgress_(action, id, cat) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var sh = ss.getSheetByName('Progress') || ss.insertSheet('Progress');
    if (sh.getLastRow() === 0) sh.appendRow(['time', 'action', 'room', 'rack', 'cabling']);
    var parts = id.split('|');
    sh.appendRow([new Date(), action, parts[0], parts[1], cat === 'V' ? 'vertical' : 'horizontal']);
  } catch (e) { /* standalone script: no sheet log */ }
}
