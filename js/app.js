// ============================================================
// APP — Concurso de Pura Raza Árabe · Zafra
// ============================================================

const DEMO_MODE = !window.SUPABASE_URL || window.SUPABASE_URL === "TU_SUPABASE_URL";

const supa = DEMO_MODE
  ? null
  : window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

let session = null;
const app = document.getElementById('app');
const adminStatus = document.getElementById('admin-status');
const btnAdmin = document.getElementById('btn-admin');
const loginDialog = document.getElementById('login-dialog');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

// ------------------------------------------------------------
// Utilidades
// ------------------------------------------------------------
function fmtFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setSaveStatus(el, msg, isError) {
  el.textContent = msg;
  el.style.color = isError ? '#e3a3a3' : '';
  if (msg) setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2500);
}

// ------------------------------------------------------------
// Capa de datos (Supabase real, o demo con datos embebidos)
// ------------------------------------------------------------
async function fetchEvento() {
  if (DEMO_MODE) {
    return {
      id: 1,
      titulo: 'Concurso de Pura Raza Árabe',
      subtitulo: 'Zafra · Badajoz',
      lugar: 'Zafra, Badajoz',
      fechas: '',
      descripcion: 'Organizado con el apoyo de la Asociación Nacional y la Asociación Extremeña del Caballo Árabe, y la colaboración del Ayuntamiento de Zafra.',
      cartel_url: '',
      patrocinadores: [],
      colaboradores: []
    };
  }
  const { data, error } = await supa.from('evento').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

async function fetchClases() {
  if (DEMO_MODE) {
    return window.DEMO_CLASES.map(c => ({ ...c, caballos: undefined }));
  }
  const { data, error } = await supa.from('clases').select('*').order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

async function fetchClase(codigo) {
  if (DEMO_MODE) {
    const c = window.DEMO_CLASES.find(x => x.codigo === codigo);
    if (!c) return null;
    return { clase: c, caballos: c.caballos };
  }
  const { data: clase, error: e1 } = await supa.from('clases').select('*').eq('codigo', codigo).single();
  if (e1) throw e1;
  const { data: caballos, error: e2 } = await supa.from('caballos').select('*').eq('clase_id', clase.id).order('dorsal', { ascending: true });
  if (e2) throw e2;
  return { clase, caballos };
}

async function guardarCaballo(id, cambios) {
  if (DEMO_MODE) return; // modo demo: solo lectura
  const { error } = await supa.from('caballos').update(cambios).eq('id', id);
  if (error) throw error;
}

async function guardarClase(id, cambios) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('clases').update(cambios).eq('id', id);
  if (error) throw error;
}

async function guardarEvento(cambios) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('evento').update(cambios).eq('id', 1);
  if (error) throw error;
}

// ------------------------------------------------------------
// Autenticación
// ------------------------------------------------------------
async function initAuth() {
  if (DEMO_MODE) return;
  const { data } = await supa.auth.getSession();
  session = data.session;
  supa.auth.onAuthStateChange((_event, s) => {
    session = s;
    updateAdminUI();
    render();
  });
}

function isAdmin() {
  return !DEMO_MODE && !!session;
}

function updateAdminUI() {
  if (isAdmin()) {
    adminStatus.hidden = false;
    adminStatus.textContent = 'Modo edición';
    btnAdmin.textContent = 'Cerrar sesión';
  } else {
    adminStatus.hidden = true;
    btnAdmin.textContent = 'Acceso organización';
  }
}

btnAdmin.addEventListener('click', async () => {
  if (isAdmin()) {
    await supa.auth.signOut();
  } else if (DEMO_MODE) {
    alert('Estás viendo la demo con datos de ejemplo.\n\nConecta Supabase (ver README.md) para poder iniciar sesión como organización y editar clasificaciones reales.');
  } else {
    loginError.hidden = true;
    loginForm.reset();
    loginDialog.showModal();
  }
});

document.getElementById('btn-cancel-login').addEventListener('click', () => loginDialog.close());

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const fd = new FormData(loginForm);
  const email = fd.get('email');
  const password = fd.get('password');
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  const { error } = await supa.auth.signInWithPassword({ email, password });
  submitBtn.disabled = false;
  if (error) {
    loginError.textContent = 'No se pudo entrar: revisa el correo y la contraseña.';
    loginError.hidden = false;
    return;
  }
  loginDialog.close();
});

// ------------------------------------------------------------
// Router
// ------------------------------------------------------------
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', async () => {
  await initAuth();
  updateAdminUI();
  render();
});

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return { name: 'home' };
  const [seg, param] = hash.split('/');
  if (seg === 'clase' && param) return { name: 'clase', codigo: decodeURIComponent(param) };
  return { name: 'home' };
}

async function render() {
  const route = currentRoute();
  try {
    if (route.name === 'clase') {
      await renderClase(route.codigo);
    } else {
      await renderHome();
    }
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="empty-state"><strong>No se pudieron cargar los datos.</strong>${escapeHtml(err.message || err)}</div>`;
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ------------------------------------------------------------
// Vista: PORTADA
// ------------------------------------------------------------
async function renderHome() {
  app.innerHTML = `<p class="muted" style="padding:60px 0;text-align:center;">Cargando…</p>`;
  const [evento, clases] = await Promise.all([fetchEvento(), fetchClases()]);

  const demoBanner = DEMO_MODE ? `
    <div class="demo-banner">
      Estás viendo datos de demostración (no editables). Conecta Supabase para gestionar el concurso real —
      instrucciones en <a href="https://github.com" target="_blank" rel="noopener">README.md</a>.
    </div>` : '';

  const cartel = evento.cartel_url ? `
    <div class="hero-cartel"><img src="${escapeHtml(evento.cartel_url)}" alt="Cartel del concurso"></div>` : '';

  const patrocinadores = (evento.patrocinadores || []);
  const colaboradores = (evento.colaboradores || []);

  app.innerHTML = `
    ${demoBanner}
    <section class="hero">
      <div class="hero-eyebrow">Concurso morfológico</div>
      <h1>${escapeHtml(evento.titulo)}</h1>
      <div class="subtitulo">${escapeHtml(evento.subtitulo || '')}</div>
      <div class="hero-meta">
        ${evento.lugar ? `<span>📍 ${escapeHtml(evento.lugar)}</span>` : ''}
        ${evento.fechas ? `<span>🗓 ${escapeHtml(evento.fechas)}</span>` : ''}
        <span>🐎 ${clases.length} clases</span>
      </div>
      ${evento.descripcion ? `<p class="hero-desc">${escapeHtml(evento.descripcion)}</p>` : ''}
      ${cartel}
    </section>

    ${colaboradores.length ? `
    <section class="logo-band">
      <h2>Organiza y colabora</h2>
      <div class="logo-row">${logoRow(colaboradores)}</div>
    </section>` : ''}

    ${patrocinadores.length ? `
    <section class="logo-band">
      <h2>Patrocinadores</h2>
      <div class="logo-row">${logoRow(patrocinadores)}</div>
    </section>` : ''}

    <div class="section-title">
      <h2>Clases del concurso</h2>
      <span class="count">${clases.length} clases</span>
    </div>
    <div class="clases-grid">
      ${clases.map(c => `
        <a class="clase-card" href="#/clase/${encodeURIComponent(c.codigo)}">
          <span class="publicada" ${c.clasificacion_publicada ? '' : 'hidden'} title="Clasificación publicada"></span>
          <span class="codigo">${escapeHtml(c.codigo)}</span>
          <span class="titulo">${escapeHtml(c.titulo)}</span>
        </a>
      `).join('')}
    </div>

    ${isAdmin() ? renderAdminEventoPanel(evento) : ''}
  `;

  if (isAdmin()) wireAdminEventoPanel(evento);
}

function logoRow(items) {
  return items.map(it => {
    if (it.logo_url) {
      return `<span class="logo-chip"><img src="${escapeHtml(it.logo_url)}" alt="${escapeHtml(it.nombre || '')}"></span>`;
    }
    return `<span class="logo-fallback">${escapeHtml(it.nombre || '')}</span>`;
  }).join('');
}

function renderAdminEventoPanel(evento) {
  const patroText = (evento.patrocinadores || []).map(p => `${p.nombre}|${p.logo_url || ''}`).join('\n');
  const colabText = (evento.colaboradores || []).map(p => `${p.nombre}|${p.logo_url || ''}`).join('\n');
  return `
    <div class="admin-panel" id="evento-panel">
      <h3>Editar portada (solo organización)</h3>
      <div class="field"><label>Título</label><input id="ev-titulo" value="${escapeHtml(evento.titulo)}"></div>
      <div class="field"><label>Subtítulo</label><input id="ev-subtitulo" value="${escapeHtml(evento.subtitulo || '')}"></div>
      <div class="field"><label>Lugar</label><input id="ev-lugar" value="${escapeHtml(evento.lugar || '')}"></div>
      <div class="field"><label>Fechas</label><input id="ev-fechas" placeholder="p. ej. 12–14 de septiembre de 2026" value="${escapeHtml(evento.fechas || '')}"></div>
      <div class="field"><label>Descripción</label><textarea id="ev-descripcion">${escapeHtml(evento.descripcion || '')}</textarea></div>
      <div class="field"><label>URL del cartel</label><input id="ev-cartel" placeholder="https://…" value="${escapeHtml(evento.cartel_url || '')}"></div>
      <div class="field"><label>Organiza / colabora — una línea por logo: Nombre|URL de imagen</label><textarea id="ev-colaboradores">${escapeHtml(colabText)}</textarea></div>
      <div class="field"><label>Patrocinadores — una línea por logo: Nombre|URL de imagen</label><textarea id="ev-patrocinadores">${escapeHtml(patroText)}</textarea></div>
      <div style="display:flex; align-items:center; gap:12px;">
        <button class="btn-primary" id="ev-guardar">Guardar portada</button>
        <span class="save-status" id="ev-status"></span>
      </div>
    </div>
  `;
}

function parseLogoLines(text) {
  return text.split('\n').map(l => l.trim()).filter(Boolean).map(line => {
    const [nombre, logo_url] = line.split('|').map(s => (s || '').trim());
    return { nombre, logo_url: logo_url || null };
  });
}

function wireAdminEventoPanel() {
  const btn = document.getElementById('ev-guardar');
  if (!btn) return;
  const status = document.getElementById('ev-status');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      await guardarEvento({
        titulo: document.getElementById('ev-titulo').value.trim(),
        subtitulo: document.getElementById('ev-subtitulo').value.trim(),
        lugar: document.getElementById('ev-lugar').value.trim(),
        fechas: document.getElementById('ev-fechas').value.trim(),
        descripcion: document.getElementById('ev-descripcion').value.trim(),
        cartel_url: document.getElementById('ev-cartel').value.trim(),
        colaboradores: parseLogoLines(document.getElementById('ev-colaboradores').value),
        patrocinadores: parseLogoLines(document.getElementById('ev-patrocinadores').value),
      });
      setSaveStatus(status, 'Guardado ✓', false);
      render();
    } catch (err) {
      setSaveStatus(status, 'Error al guardar', true);
      console.error(err);
    } finally {
      btn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Vista: CLASE (Orden de salida / Clasificación)
// ------------------------------------------------------------
let activeTab = 'salida';

async function renderClase(codigo) {
  app.innerHTML = `<p class="muted" style="padding:60px 0;text-align:center;">Cargando…</p>`;
  const result = await fetchClase(codigo);
  if (!result) {
    app.innerHTML = `<div class="empty-state"><strong>Clase no encontrada</strong><a href="#/">Volver a las clases</a></div>`;
    return;
  }
  const { clase, caballos } = result;
  activeTab = 'salida';
  paintClase(clase, caballos);
}

function paintClase(clase, caballos) {
  const admin = isAdmin();
  const salida = [...caballos].sort((a, b) => (a.dorsal ?? 999) - (b.dorsal ?? 999));
  const clasif = [...caballos].sort((a, b) => {
    if (a.posicion == null && b.posicion == null) return (a.dorsal ?? 0) - (b.dorsal ?? 0);
    if (a.posicion == null) return 1;
    if (b.posicion == null) return -1;
    return a.posicion - b.posicion;
  });

  app.innerHTML = `
    <a class="back-link" href="#/">← Volver a las clases</a>
    <div class="clase-header">
      <div>
        <h1>Clase ${escapeHtml(clase.codigo)}</h1>
        <span class="titulo-clase">${escapeHtml(clase.titulo)}</span>
      </div>
      <span class="badge">${caballos.length} caballos</span>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn" data-tab="salida" role="tab" aria-selected="${activeTab === 'salida'}">Orden de salida</button>
      <button class="tab-btn" data-tab="clasificacion" role="tab" aria-selected="${activeTab === 'clasificacion'}">Clasificación</button>
    </div>

    <div id="tab-panel"></div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      paintClase(clase, caballos);
    });
  });

  const panel = document.getElementById('tab-panel');
  if (activeTab === 'salida') {
    panel.innerHTML = tablaSalida(salida);
  } else {
    panel.innerHTML = (admin ? adminBar(clase) : '') + tablaClasificacion(clasif, clase, admin);
    if (admin) wireClasificacionAdmin(clase, clasif);
  }
}

function tablaSalida(caballos) {
  if (!caballos.length) return `<div class="empty-state"><strong>Sin inscripciones todavía</strong></div>`;
  return `
    <div class="table-wrap">
      <table class="resultados">
        <thead><tr>
          <th>Dorsal</th><th>Nombre</th><th>Nacimiento</th><th>Capa</th><th>Criador / Propietario</th>
        </tr></thead>
        <tbody>
          ${caballos.map(h => `
            <tr>
              <td class="dorsal-cell">${h.dorsal ?? '—'}</td>
              <td class="nombre-cell">${escapeHtml(h.nombre)}
                ${(h.padre || h.madre) ? `<span class="detalle">${escapeHtml(h.padre || '')}${h.padre && h.madre ? ' × ' : ''}${escapeHtml(h.madre || '')}</span>` : ''}
              </td>
              <td>${fmtFecha(h.fecha_nacimiento)}</td>
              <td>${escapeHtml(h.capa || '—')}</td>
              <td>${escapeHtml(h.criador || h.propietario || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function adminBar(clase) {
  return `
    <div class="admin-bar">
      <div class="left">
        <label class="switch">
          <input type="checkbox" id="publicar-toggle" ${clase.clasificacion_publicada ? 'checked' : ''}>
          Publicar esta clasificación al público
        </label>
      </div>
      <span class="save-status" id="clase-status"></span>
    </div>
  `;
}

function tablaClasificacion(caballos, clase, admin) {
  if (!admin && !clase.clasificacion_publicada) {
    return `<div class="empty-state"><strong>Clasificación aún no publicada</strong>La organización la publicará en cuanto los jueces terminen de valorar esta clase.</div>`;
  }
  if (!caballos.length) return `<div class="empty-state"><strong>Sin inscripciones todavía</strong></div>`;

  return `
    <div class="table-wrap">
      <table class="resultados">
        <thead><tr>
          <th>${admin ? 'Posición' : 'Pos.'}</th><th>Dorsal</th><th>Nombre</th>${admin ? '<th>Puntuación</th>' : '<th>Puntuación</th>'}<th>Criador / Propietario</th>
        </tr></thead>
        <tbody>
          ${caballos.map((h, i) => `
            <tr data-id="${h.id}">
              <td class="pos-cell">
                ${admin ? `
                  <div class="pos-editor">
                    <button class="btn-icon" data-move="up" ${i === 0 ? 'disabled' : ''} title="Subir puesto">↑</button>
                    <input type="number" min="1" class="pos-input" value="${h.posicion ?? ''}" placeholder="—">
                    <button class="btn-icon" data-move="down" ${i === caballos.length - 1 ? 'disabled' : ''} title="Bajar puesto">↓</button>
                  </div>
                ` : (h.posicion ?? '—')}
              </td>
              <td class="dorsal-cell">${h.dorsal ?? '—'}</td>
              <td class="nombre-cell">${escapeHtml(h.nombre)}</td>
              <td>${admin ? `<input class="puntuacion-input" value="${escapeHtml(h.puntuacion || '')}" placeholder="p. ej. 87,5">` : escapeHtml(h.puntuacion || '—')}</td>
              <td>${escapeHtml(h.criador || h.propietario || '—')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ${admin ? `<div style="margin-top:16px; display:flex; gap:12px; align-items:center;">
      <button class="btn-primary" id="guardar-clasificacion">Guardar cambios</button>
      <span class="save-status" id="guardar-status"></span>
    </div>` : ''}
  `;
}

function wireClasificacionAdmin(clase, caballos) {
  const status = document.getElementById('clase-status');
  const toggle = document.getElementById('publicar-toggle');
  toggle?.addEventListener('change', async () => {
    try {
      await guardarClase(clase.id, { clasificacion_publicada: toggle.checked });
      clase.clasificacion_publicada = toggle.checked;
      setSaveStatus(status, 'Guardado ✓', false);
    } catch (err) {
      setSaveStatus(status, 'Error al guardar', true);
      toggle.checked = !toggle.checked;
    }
  });

  // orden local en memoria para los botones subir/bajar
  let orden = [...caballos];

  function repintar() {
    const panel = document.getElementById('tab-panel');
    panel.innerHTML = adminBar(clase) + tablaClasificacion(orden, clase, true);
    wireClasificacionAdmin(clase, orden);
  }

  document.querySelectorAll('[data-move]').forEach(btn => {
    btn.addEventListener('click', () => {
      const row = btn.closest('tr');
      const idx = orden.findIndex(h => String(h.id) === row.dataset.id);
      const dir = btn.dataset.move === 'up' ? -1 : 1;
      const swapIdx = idx + dir;
      if (swapIdx < 0 || swapIdx >= orden.length) return;
      [orden[idx], orden[swapIdx]] = [orden[swapIdx], orden[idx]];
      repintar();
    });
  });

  const guardarBtn = document.getElementById('guardar-clasificacion');
  const guardarStatus = document.getElementById('guardar-status');
  guardarBtn?.addEventListener('click', async () => {
    guardarBtn.disabled = true;
    try {
      const rows = document.querySelectorAll('#tab-panel table.resultados tbody tr');
      const updates = [];
      rows.forEach((row, i) => {
        const id = row.dataset.id;
        const posInput = row.querySelector('.pos-input');
        const puntInput = row.querySelector('.puntuacion-input');
        const posicion = posInput.value ? parseInt(posInput.value, 10) : (i + 1);
        const puntuacion = puntInput.value.trim() || null;
        updates.push({ id, posicion, puntuacion });
      });
      await Promise.all(updates.map(u => guardarCaballo(u.id, { posicion: u.posicion, puntuacion: u.puntuacion })));
      setSaveStatus(guardarStatus, 'Clasificación guardada ✓', false);
    } catch (err) {
      console.error(err);
      setSaveStatus(guardarStatus, 'Error al guardar', true);
    } finally {
      guardarBtn.disabled = false;
    }
  });
}
