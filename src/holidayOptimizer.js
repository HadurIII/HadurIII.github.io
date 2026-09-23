(function attachHolidayOptimizer(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.HolidayOptimizer = api;
})(typeof globalThis !== "undefined" ? globalThis : window, function createHolidayOptimizer() {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const WEEKDAY_COUNT = 7;

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function makeDate(year, month, day) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  function parseDate(value) {
    if (value instanceof Date) {
      return makeDate(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
    }

    if (typeof value !== "string") {
      throw new Error("Date must be a YYYY-MM-DD string or a Date instance.");
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      throw new Error(`Invalid date: ${value}. Use YYYY-MM-DD.`);
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = makeDate(year, month, day);

    if (dateKey(date) !== value) {
      throw new Error(`Invalid date: ${value}.`);
    }

    return date;
  }

  function dateKey(value) {
    const date = value instanceof Date ? value : parseDate(value);
    return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  }

  function addDays(value, amount) {
    const date = parseDate(value);
    date.setUTCDate(date.getUTCDate() + amount);
    return date;
  }

  function daysBetweenInclusive(start, end) {
    return Math.round((parseDate(end).getTime() - parseDate(start).getTime()) / DAY_MS) + 1;
  }

  function getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return makeDate(year, month, day);
  }

  function getBrazilNationalHolidays(year) {
    const goodFriday = addDays(getEasterSunday(year), -2);
    const holidays = [
      { date: `${year}-01-01`, name: "Confraternizacao Universal", type: "national" },
      { date: dateKey(goodFriday), name: "Paixao de Cristo", type: "national" },
      { date: `${year}-04-21`, name: "Tiradentes", type: "national" },
      { date: `${year}-05-01`, name: "Dia do Trabalho", type: "national" },
      { date: `${year}-09-07`, name: "Independencia do Brasil", type: "national" },
      { date: `${year}-10-12`, name: "Nossa Senhora Aparecida", type: "national" },
      { date: `${year}-11-02`, name: "Finados", type: "national" },
      { date: `${year}-11-15`, name: "Proclamacao da Republica", type: "national" },
      { date: `${year}-11-20`, name: "Dia Nacional de Zumbi e da Consciencia Negra", type: "national" },
      { date: `${year}-12-25`, name: "Natal", type: "national" },
    ];

    return holidays.sort((left, right) => dateKey(left.date).localeCompare(dateKey(right.date)));
  }

  function getNationalHolidaysUntilEndOfNextYear(referenceDate) {
    const start = parseDate(referenceDate || new Date());
    const startKey = dateKey(start);
    const endYear = start.getUTCFullYear() + 1;

    return [
      ...getBrazilNationalHolidays(start.getUTCFullYear()),
      ...getBrazilNationalHolidays(endYear),
    ].filter((holiday) => holiday.date >= startKey && holiday.date <= `${endYear}-12-31`);
  }

  function normalizeHoliday(holiday, fallbackType) {
    if (typeof holiday === "string") {
      return { date: dateKey(holiday), name: "Feriado", type: fallbackType };
    }

    return {
      date: dateKey(holiday.date),
      name: holiday.name && holiday.name.trim() ? holiday.name.trim() : "Feriado",
      type: holiday.type || fallbackType,
    };
  }

  function buildHolidayMap(holidays) {
    return holidays.reduce((map, holiday) => {
      const normalized = normalizeHoliday(holiday, "manual");
      map.set(normalized.date, normalized);
      return map;
    }, new Map());
  }

  function buildHolidayMapForRange(minStart, maxEnd, extraHolidays) {
    const start = parseDate(minStart);
    const end = parseDate(maxEnd);
    const holidays = [];

    for (let year = start.getUTCFullYear() - 1; year <= end.getUTCFullYear() + 1; year += 1) {
      holidays.push(...getBrazilNationalHolidays(year));
    }

    for (const extraHoliday of extraHolidays || []) {
      holidays.push({ ...normalizeHoliday(extraHoliday, "manual"), type: "manual" });
    }

    return buildHolidayMap(holidays);
  }

  function normalizeWeeklyOffDays(weeklyOffDays) {
    const normalized = new Set((weeklyOffDays || []).map(Number));
    for (const day of normalized) {
      if (!Number.isInteger(day) || day < 0 || day > 6) {
        throw new Error("Weekdays must be numbers from 0 to 6.");
      }
    }

    if (normalized.size >= WEEKDAY_COUNT) {
      throw new Error("Select at least one working weekday.");
    }

    return normalized;
  }

  function isExistingDayOff(date, weeklyOffSet, holidayMap) {
    const parsedDate = parseDate(date);
    return weeklyOffSet.has(parsedDate.getUTCDay()) || holidayMap.has(dateKey(parsedDate));
  }

  function getHolidayNamesBetween(start, end, holidayMap) {
    const names = [];
    for (let cursor = parseDate(start); cursor <= parseDate(end); cursor = addDays(cursor, 1)) {
      const holiday = holidayMap.get(dateKey(cursor));
      if (holiday) {
        names.push(holiday);
      }
    }
    return names;
  }

  function countExistingDaysOffInsideVacation(start, end, weeklyOffSet, holidayMap) {
    let count = 0;
    for (let cursor = parseDate(start); cursor <= parseDate(end); cursor = addDays(cursor, 1)) {
      if (isExistingDayOff(cursor, weeklyOffSet, holidayMap)) {
        count += 1;
      }
    }
    return count;
  }

  function createCandidate(start, leaveDays, weeklyOffSet, holidayMap) {
    const vacationStart = parseDate(start);
    const vacationEnd = addDays(vacationStart, leaveDays - 1);
    let restStart = parseDate(vacationStart);
    let restEnd = parseDate(vacationEnd);

    while (isExistingDayOff(addDays(restStart, -1), weeklyOffSet, holidayMap)) {
      restStart = addDays(restStart, -1);
    }

    while (isExistingDayOff(addDays(restEnd, 1), weeklyOffSet, holidayMap)) {
      restEnd = addDays(restEnd, 1);
    }

    const existingDaysOffInsideVacation = countExistingDaysOffInsideVacation(
      vacationStart,
      vacationEnd,
      weeklyOffSet,
      holidayMap
    );

    const totalRestDays = daysBetweenInclusive(restStart, restEnd);

    return {
      vacationStart,
      vacationEnd,
      restStart,
      restEnd,
      totalRestDays,
      gainedRestDays: totalRestDays - leaveDays,
      existingDaysOffInsideVacation,
      startsOnExistingDayOff: isExistingDayOff(vacationStart, weeklyOffSet, holidayMap),
      holidaysInRest: getHolidayNamesBetween(restStart, restEnd, holidayMap),
    };
  }

  function compareCandidates(left, right) {
    if (left.totalRestDays !== right.totalRestDays) {
      return right.totalRestDays - left.totalRestDays;
    }

    if (left.existingDaysOffInsideVacation !== right.existingDaysOffInsideVacation) {
      return left.existingDaysOffInsideVacation - right.existingDaysOffInsideVacation;
    }

    if (left.startsOnExistingDayOff !== right.startsOnExistingDayOff) {
      return left.startsOnExistingDayOff ? 1 : -1;
    }

    return left.vacationStart.getTime() - right.vacationStart.getTime();
  }

  function optimizeLeave(options) {
    const leaveDays = Number(options.leaveDays);
    if (!Number.isInteger(leaveDays) || leaveDays < 1) {
      throw new Error("Vacation days must be a positive whole number.");
    }

    const minStart = parseDate(options.minStart);
    const maxEnd = parseDate(options.maxEnd);
    if (maxEnd < minStart) {
      throw new Error("The maximum end date must be after the minimum start date.");
    }

    const weeklyOffSet = normalizeWeeklyOffDays(options.weeklyOffDays || [0]);
    const holidayMap = buildHolidayMapForRange(minStart, maxEnd, options.extraHolidays || []);
    const latestStart = addDays(maxEnd, -(leaveDays - 1));
    const candidates = [];

    for (let cursor = parseDate(minStart); cursor <= latestStart; cursor = addDays(cursor, 1)) {
      candidates.push(createCandidate(cursor, leaveDays, weeklyOffSet, holidayMap));
    }

    candidates.sort(compareCandidates);

    return {
      best: candidates[0] || null,
      candidates,
      holidayMap,
    };
  }

  return {
    addDays,
    buildHolidayMap,
    dateKey,
    daysBetweenInclusive,
    getBrazilNationalHolidays,
    getNationalHolidaysUntilEndOfNextYear,
    isExistingDayOff,
    optimizeLeave,
    parseDate,
  };
});


