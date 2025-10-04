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

function renderList(arr) {
  listEl.innerHTML = "";
  if (!arr || arr.length === 0) {
    const li = document.createElement("li");
    li.className = "combo-item no-match";
    li.textContent = "No hay coincidencias";
    li.setAttribute("aria-disabled", "true");
    listEl.appendChild(li);
    return;
  }

  const toRender = arr.slice().sort((a, b) =>
    a.title.localeCompare(b.title, "es", { sensitivity: "base" })
  );

  toRender.forEach((it, i) => {
    const li = document.createElement("li");
    li.className = "combo-item";
    if (it.element) li.classList.add("element-" + it.element.toLowerCase());
    li.tabIndex = -1;
    li.setAttribute("role", "option");
    li.dataset.index = i;
    li.innerHTML = `<div class="item-title">${escapeHtml(
      it.title
    )}</div><div class="item-meta">${escapeHtml(it.meta || "")}</div>`;
    li.addEventListener("mousedown", (ev) => {
      ev.preventDefault();
      const origIndex = arr.indexOf(toRender[i]);
      selectIndex(origIndex === -1 ? i : origIndex);
    });
    listEl.appendChild(li);
  });
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
      input.value = it.title;
      loadItem(it);
    });

    cardsWrap.appendChild(card);
  });
}

function openDropdown() {
  filtered = items.slice();
  renderList(filtered);
  combo.classList.add("open");
  listEl.scrollTop = 0;
  open = true;
  focusedIndex = -1;
}

function closeDropdown() {
  combo.classList.remove("open");
  open = false;
  focusedIndex = -1;
}

function filterItems(q) {
  const v = String(q || "").trim().toLowerCase();
  const rarityVal = filterRarity.value;
  const weaponVal = filterWeapon.value;
  const elementVal = filterElement.value;
  filtered = items.filter((it) => {
    if (v) {
      const inTitle = it.title.toLowerCase().includes(v);
      const inMeta = (it.meta || "").toLowerCase().includes(v);
      if (!inTitle && !inMeta) return false;
    }
    if (rarityVal && String(it.rarity) !== String(rarityVal)) return false;
    if (weaponVal && (it.weapon || "").toLowerCase() !== weaponVal) return false;
    if (elementVal && (it.element || "").toLowerCase() !== elementVal) return false;
    return true;
  });
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
  preview.src = it.file;
  currentTitle.textContent = it.title;
  meta.textContent = it.meta || "";
  empty.style.display = "none";
  preview.style.display = "block";
}

input.addEventListener("input", (e) => {
  filterItems(e.target.value);
  if (!open) {
    combo.classList.add("open");
    open = true;
  }
});

input.addEventListener("focus", () => {
  filterItems(input.value);
  combo.classList.add("open");
  open = true;
});

btn.addEventListener("click", () => {
  if (open) closeDropdown();
  else {
    filterItems("");
    combo.classList.add("open");
    open = true;
    input.focus();
  }
});

input.addEventListener("keydown", (e) => {
  const key = e.key;
  if (key === "ArrowDown") {
    e.preventDefault();
    if (!open) {
      filterItems(input.value);
      combo.classList.add("open");
      open = true;
    }
    focusedIndex = Math.min(
      filtered.length - 1,
      focusedIndex === -1 ? 0 : focusedIndex + 1
    );
    focusItem(focusedIndex);
  } else if (key === "ArrowUp") {
    e.preventDefault();
    if (!open) {
      filterItems(input.value);
      combo.classList.add("open");
      open = true;
    }
    focusedIndex = Math.max(0, focusedIndex - 1);
    focusItem(focusedIndex);
  } else if (key === "Enter") {
    e.preventDefault();
    if (open && focusedIndex >= 0) selectIndex(focusedIndex);
    else {
      const match = items.find((it) => it.title === input.value);
      if (match) loadItem(match);
    }
  } else if (key === "Escape") {
    closeDropdown();
  }
});

document.addEventListener("click", (e) => {
  if (!combo.contains(e.target)) closeDropdown();
});

filterRarity.addEventListener("change", () => filterItems(input.value));
filterWeapon.addEventListener("change", () => filterItems(input.value));
filterElement.addEventListener("change", () => filterItems(input.value));

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
            img: String(x.img || "").trim(),
          }))
          .sort((a, b) => a.title.localeCompare(b.title, "es", { sensitivity: "base" }));

        filtered = items.slice();
        renderList(items);
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


fetchIndex();
