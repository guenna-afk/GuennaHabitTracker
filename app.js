/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   GUENNA TRACKER â€” APP.JS
   Habit & Finance Tracker
â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

'use strict';

// â”€â”€ SPLASH â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
window.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');
  let shown = false;

  const revealApp = () => {
    if (shown) return;
    shown = true;
    app.classList.remove('hidden');
    splash.style.display = 'none';
  };

  splash.addEventListener('animationend', revealApp, { once: true });
  setTimeout(revealApp, 3600);

  init();
});

// â”€â”€ STATE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const STORAGE_KEY = 'guenna_tracker_v1';

function defaultState() {
  const now = new Date();
  return {
    month: now.getMonth(),
    year: now.getFullYear(),
    dailyHabits: [],     // [{ id, name }]
    weeklyHabits: [],    // [{ id, name }]
    checks: {},          // { "YYYY-M-habitId-day": true }
    weeklyChecks: {},    // { "YYYY-M-habitId-week": true }
    income: [],          // [{ id, name, amount }]
    fixed: [],           // [{ id, name, amount }]
    variable: [],        // [{ id, name, category, date, amount }]
  };
}

let state = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch { return defaultState(); }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// â”€â”€ MONTHS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
];

function daysInMonth(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

function monthIndex(year, month) {
  return year * 12 + month;
}

function matchesMonthYearByDate(dateStr, month, year) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === month && d.getFullYear() === year;
}

function incomeForMonth(month, year) {
  return state.income
    .filter(i => {
      if (!i.month && i.month !== 0) return false;
      return +i.month === month && +i.year === year;
    })
    .reduce((acc, i) => acc + (+i.amount || 0), 0);
}

function variableForMonth(month, year) {
  return state.variable
    .filter(i => matchesMonthYearByDate(i.date, month, year))
    .reduce((acc, i) => acc + (+i.amount || 0), 0);
}

function fixedForMonth(month, year) {
  const target = monthIndex(year, month);
  return state.fixed
    .filter(i => {
      if (i.startYear !== undefined && i.startMonth !== undefined) {
        return monthIndex(+i.startYear, +i.startMonth) <= target;
      }
      // Compatibilidad con datos antiguos: si no tenían fecha de inicio,
      // los aplicamos solo al mes seleccionado actual para evitar retroactivos masivos.
      return month === state.month && year === state.year;
    })
    .reduce((acc, i) => acc + (+i.amount || 0), 0);
}

function monthNet(month, year) {
  return incomeForMonth(month, year) - fixedForMonth(month, year) - variableForMonth(month, year);
}

function cumulativeBalanceUntil(month, year) {
  const target = monthIndex(year, month);
  let total = 0;
  for (let y = 2020; y <= year; y++) {
    for (let m = 0; m < 12; m++) {
      if (monthIndex(y, m) > target) break;
      total += monthNet(m, y);
    }
  }
  return total;
}

// â”€â”€ INIT â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function init() {
  buildSelectors();
  setupTabs();
  setupResetAllButton();
  render();
}

// â”€â”€ SELECTORS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function buildSelectors() {
  const ms = document.getElementById('monthSelect');
  const ys = document.getElementById('yearSelect');

  MONTHS.forEach((m, i) => {
    const opt = document.createElement('option');
    opt.value = i; opt.textContent = m;
    if (i === state.month) opt.selected = true;
    ms.appendChild(opt);
  });

  for (let y = 2020; y <= 2035; y++) {
    const opt = document.createElement('option');
    opt.value = y; opt.textContent = y;
    if (y === state.year) opt.selected = true;
    ys.appendChild(opt);
  }

  ms.addEventListener('change', () => {
    state.month = +ms.value;
    saveState(); render();
  });

  ys.addEventListener('change', () => {
    state.year = +ys.value;
    saveState(); render();
  });
}

// â”€â”€ TABS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

function setupResetAllButton() {
  const btn = document.getElementById('resetAllData');
  if (!btn) return;
  btn.onclick = () => {
    if (!confirm('¿Reiniciar TODO y ponerlo a 0?')) return;
    if (!confirm('Esta acción borra hábitos y finanzas. ¿Seguro?')) return;

    state = defaultState();
    saveState();
    document.getElementById('monthSelect').value = String(state.month);
    document.getElementById('yearSelect').value = String(state.year);
    render();
  };
}

// â”€â”€ RENDER â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function render() {
  renderHabits();
  renderFinance();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  HABITS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function renderHabits() {
  renderDailyTable();
  renderWeeklyTable();
  renderStats();
  renderWeeklyChart();
  renderTopHabits();
  setupHabitButtons();
}

function checkKey(habitId, day) {
  return `${state.year}-${state.month}-${habitId}-${day}`;
}

function weekCheckKey(habitId, week) {
  return `${state.year}-${state.month}-${habitId}-w${week}`;
}

// â”€â”€ DAILY TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderDailyTable() {
  const days = daysInMonth(state.year, state.month);
  const head = document.getElementById('dailyHead');
  const body = document.getElementById('dailyBody');

  // Header
  let hRow = '<tr>';
  hRow += '<th class="habit-name-th">Hábito</th>';
  for (let d = 1; d <= days; d++) hRow += `<th>${d}</th>`;
  hRow += '<th>%</th><th></th></tr>';
  head.innerHTML = hRow;

  // Body
  body.innerHTML = '';
  state.dailyHabits.forEach(habit => {
    let done = 0;
    let row = `<tr class="habit-row">`;
    row += `<td class="habit-name-td">${escHtml(habit.name)}</td>`;
    for (let d = 1; d <= days; d++) {
      const key = checkKey(habit.id, d);
      const checked = state.checks[key] ? 'checked' : '';
      if (state.checks[key]) done++;
      row += `<td><input type="checkbox" class="habit-check" data-id="${habit.id}" data-day="${d}" ${checked}></td>`;
    }
    const pct = Math.round((done / days) * 100);
    row += `<td class="habit-pct">${pct}%</td>`;
    row += `<td><button class="delete-habit" data-id="${habit.id}" data-type="daily">×</button></td>`;
    row += '</tr>';
    body.insertAdjacentHTML('beforeend', row);
  });

  // Checkbox events
  body.querySelectorAll('.habit-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = checkKey(cb.dataset.id, cb.dataset.day);
      if (cb.checked) state.checks[key] = true;
      else delete state.checks[key];
      saveState(); renderHabits();
    });
  });

  // Delete events
  body.querySelectorAll('.delete-habit').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('¿Eliminar este hábito?')) return;
      state.dailyHabits = state.dailyHabits.filter(h => h.id !== btn.dataset.id);
      saveState(); renderHabits();
    });
  });
}

// â”€â”€ WEEKLY TABLE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderWeeklyTable() {
  const days = daysInMonth(state.year, state.month);
  const weeks = Math.ceil(days / 7);
  const head = document.getElementById('weeklyHead');
  const body = document.getElementById('weeklyBody');

  let hRow = '<tr><th class="habit-name-th">Hábito</th>';
  for (let w = 1; w <= weeks; w++) hRow += `<th>S${w}</th>`;
  hRow += '<th>%</th><th></th></tr>';
  head.innerHTML = hRow;

  body.innerHTML = '';
  state.weeklyHabits.forEach(habit => {
    let done = 0;
    let row = `<tr class="habit-row">`;
    row += `<td class="habit-name-td">${escHtml(habit.name)}</td>`;
    for (let w = 1; w <= weeks; w++) {
      const key = weekCheckKey(habit.id, w);
      const checked = state.weeklyChecks[key] ? 'checked' : '';
      if (state.weeklyChecks[key]) done++;
      row += `<td><input type="checkbox" class="habit-check" data-id="${habit.id}" data-week="${w}" ${checked}></td>`;
    }
    const pct = Math.round((done / weeks) * 100);
    row += `<td class="habit-pct">${pct}%</td>`;
    row += `<td><button class="delete-habit" data-id="${habit.id}" data-type="weekly">×</button></td>`;
    row += '</tr>';
    body.insertAdjacentHTML('beforeend', row);
  });

  body.querySelectorAll('.habit-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const key = weekCheckKey(cb.dataset.id, cb.dataset.week);
      if (cb.checked) state.weeklyChecks[key] = true;
      else delete state.weeklyChecks[key];
      saveState(); renderHabits();
    });
  });

  body.querySelectorAll('.delete-habit').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('¿Eliminar este hábito?')) return;
      state.weeklyHabits = state.weeklyHabits.filter(h => h.id !== btn.dataset.id);
      saveState(); renderHabits();
    });
  });
};

// â”€â”€ STATS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderStats() {
  const days = daysInMonth(state.year, state.month);
  const total = state.dailyHabits.length * days;
  let done = 0;

  state.dailyHabits.forEach(habit => {
    for (let d = 1; d <= days; d++) {
      if (state.checks[checkKey(habit.id, d)]) done++;
    }
  });

  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const left = total - done;

  // Donut
  const circ = 2 * Math.PI * 30; // r=30
  const fill = (pct / 100) * circ;
  document.getElementById('donutFill').setAttribute('stroke-dasharray', `${fill} ${circ}`);
  document.getElementById('donutPct').textContent = pct + '%';

  document.getElementById('statCompleted').textContent = done;
  document.getElementById('statLeft').textContent = left < 0 ? 0 : left;

  // Best streak (across all habits this month)
  let bestStreak = 0;
  state.dailyHabits.forEach(habit => {
    let cur = 0; let max = 0;
    for (let d = 1; d <= days; d++) {
      if (state.checks[checkKey(habit.id, d)]) { cur++; max = Math.max(max, cur); }
      else cur = 0;
    }
    bestStreak = Math.max(bestStreak, max);
  });
  document.getElementById('statStreak').textContent = bestStreak;
}

// â”€â”€ WEEKLY CHART â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderWeeklyChart() {
  const days = daysInMonth(state.year, state.month);
  const weeks = Math.ceil(days / 7);
  const chartEl = document.getElementById('weeklyChart');
  const labelsEl = document.getElementById('weeklyLabels');

  chartEl.innerHTML = '';
  labelsEl.innerHTML = '';

  for (let w = 0; w < weeks; w++) {
    const startDay = w * 7 + 1;
    const endDay = Math.min(startDay + 6, days);
    let done = 0;
    let total = 0;

    state.dailyHabits.forEach(habit => {
      for (let d = startDay; d <= endDay; d++) {
        total++;
        if (state.checks[checkKey(habit.id, d)]) done++;
      }
    });

    const pct = total > 0 ? (done / total) * 100 : 0;
    const bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = Math.max(pct, 2) + '%';
    bar.title = `Semana ${w + 1}: ${Math.round(pct)}%`;
    chartEl.appendChild(bar);

    const lbl = document.createElement('div');
    lbl.className = 'chart-label';
    lbl.textContent = `S${w + 1}`;
    labelsEl.appendChild(lbl);
  }
};

// â”€â”€ TOP HABITS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function renderTopHabits() {
  const days = daysInMonth(state.year, state.month);
  const el = document.getElementById('topHabits');
  el.innerHTML = '';

  if (!state.dailyHabits.length) {
    el.innerHTML = '<p style="font-family:var(--font-mono);font-size:11px;color:var(--grey-500)">Añade hábitos para ver el ranking.</p>';
    return;
  }

  const ranked = state.dailyHabits.map(habit => {
    let done = 0;
    for (let d = 1; d <= days; d++) {
      if (state.checks[checkKey(habit.id, d)]) done++;
    }
    return { name: habit.name, pct: Math.round((done / days) * 100) };
  }).sort((a, b) => b.pct - a.pct).slice(0, 10);

  ranked.forEach((h, i) => {
    el.insertAdjacentHTML('beforeend', `
      <div class="top-habit-item">
        <span class="top-habit-rank">${i + 1}</span>
        <span class="top-habit-name">${escHtml(h.name)}</span>
        <div class="top-habit-bar-wrap">
          <div class="top-habit-bar" style="width:${h.pct}%"></div>
        </div>
        <span class="top-habit-pct">${h.pct}%</span>
      </div>
    `);
  });
}

// â”€â”€ HABIT BUTTONS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setupHabitButtons() {
  document.getElementById('addDailyHabit').onclick = () => {
    openModal('Nuevo Hábito Diario', [
      { name: 'name', label: 'Nombre del hábito', type: 'text', placeholder: 'Ej: Correr 30 min' }
    ], fields => {
      if (!fields.name.trim()) return;
      state.dailyHabits.push({ id: uid(), name: fields.name.trim() });
      saveState(); renderHabits();
    });
  };

  document.getElementById('addWeeklyHabit').onclick = () => {
    openModal('Nuevo Hábito Semanal', [
      { name: 'name', label: 'Nombre del hábito', type: 'text', placeholder: 'Ej: Llamar a familia' }
    ], fields => {
      if (!fields.name.trim()) return;
      state.weeklyHabits.push({ id: uid(), name: fields.name.trim() });
      saveState(); renderHabits();
    });
  };
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  FINANCE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function renderFinance() {
  renderIncomeTable();
  renderFixedTable();
  renderVariableTable();
  renderFinanceStats();
  setupFinanceButtons();
}

function fmt(n) {
  return '€' + Number(n).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderIncomeTable() {
  const body = document.getElementById('incomeBody');
  body.innerHTML = '';
  let total = 0;

  // Filter by month/year
  const items = state.income.filter(i => {
    if (!i.month && i.month !== 0) return true; // no date filter = always show
    return +i.month === state.month && +i.year === state.year;
  });

  items.forEach(item => {
    total += +item.amount;
    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escHtml(item.name)}</td>
        <td class="amount">${fmt(item.amount)}</td>
        <td>
          <button class="edit-fin" data-id="${item.id}" data-type="income" title="Editar">✎</button>
          <button class="delete-fin" data-id="${item.id}" data-type="income" title="Eliminar">×</button>
        </td>
      </tr>
    `);
  });

  document.getElementById('incomeTotalFoot').textContent = fmt(total);
  setupFinDeleteEvents();
  setupFinEditEvents();
}

function renderFixedTable() {
  const body = document.getElementById('fixedBody');
  body.innerHTML = '';
  let total = 0;

  state.fixed.forEach(item => {
    total += +item.amount;
    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escHtml(item.name)}</td>
        <td class="amount">${fmt(item.amount)}</td>
        <td>
          <button class="edit-fin" data-id="${item.id}" data-type="fixed" title="Editar">✎</button>
          <button class="delete-fin" data-id="${item.id}" data-type="fixed" title="Eliminar">×</button>
        </td>
      </tr>
    `);
  });

  document.getElementById('fixedTotalFoot').textContent = fmt(total);
  setupFinDeleteEvents();
  setupFinEditEvents();
}

function renderVariableTable() {
  const body = document.getElementById('variableBody');
  body.innerHTML = '';
  let total = 0;

  const items = state.variable.filter(i => {
    if (!i.date) return true;
    const d = new Date(i.date);
    return d.getMonth() === state.month && d.getFullYear() === state.year;
  });

  items.forEach(item => {
    total += +item.amount;
    body.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${escHtml(item.name)}</td>
        <td>${escHtml(item.category || '—')}</td>
        <td style="font-family:var(--font-mono);font-size:11px">${item.date || '—'}</td>
        <td class="amount">${fmt(item.amount)}</td>
        <td>
          <button class="edit-fin" data-id="${item.id}" data-type="variable" title="Editar">✎</button>
          <button class="delete-fin" data-id="${item.id}" data-type="variable" title="Eliminar">×</button>
        </td>
      </tr>
    `);
  });

  document.getElementById('variableTotalFoot').textContent = fmt(total);
  setupFinDeleteEvents();
  setupFinEditEvents();
}

function renderFinanceStats() {
  const income = incomeForMonth(state.month, state.year);
  const fixed = fixedForMonth(state.month, state.year);
  const variable = variableForMonth(state.month, state.year);
  const balance = cumulativeBalanceUntil(state.month, state.year);

  document.getElementById('finBalance').textContent = fmt(balance);
  document.getElementById('finIncome').textContent = fmt(income);
  document.getElementById('finFixed').textContent = fmt(fixed);
  document.getElementById('finVariable').textContent = fmt(variable);

  // Bar
  const totalOut = fixed + variable;
  const max = Math.max(income, totalOut, 1);
  document.getElementById('fbIncome').style.width = (income / max * 100) + '%';
  document.getElementById('fbFixed').style.width = (fixed / max * 100) + '%';
  document.getElementById('fbVariable').style.width = (variable / max * 100) + '%';
}

let _finDeleteBound = false;
function setupFinDeleteEvents() {
  if (_finDeleteBound) return;
  _finDeleteBound = true;

  document.addEventListener('click', e => {
    const btn = e.target.closest('.delete-fin');
    if (!btn) return;
    if (!confirm('¿Eliminar este registro?')) return;

    const t = btn.dataset.type;
    if (t === 'income') state.income = state.income.filter(i => i.id !== btn.dataset.id);
    if (t === 'fixed') state.fixed = state.fixed.filter(i => i.id !== btn.dataset.id);
    if (t === 'variable') state.variable = state.variable.filter(i => i.id !== btn.dataset.id);
    saveState();
    renderFinance();
  });
}

function setupFinanceButtons() {
  document.getElementById('addIncome').onclick = () => {
    openModal('Añadir Ingreso', [
      { name: 'name',   label: 'Concepto',  type: 'text',   placeholder: 'Ej: Salario' },
      { name: 'amount', label: 'Cantidad (€)', type: 'number', placeholder: '0.00' },
    ], fields => {
      if (!fields.name.trim() || !fields.amount) return;
      state.income.push({ id: uid(), name: fields.name.trim(), amount: +fields.amount, month: state.month, year: state.year });
      saveState(); renderFinance();
    });
  };

  document.getElementById('addFixed').onclick = () => {
    openModal('Añadir Gasto Fijo', [
      { name: 'name',   label: 'Concepto',    type: 'text',   placeholder: 'Ej: Alquiler' },
      { name: 'amount', label: 'Cantidad (€)', type: 'number', placeholder: '0.00' },
    ], fields => {
      if (!fields.name.trim() || !fields.amount) return;
      state.fixed.push({
        id: uid(),
        name: fields.name.trim(),
        amount: +fields.amount,
        startMonth: state.month,
        startYear: state.year
      });
      saveState(); renderFinance();
    });
  };

  document.getElementById('addVariable').onclick = () => {
    const today = new Date().toISOString().slice(0, 10);
    openModal('Añadir Gasto Puntual', [
      { name: 'name',     label: 'Concepto',    type: 'text',   placeholder: 'Ej: Cena restaurante' },
      { name: 'category', label: 'Categoría',   type: 'text',   placeholder: 'Ej: Ocio, Salud, Ropa...' },
      { name: 'date',     label: 'Fecha',        type: 'date',   placeholder: today, defaultVal: today },
      { name: 'amount',   label: 'Cantidad (€)', type: 'number', placeholder: '0.00' },
    ], fields => {
      if (!fields.name.trim() || !fields.amount) return;
      state.variable.push({
        id: uid(),
        name: fields.name.trim(),
        category: fields.category.trim(),
        date: fields.date,
        amount: +fields.amount
      });
      saveState(); renderFinance();
    });
  };
}

function setupFinEditEvents() {
  document.querySelectorAll('.edit-fin').forEach(btn => {
    btn.onclick = () => {
      const type = btn.dataset.type;
      if (type === 'income') {
        const item = state.income.find(i => i.id === btn.dataset.id);
        if (!item) return;
        openModal('Editar ingreso', [
          { name: 'name', label: 'Concepto', type: 'text', defaultVal: item.name || '' },
          { name: 'amount', label: 'Cantidad (€)', type: 'number', defaultVal: item.amount || 0 },
        ], fields => {
          if (!fields.name.trim() || !fields.amount) return;
          item.name = fields.name.trim();
          item.amount = +fields.amount;
          saveState(); renderFinance();
        });
      }

      if (type === 'fixed') {
        const item = state.fixed.find(i => i.id === btn.dataset.id);
        if (!item) return;
        openModal('Editar gasto fijo', [
          { name: 'name', label: 'Concepto', type: 'text', defaultVal: item.name || '' },
          { name: 'amount', label: 'Cantidad (€)', type: 'number', defaultVal: item.amount || 0 },
        ], fields => {
          if (!fields.name.trim() || !fields.amount) return;
          item.name = fields.name.trim();
          item.amount = +fields.amount;
          saveState(); renderFinance();
        });
      }

      if (type === 'variable') {
        const item = state.variable.find(i => i.id === btn.dataset.id);
        if (!item) return;
        openModal('Editar gasto puntual', [
          { name: 'name', label: 'Concepto', type: 'text', defaultVal: item.name || '' },
          { name: 'category', label: 'Categoría', type: 'text', defaultVal: item.category || '' },
          { name: 'date', label: 'Fecha', type: 'date', defaultVal: item.date || '' },
          { name: 'amount', label: 'Cantidad (€)', type: 'number', defaultVal: item.amount || 0 },
        ], fields => {
          if (!fields.name.trim() || !fields.amount) return;
          item.name = fields.name.trim();
          item.category = fields.category.trim();
          item.date = fields.date;
          item.amount = +fields.amount;
          saveState(); renderFinance();
        });
      }
    };
  });
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  MODAL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

let _modalCallback = null;

function openModal(title, fields, callback) {
  _modalCallback = callback;
  document.getElementById('modalTitle').textContent = title;
  const container = document.getElementById('modalFields');
  container.innerHTML = '';

  fields.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-field';
    const lbl = document.createElement('label');
    lbl.textContent = f.label;
    const inp = document.createElement('input');
    inp.type = f.type;
    inp.name = f.name;
    inp.placeholder = f.placeholder || '';
    if (f.defaultVal) inp.value = f.defaultVal;
    if (f.type === 'number') { inp.min = '0'; inp.step = '0.01'; }
    wrap.appendChild(lbl);
    wrap.appendChild(inp);
    container.appendChild(wrap);
  });

  document.getElementById('modal').classList.remove('hidden');

  // Focus first input
  setTimeout(() => container.querySelector('input')?.focus(), 50);
}

function closeModal() {
  document.getElementById('modal').classList.add('hidden');
  _modalCallback = null;
}

document.getElementById('modalCancel').addEventListener('click', closeModal);
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

document.getElementById('modalSave').addEventListener('click', () => {
  if (!_modalCallback) return;
  const inputs = document.querySelectorAll('#modalFields input');
  const fields = {};
  inputs.forEach(inp => { fields[inp.name] = inp.value; });
  _modalCallback(fields);
  closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Enter' && !document.getElementById('modal').classList.contains('hidden')) {
    document.getElementById('modalSave').click();
  }
});

// â”€â”€ UTILS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

