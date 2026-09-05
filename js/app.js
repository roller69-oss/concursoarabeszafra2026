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

const CRITERIOS = ['t', 'cyc', 'c', 'e', 'm'];
const CRITERIOS_LABEL = { t: 'T', cyc: 'CyC', c: 'C', e: 'E', m: 'M' };

function totalJuez(h, juez) {
  const vals = CRITERIOS.map(c => h[`j${juez}_${c}`]);
  if (vals.every(v => v === null || v === undefined || v === '')) return null;
  return vals.reduce((sum, v) => sum + (Number(v) || 0), 0);
}

function totalFinal(h) {
  const t1 = totalJuez(h, 1);
  const t2 = totalJuez(h, 2);
  if (t1 == null && t2 == null) return null;
  if (t1 == null) return t2;
  if (t2 == null) return t1;
  return (t1 + t2) / 2;
}

function fmtNum(n) {
  if (n === null || n === undefined || n === '') return '—';
  const num = Number(n);
  return Number.isInteger(num) ? String(num) : num.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function tituloConLineas(titulo) {
  return titulo.split('|').map(l => escapeHtml(l.trim())).join('<br>');
}

function tituloPlano(titulo) {
  return escapeHtml(titulo.split('|').map(l => l.trim()).join(' · '));
}

function lineaJueces(j1, j2) {
  const partes = [];
  if (j1 && j1.trim()) partes.push(`JUEZ I, ${j1.trim()}`);
  if (j2 && j2.trim()) partes.push(`JUEZ II, ${j2.trim()}`);
  return partes.join(' - ');
}

function ordinal(n) {
  if (n === null || n === undefined) return '—';
  return `${n}º`;
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
      colaboradores: [],
      juez1_general: null,
      juez2_general: null,
      directo_url: null
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

async function fetchTodosCaballos() {
  if (DEMO_MODE) {
    const out = [];
    window.DEMO_CLASES.forEach(c => {
      c.caballos.forEach(h => out.push({ ...h, clase_codigo: c.codigo, clase_titulo: c.titulo }));
    });
    return out;
  }
  const [caballosRes, clases] = await Promise.all([
    supa.from('caballos').select('id, nombre, dorsal, posicion, clase_id, clases(codigo, titulo)'),
    fetchClases()
  ]);
  if (caballosRes.error) throw caballosRes.error;
  const ordenPorClaseId = {};
  clases.forEach(c => { ordenPorClaseId[c.id] = c.orden; });
  const out = caballosRes.data.map(r => ({
    id: r.id, nombre: r.nombre, dorsal: r.dorsal, posicion: r.posicion,
    clase_codigo: r.clases?.codigo, clase_titulo: r.clases?.titulo,
    _orden: ordenPorClaseId[r.clase_id] ?? 999
  }));
  out.sort((a, b) => (a._orden - b._orden) || ((a.dorsal ?? 0) - (b.dorsal ?? 0)));
  return out;
}

async function fetchCampeonatos() {
  if (DEMO_MODE) return window.DEMO_CAMPEONATOS;
  const { data, error } = await supa.from('campeonatos').select('*').order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

async function fetchCampeonato(codigo) {
  if (DEMO_MODE) return window.DEMO_CAMPEONATOS.find(c => c.codigo === codigo) || null;
  const { data, error } = await supa.from('campeonatos').select('*').eq('codigo', codigo).single();
  if (error) throw error;
  return data;
}

async function guardarCampeonato(id, cambios) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('campeonatos').update(cambios).eq('id', id);
  if (error) throw error;
}

const MEDALLA_PUNTOS = { oro: 4, plata: 2, bronce: 1 };
const MEDALLA_LABEL = { oro: '🥇 Oro', plata: '🥈 Plata', bronce: '🥉 Bronce' };
const MEDALLA_ETIQUETA = ['🥇 Oro', '🥈 Plata', '🥉 Bronce'];

function puntosMedalla(medalla) {
  return MEDALLA_PUNTOS[medalla] || 0;
}

async function fetchVotosCampeonato(campeonatoId) {
  if (DEMO_MODE) return [];
  const { data, error } = await supa.from('campeonato_votos').select('*').eq('campeonato_id', campeonatoId);
  if (error) throw error;
  return data;
}

async function guardarVotosCampeonato(filas) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('campeonato_votos').upsert(filas, { onConflict: 'campeonato_id,caballo_id' });
  if (error) throw error;
}

async function fetchTrofeos() {
  if (DEMO_MODE) return window.DEMO_TROFEOS;
  const { data, error } = await supa.from('trofeos').select('*').order('orden', { ascending: true });
  if (error) throw error;
  return data;
}

async function guardarTrofeo(id, cambios) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('trofeos').update(cambios).eq('id', id);
  if (error) throw error;
}

async function fetchSorteo() {
  if (DEMO_MODE) return window.DEMO_SORTEO;
  const { data, error } = await supa.from('sorteo').select('*').eq('id', 1).single();
  if (error) throw error;
  return data;
}

async function guardarSorteo(cambios) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('sorteo').update(cambios).eq('id', 1);
  if (error) throw error;
}

async function fetchAnuncios() {
  if (DEMO_MODE) return window.DEMO_ANUNCIOS;
  const { data, error } = await supa.from('anuncios').select('*').order('creado_en', { ascending: false });
  if (error) throw error;
  return data;
}

async function crearAnuncio({ titulo, texto }) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('anuncios').insert({ titulo: titulo || null, texto });
  if (error) throw error;
}

async function eliminarAnuncio(id) {
  if (DEMO_MODE) return;
  const { error } = await supa.from('anuncios').delete().eq('id', id);
  if (error) throw error;
}

async function fetchVisitas() {
  if (DEMO_MODE) return null;
  const { data, error } = await supa.from('visitas').select('total').eq('id', 1).single();
  if (error) return null;
  return data.total;
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
  if (!DEMO_MODE && !isAdmin()) {
    supa.rpc('incrementar_visitas').then(null, () => {}); // silencioso, no bloquea la carga
  }
  render();
});

function currentRoute() {
  const hash = location.hash.replace(/^#\/?/, '');
  if (!hash) return { name: 'home' };
  if (['anuncios', 'clases', 'campeonatos', 'trofeos', 'sorteo', 'directo'].includes(hash)) return { name: 'home', scrollTo: hash };
  const [seg, param] = hash.split('/');
  if (seg === 'clase' && param) return { name: 'clase', codigo: decodeURIComponent(param) };
  if (seg === 'campeonato' && param) return { name: 'campeonato', codigo: decodeURIComponent(param) };
  return { name: 'home' };
}

async function render() {
  const route = currentRoute();
  const quicknav = document.querySelector('.quicknav');
  if (quicknav) quicknav.hidden = route.name !== 'home';
  try {
    if (route.name === 'clase') {
      await renderClase(route.codigo);
    } else if (route.name === 'campeonato') {
      await renderCampeonato(route.codigo);
    } else {
      await renderHome();
    }
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="empty-state"><strong>No se pudieron cargar los datos.</strong>${escapeHtml(err.message || err)}</div>`;
  }
  if (route.scrollTo) {
    const el = document.getElementById(route.scrollTo);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
  }
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}

// ------------------------------------------------------------
// Vista: PORTADA
// ------------------------------------------------------------
async function renderHome() {
  app.innerHTML = `<p class="muted" style="padding:60px 0;text-align:center;">Cargando…</p>`;
  const [evento, clases, campeonatos, trofeos, sorteo, anuncios] = await Promise.all([
    fetchEvento(), fetchClases(), fetchCampeonatos(), fetchTrofeos(), fetchSorteo(), fetchAnuncios()
  ]);
  const visitas = isAdmin() ? await fetchVisitas() : null;

  const urlCartel = evento.cartel_url || 'assets/cartel.jpg';
  const cartel = `
    <div class="hero-cartel"><img src="${escapeHtml(urlCartel)}" alt="Cartel del concurso" onerror="this.closest('.hero-cartel').remove()"></div>`;

  const patrocinadores = (evento.patrocinadores || []);
  const colaboradores = (evento.colaboradores || []);

  app.innerHTML = `
    <section class="hero">
      <h1 class="sr-only">${escapeHtml(evento.titulo)}</h1>
      ${cartel}
    </section>

    <div class="section-title" id="anuncios">
      <h2>Tablón de anuncios</h2>
    </div>
    <div id="anuncios-section"></div>

    ${(evento.directo_url || isAdmin()) ? `
    <div class="section-title" id="directo">
      <h2>En directo</h2>
    </div>
    ${evento.directo_url ? `
      <a class="btn-directo" href="${escapeHtml(evento.directo_url)}" target="_blank" rel="noopener">
        ▶ Ver el concurso en directo (YouTube)
      </a>
    ` : `<p class="muted small">Añade el enlace de YouTube en "Editar portada", campo "URL para ver en directo", cuando lo tengas.</p>`}
    ` : ''}

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

    <div class="section-title" id="clases">
      <h2>Clases del concurso</h2>
      <span class="count">${clases.length} clases</span>
    </div>
    <div class="clases-grid">
      ${clases.map(c => `
        <a class="clase-card" href="#/clase/${encodeURIComponent(c.codigo)}">
          <span class="publicada" ${c.clasificacion_publicada ? '' : 'hidden'} title="Clasificación publicada"></span>
          <span class="titulo">${tituloConLineas(c.titulo)}</span>
        </a>
      `).join('')}
    </div>

    <div class="section-title" id="campeonatos">
      <h2>Campeonatos</h2>
      <span class="count">${campeonatos.length}</span>
    </div>
    <div class="clases-grid campeonatos-grid">
      ${campeonatos.map(camp => `
        <a class="clase-card campeonato-card" href="#/campeonato/${encodeURIComponent(camp.codigo)}">
          <span class="publicada" ${camp.publicado ? '' : 'hidden'} title="Publicado"></span>
          <span class="titulo">${escapeHtml(camp.titulo)}</span>
          <span class="campeonato-estado">${camp.publicado && camp.oro_id ? '🏆 Resuelto' : 'Pendiente'}</span>
        </a>
      `).join('')}
    </div>
    ${lineaJueces(evento.juez1_general, evento.juez2_general) ? `<p class="jueces-linea jueces-linea-seccion">${escapeHtml(lineaJueces(evento.juez1_general, evento.juez2_general))}</p>` : ''}

    <div class="section-title" id="trofeos">
      <h2>Trofeos</h2>
      <span class="count">${trofeos.length}</span>
    </div>
    <div id="trofeos-section"></div>
    ${lineaJueces(evento.juez1_general, evento.juez2_general) ? `<p class="jueces-linea jueces-linea-seccion">${escapeHtml(lineaJueces(evento.juez1_general, evento.juez2_general))}</p>` : ''}

    <div class="section-title" id="sorteo">
      <h2>Sorteo</h2>
    </div>
    <div id="sorteo-section"></div>

    ${isAdmin() ? `<p class="visitas-contador">👁 ${visitas != null ? visitas.toLocaleString('es-ES') : '—'} visitas registradas (orientativo)</p>` : ''}
    ${isAdmin() ? renderAdminEventoPanel(evento) : ''}
  `;

  await renderTrofeos(trofeos);
  renderSorteo(sorteo);
  renderAnuncios(anuncios);
  const btnDirecto = document.getElementById('quicknav-directo');
  if (btnDirecto) btnDirecto.hidden = !(evento.directo_url || isAdmin());
  if (isAdmin()) {
    wireAdminEventoPanel(evento);
    wireTrofeosAdmin(trofeos);
    wireSorteoAdmin(sorteo);
    wireAnunciosAdmin(anuncios);
  }
}

// ------------------------------------------------------------
// Trofeos (en la portada)
// ------------------------------------------------------------
function trofeoGanadorTexto(t) {
  if (t.tipo === 'texto') return t.ganador_texto || null;
  return t._caballo ? `${t._caballo.nombre} (dorsal ${t._caballo.dorsal ?? '—'}, clase ${t._caballo.clase_codigo})` : null;
}

async function renderTrofeos(trofeos) {
  const cont = document.getElementById('trofeos-section');
  if (!cont) return;
  cont.innerHTML = `<p class="muted small">Cargando trofeos…</p>`;

  let caballos = [];
  if (trofeos.some(t => t.tipo === 'animal')) {
    caballos = await fetchTodosCaballos();
  }
  trofeos.forEach(t => {
    if (t.tipo === 'animal' && t.ganador_caballo_id) {
      t._caballo = caballos.find(h => String(h.id) === String(t.ganador_caballo_id)) || null;
    }
  });

  const admin = isAdmin();

  cont.innerHTML = `
    <div class="trofeos-grid">
      ${trofeos.map(t => `
        <div class="trofeo-card" data-id="${t.id}" data-tipo="${t.tipo}">
          <span class="trofeo-titulo">🏅 ${escapeHtml(t.titulo)}</span>
          ${admin ? (
            t.tipo === 'texto'
              ? `<input type="text" class="trofeo-input-texto" placeholder="Nombre del presentador" value="${escapeHtml(t.ganador_texto || '')}">`
              : `<select class="trofeo-select">
                   <option value="">— Sin adjudicar —</option>
                   ${agruparPorClase(caballos).map(grupo => `
                     <optgroup label="${escapeHtml(grupo.clase_titulo)}">
                       ${grupo.caballos.map(h => `<option value="${h.id}" ${String(t.ganador_caballo_id) === String(h.id) ? 'selected' : ''}>${escapeHtml(h.nombre)} (dorsal ${h.dorsal ?? '—'})</option>`).join('')}
                     </optgroup>
                   `).join('')}
                 </select>`
          ) : `<span class="trofeo-ganador">${trofeoGanadorTexto(t) ? escapeHtml(trofeoGanadorTexto(t)) : '<em>Sin adjudicar todavía</em>'}</span>`}
        </div>
      `).join('')}
    </div>
    ${admin ? `<div style="margin-top:14px; display:flex; gap:12px; align-items:center;">
      <button class="btn-primary" id="guardar-trofeos">Guardar trofeos</button>
      <span class="save-status" id="trofeos-status"></span>
    </div>` : ''}
  `;
}

function agruparPorClase(caballos) {
  const grupos = {};
  const orden = [];
  caballos.forEach(h => {
    const key = h.clase_codigo || '—';
    if (!grupos[key]) { grupos[key] = { clase_titulo: h.clase_titulo || key, caballos: [] }; orden.push(key); }
    grupos[key].caballos.push(h);
  });
  return orden.map(k => grupos[k]);
}

function wireTrofeosAdmin(trofeos) {
  const btn = document.getElementById('guardar-trofeos');
  if (!btn) return;
  const status = document.getElementById('trofeos-status');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const cards = document.querySelectorAll('.trofeo-card');
      const updates = [];
      cards.forEach(card => {
        const id = card.dataset.id;
        if (card.dataset.tipo === 'texto') {
          const val = card.querySelector('.trofeo-input-texto').value.trim();
          updates.push({ id, cambios: { ganador_texto: val || null } });
        } else {
          const val = card.querySelector('.trofeo-select').value;
          updates.push({ id, cambios: { ganador_caballo_id: val ? Number(val) : null } });
        }
      });
      await Promise.all(updates.map(u => guardarTrofeo(u.id, u.cambios)));
      updates.forEach(u => {
        const t = trofeos.find(x => String(x.id) === u.id);
        if (t) Object.assign(t, u.cambios);
      });
      setSaveStatus(status, 'Trofeos guardados ✓', false);
      await renderTrofeos(trofeos);
      wireTrofeosAdmin(trofeos);
    } catch (err) {
      console.error(err);
      setSaveStatus(status, 'Error al guardar', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Sorteo (en la portada)
// ------------------------------------------------------------
function renderSorteo(sorteo) {
  const cont = document.getElementById('sorteo-section');
  if (!cont) return;
  const admin = isAdmin();
  const ganador = sorteo.ganador && sorteo.ganador.trim();

  cont.innerHTML = `
    <div class="sorteo-card">
      <div class="bombo" aria-hidden="true">
        <svg class="bombo-aro" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="58" fill="none" stroke="var(--oro)" stroke-width="4"/>
          <circle cx="60" cy="60" r="58" fill="none" stroke="var(--verde-900)" stroke-width="2" stroke-dasharray="2 6"/>
          <circle cx="60" cy="2" r="3" fill="var(--granate)"/>
          <circle cx="60" cy="118" r="3" fill="var(--granate)"/>
          <circle cx="2" cy="60" r="3" fill="var(--granate)"/>
          <circle cx="118" cy="60" r="3" fill="var(--granate)"/>
        </svg>
        <img class="bombo-imagen" src="assets/sorteo.jpg" alt="Sorteo de un jamón entre los participantes">
      </div>
      <div class="sorteo-info">
        <h3>${escapeHtml(sorteo.premio || 'Jamón')}</h3>
        <p>${escapeHtml(sorteo.descripcion || '')}</p>
        ${ganador
          ? `<div class="sorteo-ganador">🎉 Ganador: <strong>${escapeHtml(ganador)}</strong></div>`
          : `<div class="sorteo-pendiente">Aún no se ha realizado el sorteo</div>`}
      </div>
    </div>
    ${admin ? `
      <div class="admin-panel" id="sorteo-admin">
        <h3>Editar sorteo (solo organización)</h3>
        <div class="field"><label>Premio</label><input id="sorteo-premio" value="${escapeHtml(sorteo.premio || '')}"></div>
        <div class="field"><label>Descripción</label><textarea id="sorteo-descripcion">${escapeHtml(sorteo.descripcion || '')}</textarea></div>
        <div class="field"><label>Nombre del ganador (déjalo vacío hasta que se celebre el sorteo)</label><input id="sorteo-ganador" value="${escapeHtml(sorteo.ganador || '')}" placeholder="Se rellena el día del sorteo"></div>
        <div style="display:flex; align-items:center; gap:12px;">
          <button class="btn-primary" id="sorteo-guardar">Guardar sorteo</button>
          <span class="save-status" id="sorteo-status"></span>
        </div>
      </div>
    ` : ''}
  `;
}

function wireSorteoAdmin(sorteo) {
  const btn = document.getElementById('sorteo-guardar');
  if (!btn) return;
  const status = document.getElementById('sorteo-status');
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try {
      const cambios = {
        premio: document.getElementById('sorteo-premio').value.trim(),
        descripcion: document.getElementById('sorteo-descripcion').value.trim(),
        ganador: document.getElementById('sorteo-ganador').value.trim() || null,
      };
      await guardarSorteo(cambios);
      Object.assign(sorteo, cambios);
      setSaveStatus(status, 'Guardado ✓', false);
      renderSorteo(sorteo);
      wireSorteoAdmin(sorteo);
    } catch (err) {
      console.error(err);
      setSaveStatus(status, 'Error al guardar', true);
    } finally {
      btn.disabled = false;
    }
  });
}

// ------------------------------------------------------------
// Tablón de anuncios (en la portada)
// ------------------------------------------------------------
const ANUNCIOS_POR_PAGINA = 5;
let anunciosVisibles = ANUNCIOS_POR_PAGINA;

function fmtFechaHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${yyyy} · ${hh}:${min}`;
}

function renderAnuncios(anuncios) {
  const cont = document.getElementById('anuncios-section');
  if (!cont) return;
  const admin = isAdmin();
  const visibles = anuncios.slice(0, anunciosVisibles);
  const quedanMas = anuncios.length > anunciosVisibles;

  cont.innerHTML = `
    ${admin ? `
      <div class="admin-panel" id="anuncio-form">
        <h3>Publicar anuncio</h3>
        <div class="field"><label>Título (opcional)</label><input id="anuncio-titulo" placeholder="p. ej. Cambio de horario"></div>
        <div class="field"><label>Mensaje</label><textarea id="anuncio-texto" placeholder="Escribe aquí la información para los participantes"></textarea></div>
        <div style="display:flex; align-items:center; gap:12px;">
          <button class="btn-primary" id="anuncio-publicar">Publicar anuncio</button>
          <span class="save-status" id="anuncio-status"></span>
        </div>
      </div>
    ` : ''}
    ${anuncios.length === 0
      ? `<div class="empty-state"><strong>Todavía no hay anuncios</strong></div>`
      : `
      <div class="anuncios-lista">
        ${visibles.map(a => `
          <div class="anuncio-card" data-id="${a.id}">
            <div class="anuncio-cabecera">
              <span class="anuncio-fecha">${fmtFechaHora(a.creado_en)}</span>
              ${admin ? `<button class="btn-ghost btn-borrar-anuncio" data-id="${a.id}">Eliminar</button>` : ''}
            </div>
            ${a.titulo ? `<strong class="anuncio-titulo">${escapeHtml(a.titulo)}</strong>` : ''}
            <p class="anuncio-texto">${escapeHtml(a.texto)}</p>
          </div>
        `).join('')}
      </div>
      ${quedanMas ? `<div style="margin-top:14px; text-align:center;"><button class="btn-ghost" id="anuncios-ver-mas">Ver anteriores</button></div>` : ''}
    `}
  `;

  document.getElementById('anuncios-ver-mas')?.addEventListener('click', () => {
    anunciosVisibles += ANUNCIOS_POR_PAGINA;
    renderAnuncios(anuncios);
    if (isAdmin()) wireAnunciosAdmin(anuncios);
  });

  document.querySelectorAll('.btn-borrar-anuncio').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar este anuncio? No se puede deshacer.')) return;
      try {
        await eliminarAnuncio(btn.dataset.id);
        const idx = anuncios.findIndex(a => String(a.id) === btn.dataset.id);
        if (idx >= 0) anuncios.splice(idx, 1);
        renderAnuncios(anuncios);
        if (isAdmin()) wireAnunciosAdmin(anuncios);
      } catch (err) {
        console.error(err);
        alert('No se pudo eliminar, inténtalo de nuevo.');
      }
    });
  });
}

function wireAnunciosAdmin(anuncios) {
  const btn = document.getElementById('anuncio-publicar');
  if (!btn) return;
  const status = document.getElementById('anuncio-status');
  btn.addEventListener('click', async () => {
    const texto = document.getElementById('anuncio-texto').value.trim();
    if (!texto) {
      setSaveStatus(status, 'Escribe el mensaje antes de publicar', true);
      return;
    }
    const titulo = document.getElementById('anuncio-titulo').value.trim();
    btn.disabled = true;
    try {
      await crearAnuncio({ titulo, texto });
      anunciosVisibles = ANUNCIOS_POR_PAGINA;
      const fresh = await fetchAnuncios();
      anuncios.length = 0;
      anuncios.push(...fresh);
      renderAnuncios(anuncios);
      wireAnunciosAdmin(anuncios);
      setSaveStatus(document.getElementById('anuncio-status'), 'Anuncio publicado ✓', false);
    } catch (err) {
      console.error(err);
      setSaveStatus(status, 'Error al publicar', true);
    } finally {
      btn.disabled = false;
    }
  });
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
      <div class="field"><label>URL para ver en directo (YouTube) — déjalo vacío hasta que empiece la emisión</label><input id="ev-directo" placeholder="https://youtube.com/…" value="${escapeHtml(evento.directo_url || '')}"></div>
      <div class="field"><label>Organiza / colabora — una línea por logo: Nombre|URL de imagen</label><textarea id="ev-colaboradores">${escapeHtml(colabText)}</textarea></div>
      <div class="field"><label>Patrocinadores — una línea por logo: Nombre|URL de imagen</label><textarea id="ev-patrocinadores">${escapeHtml(patroText)}</textarea></div>
      <div class="field"><label>Juez I general (se muestra al final de Campeonatos y Trofeos)</label><input id="ev-juez1" placeholder="D. Nombre Apellido" value="${escapeHtml(evento.juez1_general || '')}"></div>
      <div class="field"><label>Juez II general</label><input id="ev-juez2" placeholder="D. Nombre Apellido" value="${escapeHtml(evento.juez2_general || '')}"></div>
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
        directo_url: document.getElementById('ev-directo').value.trim() || null,
        colaboradores: parseLogoLines(document.getElementById('ev-colaboradores').value),
        patrocinadores: parseLogoLines(document.getElementById('ev-patrocinadores').value),
        juez1_general: document.getElementById('ev-juez1').value.trim() || null,
        juez2_general: document.getElementById('ev-juez2').value.trim() || null,
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
  const clasif = caballos
    .filter(h => !h.no_presentado && totalFinal(h) != null)
    .sort((a, b) => {
      if (a.posicion != null && b.posicion != null) return a.posicion - b.posicion;
      if (a.posicion != null) return -1;
      if (b.posicion != null) return 1;
      return totalFinal(b) - totalFinal(a);
    });

  app.innerHTML = `
    <a class="back-link" href="#/">← Volver a las clases</a>
    <div class="clase-header">
      <div>
        <h1>Clase ${escapeHtml(clase.codigo)}</h1>
        <span class="titulo-clase">${tituloPlano(clase.titulo)}</span>
      </div>
      <span class="badge">${caballos.length} caballos</span>
    </div>

    <div class="tabs" role="tablist">
      <button class="tab-btn" data-tab="salida" role="tab" aria-selected="${activeTab === 'salida'}">Orden de salida</button>
      <button class="tab-btn" data-tab="clasificacion" role="tab" aria-selected="${activeTab === 'clasificacion'}">Clasificación</button>
    </div>

    <div id="tab-panel"></div>

    <div class="jueces-clase" id="jueces-clase">
      ${admin ? `
        <div class="jueces-editor">
          <label>Juez I <input type="text" id="juez1-input" value="${escapeHtml(clase.juez1 || '')}" placeholder="D. Nombre Apellido"></label>
          <label>Juez II <input type="text" id="juez2-input" value="${escapeHtml(clase.juez2 || '')}" placeholder="D. Nombre Apellido"></label>
          <button class="btn-ghost" id="guardar-jueces">Guardar jueces</button>
          <span class="save-status" id="jueces-status"></span>
        </div>
      ` : (lineaJueces(clase.juez1, clase.juez2) ? `<p class="jueces-linea">${escapeHtml(lineaJueces(clase.juez1, clase.juez2))}</p>` : '')}
    </div>
  `;

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTab = btn.dataset.tab;
      paintClase(clase, caballos);
    });
  });

  if (admin) {
    const guardarJuecesBtn = document.getElementById('guardar-jueces');
    const juecesStatus = document.getElementById('jueces-status');
    guardarJuecesBtn?.addEventListener('click', async () => {
      guardarJuecesBtn.disabled = true;
      try {
        const cambios = {
          juez1: document.getElementById('juez1-input').value.trim() || null,
          juez2: document.getElementById('juez2-input').value.trim() || null,
        };
        await guardarClase(clase.id, cambios);
        Object.assign(clase, cambios);
        setSaveStatus(juecesStatus, 'Guardado ✓', false);
      } catch (err) {
        console.error(err);
        setSaveStatus(juecesStatus, 'Error al guardar', true);
      } finally {
        guardarJuecesBtn.disabled = false;
      }
    });
  }

  const panel = document.getElementById('tab-panel');
  if (activeTab === 'salida') {
    panel.innerHTML = tablaSalida(salida, admin, clase.codigo);
    if (admin) wireOrdenSalidaAdmin(clase, salida, caballos);
  } else {
    panel.innerHTML = (admin ? adminBar(clase) : '') + tablaClasificacion(clasif, clase, admin);
    wireVerNotas();
    if (admin) wireClasificacionAdmin(clase, clasif, caballos);
  }
}

function wireVerNotas() {
  document.querySelectorAll('.btn-ver-notas').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(`notas-${btn.dataset.toggle}`);
      const abierto = !panel.hidden;
      panel.hidden = abierto;
      btn.textContent = abierto ? 'Ver notas' : 'Ocultar notas';
    });
  });
}

// ------------------------------------------------------------
// Pestaña: ORDEN DE SALIDA — la hoja de trabajo con las notas
// ------------------------------------------------------------
const CLASES_HEMBRA = ['1A', '1B', '3', '4', '7', '8', '9', '13'];

function tablaSalida(caballos, admin, claseCodigo) {
  if (!caballos.length) return `<div class="empty-state"><strong>Sin inscripciones todavía</strong></div>`;
  const esHembra = CLASES_HEMBRA.includes(claseCodigo);
  return `
    <div class="caballos-clasif">
      ${caballos.map(h => `
        <div class="caballo-card ${h.no_presentado ? 'caballo-no-presentado' : ''}" data-id="${h.id}">
          <div class="caballo-card-head">
            <div class="pos-block"><span class="dorsal-circle">${h.dorsal ?? '—'}</span></div>
            <div class="caballo-card-info">
              <strong class="caballo-nombre">${escapeHtml(h.nombre)}${h.capa ? ` <span class="caballo-capa">(${escapeHtml(h.capa)})</span>` : ''}</strong>
              <span class="caballo-sub">
                ${esHembra ? 'Hija' : 'Hijo'} de ${escapeHtml(h.padre || '—')} y ${escapeHtml(h.madre || '—')}${h.abuelo_materno ? ` por ${escapeHtml(h.abuelo_materno)}` : ''}
              </span>
              <span class="caballo-meta">
                Nacimiento: ${fmtFecha(h.fecha_nacimiento)} · Criador: ${escapeHtml(h.criador || '—')} · Propietario: ${escapeHtml(h.propietario || '—')}
              </span>
            </div>
            ${admin
              ? `<label class="chk-no-presentado-label"><input type="checkbox" class="chk-no-presentado" data-id="${h.id}" ${h.no_presentado ? 'checked' : ''}> No presentado</label>`
              : (h.no_presentado ? `<span class="badge-no-presentado">No presentado</span>` : '')}
          </div>
          ${scoreTable(h, admin)}
        </div>
      `).join('')}
    </div>
    ${admin ? `<div style="margin-top:10px; display:flex; gap:12px; align-items:center;">
      <button class="btn-primary" id="guardar-salida">Guardar notas</button>
      <span class="save-status" id="guardar-salida-status"></span>
    </div>` : ''}
  `;
}

function leerNotasDeTarjeta(card) {
  const h = {};
  card.querySelectorAll('.score-input').forEach(inp => {
    const raw = inp.value.trim().replace(',', '.');
    const num = raw === '' ? null : Number(raw);
    h[`j${inp.dataset.juez}_${inp.dataset.criterio}`] = (num === null || isNaN(num)) ? null : num;
  });
  return h;
}

function recalcularTarjeta(card) {
  const notas = leerNotasDeTarjeta(card);
  const t1 = totalJuez(notas, 1);
  const t2 = totalJuez(notas, 2);
  card.querySelector('[data-total-juez="1"]').textContent = fmtNum(t1);
  card.querySelector('[data-total-juez="2"]').textContent = fmtNum(t2);
  card.querySelector('[data-total-final]').textContent = fmtNum(totalFinal(notas));
}

function wireOrdenSalidaAdmin(clase, salida, todosCaballos) {
  document.querySelectorAll('.score-input').forEach(inp => {
    inp.addEventListener('input', () => recalcularTarjeta(inp.closest('.caballo-card')));
  });

  document.querySelectorAll('.chk-no-presentado').forEach(chk => {
    chk.addEventListener('change', async () => {
      const card = chk.closest('.caballo-card');
      card.classList.toggle('caballo-no-presentado', chk.checked);
      try {
        await guardarCaballo(chk.dataset.id, { no_presentado: chk.checked });
        const h = todosCaballos.find(x => String(x.id) === chk.dataset.id);
        if (h) h.no_presentado = chk.checked;
      } catch (err) {
        console.error(err);
        chk.checked = !chk.checked;
        card.classList.toggle('caballo-no-presentado', chk.checked);
        alert('No se pudo guardar, inténtalo de nuevo.');
      }
    });
  });

  const guardarBtn = document.getElementById('guardar-salida');
  const status = document.getElementById('guardar-salida-status');
  guardarBtn?.addEventListener('click', async () => {
    guardarBtn.disabled = true;
    try {
      const cards = document.querySelectorAll('#tab-panel .caballo-card');
      const updates = [];
      cards.forEach(card => {
        const id = card.dataset.id;
        const notas = leerNotasDeTarjeta(card);
        updates.push({ id, ...notas });
      });
      await Promise.all(updates.map(u => {
        const { id, ...cambios } = u;
        return guardarCaballo(id, cambios);
      }));
      // reflejar los cambios en memoria para que la pestaña Clasificación los vea sin recargar
      updates.forEach(u => {
        const h = todosCaballos.find(x => String(x.id) === u.id);
        if (h) Object.assign(h, u);
      });
      setSaveStatus(status, 'Notas guardadas ✓', false);
    } catch (err) {
      console.error(err);
      setSaveStatus(status, 'Error al guardar', true);
    } finally {
      guardarBtn.disabled = false;
    }
  });
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

function scoreTable(h, admin) {
  const fila = (juez) => CRITERIOS.map(c => {
    const val = h[`j${juez}_${c}`];
    return admin
      ? `<td><input type="text" inputmode="decimal" class="score-input" data-juez="${juez}" data-criterio="${c}" value="${val ?? ''}"></td>`
      : `<td>${fmtNum(val)}</td>`;
  }).join('');

  return `
    <div class="score-sheet">
      <table class="mini-score-table">
        <thead><tr>
          <th>Puntos</th>${CRITERIOS.map(c => `<th>${CRITERIOS_LABEL[c]}</th>`).join('')}<th>Total</th>
        </tr></thead>
        <tbody>
          <tr><th>Juez I</th>${fila(1)}<td class="total-juez" data-total-juez="1">${fmtNum(totalJuez(h, 1))}</td></tr>
          <tr><th>Juez II</th>${fila(2)}<td class="total-juez" data-total-juez="2">${fmtNum(totalJuez(h, 2))}</td></tr>
        </tbody>
      </table>
      <div class="total-final"><span>Total (media de los 2 jueces)</span><strong data-total-final>${fmtNum(totalFinal(h))}</strong></div>
    </div>
  `;
}

// ------------------------------------------------------------
// Pestaña: CLASIFICACIÓN — resumen, solo caballos ya puntuados
// ------------------------------------------------------------
function tablaClasificacion(caballos, clase, admin) {
  if (!admin && !clase.clasificacion_publicada) {
    return `<div class="empty-state"><strong>Clasificación aún no publicada</strong>La organización la publicará en cuanto los jueces terminen de valorar esta clase.</div>`;
  }
  if (!caballos.length) {
    return `<div class="empty-state"><strong>Todavía no hay caballos puntuados</strong>En cuanto se anoten notas en "Orden de salida", aparecerán aquí.</div>`;
  }

  return `
    <div class="caballos-clasif">
      ${caballos.map((h, i) => `
        <div class="resumen-card" data-id="${h.id}">
          <div class="resumen-row">
            <div class="pos-block">
              ${admin
                ? `<input type="number" min="1" class="pos-input-clasif" value="${h.posicion ?? (i + 1)}">`
                : `<span class="pos-num pos-num-public">${h.posicion != null ? ordinal(h.posicion) : (i + 1) + 'º'}</span>`}
            </div>
            <div class="resumen-info">
              <strong class="caballo-nombre">${escapeHtml(h.nombre)}</strong>
              <span class="dorsal-grande dorsal-grande-publico">Dorsal ${h.dorsal ?? '—'}</span>
            </div>
            <div class="resumen-total">${fmtNum(totalFinal(h))}</div>
            <button class="btn-ghost btn-ver-notas" data-toggle="${h.id}">Ver notas</button>
          </div>
          <div class="detalle-notas" id="notas-${h.id}" hidden>${scoreTable(h, false)}</div>
        </div>
      `).join('')}
    </div>
    ${admin ? `
      <p class="muted small">Cada casilla ya trae un puesto sugerido según la puntuación — cámbialo si no es el orden final que quieres, y pulsa "Guardar cambios" para que quede guardado de verdad.</p>
      <div style="margin-top:10px; display:flex; gap:12px; align-items:center;">
        <button class="btn-primary" id="guardar-clasificacion">Guardar cambios</button>
        <span class="save-status" id="guardar-status"></span>
      </div>` : ''}
  `;
}

// ------------------------------------------------------------
// Vista: CAMPEONATO (Oro / Plata / Bronce)
// ------------------------------------------------------------
async function renderCampeonato(codigo) {
  app.innerHTML = `<p class="muted" style="padding:60px 0;text-align:center;">Cargando…</p>`;
  const camp = await fetchCampeonato(codigo);
  if (!camp) {
    app.innerHTML = `<div class="empty-state"><strong>Campeonato no encontrado</strong><a href="#/">Volver a la portada</a></div>`;
    return;
  }
  const [todosCaballos, votos] = await Promise.all([fetchTodosCaballos(), fetchVotosCampeonato(camp.id)]);
  const admin = isAdmin();

  const clasesFeeder = camp.clases || [];
  const votosPorCaballo = {};
  votos.forEach(v => { votosPorCaballo[v.caballo_id] = v; });

  const candidatos = todosCaballos
    .filter(h => clasesFeeder.includes(h.clase_codigo) && h.posicion != null && h.posicion <= 3)
    .map(h => {
      const v = votosPorCaballo[h.id] || {};
      const total = puntosMedalla(v.juez1_medalla) + puntosMedalla(v.juez2_medalla);
      return { ...h, juez1_medalla: v.juez1_medalla || '', juez2_medalla: v.juez2_medalla || '', posicion_final: v.posicion_final ?? null, total };
    })
    .sort((a, b) => {
      if (a.posicion_final != null && b.posicion_final != null) return a.posicion_final - b.posicion_final;
      if (a.posicion_final != null) return -1;
      if (b.posicion_final != null) return 1;
      return b.total - a.total;
    });

  app.innerHTML = `
    <a class="back-link" href="#/">← Volver a la portada</a>
    <div class="clase-header">
      <div><h1>${escapeHtml(camp.titulo)}</h1></div>
      <span class="badge">${clasesFeeder.map(c => 'Clase ' + c).join(' · ')}</span>
    </div>

    ${admin ? `
      <div class="admin-bar">
        <div class="left">
          <label class="switch">
            <input type="checkbox" id="publicar-campeonato-toggle" ${camp.publicado ? 'checked' : ''}>
            Publicar este campeonato al público
          </label>
        </div>
        <span class="save-status" id="campeonato-status"></span>
      </div>
    ` : ''}

    ${!candidatos.length ? `
      <div class="empty-state"><strong>Todavía no hay candidatos</strong>Ningún caballo tiene 1º, 2º o 3º puesto guardado en las clases ${clasesFeeder.join(', ')} — resuelve primero esas clasificaciones.</div>
    ` : admin ? `
      <div class="table-wrap">
        <table class="resultados tabla-votos">
          <thead><tr>
            <th>Dorsal</th><th>Nombre</th><th>Juez I</th><th>Juez II</th><th>Total</th><th>Puesto</th>
          </tr></thead>
          <tbody>
            ${candidatos.map((c, i) => `
              <tr data-id="${c.id}">
                <td class="dorsal-grande">${c.dorsal ?? '—'}</td>
                <td class="nombre-cell">${escapeHtml(c.nombre)}<span class="detalle">${c.posicion}º clase ${c.clase_codigo}</span></td>
                <td>${selectMedalla('juez1', c.juez1_medalla)}</td>
                <td>${selectMedalla('juez2', c.juez2_medalla)}</td>
                <td class="total-votos" data-total>${c.total}</td>
                <td><input type="number" min="1" class="pos-input-clasif" value="${c.posicion_final ?? (i + 1)}"></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <p class="muted small">El total se calcula solo (Oro = 4, Plata = 2, Bronce = 1 por juez). El puesto ya viene sugerido según el total — cámbialo si hace falta y pulsa "Guardar campeonato".</p>
      <div style="margin-top:10px; display:flex; gap:12px; align-items:center;">
        <button class="btn-primary" id="guardar-campeonato">Guardar campeonato</button>
        <span class="save-status" id="guardar-campeonato-status"></span>
      </div>
    ` : (!camp.publicado ? `
      <div class="empty-state"><strong>Campeonato aún no publicado</strong>La organización lo publicará en cuanto se decida.</div>
    ` : `
      <div class="caballos-clasif">
        ${candidatos.slice(0, 3).map((c, i) => `
          <div class="resumen-card">
            <div class="resumen-row">
              <span class="pos-num pos-num-public">${MEDALLA_ETIQUETA[i]}</span>
              <div class="resumen-info">
                <strong class="caballo-nombre">${escapeHtml(c.nombre)}</strong>
              </div>
              <span class="dorsal-grande dorsal-grande-publico">Dorsal ${c.dorsal ?? '—'}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `)}
  `;

  if (admin) wireCampeonatoAdmin(camp, candidatos);
}

function selectMedalla(juez, valor) {
  return `
    <select class="select-medalla" data-juez="${juez}">
      <option value="" ${!valor ? 'selected' : ''}>—</option>
      <option value="oro" ${valor === 'oro' ? 'selected' : ''}>🥇 Oro</option>
      <option value="plata" ${valor === 'plata' ? 'selected' : ''}>🥈 Plata</option>
      <option value="bronce" ${valor === 'bronce' ? 'selected' : ''}>🥉 Bronce</option>
    </select>
  `;
}

function wireCampeonatoAdmin(camp, candidatos) {
  const toggle = document.getElementById('publicar-campeonato-toggle');
  const status = document.getElementById('campeonato-status');
  toggle?.addEventListener('change', async () => {
    try {
      await guardarCampeonato(camp.id, { publicado: toggle.checked });
      camp.publicado = toggle.checked;
      setSaveStatus(status, 'Guardado ✓', false);
    } catch (err) {
      setSaveStatus(status, 'Error al guardar', true);
      toggle.checked = !toggle.checked;
    }
  });

  document.querySelectorAll('.select-medalla').forEach(sel => {
    sel.addEventListener('change', () => {
      const row = sel.closest('tr');
      const j1 = row.querySelector('[data-juez="juez1"]').value;
      const j2 = row.querySelector('[data-juez="juez2"]').value;
      row.querySelector('[data-total]').textContent = puntosMedalla(j1) + puntosMedalla(j2);
    });
  });

  const guardarBtn = document.getElementById('guardar-campeonato');
  const guardarStatus = document.getElementById('guardar-campeonato-status');
  guardarBtn?.addEventListener('click', async () => {
    guardarBtn.disabled = true;
    try {
      const filas = [];
      document.querySelectorAll('.tabla-votos tbody tr').forEach(row => {
        const caballo_id = Number(row.dataset.id);
        const juez1_medalla = row.querySelector('[data-juez="juez1"]').value || null;
        const juez2_medalla = row.querySelector('[data-juez="juez2"]').value || null;
        const posInput = row.querySelector('.pos-input-clasif');
        const posicion_final = posInput.value ? parseInt(posInput.value, 10) : null;
        filas.push({ campeonato_id: camp.id, caballo_id, juez1_medalla, juez2_medalla, posicion_final });
      });
      await guardarVotosCampeonato(filas);
      setSaveStatus(guardarStatus, 'Campeonato guardado ✓', false);
    } catch (err) {
      console.error(err);
      setSaveStatus(guardarStatus, 'Error al guardar', true);
    } finally {
      guardarBtn.disabled = false;
    }
  });
}

function wireClasificacionAdmin(clase, clasif, todosCaballos) {
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

  const guardarBtn = document.getElementById('guardar-clasificacion');
  const guardarStatus = document.getElementById('guardar-status');
  guardarBtn?.addEventListener('click', async () => {
    guardarBtn.disabled = true;
    try {
      const cards = document.querySelectorAll('#tab-panel .resumen-card');
      const updates = [];
      cards.forEach(card => {
        const id = card.dataset.id;
        const posInput = card.querySelector('.pos-input-clasif');
        const posicion = posInput.value ? parseInt(posInput.value, 10) : null;
        updates.push({ id, posicion });
      });
      await Promise.all(updates.map(u => guardarCaballo(u.id, { posicion: u.posicion })));
      updates.forEach(u => {
        const h = todosCaballos.find(x => String(x.id) === u.id);
        if (h) h.posicion = u.posicion;
      });
      setSaveStatus(guardarStatus, 'Clasificación guardada ✓', false);
      paintClase(clase, todosCaballos);
    } catch (err) {
      console.error(err);
      setSaveStatus(guardarStatus, 'Error al guardar', true);
    } finally {
      guardarBtn.disabled = false;
    }
  });
}
