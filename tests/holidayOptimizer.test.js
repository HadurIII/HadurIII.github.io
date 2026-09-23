const assert = require("node:assert/strict");
const {
  addDays,
  buildHolidayMap,
  dateKey,
  getBrazilNationalHolidays,
  getNationalHolidaysUntilEndOfNextYear,
  optimizeLeave,
} = require("../src/holidayOptimizer");

function sameDate(actual, expected) {
  assert.equal(dateKey(actual), expected);
}

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}

test("finds the longest rest block even when the best vacation starts on a regular day", () => {
  const result = optimizeLeave({
    leaveDays: 9,
    minStart: "2026-05-01",
    maxEnd: "2026-05-31",
    weeklyOffDays: [],
    extraHolidays: [
      { date: "2026-05-05", name: "Feriado A" },
      { date: "2026-05-15", name: "Feriado B" },
    ],
  });

  assert.equal(result.best.totalRestDays, 11);
  assert.equal(result.best.gainedRestDays, 2);
  sameDate(result.best.vacationStart, "2026-05-06");
  sameDate(result.best.vacationEnd, "2026-05-14");
  sameDate(result.best.restStart, "2026-05-05");
  sameDate(result.best.restEnd, "2026-05-15");
  assert.equal(result.best.startsOnExistingDayOff, false);
});

test("chooses a start on an existing day off when it creates the biggest rest block", () => {
  const result = optimizeLeave({
    leaveDays: 3,
    minStart: "2026-02-09",
    maxEnd: "2026-02-12",
    weeklyOffDays: [],
    extraHolidays: [
      { date: "2026-02-10", name: "Folga extra" },
      { date: "2026-02-13", name: "Folga extra" },
    ],
  });

  assert.equal(result.best.totalRestDays, 4);
  sameDate(result.best.vacationStart, "2026-02-10");
  sameDate(result.best.vacationEnd, "2026-02-12");
  sameDate(result.best.restStart, "2026-02-10");
  sameDate(result.best.restEnd, "2026-02-13");
  assert.equal(result.best.startsOnExistingDayOff, true);
});

test("uses Brazilian guaranteed national holidays and ignores optional dates by default", () => {
  const holidays = getBrazilNationalHolidays(2026);
  const holidayMap = buildHolidayMap(holidays);

  assert.equal(holidayMap.get("2026-01-01").name, "Confraternizacao Universal");
  assert.equal(holidayMap.get("2026-04-03").name, "Paixao de Cristo");
  assert.equal(holidayMap.get("2026-11-20").name, "Dia Nacional de Zumbi e da Consciencia Negra");
  assert.equal(holidayMap.has("2026-02-17"), false);
  assert.equal(holidayMap.has("2026-06-04"), false);
});

test("extends the rest block backward from a manual holiday before the vacation", () => {
  const result = optimizeLeave({
    leaveDays: 2,
    minStart: "2026-02-09",
    maxEnd: "2026-02-13",
    weeklyOffDays: [],
    extraHolidays: [{ date: "2026-02-10", name: "Folga extra" }],
  });

  assert.equal(result.best.totalRestDays, 3);
  sameDate(result.best.vacationStart, "2026-02-11");
  sameDate(result.best.vacationEnd, "2026-02-12");
  sameDate(result.best.restStart, "2026-02-10");
  sameDate(result.best.restEnd, "2026-02-12");
});


test("lists national holidays from a reference date through the end of the following year", () => {
  const holidays = getNationalHolidaysUntilEndOfNextYear("2026-11-16");
  const keys = holidays.map((holiday) => holiday.date);

  assert.deepEqual(keys, [
    "2026-11-20",
    "2026-12-25",
    "2027-01-01",
    "2027-03-26",
    "2027-04-21",
    "2027-05-01",
    "2027-09-07",
    "2027-10-12",
    "2027-11-02",
    "2027-11-15",
    "2027-11-20",
    "2027-12-25",
  ]);
});
test("returns no result when the vacation period cannot fit inside the window", () => {
  const result = optimizeLeave({
    leaveDays: 10,
    minStart: "2026-01-01",
    maxEnd: "2026-01-05",
    weeklyOffDays: [0],
    extraHolidays: [],
  });

  assert.equal(result.best, null);
  assert.deepEqual(result.candidates, []);
});


test("rejects configurations where every weekday is already a day off", () => {
  assert.throws(
    () => optimizeLeave({
      leaveDays: 5,
      minStart: "2026-01-01",
      maxEnd: "2026-01-31",
      weeklyOffDays: [0, 1, 2, 3, 4, 5, 6],
      extraHolidays: [],
    }),
    /at least one working weekday/i
  );
});
test("date math stays stable across month boundaries", () => {
  sameDate(addDays("2026-01-31", 1), "2026-02-01");
  sameDate(addDays("2026-03-01", -1), "2026-02-28");
});






