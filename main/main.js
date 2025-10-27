const combo = document.getElementById("combo");
const input = document.getElementById("comboInput");
const listEl = document.getElementById("comboList");
const preview = document.getElementById("preview");
const currentTitle = document.getElementById("currentTitle");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const buildButtons = document.getElementById("buildButtons");
const cardsWrap = document.getElementById("cardsWrap");
const filterPanel = document.getElementById("filterPanel");
const gameLabel = document.getElementById("gameLabel");
const bodyEl = document.body;

let itemsGI = [];
let itemsZZZ = [];
let items = [];
let filtered = [];
let focusedIndex = -1;
let currentGame = "gi";

function escapeHtml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderList() { }

function slugifyEl(val) {
  return String(val || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function renderCards(arr) {
  cardsWrap.innerHTML = "";
  if (!arr || arr.length === 0) {
    cardsWrap.innerHTML = '<div style="color:var(--muted);text-align:center;padding:20px;grid-column:1/-1;">No se han encontrado personajes</div>';
    return;
  }
  const toRender = arr.slice().sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  toRender.forEach((it) => {
    const card = document.createElement("div");
    card.className = "card";
    if (it.element) {
      const safeEl = String(it.element).trim().toLowerCase();
      if (safeEl) {
        const cls = currentGame === "gi" ? ("element-" + safeEl) : ("zzz-" + normalizeElementClass(safeEl));
        card.classList.add(cls);
      }
    }
    if (currentGame === "gi" && it.rarity) card.dataset.rarity = it.rarity;

    const img = document.createElement("img");
    img.src = it.img && it.img.trim() ? it.img : "https://via.placeholder.com/100?text=No+img";
    img.alt = it.title;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = it.title;

    card.appendChild(img);
    card.appendChild(name);

    card.addEventListener("click", () => loadItem(it));
    cardsWrap.appendChild(card);
  });
}

function normalizeElementClass(val) {
  const v = String(val || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const allow = new Set(["electrico", "igneo", "hielo", "etereo", "fisico"]);
  return allow.has(v) ? v : "electrico";
}


function getCurrentFilters() {
  if (currentGame === "gi") {
    return {
      rarity: getVal("#filterRarity"),
      weapon: getVal("#filterWeapon"),
      element: getVal("#filterElement"),
      region: getVal("#filterRegion")
    };
  } else {
    return {
      range: getVal("#filterRange"),
      type: getVal("#filterType"),
      element: getVal("#filterElementZZZ"),
      faction: getVal("#filterFaction")
    };
  }
}

function getVal(sel) {
  const el = document.querySelector(sel);
  return el ? String(el.value || "").trim().toLowerCase() : "";
}

function filterItems(q) {
  const v = String(q || "").trim().toLowerCase();
  const f = getCurrentFilters();

  filtered = items.filter((it) => {
    if (v) {
      const inTitle = it.title.toLowerCase().includes(v);
      const inMeta = (it.meta || "").toLowerCase().includes(v);
      if (!inTitle && !inMeta) return false;
    }
    if (currentGame === "gi") {
      if (f.rarity && String(it.rarity).toLowerCase() !== f.rarity) return false;
      if (f.weapon && (it.weapon || "").toLowerCase() !== f.weapon) return false;
      if (f.element && (it.element || "").toLowerCase() !== f.element) return false;
      if (f.region && (it.region || "").toLowerCase() !== f.region) return false;
    } else {
      if (f.range && (it.range || "").toLowerCase() !== f.range) return false;
      if (f.type && (it.type || "").toLowerCase() !== f.type) return false;
      if (f.element && (it.element || "").toLowerCase() !== f.element) return false;
      if (f.faction && (it.faction || "").toLowerCase() !== f.faction) return false;
    }
    return true;
  });
  filtered.sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
  renderList(filtered);
  renderCards(filtered);
  focusedIndex = filtered.length > 0 ? 0 : -1;
}

function selectIndex(idx) {
  const it = filtered[idx];
  if (!it) return;
  input.value = it.title;
  loadItem(it);
  try { closeDropdown(); } catch (e) {
    const comboEl = document.getElementById("combo");
    if (comboEl) comboEl.classList.remove("open");
  }
  input.blur();
}

function closeDropdown() {
  const comboEl = document.getElementById("combo");
  if (comboEl) comboEl.classList.remove("open");
}

function loadItem(it) {
  if (!it || !it.file) {
    showError("No se encontró el archivo de la tabla.");
    return;
  }

  const freshPreview = preview;

  empty.style.display = "none";
  freshPreview.style.display = "block";

  freshPreview.removeAttribute("srcdoc");
  freshPreview.removeAttribute("src");

  setTimeout(() => {
    freshPreview.src = it.file;

    freshPreview.onload = null;
    freshPreview.onerror = null;

    freshPreview.onload = () => {
      currentTitle.textContent = it.title || "—";
      meta.textContent = "";

      if (buildButtons) {
        buildButtons.innerHTML = "";
        buildButtons.setAttribute("aria-hidden", "true");
      }
      if (it.builds && Array.isArray(it.builds) && it.builds.length > 0) {
        renderBuildButtons(it.builds);
        try {
          freshPreview.contentWindow?.postMessage({ type: "show-build", index: 0 }, "*");
        } catch (_) { }
      }
    };

    freshPreview.onerror = () => {
      showError("No se pudo cargar la tabla: " + it.file);
      freshPreview.style.display = "none";
      empty.style.display = "flex";
    };
  }, 0);
}

function buildMeta(it) {
  if (currentGame === "gi") {
    const bits = [];
    if (it.rarity) bits.push(`${it.rarity}★`);
    if (it.weapon) bits.push(cap(it.weapon));
    if (it.element) bits.push(cap(it.element));
    if (it.region) bits.push(cap(it.region));
    return bits.join(" · ");
  } else {
    const bits = [];
    if (it.range) bits.push(`Rango ${it.range.toUpperCase()}`);
    if (it.type) bits.push(cap(it.type));
    if (it.element) bits.push(cap(it.element));
    if (it.faction) bits.push(cap(it.faction));
    return bits.join(" · ");
  }
}

function cap(s) { return String(s || "").charAt(0).toUpperCase() + String(s || "").slice(1); }

window.addEventListener("message", (ev) => {
  const data = ev.data || {};
  if (!data || typeof data !== "object") return;
  if (data.type === "builds" && Array.isArray(data.builds)) {
    renderBuildButtons(data.builds);
  }
});

function renderBuildButtons(list) {
  if (!buildButtons) return;
  buildButtons.innerHTML = "";
  buildButtons.setAttribute("aria-hidden", "false");
  list.forEach((label, idx) => {
    const btn = document.createElement("button");
    btn.className = "build-button";
    btn.type = "button";
    btn.textContent = label;
    btn.addEventListener("click", () => {
      Array.from(buildButtons.querySelectorAll(".build-button")).forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const msg = { type: "show-build", index: idx };
      if (preview && preview.contentWindow) preview.contentWindow.postMessage(msg, "*");
    });
    buildButtons.appendChild(btn);
  });
  const first = buildButtons.querySelector(".build-button");
  if (first) first.classList.add("active");
}

input.addEventListener("input", (e) => filterItems(e.target.value));
input.addEventListener("focus", () => filterItems(input.value));
input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    if (filtered && filtered.length > 0) {
      const exact = filtered.find((it) => it.title === input.value);
      loadItem(exact || filtered[0]);
    }
  } else if (e.key === "Escape") {
    input.value = "";
    filterItems("");
  }
});

(function () {
  const wrapper = document.getElementById("filtersWrapper");
  const toggle = document.getElementById("filtersToggle");
  const panel = document.getElementById("filterPanel");
  if (!wrapper || !toggle || !panel) return;
  const KEY = "filtersCollapsed_v2";
  const collapsed = (function () {
    const v = localStorage.getItem(KEY);
    if (v === null) return true;
    return v === "1";
  })();
  function applyState(collapsedNow) {
    if (collapsedNow) {
      wrapper.classList.add("filters-collapsed");
      wrapper.classList.remove("filters-expanded");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Filtros ▸";
    } else {
      wrapper.classList.remove("filters-collapsed");
      wrapper.classList.add("filters-expanded");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Filtros ▾";
    }
  }
  applyState(collapsed);
  toggle.addEventListener("click", function () {
    const now = !wrapper.classList.contains("filters-collapsed");
    localStorage.setItem(KEY, now ? "1" : "0");
    applyState(now);
  });
})();

(function () {
  const comboEl = document.getElementById("combo");
  const inputEl = document.getElementById("comboInput");
  const clearBtn = document.getElementById("clearSearch");
  if (!inputEl || !comboEl || !clearBtn) return;
  function updateClearVisibility() {
    const has = inputEl.value && inputEl.value.trim().length > 0;
    clearBtn.style.display = has ? "inline-flex" : "none";
  }
  inputEl.addEventListener("input", function () {
    updateClearVisibility();
    filterItems(inputEl.value);
  });
  clearBtn.addEventListener("click", function (e) {
    e.preventDefault();
    inputEl.value = "";
    updateClearVisibility();
    inputEl.focus();
    filterItems("");
    if (comboEl && !comboEl.classList.contains("open")) comboEl.classList.add("open");
  });
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (inputEl.value && inputEl.value.trim().length > 0) {
        e.preventDefault();
        inputEl.value = "";
        updateClearVisibility();
        filterItems("");
      } else {
        if (comboEl && comboEl.classList.contains("open")) comboEl.classList.remove("open");
      }
    }
  });
  updateClearVisibility();
})();

function buildFiltersForGI() {
  filterPanel.innerHTML = `
    <label class="filter">
      <span>Rareza</span>
      <select id="filterRarity" class="filter-select">
        <option value="">Todas</option>
        <option value="5">5★</option>
        <option value="4">4★</option>
      </select>
    </label>
    <label class="filter">
      <span>Arma</span>
      <select id="filterWeapon" class="filter-select">
        <option value="">Todas</option>
        <option value="lanza">Lanza</option>
        <option value="mandoble">Mandoble</option>
        <option value="catalizador">Catalizador</option>
        <option value="espada">Espada</option>
        <option value="arco">Arco</option>
      </select>
    </label>
    <label class="filter">
      <span>Elemento</span>
      <select id="filterElement" class="filter-select">
        <option value="">Todos</option>
        <option value="electro">Electro</option>
        <option value="hydro">Hydro</option>
        <option value="pyro">Pyro</option>
        <option value="anemo">Anemo</option>
        <option value="dendro">Dendro</option>
        <option value="geo">Geo</option>
        <option value="cryo">Cryo</option>
      </select>
    </label>
    <label class="filter">
      <span>Región</span>
      <select id="filterRegion" class="filter-select">
        <option value="">Todas</option>
        <option value="mondstadt">Mondstadt</option>
        <option value="liyue">Liyue</option>
        <option value="inazuma">Inazuma</option>
        <option value="sumeru">Sumeru</option>
        <option value="fontaine">Fontaine</option>
        <option value="natlan">Natlan</option>
        <option value="nod-krai">Nod Krai</option>
        <option value="narnia">Narnia</option>
      </select>
    </label>
  `;
  ["filterRarity", "filterWeapon", "filterElement", "filterRegion"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => filterItems(input.value));
  });
}

function buildFiltersForZZZ() {
  filterPanel.innerHTML = `
    <label class="filter">
      <span>Rango</span>
      <select id="filterRange" class="filter-select">
        <option value="">Todos</option>
        <option value="s">S</option>
        <option value="a">A</option>
      </select>
    </label>
    <label class="filter">
      <span>Tipo</span>
      <select id="filterType" class="filter-select">
        <option value="">Todos</option>
        <option value="atacante">Atacante</option>
        <option value="defensivo">Defensivo</option>
        <option value="auxiliar">Auxiliar</option>
        <option value="anómalo">Anómalo</option>
        <option value="disruptivo">Disruptivo</option>
        <option value="aturdidor">Aturdidor</option>
      </select>
    </label>
    <label class="filter">
      <span>Atributo</span>
      <select id="filterElementZZZ" class="filter-select">
        <option value="">Todos</option>
        <option value="etéreo">Etéreo</option>
        <option value="ígneo">Ígneo</option>
        <option value="eléctrico">Eléctrico</option>
        <option value="hielo">Hielo</option>
        <option value="físico">Físico</option>
      </select>
    </label>
    <label class="filter">
      <span>Facción</span>
      <select id="filterFaction" class="filter-select">
        <option value="">Todas</option>
        <option value="auditoría krampus">Auditoría Krampus</option>
        <option value="cabaña del terror">Cabaña del terror</option>
        <option value="pináculo yunkui">Pináculo Yunkui</option>
        <option value="ruiseñor">Ruiseñor</option>
        <option value="batallón argente">Batallón argente</option>
        <option value="estrellas de lyra">Estrellas de Lyra</option>
        <option value="división n.º6">División N.º6</option>
        <option value="hijos de calidón">Hijos de Calidón</option>
        <option value="eruic">ERUIC</option>
        <option value="batallón obolos">Batallón Obolos</option>
        <option value="servicios domésticos victoria">Servicios domésticos victoria</option>
        <option value="construcciones belobog">Construcciones Belobog</option>
        <option value="liebres astutas">Liebres astutas</option>
      </select>
    </label>
  `;
  ["filterRange", "filterType", "filterElementZZZ", "filterFaction"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", () => filterItems(input.value));
  });
}

function applyGame(game) {
  currentGame = game;
  bodyEl.setAttribute("data-game", game);
  document.querySelectorAll(".brand-logo").forEach(b => {
    b.classList.toggle("active", b.dataset.game === game);
    b.setAttribute("aria-selected", b.dataset.game === game ? "true" : "false");
  });
  if (game === "gi") {
    gameLabel.textContent = "Genshin Impact";
    items = itemsGI.slice();
    buildFiltersForGI();
  } else {
    gameLabel.textContent = "Zenless Zone Zero";
    items = itemsZZZ.slice();
    buildFiltersForZZZ();
  }
  input.value = "";
  filterItems("");
  preview.removeAttribute("src");
  preview.srcdoc = "";
  preview.style.display = "none";
  empty.style.display = "flex";
  currentTitle.textContent = "Selecciona un personaje";
  meta.textContent = "—";
  if (buildButtons) {
    buildButtons.innerHTML = "";
    buildButtons.setAttribute("aria-hidden", "true");
  }
}

function fetchIndex() {
  try {
    const elGI = document.getElementById("tablesIndexGI");
    if (elGI && elGI.textContent && elGI.textContent.trim()) {
      const jsonGI = JSON.parse(elGI.textContent);
      if (Array.isArray(jsonGI)) {
        itemsGI = jsonGI.map((x) => ({
          title: String(x.title || "").trim(),
          file: String(x.file || "").trim(),
          meta: String(x.meta || "").trim(),
          rarity: String(x.rarity || "").trim(),
          weapon: String((x.weapon || "").toLowerCase()).trim(),
          element: String((x.element || "").toLowerCase()).trim(),
          region: String((x.region || "").toLowerCase()).trim(),
          img: String(x.img || "").trim(),
          builds: Array.isArray(x.builds) ? x.builds.map((b) => String(b)) : []
        })).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
      }
    }
    const elZZZ = document.getElementById("tablesIndexZZZ");
    if (elZZZ && elZZZ.textContent && elZZZ.textContent.trim()) {
      const raw = JSON.parse(elZZZ.textContent);
      if (Array.isArray(raw)) {
        itemsZZZ = raw.map((x) => ({
          title: String(x.title || "").trim(),
          file: String(x.file || "").trim(),
          meta: String(x.meta || "").trim(),
          range: String((x.range || "").toLowerCase()).trim(),
          type: String((x.type || x.tipe || "").toLowerCase()).trim(),
          element: String((x.element || "").toLowerCase()).trim(),
          faction: String((x.faction || "").toLowerCase()).trim(),
          img: String(x.img || "").trim(),
          builds: Array.isArray(x.builds) ? x.builds.map((b) => String(b)) : []
        })).sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));
      }
    }
    applyGame("gi");
  } catch (err) {
    console.warn("Error cargando índices", err);
    showError("No hay índice de tablas embebido.");
  }
}

function showError(msg) {
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "combo-item no-match";
  li.textContent = msg;
  listEl.appendChild(li);
  cardsWrap.innerHTML =
    '<div style="color:var(--muted);text-align:center;padding:20px;grid-column:1/-1;">' +
    escapeHtml(msg) + "</div>";
}

document.getElementById("btnGI")?.addEventListener("click", () => applyGame("gi"));
document.getElementById("btnZZZ")?.addEventListener("click", () => applyGame("zzz"));

fetchIndex();
