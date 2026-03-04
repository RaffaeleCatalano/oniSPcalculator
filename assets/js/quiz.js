(() => {
    // Requisiti: PARAMETERS e setLevel(paramKey, level) devono esistere già (dal tuo script principale)

    const openBtn = document.getElementById("openQuizBtn");
    const overlay = document.getElementById("quizOverlay");
    const closeBtn = document.getElementById("closeQuizBtn");

    const progressEl = document.getElementById("quizProgress");
    const questionEl = document.getElementById("quizQuestion");
    const answersEl = document.getElementById("quizAnswers");

    const backBtn = document.getElementById("quizBackBtn");
    const skipBtn = document.getElementById("quizSkipBtn");

    if (
        !openBtn ||
        !overlay ||
        !closeBtn ||
        !questionEl ||
        !answersEl ||
        !backBtn ||
        !skipBtn
    )
        return;

    function levelLabel(lvl) {
        switch (lvl) {
            case 1:
                return "Low (1)";
            case 2:
                return "Low/Medium (2)";
            case 3:
                return "Medium (3)";
            case 4:
                return "Medium/High (4)";
            case 5:
                return "High (5)";
            default:
                return String(lvl);
        }
    }

    // Domande: 1 per parametro (stesso ordine della tabella)
    // Ogni risposta è un livello 1..5 con descrizione presa da PARAMETERS[x].desc[level]
    const QUIZ = PARAMETERS.map((p) => ({
        key: p.key,
        title: p.name,
        answers: [1, 2, 3, 4, 5].map((lvl) => ({
            level: lvl,
            label: levelLabel(lvl),
            desc: p.desc?.[lvl] ?? "",
        })),
    }));

    let step = 0;
    let lastFocus = null;

    window.quizState = Object.create(null);

    function openModal() {
        lastFocus = document.activeElement;
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
        step = 0;
        renderStep();
        closeBtn.focus();
        document.addEventListener("keydown", onKeyDown);
    }

    function closeModal() {
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
        document.removeEventListener("keydown", onKeyDown);
        if (lastFocus && typeof lastFocus.focus === "function")
            lastFocus.focus();
    }

    function onKeyDown(e) {
        if (e.key === "Escape") closeModal();
    }

    function renderStep() {
        const totalSteps = QUIZ.length;
        const item = QUIZ[step];

        progressEl.textContent = `${step + 1} / ${totalSteps}`;
        questionEl.textContent = item.title;

        // Pulsanti nav
        backBtn.disabled = step === 0;
        skipBtn.textContent = step === totalSteps - 1 ? "Chiudi" : "Avanti";

        // Risposte
        answersEl.innerHTML = "";

        const selectedLevel = quizState[item.key] ?? null;

        item.answers.forEach((a) => {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "quizAnswerBtn";

            // Se già scelta in precedenza (es. tornando indietro), evidenzia
            if (selectedLevel === a.level) {
                btn.classList.add("selected");
            }

            btn.innerHTML = `
        <div class="ansTitle">${a.label}</div>
        <div class="ansDesc">${escapeHtml(a.desc)}</div>
      `;

            btn.addEventListener("click", () => {
                // 1) salva selezione
                quizState[item.key] = a.level;

                // 2) evidenzia subito la scelta e disabilita gli altri
                [...answersEl.querySelectorAll(".quizAnswerBtn")].forEach(
                    (b) => {
                        b.classList.remove("selected");
                    },
                );
                btn.classList.add("selected");

                // 3) aggiorna la tabella (riuso logica esistente)
                setLevel(item.key, a.level);

                // 4) vai automaticamente alla prossima domanda
                // micro-delay per rendere visibile l'highlight prima del cambio schermata
                window.setTimeout(() => {
                    if (step < totalSteps - 1) {
                        step += 1;
                        renderStep();
                    } else {
                        closeModal();
                    }
                }, 180);
            });

            answersEl.appendChild(btn);
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;");
    }

    // Eventi
    openBtn.addEventListener("click", openModal);
    closeBtn.addEventListener("click", closeModal);

    // click fuori (sul backdrop) chiude
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) closeModal();
    });

    backBtn.addEventListener("click", () => {
        if (step > 0) {
            step -= 1;
            renderStep();
        }
    });

    skipBtn.addEventListener("click", () => {
        const totalSteps = QUIZ.length;
        if (step < totalSteps - 1) {
            step += 1;
            renderStep();
        } else {
            closeModal();
        }
    });
})();
