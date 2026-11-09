'use strict';
/* =========================================================
   日程本+  —  手帳式學生日程本（資料只存在本機）
   ========================================================= */

/* ---------- 小工具 ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
const today = () => ymd(new Date());
const diffDays = (a, b) => Math.round((parse(b) - parse(a)) / 864e5);
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => { const d = parse(s); return `${d.getMonth() + 1}/${d.getDate()}`; };

const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WD_TC = ['日', '一', '二', '三', '四', '五', '六'];
const TASK_TYPES = ['作業', '考試', '報告', '其他'];
const PALETTE = ['#c4553a', '#d4903c', '#b9a23f', '#7a9a4a', '#3f8a7c', '#3d6a9e', '#6b5b9a', '#b0607e', '#8a7a66'];

// 空白狀態的線條插圖
const ILL = {
  plane: `<svg viewBox="0 0 96 72"><path d="M14 38 L80 12 L64 60 L46 44 Z"/><path d="M46 44 L80 12"/><path d="M46 44 L44 56 L54 50"/><path class="dash" d="M8 58 C18 54 22 62 32 58"/><circle class="acc" cx="84" cy="30" r="2"/><circle class="acc" cx="24" cy="20" r="1.5"/></svg>`,
  book: `<svg viewBox="0 0 96 72"><path d="M18 18 C30 13 40 15 48 21 C56 15 66 13 78 18 V56 C66 51 56 53 48 59 C40 53 30 51 18 56 Z"/><path d="M48 21 V59"/><path d="M26 28 H40 M26 35 H40 M56 28 H70 M56 35 H66"/><path class="acc" d="M62 14 V28 L65.5 25 L69 28 V14"/></svg>`,
};

const I = {
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
  plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
  left: '<svg viewBox="0 0 24 24"><path d="M15 6l-6 6 6 6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  arrow: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  trash: '<svg viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>',
  up: '<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>',
};

const MOODS = [
  { k: 1, l: '很糟', m: 'M8 16.8 Q12 13.2 16 16.8' },
  { k: 2, l: '不太好', m: 'M8.6 16 Q12 14.2 15.4 16' },
  { k: 3, l: '普通', m: 'M8.8 15.4 H15.2' },
  { k: 4, l: '不錯', m: 'M8.6 14.6 Q12 17.2 15.4 14.6' },
  { k: 5, l: '超棒', m: 'M8 14 Q12 19.2 16 14' },
];
const face = m => `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.3"/><circle cx="9" cy="10" r=".9" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r=".9" fill="currentColor" stroke="none"/><path d="${m.m}"/></svg>`;

/* ---------- 資料 ---------- */
const KEY = 'planner-plus-v1';

function defaults() {
  const subjects = [['國文', 0], ['英文', 5], ['數學', 4], ['自然', 3], ['社會', 1]]
    .map(([name, c]) => ({ id: uid(), name, color: PALETTE[c] }));
  return {
    v: 1,
    days: {},      // 'YYYY-MM-DD' -> { todos, events, note, mood }
    weeks: {},     // 週起始日 -> { goals, memo }
    months: {},    // 'YYYY-MM' -> { goals, memo }
    habits: ['早起', '運動', '閱讀'].map(name => ({ id: uid(), name })),
    habitLog: {},  // 'YYYY-MM-DD' -> [habitId]
    subjects,
    tasks: [],     // { id, title, type, subject, due, note, done }
    settings: { weekStart: 1, tipClosed: false },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw), d = defaults();
      delete p.timetable; delete p.periods; // 舊版課表資料
      return { ...d, ...p, settings: { ...d.settings, ...(p.settings || {}) } };
    }
  } catch (e) { console.warn(e); }
  return defaults();
}

let data = load();
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(KEY, JSON.stringify(data)); }
  catch (e) { toast('儲存失敗：空間不足'); }
}
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 400); }

const emptyDay = () => ({ todos: [], events: [], note: '', mood: null });
const peekDay = s => data.days[s] || emptyDay();
const day = s => data.days[s] || (data.days[s] = emptyDay());
const weekStart = s => { const d = parse(s); d.setDate(d.getDate() - (d.getDay() - data.settings.weekStart + 7) % 7); return ymd(d); };
const peekWeek = k => data.weeks[k] || { goals: [], memo: '' };
const week = k => data.weeks[k] || (data.weeks[k] = { goals: [], memo: '' });
const monthKey = s => s.slice(0, 7);
const peekMonth = k => data.months[k] || { goals: [], memo: '' };
const month = k => data.months[k] || (data.months[k] = { goals: [], memo: '' });
const subj = id => data.subjects.find(x => x.id === id);
const tasksOn = s => data.tasks.filter(t => t.due === s);
const sortEv = arr => [...arr].sort((a, b) => (a.time || '').localeCompare(b.time || ''));

function isoWeek(s) {
  const d = parse(s); d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const w1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - w1) / 864e5 - 3 + (w1.getDay() + 6) % 7) / 7);
}

function listOf(kind) {
  if (kind === 'todo') return day(cur).todos;
  if (kind === 'wgoal') return week(weekStart(cur)).goals;
  if (kind === 'mgoal') return month(monthKey(cur)).goals;
  return [];
}

/* ---------- 狀態 ---------- */
let cur = today();
let lastToday = today();
let view = (() => { try { return localStorage.getItem(KEY + ':tab') || 'day'; } catch { return 'day'; } })();
let taskFilter = 'open';

/* ---------- 共用片段 ---------- */
const sec = (tc, en, body, act = '') =>
  `<section class="sec"><div class="sec-h"><h3>${tc}</h3>${act ? `<div class="act">${act}</div>` : ''}</div>${body}</section>`;
const addBtn = (a, extra = '') => `<button class="add-btn" data-a="${a}" ${extra} aria-label="新增">${I.plus}</button>`;

function checkList(kind, items, ph) {
  return `<ul>${items.map(t => `
    <li class="todo ${t.done ? 'done' : ''}">
      <button class="chk ${t.done ? 'on' : ''}" data-a="item-toggle" data-k="${kind}" data-id="${t.id}" aria-label="完成">${I.check}</button>
      <span class="todo-t" data-a="item-edit" data-k="${kind}" data-id="${t.id}"><span class="st">${esc(t.text)}</span></span>
    </li>`).join('')}</ul>
    <label class="add-wrap">${I.plus}<input class="add-line" data-add="${kind}" placeholder="${ph}" enterkeyhint="done" autocomplete="off"></label>`;
}

function dueLabel(t) {
  const dd = diffDays(today(), t.due);
  if (t.done) return '完成';
  if (dd < 0) return `逾期 ${-dd} 天`;
  if (dd === 0) return '今天';
  if (dd === 1) return '明天';
  return `D-${dd}`;
}

function taskRow(t, showDate = true) {
  const s = subj(t.subject);
  const late = !t.done && t.due < today();
  return `<li class="task ${t.done ? 'done' : ''} ${late ? 'late' : ''}">
    <button class="chk ${t.done ? 'on' : ''}" data-a="task-toggle" data-id="${t.id}" aria-label="完成">${I.check}</button>
    <div class="task-main" data-a="task-edit" data-id="${t.id}">
      <div class="task-t"><span class="st">${esc(t.title)}</span></div>
      <div class="task-m">
        <span class="type t-${TASK_TYPES.indexOf(t.type)}">${esc(t.type)}</span>
        ${s ? `<span class="subj" style="--c:${s.color}">${esc(s.name)}</span>` : ''}
        ${showDate ? `<span class="due">${md(t.due)}（${WD_TC[parse(t.due).getDay()]}）</span>` : ''}
      </div>
    </div>
    ${showDate ? `<span class="dchip">${dueLabel(t)}</span>` : ''}
  </li>`;
}

function hasContent(s) {
  const D = data.days[s];
  return !!(D && (D.todos.length || D.events.length || D.note)) || data.tasks.some(t => t.due === s);
}

/* =========================================================
   每日
   ========================================================= */
function renderDay() {
  const s = cur, d = parse(s), D = peekDay(s), T = today(), isToday = s === T;
  const ws = weekStart(s);

  let strip = '';
  for (let i = 0; i < 7; i++) {
    const x = addDays(ws, i), xd = parse(x);
    strip += `<button class="strip-d ${x === s ? 'on' : ''} ${x === T ? 'today' : ''}" data-a="goto" data-d="${x}">
      <span class="sw">${WD_TC[xd.getDay()]}</span><span class="sn">${xd.getDate()}</span><i class="${hasContent(x) ? 'dot' : ''}"></i></button>`;
  }

  const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone = navigator.standalone || matchMedia('(display-mode: standalone)').matches;
  const tip = (isIOS && !standalone && !data.settings.tipClosed)
    ? `<div class="tip"><div>在 Safari 點 <b>分享</b> → <b>加入主畫面</b>，就能像 App 一樣全螢幕使用。</div><button class="x" data-a="close-tip" aria-label="關閉">×</button></div>` : '';

  // 截止與考試
  const due = data.tasks.filter(t => t.due === s || (isToday && !t.done && t.due < s))
    .sort((a, b) => a.due.localeCompare(b.due));
  const dueHtml = due.length ? sec('截止與考試', 'Due', `<ul>${due.map(t => taskRow(t, t.due !== s)).join('')}</ul>`) : '';

  // 行程
  const evs = sortEv(D.events);
  const evHtml = sec('行程', 'Schedule',
    evs.length ? `<ul class="timeline">${evs.map(e => `
      <li data-a="ev-edit" data-id="${e.id}">
        <span class="ev-time ${e.time ? '' : 'allday'}">${e.time ? `${e.time}${e.end ? `<small>${e.end}</small>` : ''}` : '整天'}</span>
        <span class="ev-line"></span>
        <span class="ev-t">${esc(e.title)}${e.place ? `<span class="ev-sub">${esc(e.place)}</span>` : ''}</span>
      </li>`).join('')}</ul>`
      : `<button class="empty-add" data-a="ev-new">${I.plus}新增行程</button>`,
    addBtn('ev-new'));

  // 待辦
  const done = D.todos.filter(t => t.done).length;
  const todoHtml = sec('待辦', 'To do', checkList('todo', D.todos, '新增待辦…'),
    D.todos.length ? `<span class="count">${done}/${D.todos.length}</span>` : '');

  // 習慣
  const log = data.habitLog[s] || [];
  const habHtml = data.habits.length ? sec('習慣', 'Habits',
    `<div class="habits">${data.habits.map(h => `<button class="habit ${log.includes(h.id) ? 'on' : ''}" data-a="habit" data-h="${h.id}" data-d="${s}"><i></i>${esc(h.name)}</button>`).join('')}</div>`) : '';

  // 心情 + 日記
  const noteHtml = sec('日記', 'Diary',
    `<div class="moods">${MOODS.map(m => `<button class="mood-b ${D.mood === m.k ? 'on' : ''}" data-a="mood" data-k="${m.k}" aria-label="${m.l}">${face(m)}</button>`).join('')}</div>
     <textarea class="lined" data-bind="note" rows="4" placeholder="今天過得如何？記下一件小事吧。">${esc(D.note)}</textarea>`);

  return `<div>
    <header class="hd">
      <div class="hd-row">
        <span class="eyebrow">${d.getFullYear()} 年 ${d.getMonth() + 1} 月</span>
        <div class="hd-act">${isToday ? '' : '<button class="pill" data-a="today">回到今天</button>'}<button class="icon-btn" data-a="settings" aria-label="設定">${I.gear}</button></div>
      </div>
      <div class="day-title">
        <span class="big-num">${d.getDate()}</span>
        <div class="day-meta">
          <span class="day-wd">星期${WD_TC[d.getDay()]}${isToday ? '<span class="stamp">今天</span>' : ''}</span>
        </div>
      </div>
      <div class="strip">
        <button class="strip-nav" data-a="step" data-n="-7" aria-label="上一週">${I.left}</button>${strip}<button class="strip-nav" data-a="step" data-n="7" aria-label="下一週">${I.right}</button>
      </div>
    </header>
    ${tip}${dueHtml}${todoHtml}${evHtml}${habHtml}${noteHtml}
  </div>`;
}

/* =========================================================
   週計畫
   ========================================================= */
function renderWeek() {
  const ws = weekStart(cur), we = addDays(ws, 6), a = parse(ws), b = parse(we), W = peekWeek(ws), T = today();
  const inWeek = T >= ws && T <= we;
  const title = `${a.getMonth() + 1}月${a.getDate()}日 – ${a.getMonth() !== b.getMonth() ? `${b.getMonth() + 1}月` : ''}${b.getDate()}日`;
  const days = [...Array(7)].map((_, i) => addDays(ws, i));

  // 習慣追蹤表
  const hab = data.habits.length ? sec('習慣追蹤', 'Habit tracker', `
    <div class="hgrid">
      <span></span>${days.map(x => { const xd = parse(x); return `<span class="hh ${x === T ? 'today' : ''}">${WD_TC[xd.getDay()]}<b>${xd.getDate()}</b></span>`; }).join('')}
      ${data.habits.map(h => `<span class="hn">${esc(h.name)}</span>${days.map(x =>
        `<button class="hc ${(data.habitLog[x] || []).includes(h.id) ? 'on' : ''}" data-a="habit" data-h="${h.id}" data-d="${x}" aria-label="${esc(h.name)} ${md(x)}">${I.check}</button>`).join('')}`).join('')}
    </div>`, `<button class="pill" data-a="settings" data-focus="habits" style="padding:4px 10px;font-size:12px">編輯</button>`) : '';

  const rows = days.map(x => {
    const xd = parse(x), D = peekDay(x), wd = xd.getDay();
    const items = [];
    sortEv(D.events).slice(0, 4).forEach(e => items.push(`<div class="wk-it"><span class="tm">${e.time || '整天'}</span><span class="tx">${esc(e.title)}</span></div>`));
    tasksOn(x).forEach(t => { const s = subj(t.subject); items.push(`<div class="wk-it tk ${t.type === '考試' ? 'exam' : ''}" style="--c:${s ? s.color : 'var(--ink-3)'}"><span class="tx">${esc(t.type)}・${esc(t.title)}${t.done ? '（完成）' : ''}</span></div>`); });
    if (D.todos.length) {
      const dn = D.todos.filter(t => t.done).length;
      items.push(`<div class="wk-prog"><span>待辦 ${dn}/${D.todos.length}</span><span class="bar"><i style="width:${dn / D.todos.length * 100}%"></i></span></div>`);
    }
    return `<button class="wk-day ${x === T ? 'today' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}" data-a="open-day" data-d="${x}">
      <div class="wk-date"><span class="wk-n">${xd.getDate()}</span><span class="wk-w">${x === T ? '今天' : '週' + WD_TC[wd]}</span></div>
      <div class="wk-body">${items.join('') || '<span class="muted">—</span>'}</div>
    </button>`;
  }).join('');

  return `<div>
    <header class="hd">
      <div class="hd-row">
        <span class="eyebrow">${a.getFullYear()} 年・第 ${isoWeek(ws)} 週</span>
        <div class="hd-act">${inWeek ? '' : '<button class="pill" data-a="today">本週</button>'}<button class="icon-btn" data-a="settings" aria-label="設定">${I.gear}</button></div>
      </div>
      <div class="title-row">
        <h1 class="title">${title}</h1>
        <div class="navs"><button class="nav-btn" data-a="step" data-n="-7" aria-label="上一週">${I.left}</button><button class="nav-btn" data-a="step" data-n="7" aria-label="下一週">${I.right}</button></div>
      </div>
    </header>
    ${sec('本週目標', 'Goals', checkList('wgoal', W.goals, '這週想完成什麼？'))}
    ${sec('一週行程', 'This week', rows)}
    ${hab}
    ${sec('週記', 'Memo', `<textarea class="lined" data-bind="wmemo" rows="4" placeholder="本週回顧、下週要調整的地方…">${esc(W.memo)}</textarea>`)}
  </div>`;
}

/* =========================================================
   月計畫
   ========================================================= */
function renderMonth() {
  const d = parse(cur), y = d.getFullYear(), m = d.getMonth(), T = today();
  const first = ymd(new Date(y, m, 1)), dim = new Date(y, m + 1, 0).getDate();
  const ws = data.settings.weekStart;
  const offset = (new Date(y, m, 1).getDay() - ws + 7) % 7;
  const rows = Math.ceil((offset + dim) / 7);
  const start = addDays(first, -offset);
  const M = peekMonth(monthKey(cur));

  let cal = '';
  for (let i = 0; i < 7; i++) { const w = (ws + i) % 7; cal += `<div class="wh ${w === 0 ? 'sun' : w === 6 ? 'sat' : ''}">${WD_TC[w]}</div>`; }
  for (let i = 0; i < rows * 7; i++) {
    const x = addDays(start, i), xd = parse(x), wd = xd.getDay(), D = data.days[x];
    const dots = [];
    if (D && D.events.length) dots.push('<i></i>');
    tasksOn(x).filter(t => !t.done).slice(0, 3).forEach(t => {
      if (t.type === '考試') dots.push('<i class="sq"></i>');
      else { const s = subj(t.subject); dots.push(`<i style="--c:${s ? s.color : 'var(--ink-3)'}"></i>`); }
    });
    cal += `<button class="mc ${xd.getMonth() !== m ? 'out' : ''} ${x === cur ? 'sel' : ''} ${x === T ? 'today' : ''} ${wd === 0 ? 'sun' : wd === 6 ? 'sat' : ''}" data-a="msel" data-d="${x}">
      <span class="mc-n">${xd.getDate()}</span><span class="mc-dots">${dots.slice(0, 4).join('')}</span></button>`;
  }

  // 選取日預覽
  const sd = parse(cur), SD = peekDay(cur);
  const ag = [];
  sortEv(SD.events).forEach(e => ag.push(`<div class="wk-it"><span class="tm">${e.time || '整天'}</span><span class="tx">${esc(e.title)}</span></div>`));
  tasksOn(cur).forEach(t => { const s = subj(t.subject); ag.push(`<div class="wk-it tk ${t.type === '考試' ? 'exam' : ''}" style="--c:${s ? s.color : 'var(--ink-3)'}"><span class="tx">${esc(t.type)}・${esc(t.title)}</span></div>`); });
  if (SD.todos.length) ag.push(`<div class="wk-prog"><span>待辦 ${SD.todos.filter(t => t.done).length}/${SD.todos.length}</span></div>`);

  return `<div>
    <header class="hd">
      <div class="hd-row">
        <span class="eyebrow">${y} 年</span>
        <div class="hd-act">${monthKey(T) === monthKey(cur) ? '' : '<button class="pill" data-a="today">本月</button>'}<button class="icon-btn" data-a="settings" aria-label="設定">${I.gear}</button></div>
      </div>
      <div class="title-row">
        <h1 class="title">${m + 1} 月</h1>
        <div class="navs"><button class="nav-btn" data-a="mstep" data-n="-1" aria-label="上個月">${I.left}</button><button class="nav-btn" data-a="mstep" data-n="1" aria-label="下個月">${I.right}</button></div>
      </div>
    </header>
    <section class="sec">
      <div class="cal">${cal}</div>
      <div class="legend"><span><i></i>行程</span><span><i class="cc"></i>作業・報告</span><span><i class="sq"></i>考試</span></div>
    </section>
    <section class="sec">
      <div class="sec-h"><div class="agenda-h"><span class="d">${sd.getMonth() + 1}/${sd.getDate()}</span><h3>星期${WD_TC[sd.getDay()]}</h3></div><div class="act">${addBtn('ev-new')}</div></div>
      ${ag.length ? `<div class="wk-body" style="gap:6px">${ag.join('')}</div>` : `<div class="ill">${ILL.book}<span>這天還沒有安排</span></div>`}
      <button class="open-day" data-a="open-day" data-d="${cur}">翻到這一天 ${I.arrow}</button>
    </section>
    ${sec('本月目標', 'Goals', checkList('mgoal', M.goals, '這個月的目標…'))}
    ${sec('月記', 'Memo', `<textarea class="lined" data-bind="mmemo" rows="4" placeholder="重要日子、想做的事、月底回顧…">${esc(M.memo)}</textarea>`)}
  </div>`;
}

/* =========================================================
   作業與考試
   ========================================================= */
function renderStudy() {
  const n = data.tasks.filter(t => !t.done).length;
  return `<div>
    <header class="hd">
      <div class="hd-row">
        <span class="eyebrow">${n ? `還有 ${n} 項未完成` : '全部完成'}</span>
        <div class="hd-act"><button class="icon-btn" data-a="settings" aria-label="設定">${I.gear}</button></div>
      </div>
      <div class="title-row">
        <h1 class="title">作業與考試</h1>
        <button class="btn-main" data-a="task-new">${I.plus}新增</button>
      </div>
    </header>
    ${renderTasks()}
    ${sec('科目', '', `<div class="chips">${data.subjects.map(s => `<button class="chip" style="--c:${s.color}" data-a="subj-edit" data-id="${s.id}">${esc(s.name)}</button>`).join('')}
      <button class="chip add" data-a="subj-new">${I.plus}新增</button></div>`)}
  </div>`;
}

function renderTasks() {
  const T = today(), wEnd = addDays(T, 7);
  const list = data.tasks.filter(t => !t.done).sort((a, b) => a.due.localeCompare(b.due));
  const doneList = data.tasks.filter(t => t.done).sort((a, b) => b.due.localeCompare(a.due));
  let body = '';
  if (!list.length) {
    body = `<div class="ill">${ILL.plane}<span>${data.tasks.length ? '全部完成了，好好休息！' : '還沒有作業或考試'}</span><small>按右上角「新增」加入</small></div>`;
  } else {
    const groups = [
      ['已逾期', t => t.due < T, 'late'],
      ['今天', t => t.due === T],
      ['明天', t => t.due === addDays(T, 1)],
      ['七天內', t => t.due > addDays(T, 1) && t.due <= wEnd],
      ['之後', t => t.due > wEnd],
    ];
    groups.forEach(([name, fn, cls]) => {
      const g = list.filter(fn);
      if (g.length) body += `<div class="grp-h ${cls || ''}">${name}</div><ul>${g.map(t => taskRow(t)).join('')}</ul>`;
    });
  }
  const next = data.tasks.filter(t => !t.done && t.type === '考試' && t.due >= T).sort((a, b) => a.due.localeCompare(b.due))[0];
  const nd = next ? diffDays(T, next.due) : 0;
  const showDone = taskFilter === 'done';
  return `
    ${next ? `<div class="countdown"><b>${nd || '今天'}</b><div><small>${nd ? '天後考試' : '考試'}</small><span>${esc(next.title)}</span></div></div>` : ''}
    <section class="sec">${body}</section>
    ${doneList.length ? `<button class="toggle-done" data-a="task-filter" data-v="${showDone ? 'open' : 'done'}">${showDone ? '隱藏' : '顯示'}已完成（${doneList.length}）</button>` : ''}
    ${showDone && doneList.length ? `<section class="sec">${`<ul>${doneList.map(t => taskRow(t)).join('')}</ul>`}</section>` : ''}`;
}

/* =========================================================
   Render
   ========================================================= */
const VIEWS = { day: renderDay, week: renderWeek, month: renderMonth, study: renderStudy };

function render(anim) {
  const v = $('#view');
  v.classList.remove('slide-next', 'slide-prev', 'fade');
  v.innerHTML = VIEWS[view]();
  if (anim) { void v.offsetWidth; v.classList.add(anim); }
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.tab === view));
  $$('textarea.lined', v).forEach(autosize);
}
function commit(anim) { save(); render(anim); }
function autosize(t) { t.style.height = 'auto'; t.style.height = Math.max(t.scrollHeight, 136) + 'px'; }

/* ---------- Sheet ---------- */
let sheetEl = null;
function sheet({ title, body, save: onSave, del, saveLabel = '完成', onClick, onMount, cancel = '取消' }) {
  closeSheet(true);
  const w = document.createElement('div');
  w.className = 'sheet-wrap';
  w.innerHTML = `<div class="sheet-bg"></div>
    <div class="sheet" role="dialog" aria-label="${esc(title)}">
      <div class="grab"></div>
      <div class="sheet-h"><button class="sh-btn" data-s="cancel">${cancel}</button><h2>${esc(title)}</h2>${onSave ? `<button class="sh-btn strong" data-s="save">${saveLabel}</button>` : '<span></span>'}</div>
      <div class="sheet-b">${body}</div>
      ${del ? `<button class="danger" data-s="del">${del.label || '刪除'}</button>` : ''}
    </div>`;
  document.body.appendChild(w);
  sheetEl = w;
  requestAnimationFrame(() => requestAnimationFrame(() => w.classList.add('open')));

  w.addEventListener('click', e => {
    if (e.target.classList.contains('sheet-bg')) return closeSheet();
    const pk = e.target.closest('.pick button, .palette button');
    if (pk) { $$('button', pk.parentElement).forEach(b => b.classList.toggle('on', b === pk)); }
    if (onClick && onClick(e, w) === true) return;
    const b = e.target.closest('[data-s]');
    if (!b) return;
    const s = b.dataset.s;
    if (s === 'cancel') closeSheet();
    else if (s === 'save') { if (onSave(w) !== false) { closeSheet(); commit(); } }
    else if (s === 'del') { if (!del.confirm || confirm(del.confirm)) { del.fn(w); closeSheet(); commit(); } }
  });
  // 下滑關閉
  // 在表單頂端往下拉（任何位置皆可）就能關閉，表單跟著手指移動
  const sh = $('.sheet', w), bg = $('.sheet-bg', w);
  let y0 = null, dy = 0, t0 = 0, drag = false;
  sh.addEventListener('touchstart', e => {
    drag = false; dy = 0; t0 = Date.now();
    y0 = sh.scrollTop <= 0 && !e.target.closest('textarea, .palette') ? e.touches[0].clientY : null;
  }, { passive: true });
  sh.addEventListener('touchmove', e => {
    if (y0 == null) return;
    const d = e.touches[0].clientY - y0;
    if (!drag) {
      if (d < -4) { y0 = null; return; }   // 往上滑＝捲動內容
      if (d < 8) return;
      drag = true; y0 += 8;
      if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur();
    }
    dy = Math.max(0, e.touches[0].clientY - y0);
    sh.style.transition = 'none'; bg.style.transition = 'none';
    sh.style.transform = `translateY(${dy}px)`;
    bg.style.opacity = String(Math.max(0, 1 - dy / 450));
  }, { passive: true });
  const release = () => {
    if (!drag) { y0 = null; return; }
    drag = false; y0 = null;
    sh.style.transition = ''; bg.style.transition = '';
    const flick = dy > 40 && Date.now() - t0 < 300;
    sh.style.transform = ''; bg.style.opacity = '';
    if (dy > 110 || flick) closeSheet();
  };
  sh.addEventListener('touchend', release);
  sh.addEventListener('touchcancel', release);

  if (onMount) onMount(w);
  return w;
}
function closeSheet(instant) {
  const w = sheetEl; if (!w) return;
  sheetEl = null;
  if (document.activeElement) document.activeElement.blur();
  if (instant) return w.remove();
  w.classList.remove('open');
  setTimeout(() => w.remove(), 320);
}
const vals = w => Object.fromEntries($$('[name]', w).map(i => [i.name, i.value]));
const picked = (w, name) => { const b = $(`.pick[data-name="${name}"] .on, .palette[data-name="${name}"] .on`, w); return b ? b.dataset.v : null; };

let toastT;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1800);
}

/* ---------- 各種編輯表單 ---------- */
function itemSheet(kind, id) {
  const list = listOf(kind), it = list.find(x => x.id === id);
  if (!it) return;
  const isTodo = kind === 'todo';
  sheet({
    title: isTodo ? '編輯待辦' : '編輯目標',
    body: `<label class="field"><span>內容</span><input name="text" value="${esc(it.text)}" autocomplete="off"></label>
      ${isTodo ? `<div class="btn-row"><button data-s2="tomorrow">${I.arrow}移到明天</button></div>` : ''}`,
    save: w => { const v = vals(w).text.trim(); if (!v) { toast('內容不能空白'); return false; } it.text = v; },
    del: { fn: () => list.splice(list.indexOf(it), 1) },
    onClick: (e) => {
      if (e.target.closest('[data-s2="tomorrow"]')) {
        list.splice(list.indexOf(it), 1);
        day(addDays(cur, 1)).todos.push({ ...it, done: false });
        closeSheet(); commit(); toast('已移到明天');
        return true;
      }
    },
  });
}

function eventSheet(id) {
  const date = cur, D = day(date);
  const e = id ? D.events.find(x => x.id === id) : null;
  const v = e || { title: '', time: '', end: '', place: '' };
  sheet({
    title: e ? '編輯行程' : '新增行程',
    body: `<label class="field"><span>標題</span><input name="title" value="${esc(v.title)}" placeholder="例如：社團、補習、讀書會" autocomplete="off"></label>
      <label class="field"><span>日期</span><input type="date" name="date" value="${date}"></label>
      <div class="row2">
        <label class="field"><span>開始（可留空＝整天）</span><input type="time" name="time" value="${v.time}"></label>
        <label class="field"><span>結束</span><input type="time" name="end" value="${v.end || ''}"></label>
      </div>
      <label class="field"><span>地點 / 備註</span><input name="place" value="${esc(v.place || '')}" autocomplete="off"></label>`,
    save: w => {
      const f = vals(w);
      if (!f.title.trim()) { toast('請輸入標題'); return false; }
      if (e) D.events.splice(D.events.indexOf(e), 1);
      day(f.date || date).events.push({ id: e ? e.id : uid(), title: f.title.trim(), time: f.time, end: f.time ? f.end : '', place: f.place.trim() });
      if (f.date && f.date !== date) toast(`已存到 ${md(f.date)}`);
    },
    del: e && { fn: () => D.events.splice(D.events.indexOf(e), 1) },
  });
}

function taskSheet(id) {
  const t = id ? data.tasks.find(x => x.id === id) : null;
  const v = t || { title: '', type: '作業', subject: '', due: cur > today() ? cur : addDays(today(), 1), note: '' };
  sheet({
    title: t ? '編輯' : '新增作業 / 考試',
    body: `<label class="field"><span>名稱</span><input name="title" value="${esc(v.title)}" placeholder="例如：英文第三課習作" autocomplete="off"></label>
      <div class="field"><span>類型</span><div class="pick" data-name="type">${TASK_TYPES.map(x => `<button data-v="${x}" class="${v.type === x ? 'on' : ''}">${x}</button>`).join('')}</div></div>
      <div class="field"><span>日期</span>
        <div class="quick">${[['今天', 0], ['明天', 1], ['後天', 2], ['下週', 7]].map(([l, n]) => `<button type="button" data-q="${addDays(today(), n)}">${l}</button>`).join('')}</div>
        <input type="date" name="due" value="${v.due}"></div>
      <div class="field"><span>科目（選填）</span><div class="pick" data-name="subject">
        <button data-v="" class="${!v.subject ? 'on' : ''}">無</button>
        ${data.subjects.map(s => `<button class="sc ${v.subject === s.id ? 'on' : ''}" style="--c:${s.color}" data-v="${s.id}">${esc(s.name)}</button>`).join('')}
      </div></div>
      <label class="field"><span>備註（選填）</span><textarea name="note" rows="2" placeholder="範圍、頁數…">${esc(v.note)}</textarea></label>`,
    onClick: (e, w) => { const q = e.target.closest('[data-q]'); if (q) { $('[name=due]', w).value = q.dataset.q; return true; } },
    save: w => {
      const f = vals(w);
      if (!f.title.trim()) { toast('請輸入名稱'); return false; }
      if (!f.due) { toast('請選擇日期'); return false; }
      const o = { title: f.title.trim(), type: picked(w, 'type') || '作業', subject: picked(w, 'subject') || '', due: f.due, note: f.note.trim() };
      if (t) Object.assign(t, o); else data.tasks.push({ id: uid(), done: false, ...o });
    },
    del: t && { fn: () => data.tasks.splice(data.tasks.indexOf(t), 1) },
  });
}

function subjectSheet(id) {
  const s = id ? subj(id) : null;
  const v = s || { name: '', color: PALETTE[data.subjects.length % PALETTE.length] };
  sheet({
    title: s ? '編輯科目' : '新增科目',
    body: `<label class="field"><span>科目名稱</span><input name="name" value="${esc(v.name)}" placeholder="例如：物理" autocomplete="off"></label>
      <div class="field"><span>顏色</span><div class="palette" data-name="color">${PALETTE.map(c => `<button data-v="${c}" style="--c:${c}" class="${c === v.color ? 'on' : ''}" aria-label="${c}"></button>`).join('')}</div></div>`,
    save: w => {
      const name = vals(w).name.trim();
      if (!name) { toast('請輸入科目名稱'); return false; }
      const color = picked(w, 'color') || v.color;
      if (s) Object.assign(s, { name, color });
      else data.subjects.push({ id: uid(), name, color });
    },
    del: s && {
      confirm: `刪除科目「${s.name}」？`,
      fn: () => {
        data.subjects.splice(data.subjects.indexOf(s), 1);
        data.tasks.forEach(t => { if (t.subject === s.id) t.subject = ''; });
      },
    },
  });
}

/* ---------- 設定 ---------- */
function settingsBody() {
  const st = data.settings;
  return `
  <div class="set-group"><h4>一般</h4><div class="set-card">
    <div class="set-row"><span>每週開始於</span><div class="seg sm pick" data-name="ws">
      <button data-v="1" class="${st.weekStart === 1 ? 'on' : ''}">週一</button><button data-v="0" class="${st.weekStart === 0 ? 'on' : ''}">週日</button></div></div>
  </div></div>

  <div class="set-group" id="set-habits"><h4>習慣追蹤項目</h4><div class="set-card">
    ${data.habits.map(h => `<div class="hab-row"><span>${esc(h.name)}</span><button class="del-x" data-set="hab-del" data-id="${h.id}" aria-label="刪除">${I.x}</button></div>`).join('')}
    <label class="add-wrap">${I.plus}<input class="add-line" data-set-add="habit" placeholder="新增習慣，例如：喝水 2000cc" enterkeyhint="done" autocomplete="off"></label>
  </div></div>

  <div class="set-group"><h4>資料備份</h4>
    <p class="hint">所有資料只存在這支手機的瀏覽器裡，不會上傳。換手機或清除 Safari 資料前，請先匯出備份。</p>
    <div class="btn-row"><button data-set="export">${I.down}匯出備份</button><button data-set="import">${I.up}匯入備份</button></div>
    <button class="danger" data-set="reset">清除所有資料</button>
  </div>
  <p class="foot">日程本+ · v1.0</p>`;
}

function settingsSheet(focus) {
  const rerender = w => { $('.sheet-b', w).innerHTML = settingsBody(); };
  sheet({
    title: '設定', cancel: '', save: () => { }, saveLabel: '完成',
    body: settingsBody(),
    onMount: w => {
      if (focus === 'habits') setTimeout(() => $('#set-habits', w)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 360);
      w.addEventListener('keydown', e => {
        const inp = e.target.closest('[data-set-add="habit"]');
        if (inp && e.key === 'Enter') {
          e.preventDefault();
          const v = inp.value.trim(); if (!v) return;
          data.habits.push({ id: uid(), name: v }); save(); rerender(w);
          $('[data-set-add="habit"]', w).focus();
        }
      });
    },
    onClick: (e, w) => {
      const ws = e.target.closest('.pick[data-name="ws"] button');
      if (ws) { data.settings.weekStart = +ws.dataset.v; save(); return true; }
      const b = e.target.closest('[data-set]'); if (!b) return;
      const a = b.dataset.set;
      if (a === 'hab-del') {
        const h = data.habits.find(x => x.id === b.dataset.id);
        if (h && confirm(`刪除習慣「${h.name}」？`)) { data.habits.splice(data.habits.indexOf(h), 1); save(); rerender(w); }
      }
      else if (a === 'export') exportData();
      else if (a === 'import') $('#importFile').click();
      else if (a === 'reset') {
        if (confirm('確定清除所有資料？此動作無法復原。') && confirm('真的要清除嗎？建議先匯出備份。')) {
          data = defaults(); save(); closeSheet(); render('fade'); toast('已清除');
        }
      }
      return true;
    },
  });
}

async function exportData() {
  save();
  const name = `日程本備份-${today()}.json`;
  const file = new File([JSON.stringify(data)], name, { type: 'application/json' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; }
    catch (e) { if (e.name === 'AbortError') return; }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

$('#importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const p = JSON.parse(await f.text());
    if (!p || typeof p !== 'object' || !p.days || !Array.isArray(p.tasks)) throw new Error('格式不符');
    if (!confirm('匯入會覆蓋目前所有資料，確定嗎？')) return;
    const d = defaults();
    data = { ...d, ...p, settings: { ...d.settings, ...(p.settings || {}) } };
    save(); closeSheet(); render('fade'); toast('匯入完成');
  } catch (err) { alert('無法匯入：檔案不是有效的日程本備份。'); }
});

/* =========================================================
   互動
   ========================================================= */
function step(n) {
  if (view === 'day') cur = addDays(cur, n);
  else if (view === 'week') cur = addDays(cur, n * 7);
  else if (view === 'month') { const d = parse(cur); cur = ymd(new Date(d.getFullYear(), d.getMonth() + n, 1)); }
  else return;
  render(n > 0 ? 'slide-next' : 'slide-prev');
}

const ACTIONS = {
  goto: b => { const old = cur; cur = b.dataset.d; render(cur > old ? 'slide-next' : cur < old ? 'slide-prev' : null); },
  step: b => { const n = +b.dataset.n; cur = addDays(cur, n); render(n > 0 ? 'slide-next' : 'slide-prev'); },
  mstep: b => step(+b.dataset.n),
  today: () => { const old = cur; cur = today(); render(cur > old ? 'slide-next' : 'slide-prev'); },
  settings: b => settingsSheet(b.dataset.focus),
  'close-tip': () => { data.settings.tipClosed = true; commit(); },
  'item-toggle': b => {
    const k = b.dataset.k, list = listOf(k), it = list.find(x => x.id === b.dataset.id);
    if (!it) return;
    it.done = !it.done; save(); markDone(b, it.done);
    if (it.done && list.length > 1 && list.every(x => x.done)) celebrate(k === 'todo' ? '今日完成' : '目標達成');
  },
  'item-edit': b => itemSheet(b.dataset.k, b.dataset.id),
  'ev-new': () => eventSheet(null),
  'ev-edit': b => eventSheet(b.dataset.id),
  'task-new': () => taskSheet(null),
  'task-edit': b => taskSheet(b.dataset.id),
  'task-toggle': b => {
    const t = data.tasks.find(x => x.id === b.dataset.id);
    if (!t) return;
    t.done = !t.done; save(); markDone(b, t.done);
    if (t.done && data.tasks.every(x => x.done)) celebrate('全部完成');
  },
  'task-filter': b => { taskFilter = b.dataset.v; render(); },
  mood: b => {
    const D = day(cur), k = +b.dataset.k; D.mood = D.mood === k ? null : k; save(); haptic();
    $$('.mood-b').forEach(x => x.classList.toggle('on', +x.dataset.k === D.mood));
  },
  habit: b => {
    const s = b.dataset.d, h = b.dataset.h, log = data.habitLog[s] || (data.habitLog[s] = []);
    const i = log.indexOf(h); if (i >= 0) log.splice(i, 1); else log.push(h);
    if (!log.length) delete data.habitLog[s];
    save(); haptic();
    b.classList.toggle('on', i < 0); pop(b);
  },
  msel: b => { const x = b.dataset.d; if (monthKey(x) !== monthKey(cur)) { const n = x > cur ? 1 : -1; cur = x; render(n > 0 ? 'slide-next' : 'slide-prev'); } else { cur = x; render(); } },
  'open-day': b => { cur = b.dataset.d; setView('day'); },
  'subj-edit': b => subjectSheet(b.dataset.id),
  'subj-new': () => subjectSheet(null),
};

// 每個分頁記住自己的捲動位置
const scrollPos = {};
function setView(v) {
  const el = $('#view');
  scrollPos[view] = el.scrollTop;
  view = v;
  try { localStorage.setItem(KEY + ':tab', v); } catch { }
  render('fade');
  el.scrollTop = scrollPos[v] || 0;
}

/* ---------- 回饋：觸感、打勾動畫、完成印章 ---------- */
// iOS 18 起，點擊 <input switch> 的 label 會產生系統觸感；其他裝置用 vibrate
const hapticEl = (() => {
  const l = document.createElement('label');
  l.setAttribute('aria-hidden', 'true');
  l.style.cssText = 'position:fixed;left:-200px;top:0;opacity:0;pointer-events:none';
  l.innerHTML = '<input type="checkbox" switch tabindex="-1">';
  document.body.appendChild(l);
  return l;
})();
function haptic() {
  if (navigator.vibrate) { navigator.vibrate(10); return; }
  try { hapticEl.click(); } catch { }
}
function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
function markDone(chk, on) {
  chk.classList.toggle('on', on);
  const li = chk.closest('li'); if (li) li.classList.toggle('done', on);
  if (on) { pop(chk); haptic(); }
  const sc = chk.closest('.sec'), c = sc && $('.count', sc);
  if (c) c.textContent = `${$$('.chk.on', sc).length}/${$$('.chk', sc).length}`;
}
function celebrate(text) {
  $('.stamp-pop')?.remove();
  const s = document.createElement('div');
  s.className = 'stamp-pop';
  s.innerHTML = `<span>${esc(text)}</span>`;
  document.body.appendChild(s);
  setTimeout(() => s.remove(), 1700);
}

document.addEventListener('click', e => {
  if (e.target.closest('.sheet-wrap')) return;
  const tab = e.target.closest('[data-tab]');
  if (tab) { if (tab.dataset.tab === view) { $('#view').scrollTo({ top: 0, behavior: 'smooth' }); } else setView(tab.dataset.tab); return; }
  const b = e.target.closest('[data-a]');
  if (b && ACTIONS[b.dataset.a]) ACTIONS[b.dataset.a](b);
});

// 快速新增（Enter）
function addFromInput(inp) {
  const v = inp.value.trim(); if (!v) return false;
  listOf(inp.dataset.add).push({ id: uid(), text: v, done: false });
  inp.value = '';
  return true;
}
document.addEventListener('keydown', e => {
  const inp = e.target.closest && e.target.closest('[data-add]');
  if (!inp || e.key !== 'Enter' || e.isComposing) return;
  e.preventDefault();
  const kind = inp.dataset.add;
  if (addFromInput(inp)) { commit(); const n = $(`[data-add="${kind}"]`); if (n) n.focus(); }
});
document.addEventListener('focusout', e => {
  const inp = e.target.closest && e.target.closest('[data-add]');
  if (inp && addFromInput(inp)) {
    save();
    setTimeout(() => { const a = document.activeElement; if (!a || !a.matches('input, textarea')) render(); }, 180);
  }
});

// 文字區塊即時儲存
document.addEventListener('input', e => {
  const t = e.target, b = t.dataset && t.dataset.bind;
  if (!b) return;
  if (b === 'note') day(cur).note = t.value;
  else if (b === 'wmemo') week(weekStart(cur)).memo = t.value;
  else if (b === 'mmemo') month(monthKey(cur)).memo = t.value;
  autosize(t); saveSoon();
});

// 左右滑動切換日期（畫面跟著手指移動）
(() => {
  const v = $('#view');
  let sx = null, sy = 0, st = 0, axis = null, dx = 0, inner = null;
  v.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || view === 'study' || e.target.closest('textarea, input, .hgrid')) { sx = null; return; }
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
    axis = null; dx = 0; inner = v.firstElementChild;
  }, { passive: true });
  v.addEventListener('touchmove', e => {
    if (sx == null || !inner) return;
    const x = e.touches[0].clientX - sx, y = e.touches[0].clientY - sy;
    if (!axis) {
      if (Math.abs(x) < 10 && Math.abs(y) < 10) return;
      axis = Math.abs(x) > Math.abs(y) * 1.2 ? 'x' : 'y';
      if (axis === 'x') v.classList.remove('slide-next', 'slide-prev', 'fade');
    }
    if (axis !== 'x') return;
    dx = x;
    inner.style.transition = 'none';
    inner.style.transform = `translateX(${x * 0.5}px)`;
    inner.style.opacity = String(1 - Math.min(Math.abs(x) / 500, 0.45));
  }, { passive: true });
  const end = () => {
    if (sx == null) return;
    sx = null;
    if (axis !== 'x' || !inner) return;
    const fast = Math.abs(dx) > 30 && Date.now() - st < 250;
    if (Math.abs(dx) > 70 || fast) { step(dx < 0 ? 1 : -1); return; }
    inner.style.transition = 'transform .35s cubic-bezier(.2,.8,.2,1), opacity .35s';
    inner.style.transform = ''; inner.style.opacity = '';
  };
  v.addEventListener('touchend', end, { passive: true });
  v.addEventListener('touchcancel', end, { passive: true });
})();

// 隔天打開時自動跳到今天
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') { save(); return; }
  const T = today();
  if (T !== lastToday) { if (cur === lastToday) cur = T; lastToday = T; render(); }
});
window.addEventListener('pagehide', save);

/* ---------- 啟動 ---------- */
render();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
