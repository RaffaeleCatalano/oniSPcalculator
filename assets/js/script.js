// === 1) Parametri e descrizioni (come tabella Excel) ===
const PARAMETERS = [
    {
        key: "reproducibility",
        name: "Riproducibilità",
        weight: 0.35,
        desc: {
            1: "Bug immediato e facile da riprodurre. Funzione/area semplice (es. solo SFCC, PWA, BFF).",
            3: "Richiede setup dati specifico o configurazione ambiente. Tecnologie / integrazioni esterne (es. BFF+PWA+PIM, BFF+SFCC+SAP).",
            5: "Intermittente o richiede trigger esterni/3rd party. Cambio architetturale o logica cross-domain con sistemi esterni coinvolti.",
        },
    },
    {
        key: "scope",
        name: "Ambito e-Commerce e componenti coinvolti",
        weight: 0.3,
        desc: {
            1: "Impatto locale su un'area/funzionalità limitata.",
            3: "Impatto su più componenti/integrazioni o su una parte rilevante della piattaforma.",
            5: "Impatto ampio/cross-domain con 1+ sistemi esterni coinvolti.",
        },
    },
    {
        key: "processes",
        name: "Processi e-Commerce",
        weight: 0.2,
        desc: {
            1: "Editorial, SEO o navigazione info prodotto base.",
            3: "Login, Registration, Promotions.",
            5: "Checkout, Payments, Order flows, dati ordine mancanti.",
        },
    },
    {
        key: "brand",
        name: "Brand Scope",
        weight: 0.15,
        desc: {
            1: "Singolo brand.",
            3: "2+ brands o logica condivisa.",
            5: "Cross-brand / core platform features (impatta tutti).",
        },
    },
];

const state = Object.fromEntries(PARAMETERS.map((p) => [p.key, null]));

const rowsEl = document.getElementById("rows");
const totalScoreEl = document.getElementById("totalScore");
const storyPointsEl = document.getElementById("storyPoints");
const statusBadge = document.getElementById("statusBadge");
const mappingInfo = document.getElementById("mappingInfo");

function format2(n) {
    return (Math.round(n * 100) / 100).toFixed(2);
}

function scoreToSP(total) {

    if (total < 1) return 0;

    if (total <= 1.4) return 1;
    if (total <= 1.8) return 2;
    if (total <= 2.8) return 3;
    if (total <= 3.8) return 5;
    if (total <= 4.5) return 8;
    if (total <= 5.0) return 12;

    return 0;
}

function compute() {
    let total = 0;

    for (const p of PARAMETERS) {
        const level = state[p.key];
        if (level == null) continue;
        total += p.weight * level;
    }

    totalScoreEl.textContent = format2(total);
    storyPointsEl.textContent = String(scoreToSP(total));

    const missing = PARAMETERS.filter((p) => state[p.key] == null).length;
    if (missing === 0) {
        statusBadge.textContent = "Complete";
    } else {
        statusBadge.textContent = `Missing: ${missing}`;
    }

    PARAMETERS.forEach((p) => {
        const wsEl = document.querySelector(`[data-ws="${p.key}"]`);
        const level = state[p.key];
        wsEl.textContent = level == null ? "—" : format2(p.weight * level);
    });
}

function setLevel(paramKey, level) {
    state[paramKey] = level;

    const btns = document.querySelectorAll(
        `[data-param="${paramKey}"][data-level]`,
    );
    btns.forEach((b) =>
        b.classList.toggle("active", Number(b.dataset.level) === level),
    );

    const descEl = document.querySelector(`[data-desc="${paramKey}"]`);
    const p = PARAMETERS.find((x) => x.key === paramKey);
    descEl.textContent = p.desc[level];

    compute();
}

function render() {
    rowsEl.innerHTML = "";

    for (const p of PARAMETERS) {
        const tr = document.createElement("tr");

        const tdParam = document.createElement("td");
        tdParam.innerHTML = `
            <div class="rowHead">
            <div class="paramName">${p.name}</div>
            <div class="desc" data-desc="${p.key}">Seleziona un livello.</div>
            </div>
        `;

        const tdWeight = document.createElement("td");
        tdWeight.textContent = `${Math.round(p.weight * 100)}%`;

        const tdLevel = document.createElement("td");
        tdLevel.innerHTML =
            `<div class="levels">
            ${levelButtonHTML(p.key, 1, "Low (1)", p.desc[1])}
            ${levelButtonHTML(p.key, 3, "Medium (3)", p.desc[3])}
            ${levelButtonHTML(p.key, 5, "High (5)", p.desc[5])}
            </div>`;

        const tdWS = document.createElement("td");
        tdWS.setAttribute("data-ws", p.key);
        tdWS.textContent = "—";

        tr.appendChild(tdParam);
        tr.appendChild(tdWeight);
        tr.appendChild(tdLevel);
        tr.appendChild(tdWS);

        rowsEl.appendChild(tr);
    }

    rowsEl.querySelectorAll(".levelBtn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const paramKey = btn.dataset.param;
            const level = Number(btn.dataset.level);
            setLevel(paramKey, level);
        });
    });

    compute();
}

function levelButtonHTML(paramKey, level, label, tooltip) {
    return `
    <label 
        class="levelBtn" 
        data-param="${paramKey}" 
        data-level="${level}"
        data-tooltip="${tooltip.replace(/"/g, "&quot;")}"
    >
        <span class="dot"></span>
        <input type="radio" name="${paramKey}" value="${level}" />
        <span>${label}</span>
    </label>
    `;
}

const resetBtn = document.getElementById("resetBtn");

if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        for (const p of PARAMETERS) {
            state[p.key] = null;

            const descEl = document.querySelector(`[data-desc="${p.key}"]`);
            if (descEl) descEl.textContent = "Seleziona un livello.";

            const btns = document.querySelectorAll(
                `[data-param="${p.key}"][data-level]`,
            );
            btns.forEach((b) => b.classList.remove("active"));
        }

        // reset stato quiz
        if (window.quizState) {
            Object.keys(window.quizState).forEach(
                (k) => delete window.quizState[k],
            );
        }

        compute();
    });
}

const exampleBtn = document.getElementById("fillExampleBtn");
if (exampleBtn) {
    exampleBtn.addEventListener("click", () => {
        setLevel("reproducibility", 1);
        setLevel("scope", 3);
        setLevel("processes", 1);
        setLevel("brand", 1);
    });
}

render();
