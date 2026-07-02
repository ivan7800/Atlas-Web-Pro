const APP_VERSION = '3.2.2';
const MAX_IMPORT_BYTES = 512 * 1024;
const BASE_DATA = Array.isArray(window.ATLAS_TOOLS) ? window.ATLAS_TOOLS : [];
const $ = selector => document.querySelector(selector);

const cards = $('#cards');
const filters = $('#categoryFilters');
const search = $('#searchInput');
const root = document.documentElement;
const statusMessage = $('#statusMessage');

const storage = {
  favs: 'atlasFavs.v3',
  notes: 'atlasNotes.v3',
  skin: 'atlasSkin.v3',
  ratings: 'atlasRatings.v3',
  custom: 'atlasCustomTools.v3',
  usage: 'atlasUsage.v3',
  view: 'atlasView.v3'
};

let storageBlocked = false;

function showStatus(message, tone = 'info') {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.dataset.tone = tone;
  clearTimeout(showStatus.timer);
  showStatus.timer = setTimeout(() => {
    statusMessage.textContent = '';
    statusMessage.removeAttribute('data-tone');
  }, 2600);
}

function readJSON(key, fallback) {
  try {
    const raw = window.localStorage?.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    storageBlocked = true;
    return fallback;
  }
}

function readArray(key, fallback = []) {
  const value = readJSON(key, fallback);
  return Array.isArray(value) ? value : fallback;
}

function readText(key, fallback = '') {
  try {
    const value = window.localStorage?.getItem(key);
    return value === null || value === undefined ? fallback : String(value);
  } catch {
    storageBlocked = true;
    return fallback;
  }
}

function writeJSON(key, value) {
  try {
    window.localStorage?.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    storageBlocked = true;
    showStatus('No se ha podido guardar en este navegador. Revisa permisos o espacio disponible.', 'error');
    return false;
  }
}

function writeText(key, value) {
  try {
    window.localStorage?.setItem(key, String(value));
    return true;
  } catch {
    storageBlocked = true;
    showStatus('No se ha podido guardar la preferencia en este navegador.', 'error');
    return false;
  }
}

function asPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function cleanId(value, fallback) {
  const cleaned = String(value ?? fallback).trim().replace(/[^a-zA-Z0-9_.-]/g, '-').slice(0, 80);
  return cleaned || fallback;
}

function isSafeWebUrl(value) {
  try {
    const url = new URL(String(value).trim());
    const localHttp = url.protocol === 'http:' && ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    return url.protocol === 'https:' || localHttp;
  } catch {
    return false;
  }
}

function normalizeSearch(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function cleanTool(tool, index = 0, isCustom = false) {
  const fallbackId = `${isCustom ? 'custom' : 'tool'}-${index}`;
  let id = cleanId(tool?.id, fallbackId);
  if (isCustom && !id.startsWith('custom-')) id = `custom-${id}`;

  const url = String(tool?.url || '').trim();
  return {
    id,
    name: String(tool?.name || 'Sin nombre').trim().slice(0, 60) || 'Sin nombre',
    url: isSafeWebUrl(url) ? url : 'https://example.com',
    desc: String(tool?.desc || 'Sin descripción.').trim().slice(0, 180) || 'Sin descripción.',
    category: String(tool?.category || 'Sin categoría').trim().slice(0, 60) || 'Sin categoría',
    tags: Array.isArray(tool?.tags)
      ? tool.tags.map(tag => String(tag).trim().slice(0, 30)).filter(Boolean).slice(0, 12)
      : [],
    custom: isCustom
  };
}

function cleanCustomTools(tools) {
  if (!Array.isArray(tools)) return [];
  const seen = new Set();
  return tools
    .filter(tool => isSafeWebUrl(tool?.url))
    .map((tool, index) => cleanTool(tool, index, true))
    .map((tool, index) => {
      if (seen.has(tool.id)) tool.id = `custom-${Date.now()}-${index}`;
      seen.add(tool.id);
      return tool;
    })
    .slice(0, 200);
}

function cleanTextMap(value, maxLength = 600) {
  const result = {};
  for (const [key, raw] of Object.entries(asPlainObject(value))) {
    const id = cleanId(key, 'item');
    result[id] = String(raw ?? '').slice(0, maxLength);
  }
  return result;
}

function cleanRatings(value) {
  const result = {};
  for (const [key, raw] of Object.entries(asPlainObject(value))) {
    const rating = Math.max(0, Math.min(5, Number(raw) || 0));
    if (rating) result[cleanId(key, 'item')] = rating;
  }
  return result;
}

function cleanUsage(value) {
  const result = {};
  for (const [key, raw] of Object.entries(asPlainObject(value))) {
    const item = asPlainObject(raw);
    const count = Math.max(0, Math.min(99999, Number(item.count) || 0));
    const last = Number.isFinite(Date.parse(item.last)) ? String(item.last) : '';
    if (count || last) result[cleanId(key, 'item')] = { count, last };
  }
  return result;
}

const legacyFavs = readArray('atlasFavs.v2', []).map(String);
const legacyNotes = cleanTextMap(readJSON('atlasNotes.v2', {}));

let state = {
  category: 'Todas',
  onlyFavs: false,
  onlyCustom: false,
  sort: 'category',
  view: ['grid', 'list'].includes(readText(storage.view, 'grid')) ? readText(storage.view, 'grid') : 'grid',
  favs: new Set(readArray(storage.favs, legacyFavs).map(value => cleanId(value, 'item'))),
  notes: cleanTextMap(readJSON(storage.notes, legacyNotes)),
  ratings: cleanRatings(readJSON(storage.ratings, {})),
  customTools: cleanCustomTools(readJSON(storage.custom, [])),
  usage: cleanUsage(readJSON(storage.usage, {}))
};

function normalizeTool(tool, index, isCustom = false) {
  return cleanTool(tool, index, isCustom);
}

function allTools() {
  return [
    ...BASE_DATA.map((tool, index) => normalizeTool(tool, index, false)),
    ...state.customTools.map((tool, index) => normalizeTool(tool, index, true))
  ];
}

function toolIdSet() {
  return new Set(allTools().map(tool => tool.id));
}

function pruneStateToExistingTools() {
  const validIds = toolIdSet();
  state.favs = new Set([...state.favs].filter(id => validIds.has(id)));
  for (const key of Object.keys(state.notes)) if (!validIds.has(key)) delete state.notes[key];
  for (const key of Object.keys(state.ratings)) if (!validIds.has(key)) delete state.ratings[key];
  for (const key of Object.keys(state.usage)) if (!validIds.has(key)) delete state.usage[key];
}

function categories() {
  return ['Todas', ...new Set(allTools().map(tool => tool.category).sort((a, b) => a.localeCompare(b, 'es')))];
}

function saveFavs() { writeJSON(storage.favs, [...state.favs]); }
function saveNotes() { writeJSON(storage.notes, state.notes); }
function saveRatings() { writeJSON(storage.ratings, state.ratings); }
function saveCustomTools() { writeJSON(storage.custom, state.customTools); }
function saveUsage() { writeJSON(storage.usage, state.usage); }

function esc(value = '') {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function setSkin(skin) {
  const colors = {
    'pro-dark': '#101827',
    'atlas-gold': '#17130d',
    cyberpunk: '#130b22',
    terminal: '#000000',
    omega: '#141418',
    light: '#f5f7fb'
  };
  const selectedSkin = colors[skin] ? skin : 'pro-dark';
  root.dataset.skin = selectedSkin;
  $('#skinSelect').value = selectedSkin;
  writeText(storage.skin, selectedSkin);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[selectedSkin]);
}

function getList() {
  const query = normalizeSearch(search.value);
  let list = allTools().filter(tool => {
    const haystack = normalizeSearch(`${tool.name} ${tool.category} ${tool.desc} ${(tool.tags || []).join(' ')} ${state.notes[tool.id] || ''}`);
    return (state.category === 'Todas' || tool.category === state.category)
      && (!state.onlyFavs || state.favs.has(tool.id))
      && (!state.onlyCustom || tool.custom)
      && (!query || haystack.includes(query));
  });

  const usageCount = id => state.usage[id]?.count || 0;
  const usageLast = id => state.usage[id]?.last || '';
  const rating = id => Number(state.ratings[id] || 0);

  if (state.sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'favorites') list.sort((a, b) => Number(state.favs.has(b.id)) - Number(state.favs.has(a.id)) || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'rating') list.sort((a, b) => rating(b.id) - rating(a.id) || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'used') list.sort((a, b) => usageCount(b.id) - usageCount(a.id) || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'recent') list.sort((a, b) => usageLast(b.id).localeCompare(usageLast(a.id)) || a.name.localeCompare(b.name, 'es'));
  if (state.sort === 'category') list.sort((a, b) => a.category.localeCompare(b.category, 'es') || a.name.localeCompare(b.name, 'es'));
  return list;
}

function renderFilters() {
  const data = allTools();
  filters.innerHTML = categories().map(category => {
    const count = category === 'Todas' ? data.length : data.filter(tool => tool.category === category).length;
    const active = state.category === category && !state.onlyCustom;
    return `<button type="button" class="filter ${active ? 'active' : ''}" data-cat="${esc(category)}" aria-pressed="${active}"><span>${esc(category)}</span><small>${count}</small></button>`;
  }).join('');

  $('#categorySuggestions').innerHTML = categories()
    .filter(category => category !== 'Todas')
    .map(category => `<option value="${esc(category)}"></option>`)
    .join('');
}

function renderRating(tool) {
  const value = Number(state.ratings[tool.id] || 0);
  return `<div class="rating" aria-label="Valoración de ${esc(tool.name)}">${[1, 2, 3, 4, 5].map(star => `<button type="button" class="${star <= value ? 'on' : ''}" data-rate="${esc(tool.id)}" data-value="${star}" aria-label="${star} estrellas para ${esc(tool.name)}" aria-pressed="${star <= value}">★</button>`).join('')}</div>`;
}

function renderCards() {
  pruneStateToExistingTools();
  const list = getList();
  cards.classList.toggle('list', state.view === 'list');
  cards.innerHTML = list.map(tool => {
    const tags = (tool.tags || []).slice(0, 5).map(tag => `<span>${esc(tag)}</span>`).join('');
    const note = state.notes[tool.id] || '';
    const uses = state.usage[tool.id]?.count || 0;
    const isFav = state.favs.has(tool.id);
    return `<article class="card">
      <div class="cardTop">
        <div>
          <div class="cat">${esc(tool.category)} ${tool.custom ? '<span class="customBadge">Propia</span>' : ''}</div>
          <h3>${esc(tool.name)}</h3>
        </div>
        <button type="button" class="fav ${isFav ? 'on' : ''}" data-fav="${esc(tool.id)}" aria-label="${isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}: ${esc(tool.name)}" aria-pressed="${isFav}">★</button>
      </div>
      <p class="desc">${esc(tool.desc)}</p>
      <div class="tags">${tags}</div>
      ${renderRating(tool)}
      <textarea class="noteBox" data-note="${esc(tool.id)}" maxlength="600" placeholder="Nota personal..." aria-label="Nota personal para ${esc(tool.name)}">${esc(note)}</textarea>
      <div class="tools">
        <a href="${esc(tool.url)}" target="_blank" rel="noopener noreferrer" data-open="${esc(tool.id)}">Abrir</a>
        <button type="button" data-copy="${esc(tool.url)}">Copiar</button>
        ${tool.custom ? `<button type="button" data-edit="${esc(tool.id)}">Editar</button>` : ''}
      </div>
      <small class="note">${uses ? `Abierta ${uses} ${uses === 1 ? 'vez' : 'veces'}` : 'Sin abrir todavía'}</small>
    </article>`;
  }).join('');

  $('#totalCount').textContent = allTools().length;
  $('#visibleCount').textContent = list.length;
  $('#favCount').textContent = state.favs.size;
  $('#customCount').textContent = state.customTools.length;
  $('#emptyState').hidden = list.length !== 0;
  $('#resultTitle').textContent = state.onlyFavs ? 'Favoritas' : state.onlyCustom ? 'Mis herramientas' : state.category === 'Todas' ? 'Todas las herramientas' : state.category;

  const onlyFavsBtn = $('#onlyFavsBtn');
  const onlyCustomBtn = $('#onlyCustomBtn');
  onlyFavsBtn.setAttribute('aria-pressed', String(state.onlyFavs));
  onlyCustomBtn.setAttribute('aria-pressed', String(state.onlyCustom));
  onlyFavsBtn.classList.toggle('active', state.onlyFavs);
  onlyCustomBtn.classList.toggle('active', state.onlyCustom);
  $('#viewBtn').setAttribute('aria-pressed', String(state.view === 'list'));
  renderUsageSummary();
}

function renderUsageSummary() {
  const data = allTools();
  const used = Object.entries(state.usage)
    .map(([id, usage]) => ({ tool: data.find(item => item.id === id), ...usage }))
    .filter(item => item.tool)
    .sort((a, b) => (b.count || 0) - (a.count || 0));
  $('#usageSummary').textContent = used.length ? `${used[0].tool.name} · ${used[0].count} usos` : 'Sin historial';
}

function render() {
  renderFilters();
  renderCards();
  if (storageBlocked) showStatus('Modo sin guardado: el navegador ha bloqueado localStorage.', 'error');
}

function rememberOpen(id) {
  state.usage[id] = {
    count: (state.usage[id]?.count || 0) + 1,
    last: new Date().toISOString()
  };
  saveUsage();
  renderUsageSummary();
}

async function copyText(text, button) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      temp.setAttribute('readonly', '');
      temp.className = 'clipboardBuffer';
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      temp.remove();
    }
    button.textContent = 'Copiada';
    showStatus('URL copiada al portapapeles.', 'ok');
  } catch {
    button.textContent = 'Error';
    showStatus('No se ha podido copiar la URL.', 'error');
  }
  setTimeout(() => { button.textContent = 'Copiar'; }, 900);
}

function openToolDialog(tool = null) {
  const dialog = $('#toolDialog');
  $('#dialogTitle').textContent = tool ? 'Editar herramienta' : 'Añadir herramienta';
  $('#toolId').value = tool?.id || '';
  $('#toolName').value = tool?.name || '';
  $('#toolUrl').value = tool?.url || '';
  $('#toolCategory').value = tool?.category || '';
  $('#toolDesc').value = tool?.desc || '';
  $('#toolTags').value = (tool?.tags || []).join(', ');
  $('#deleteCustomBtn').hidden = !tool;
  if (dialog.showModal) dialog.showModal();
  else dialog.setAttribute('open', '');
  setTimeout(() => $('#toolName').focus(), 60);
}

function closeToolDialog() {
  const dialog = $('#toolDialog');
  if (dialog.close) dialog.close();
  else dialog.removeAttribute('open');
}

function saveCustomFromForm() {
  const id = $('#toolId').value || `custom-${Date.now()}`;
  const rawTool = {
    id,
    name: $('#toolName').value.trim(),
    url: $('#toolUrl').value.trim(),
    category: $('#toolCategory').value.trim(),
    desc: $('#toolDesc').value.trim(),
    tags: $('#toolTags').value.split(',').map(tag => tag.trim()).filter(Boolean)
  };

  if (!rawTool.name || !rawTool.category || !rawTool.desc) {
    showStatus('Completa nombre, categoría y descripción.', 'error');
    return;
  }
  if (!isSafeWebUrl(rawTool.url)) {
    showStatus('La URL debe usar https:// o http://localhost.', 'error');
    return;
  }

  const tool = cleanTool(rawTool, 0, true);
  const existing = state.customTools.findIndex(item => String(item.id) === tool.id);
  if (existing >= 0) state.customTools[existing] = tool;
  else state.customTools.push(tool);
  saveCustomTools();
  closeToolDialog();
  render();
  showStatus('Herramienta guardada.', 'ok');
}

function deleteCustomTool(id) {
  if (!confirm('¿Eliminar esta herramienta personalizada?')) return;
  state.customTools = state.customTools.filter(tool => String(tool.id) !== id);
  delete state.notes[id];
  delete state.ratings[id];
  delete state.usage[id];
  state.favs.delete(id);
  saveCustomTools();
  saveNotes();
  saveRatings();
  saveUsage();
  saveFavs();
  closeToolDialog();
  render();
  showStatus('Herramienta eliminada.', 'ok');
}

function exportData() {
  const payload = {
    app: 'Atlas Web Pro',
    version: APP_VERSION,
    exportedAt: new Date().toISOString(),
    skin: readText(storage.skin, 'pro-dark'),
    view: state.view,
    favs: [...state.favs],
    notes: state.notes,
    ratings: state.ratings,
    customTools: state.customTools,
    usage: state.usage
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.download = 'atlas-web-pro-backup.json';
  link.className = 'downloadBuffer';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 800);
  showStatus('Backup exportado.', 'ok');
}

function importData(file) {
  if (!file) return;
  if (file.size > MAX_IMPORT_BYTES) {
    showStatus('El backup es demasiado grande. Máximo permitido: 512 KB.', 'error');
    $('#importInput').value = '';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const payload = Array.isArray(data) ? { favs: data } : asPlainObject(data);
      state.customTools = cleanCustomTools(payload.customTools || []);
      state.favs = new Set(Array.isArray(payload.favs) ? payload.favs.map(value => cleanId(value, 'item')) : []);
      state.notes = cleanTextMap(payload.notes || {});
      state.ratings = cleanRatings(payload.ratings || {});
      state.usage = cleanUsage(payload.usage || {});
      state.view = ['grid', 'list'].includes(payload.view) ? payload.view : state.view;
      if (payload.skin) setSkin(payload.skin);
      pruneStateToExistingTools();
      saveFavs(); saveNotes(); saveRatings(); saveCustomTools(); saveUsage();
      writeText(storage.view, state.view);
      render();
      showStatus('Backup importado correctamente.', 'ok');
    } catch {
      showStatus('Archivo no válido. Importa un JSON exportado desde Atlas Web Pro.', 'error');
    } finally {
      $('#importInput').value = '';
    }
  };
  reader.onerror = () => showStatus('No se ha podido leer el archivo.', 'error');
  reader.readAsText(file);
}

document.addEventListener('click', event => {
  const category = event.target.closest('[data-cat]');
  if (category) {
    state.category = category.dataset.cat;
    state.onlyFavs = false;
    state.onlyCustom = false;
    render();
  }

  const favorite = event.target.closest('[data-fav]');
  if (favorite) {
    const id = favorite.dataset.fav;
    state.favs.has(id) ? state.favs.delete(id) : state.favs.add(id);
    saveFavs();
    render();
  }

  const copy = event.target.closest('[data-copy]');
  if (copy) copyText(copy.dataset.copy, copy);

  const rate = event.target.closest('[data-rate]');
  if (rate) {
    const id = rate.dataset.rate;
    const value = Number(rate.dataset.value);
    state.ratings[id] = Number(state.ratings[id] || 0) === value ? 0 : value;
    saveRatings();
    render();
  }

  const open = event.target.closest('[data-open]');
  if (open) rememberOpen(open.dataset.open);

  const edit = event.target.closest('[data-edit]');
  if (edit) {
    const tool = state.customTools.find(item => String(item.id) === edit.dataset.edit);
    if (tool) openToolDialog(normalizeTool(tool, 0, true));
  }
});

document.addEventListener('input', event => {
  const note = event.target.closest('[data-note]');
  if (note) {
    state.notes[note.dataset.note] = note.value.slice(0, 600);
    saveNotes();
  }
});

document.addEventListener('keydown', event => {
  const isMac = navigator.platform.toUpperCase().includes('MAC');
  if ((isMac ? event.metaKey : event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    search.focus();
    search.select();
  }
  if (event.key === 'Escape' && $('#toolDialog').open) closeToolDialog();

  const importLabel = event.target.closest?.('.fileLabel');
  if (importLabel && (event.key === 'Enter' || event.key === ' ')) {
    event.preventDefault();
    $('#importInput').click();
  }
});

search.addEventListener('input', render);
$('#clearBtn').onclick = () => { search.value = ''; render(); search.focus(); };
$('#resetBtn').onclick = () => { state.category = 'Todas'; state.onlyFavs = false; state.onlyCustom = false; search.value = ''; render(); };
$('#onlyFavsBtn').onclick = () => { state.onlyFavs = !state.onlyFavs; state.onlyCustom = false; render(); };
$('#onlyCustomBtn').onclick = () => { state.onlyCustom = !state.onlyCustom; state.onlyFavs = false; state.category = 'Todas'; render(); };
$('#sortSelect').onchange = event => { state.sort = event.target.value; render(); };
$('#skinSelect').onchange = event => setSkin(event.target.value);
$('#viewBtn').onclick = () => { state.view = state.view === 'grid' ? 'list' : 'grid'; writeText(storage.view, state.view); render(); };
$('#randomBtn').onclick = () => {
  const list = getList();
  const pick = list[Math.floor(Math.random() * list.length)] || allTools()[Math.floor(Math.random() * allTools().length)];
  if (pick && isSafeWebUrl(pick.url)) {
    rememberOpen(pick.id);
    window.open(pick.url, '_blank', 'noopener,noreferrer');
  }
};
$('#addToolBtn').onclick = () => openToolDialog();
$('#exportBtn').onclick = exportData;
$('#importInput').onchange = event => importData(event.target.files[0]);
$('#closeDialogBtn').onclick = closeToolDialog;
$('#cancelDialogBtn').onclick = closeToolDialog;
$('#toolForm').addEventListener('submit', event => { event.preventDefault(); saveCustomFromForm(); });
$('#deleteCustomBtn').onclick = () => deleteCustomTool($('#toolId').value);

pruneStateToExistingTools();
setSkin(readText(storage.skin, 'pro-dark'));
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
render();
