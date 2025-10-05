const combo = document.getElementById("combo");
const input = document.getElementById("comboInput");
const btn = document.getElementById("comboBtn");
const listEl = document.getElementById("comboList");
const preview = document.getElementById("preview");
const currentTitle = document.getElementById("currentTitle");
const meta = document.getElementById("meta");
const empty = document.getElementById("empty");
const cardsWrap = document.getElementById("cardsWrap");
const filterRarity = document.getElementById("filterRarity");
const filterWeapon = document.getElementById("filterWeapon");
const filterElement = document.getElementById("filterElement");
const filterRegion = document.getElementById("filterRegion");

let items = [];
let filtered = [];
let open = false;
let focusedIndex = -1;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderList() {
}

function renderCards(arr) {
  cardsWrap.innerHTML = "";
  if (!arr || arr.length === 0) {
    cardsWrap.innerHTML =
      '<div style="color:var(--muted);text-align:center;padding:20px;grid-column:1/-1;">No se han encontrado personajes</div>';
    return;
  }

  const toRender = arr.slice().sort((a, b) =>
    a.title.localeCompare(b.title, "es", { sensitivity: "base" })
  );

  toRender.forEach((it, idx) => {
    const card = document.createElement("div");
    card.className = "card";
    if (it.element) {
      const safeEl = String(it.element).trim().toLowerCase();
      if (safeEl) card.classList.add("element-" + safeEl);
    }

    if (it.rarity) card.dataset.rarity = it.rarity;

    const img = document.createElement("img");
    img.src =
      it.img && it.img.trim()
        ? it.img
        : "https://via.placeholder.com/100?text=No+img";
    img.alt = it.title;

    const name = document.createElement("div");
    name.className = "name";
    name.textContent = it.title;

    card.appendChild(img);
    card.appendChild(name);

    card.addEventListener("click", () => {
      loadItem(it);
    });

    cardsWrap.appendChild(card);
  });
}

function filterItems(q) {
  const v = String(q || "").trim().toLowerCase();
  const rarityVal = filterRarity.value;
  const weaponVal = filterWeapon.value;
  const elementVal = filterElement.value;
  const regionVal = filterRegion ? filterRegion.value : "";
  filtered = items.filter((it) => {
    if (v) {
      const inTitle = it.title.toLowerCase().includes(v);
      const inMeta = (it.meta || "").toLowerCase().includes(v);
      if (!inTitle && !inMeta) return false;
    }
    if (rarityVal && String(it.rarity) !== String(rarityVal)) return false;
    if (weaponVal && (it.weapon || "").toLowerCase() !== weaponVal) return false;
    if (elementVal && (it.element || "").toLowerCase() !== elementVal) return false;
    if (regionVal && (it.region || "").toLowerCase() !== regionVal) return false;
    return true;
  });
  filtered.sort((a, b) => a.title.localeCompare(b.title, 'es', { sensitivity: 'base' }));
  renderList(filtered);
  renderCards(filtered);
  if (filtered.length > 0) {
    focusedIndex = 0;
    focusItem(0);
  } else {
    focusedIndex = -1;
  }
}

function focusItem(idx) {
  const nodes = Array.from(listEl.querySelectorAll(".combo-item"));
  nodes.forEach((n) => n.classList.remove("focused"));
  if (idx >= 0 && idx < nodes.length) {
    nodes[idx].classList.add("focused");
    const node = nodes[idx];
    const rectTop = node.offsetTop;
    const rectBottom = rectTop + node.offsetHeight;
    if (rectTop < listEl.scrollTop) listEl.scrollTop = rectTop;
    else if (rectBottom > listEl.scrollTop + listEl.clientHeight)
      listEl.scrollTop = rectBottom - listEl.clientHeight;
  }
}

function selectIndex(idx) {
  const it = filtered[idx];
  if (!it) return;
  input.value = it.title;
  loadItem(it);
  closeDropdown();
  input.blur();
}

function loadItem(it) {
  if (it.html) {
    preview.removeAttribute('src');
    preview.srcdoc = it.html;
  } else {
    preview.src = it.file;
  }
  currentTitle.textContent = it.title;
  meta.textContent = it.meta || "";
  empty.style.display = "none";
  preview.style.display = "block";
}

input.addEventListener("input", (e) => {
  filterItems(e.target.value);
});

input.addEventListener("focus", () => {
  filterItems(input.value);
});

if (btn) btn.addEventListener('click', (e) => { e.preventDefault(); input.focus(); });

input.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === "Enter") {
    e.preventDefault();
    if (filtered && filtered.length > 0) {
      const exact = filtered.find((it) => it.title === input.value);
      loadItem(exact || filtered[0]);
    }
  } else if (key === "Escape") {
    input.value = "";
    filterItems("");
  }
});

filterRarity.addEventListener("change", () => filterItems(input.value));
filterWeapon.addEventListener("change", () => filterItems(input.value));
filterElement.addEventListener("change", () => filterItems(input.value));
if (filterRegion) filterRegion.addEventListener("change", () => filterItems(input.value));

function showError(msg) {
  listEl.innerHTML = "";
  const li = document.createElement("li");
  li.className = "combo-item no-match";
  li.textContent = msg;
  listEl.appendChild(li);
  cardsWrap.innerHTML =
    '<div style="color:var(--muted);text-align:center;padding:20px;grid-column:1/-1;">' +
    escapeHtml(msg) +
    "</div>";
}

function fetchIndex() {
  try {
    const el = document.getElementById("tablesIndex");
    if (el && el.textContent && el.textContent.trim()) {
      const json = JSON.parse(el.textContent);
      if (Array.isArray(json)) {
        items = json
          .map((x) => ({
            title: String(x.title || "").trim(),
            file: String(x.file || "").trim(),
            meta: String(x.meta || "").trim(),
            rarity: String(x.rarity || "").trim(),
            weapon: String((x.weapon || "").toLowerCase()).trim(),
            element: String((x.element || "").toLowerCase()).trim(),
            region: String((x.region || "").toLowerCase()).trim(),
            img: String(x.img || "").trim(),
          }))
          .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));

        filtered = items.slice();
        renderCards(items);
        return;
      }
    }
  } catch (err) {
    console.warn("embedded JSON inválido, no se cargó índice", err);
  }
  showError("No hay índice de tablas embebido.");
}

(function () {
  const comboEl = document.getElementById('combo');
  const inputEl = document.getElementById('comboInput');
  const comboBtn = document.getElementById('comboBtn');
  if (!inputEl || !comboEl) return;

  let clearBtn = document.getElementById('clearSearch');
  if (!clearBtn) {
    clearBtn = document.createElement('button');
    clearBtn.id = 'clearSearch';
    clearBtn.className = 'combo-clear';
    clearBtn.type = 'button';
    clearBtn.setAttribute('aria-label', 'Borrar búsqueda');
    clearBtn.title = 'Borrar búsqueda';
    clearBtn.textContent = '✕';
    if (comboBtn && comboBtn.parentNode === comboEl) {
      comboEl.insertBefore(clearBtn, comboBtn);
    } else {
      comboEl.appendChild(clearBtn);
    }
  }

  function updateClearVisibility() {
    const has = inputEl.value && inputEl.value.trim().length > 0;
    clearBtn.style.display = has ? 'inline-flex' : 'none';
  }

  inputEl.addEventListener('input', function (e) {
    updateClearVisibility();
    if (typeof filterItems === 'function') filterItems(inputEl.value);
  });

  clearBtn.addEventListener('click', function (e) {
    e.preventDefault();
    inputEl.value = '';
    updateClearVisibility();
    inputEl.focus();
    if (typeof filterItems === 'function') filterItems('');
    if (comboEl && !comboEl.classList.contains('open')) comboEl.classList.add('open');
  });

  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (inputEl.value && inputEl.value.trim().length > 0) {
        e.preventDefault();
        inputEl.value = '';
        updateClearVisibility();
        if (typeof filterItems === 'function') filterItems('');
      } else {
        if (comboEl && comboEl.classList.contains('open')) comboEl.classList.remove('open');
      }
    }
  });

  updateClearVisibility();
})();

; (function () {
  const wrapper = document.getElementById('filtersWrapper');
  const toggle = document.getElementById('filtersToggle');
  const panel = document.getElementById('filterPanel');
  if (!wrapper || !toggle || !panel) return;

  const KEY = 'filtersCollapsed_v1';
  const collapsed = (function () {
    const v = localStorage.getItem(KEY);
    if (v === null) return true;
    return v === '1';
  })();

  function applyState(collapsedNow) {
    if (collapsedNow) {
      wrapper.classList.add('filters-collapsed');
      wrapper.classList.remove('filters-expanded');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = 'Filtros ▸';
    } else {
      wrapper.classList.remove('filters-collapsed');
      wrapper.classList.add('filters-expanded');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.textContent = 'Filtros ▾';
    }
  }

  applyState(collapsed);

  toggle.addEventListener('click', function () {
    const now = !wrapper.classList.contains('filters-collapsed');
    localStorage.setItem(KEY, now ? '1' : '0');
    applyState(now);
  });
})();


fetchIndex();
