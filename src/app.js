(function bootOptimizerApp() {
  const optimizer = window.HolidayOptimizer;
  const storageKey = "folgapp.extraHolidays";
  const weekdayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const shortDateFormatter = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
  const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    timeZone: "UTC",
  });

  const form = document.querySelector("#optimizer-form");
  const leaveDaysInput = document.querySelector("#leave-days");
  const minStartInput = document.querySelector("#min-start");
  const maxEndInput = document.querySelector("#max-end");
  const extraDateInput = document.querySelector("#extra-date");
  const extraNameInput = document.querySelector("#extra-name");
  const addExtraButton = document.querySelector("#add-extra");
  const resetButton = document.querySelector("#reset-button");
  const extraList = document.querySelector("#extra-list");
  const extraCount = document.querySelector("#extra-count");
  const errorBox = document.querySelector("#form-error");
  const resultPanel = document.querySelector("#result-panel");
  const nationalHolidaysList = document.querySelector("#national-holidays-list");
  const nationalHolidaysCount = document.querySelector("#national-holidays-count");

  let extraHolidays = loadExtras();

  function isoLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function addLocalMonths(date, months) {
    const next = new Date(date);
    next.setMonth(next.getMonth() + months);
    return next;
  }

  function formatDate(date) {
    return shortDateFormatter.format(optimizer.parseDate(date));
  }

  function formatDateRange(start, end) {
    return `${formatDate(start)} a ${formatDate(end)}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;",
    })[character]);
  }

  function clearError() {
    errorBox.textContent = "";
  }

  function showError(message) {
    errorBox.textContent = message;
  }

  function loadExtras() {
    try {
      const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(parsed)
        ? parsed
            .filter((item) => item && item.date)
            .map((item, index) => ({
              id: item.id || `${item.date}-${index}`,
              date: item.date,
              name: item.name || "Feriado extra",
            }))
        : [];
    } catch (error) {
      return [];
    }
  }

  function saveExtras() {
    localStorage.setItem(storageKey, JSON.stringify(extraHolidays));
  }

  function sortExtras() {
    extraHolidays.sort((left, right) => left.date.localeCompare(right.date));
  }

  function renderExtras() {
    sortExtras();
    extraCount.textContent = String(extraHolidays.length);
    extraList.innerHTML = "";

    for (const holiday of extraHolidays) {
      const item = document.createElement("li");
      const text = document.createElement("div");
      const title = document.createElement("strong");
      const date = document.createElement("span");
      const remove = document.createElement("button");

      title.textContent = holiday.name || "Feriado extra";
      date.textContent = formatDate(holiday.date);
      remove.className = "remove-button";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", `Remover ${title.textContent}`);
      remove.addEventListener("click", () => {
        extraHolidays = extraHolidays.filter((itemToKeep) => itemToKeep.id !== holiday.id);
        saveExtras();
        renderExtras();
        calculate();
      });

      text.append(title, date);
      item.append(text, remove);
      extraList.append(item);
    }
  }


  function renderNationalHolidays() {
    const holidays = optimizer.getNationalHolidaysUntilEndOfNextYear(new Date());
    nationalHolidaysCount.textContent = String(holidays.length);
    nationalHolidaysList.innerHTML = holidays
      .map((holiday) => {
        const date = optimizer.parseDate(holiday.date);
        return `
          <li>
            <div>
              <strong>${escapeHtml(holiday.name)}</strong>
              <span>${formatDate(date)} · ${weekdayFormatter.format(date)}</span>
            </div>
          </li>
        `;
      })
      .join("");
  }
  function getWeeklyOffDays() {
    return Array.from(form.querySelectorAll('input[name="weeklyOff"]:checked')).map((input) => Number(input.value));
  }

  function getFormOptions() {
    return {
      leaveDays: Number(leaveDaysInput.value),
      minStart: minStartInput.value,
      maxEnd: maxEndInput.value,
      weeklyOffDays: getWeeklyOffDays(),
      extraHolidays: extraHolidays.map(({ date, name }) => ({ date, name })),
    };
  }

  function getDatesBetween(start, end) {
    const dates = [];
    for (let cursor = optimizer.parseDate(start); cursor <= optimizer.parseDate(end); cursor = optimizer.addDays(cursor, 1)) {
      dates.push(cursor);
    }
    return dates;
  }

  function isBetween(date, start, end) {
    const value = optimizer.parseDate(date).getTime();
    return value >= optimizer.parseDate(start).getTime() && value <= optimizer.parseDate(end).getTime();
  }


  function pluralizeDays(total) {
    return total === 1 ? "1 dia" : `${total} dias`;
  }

  function renderResult(result, options) {
    if (!result.best) {
      resultPanel.innerHTML = `
        <div class="empty-state">
          <p class="empty-kicker">Sem combinação</p>
          <h2>O período de férias não cabe nessa janela.</h2>
          <p>Aumente a data máxima final ou reduza a quantidade de dias.</p>
        </div>
      `;
      return;
    }

    const best = result.best;
    const weeklyOffSet = new Set(options.weeklyOffDays);
    const timeline = renderTimeline(best, result.holidayMap, weeklyOffSet);
    const reasons = renderReasons(best, weeklyOffSet);
    const alternatives = renderAlternatives(result.candidates.slice(1, 6));

    resultPanel.innerHTML = `
      <div class="result-header">
        <div class="result-title-row">
          <h2>${pluralizeDays(best.totalRestDays)} consecutivos de descanso</h2>
        </div>
        <div class="metric-grid">
          <div class="metric metric-primary">
            <span>Período sugerido</span>
            <strong>${formatDateRange(best.vacationStart, best.vacationEnd)}</strong>
          </div>
          <div class="metric">
            <span>Descanso total</span>
            <strong>${formatDateRange(best.restStart, best.restEnd)}</strong>
          </div>
          <div class="metric metric-split">
            <div class="metric-mini">
              <span>Dias 'perdidos'</span>
              <strong>${pluralizeDays(best.existingDaysOffInsideVacation)}</strong>
            </div>
            <div class="metric-mini">
              <span>Dias 'ganhos'</span>
              <strong>${pluralizeDays(best.gainedRestDays)}</strong>
            </div>
          </div>
        </div>
      </div>
      ${timeline}
      ${reasons}
      ${alternatives}
    `;
  }

  function renderTimeline(candidate, holidayMap, weeklyOffSet) {
    const days = getDatesBetween(candidate.restStart, candidate.restEnd)
      .map((date) => {
        const key = optimizer.dateKey(date);
        const holiday = holidayMap.get(key);
        const isVacation = isBetween(date, candidate.vacationStart, candidate.vacationEnd);
        const isWeekly = weeklyOffSet.has(date.getUTCDay());
        const classes = ["day-chip"];
        const tags = [];

        if (holiday) {
          classes.push("holiday");
          tags.push(holiday.name);
        }
        if (isWeekly) {
          classes.push("weekly");
          tags.push("Folga semanal");
        }
        if (isVacation) {
          classes.push("vacation");
          tags.push("Férias");
        }

        return `
          <div class="${classes.join(" ")}">
            <span class="day-date">${formatDate(date).slice(0, 5)}</span>
            <span class="day-weekday">${weekdayFormatter.format(date)}</span>
            <span class="day-tags">${tags.map(escapeHtml).join(" · ")}</span>
          </div>
        `;
      })
      .join("");

    return `
      <section class="timeline-section">
        <h3>Bloco recomendado</h3>
        <div class="timeline-grid">${days}</div>
      </section>
    `;
  }

  function renderReasons(candidate, weeklyOffSet) {
    const holidayItems = candidate.holidaysInRest.map((holiday) => {
      const label = holiday.type === "manual" ? "data extra" : "feriado nacional";
      return `<li><strong>${formatDate(holiday.date)} · ${escapeHtml(holiday.name)}</strong><br /><span>${label}</span></li>`;
    });

    const weeklyText = Array.from(weeklyOffSet)
      .sort((left, right) => left - right)
      .map((day) => weekdayNames[day])
      .join(", ");

    const items = [
`<li><strong>${weeklyText || "Nenhum dia semanal marcado"}</strong><br /><span>Folgas semanais consideradas.</span></li>`,
      ...holidayItems,
    ];

    return `
      <section class="reason-section">
        <h3>Composição</h3>
        <ul class="reason-list">${items.join("")}</ul>
      </section>
    `;
  }

  function renderAlternatives(candidates) {
    if (!candidates.length) {
      return "";
    }

    const items = candidates
      .map((candidate) => `
        <li>
          <strong>${pluralizeDays(candidate.totalRestDays)} · férias de ${formatDateRange(candidate.vacationStart, candidate.vacationEnd)}</strong><br />
          <span>Descanso de ${formatDateRange(candidate.restStart, candidate.restEnd)}</span>
        </li>
      `)
      .join("");

    return `
      <details class="alternatives-section">
        <summary>Próximas opções</summary>
        <ul class="alternative-list">${items}</ul>
      </details>
    `;
  }

  function calculate() {
    clearError();
    try {
      const options = getFormOptions();
      const result = optimizer.optimizeLeave(options);
      renderResult(result, options);
    } catch (error) {
      showError(error.message || "Não foi possível calcular com esses dados.");
    }
  }

  function addExtraHoliday() {
    clearError();
    const date = extraDateInput.value;
    const name = extraNameInput.value.trim() || "Feriado extra";

    if (!date) {
      showError("Escolha uma data extra antes de adicionar.");
      return;
    }

    try {
      optimizer.parseDate(date);
    } catch (error) {
      showError(error.message);
      return;
    }

    const existing = extraHolidays.find((holiday) => holiday.date === date);
    if (existing) {
      existing.name = name;
    } else {
      extraHolidays.push({ id: `${date}-${Date.now()}`, date, name });
    }

    extraDateInput.value = "";
    extraNameInput.value = "";
    saveExtras();
    renderExtras();
    calculate();
  }

  function setDefaultDates() {
    const today = new Date();
    minStartInput.value = isoLocalDate(today);
    maxEndInput.value = isoLocalDate(addLocalMonths(today, 12));
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    calculate();
  });

  addExtraButton.addEventListener("click", addExtraHoliday);
  extraNameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addExtraHoliday();
    }
  });

  resetButton.addEventListener("click", () => {
    extraHolidays = [];
    saveExtras();
    renderExtras();
    calculate();
  });

  form.addEventListener("change", (event) => {
    if (event.target.matches("input")) {
      calculate();
    }
  });

  setDefaultDates();
  renderExtras();
  renderNationalHolidays();
  calculate();
})();





