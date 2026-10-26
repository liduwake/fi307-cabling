/**
 * FI307 布线查询 —— Google Apps Script（全部功能，一个文件）
 *  1) 访问记录：doPost → 本表格“访问记录”工作表（IP、时间、事件、名字…）
 *  2) 布线进度：doGet  → 机柜“垂直/水平布线完成”标记（谁、何时、套餐），
 *                        “人员”工作表自动登记名字，“Progress”工作表记录每次操作
 *
 * 用法：在 Google 表格里 扩展程序(Extensions) → Apps Script，把本文件全部内容贴进 Code.gs。
 * 项目设置(Project Settings) → 脚本属性(Script Properties)：
 *   ADMIN_PIN    管理员 PIN（至少 6 位，只有你知道）
 *   SITE_ANSWER  duxing
 * 然后 部署(Deploy) → 新部署(New deployment) → 网页应用(Web app)：
 *   执行身份 Me；谁可以访问 Anyone。把得到的 …/exec 网址发给 Claude。
 */

/* ================= 1) 访问记录 ================= */
const SHEET_NAME = '访问记录';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    let d = {};
    try { d = JSON.parse(e.postData.contents); } catch (err) { d = { ev: 'bad-json' }; }
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sh.getLastRow() === 0) {
      sh.appendRow(['时间（服务器）', 'IP', '事件', '语言', '设备/浏览器', '页面', '时间（浏览器 UTC）', '名字']);
      sh.setFrozenRows(1);
    }
    const s = v => String(v == null ? '' : v).slice(0, 500);   // 防止超长内容
    sh.appendRow([new Date(), s(d.ip), s(d.ev), s(d.lang), s(d.ua), s(d.page), s(d.ts), s(d.name)]);
    if (sh.getRange(1, 8).getValue() === '') sh.getRange(1, 8).setValue('名字');
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}


/* ================= 2) 布线进度 ================= */

var ST_PREFIX = 'st:';
var ST_CATS = ['V', 'H'];          // V = vertical, H = horizontal
var MAX_PIN_FAILS = 5;             // then locked for 15 minutes
var UNDO_MIN = 10;                 // the marker can undo their own mark within 10 minutes
var PEOPLE_TAB = '人员';

function doGet(e) {
  var p = (e && e.parameter) || {};
  var out;
  try { out = statusHandle_(p); }
  catch (err) { out = { ok: false, err: String((err && err.message) || err) }; }
  return ContentService.createTextOutput(JSON.stringify(out))
    .setMimeType(ContentService.MimeType.JSON);
}

function clean_(s, n) { return String(s == null ? '' : s).replace(/[\r\n\t]/g, ' ').trim().slice(0, n || 40); }

function statusHandle_(p) {
  var props = PropertiesService.getScriptProperties();
  var site = String(props.getProperty('SITE_ANSWER') || '').trim().toLowerCase();
  if (!site) return { ok: false, err: 'not-configured' };
  // The page sends SHA-256 of the site answer, so only people who unlocked the tool can read or mark.
  if (String(p.k || '') !== sha256hex_(site)) return { ok: false, err: 'denied' };

  var a = String(p.a || 'list');
  if (a === 'list') return { ok: true, st: readAll_(props) };
  if (a === 'admin') return checkAdmin_(props, p.pin);
  if (a === 'hello') {                                   // register / refresh a name in the 人员 tab
    var nm = clean_(p.name, 30);
    if (nm.length < 2) return { ok: false, err: 'need-name' };
    people_(nm, clean_(p.old, 30), 0);
    return { ok: true };
  }

  var id = String(p.id || ''), cat = String(p.cat || '');
  if (!/^[^\n|]{1,40}\|[^\n|]{1,40}$/.test(id) || ST_CATS.indexOf(cat) < 0) return { ok: false, err: 'bad-request' };

  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var key = ST_PREFIX + id + '|' + cat;
    var by = clean_(p.by, 30);
    if (a === 'mark') {
      if (by.length < 2) return { ok: false, err: 'need-name' };
      var pkg = clean_(p.pkg, 80);
      if (!props.getProperty(key)) {
        props.setProperty(key, JSON.stringify({ t: new Date().toISOString(), by: by, p: pkg }));
        logProgress_('mark', id, cat, by, pkg);
        people_(by, '', 1);
      }
    } else if (a === 'undo') {                           // the same person, within UNDO_MIN minutes
      var cur = parseMark_(props.getProperty(key));
      if (!cur) return { ok: false, err: 'not-found', st: readAll_(props) };
      if (!by || cur.by !== by) return { ok: false, err: 'not-yours' };
      if (Date.now() - Date.parse(cur.t) > UNDO_MIN * 60000) return { ok: false, err: 'too-late' };
      props.deleteProperty(key);
      logProgress_('undo', id, cat, by, cur.p);
      people_(by, '', -1);
    } else if (a === 'clear') {
      var adm = checkAdmin_(props, p.pin);
      if (!adm.ok) return { ok: false, err: adm.err === 'locked' ? 'locked' : 'admin-only' };
      var old = parseMark_(props.getProperty(key));
      props.deleteProperty(key);
      logProgress_('clear (admin)', id, cat, old ? old.by : '', old ? old.p : '');
      if (old && old.by) people_(old.by, '', -1);
    } else {
      return { ok: false, err: 'bad-action' };
    }
    return { ok: true, st: readAll_(props) };
  } finally {
    lock.releaseLock();
  }
}

function parseMark_(v) {
  if (!v) return null;
  try { if (v.charAt(0) === '{') { var o = JSON.parse(v); return { t: o.t || '', by: o.by || '', p: o.p || '' }; } } catch (e) {}
  return { t: v, by: '', p: '' };
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

/** 人员 tab: one row per name — first seen, last seen, marks done, renamed from. Created automatically. */
function people_(name, oldName, delta) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var sh = ss.getSheetByName(PEOPLE_TAB) || ss.insertSheet(PEOPLE_TAB);
    if (sh.getLastRow() === 0) { sh.appendRow(['名字', '首次使用', '最近使用', '完成标记数', '改名自']); sh.setFrozenRows(1); }
    var n = sh.getLastRow(), names = n > 1 ? sh.getRange(2, 1, n - 1, 1).getValues() : [];
    var row = -1;
    for (var i = 0; i < names.length; i++) if (String(names[i][0]) === name) { row = i + 2; break; }
    var now = new Date();
    if (row < 0) {
      sh.appendRow([name, now, now, Math.max(0, delta), oldName && oldName !== name ? oldName : '']);
    } else {
      sh.getRange(row, 3).setValue(now);
      if (delta) sh.getRange(row, 4).setValue(Math.max(0, Number(sh.getRange(row, 4).getValue() || 0) + delta));
      if (oldName && oldName !== name) sh.getRange(row, 5).setValue(oldName);
    }
  } catch (e) { /* standalone script: no sheet */ }
}

function logProgress_(action, id, cat, by, pkg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return;
    var sh = ss.getSheetByName('Progress') || ss.insertSheet('Progress');
    if (sh.getLastRow() === 0) { sh.appendRow(['time', 'action', 'room', 'rack', 'cabling', 'package', 'by']); sh.setFrozenRows(1); }
    var parts = id.split('|');
    sh.appendRow([new Date(), action, parts[0], parts[1], cat === 'V' ? 'vertical' : 'horizontal', pkg || '', by || '']);
  } catch (e) { /* standalone script: no sheet log */ }
}
