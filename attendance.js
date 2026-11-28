/* BU CSE 2026 — attendance tracker.
   Reads the class list from the timetable in script.js, so there is one
   source of truth. Everything is stored in this browser only. */
(function () {
  "use strict";

  var TT = window.BU_TIMETABLE || {};
  var DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG = {
    Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
    Thu: "Thursday", Fri: "Friday", Sat: "Saturday"
  };
  var STORE = "bu-attendance-v1";

  var state = load();
  var cursor = new Date();

  function load() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      return {
        batch: raw.batch === "B2" ? "B2" : "B1",
        marks: raw.marks && typeof raw.marks === "object" ? raw.marks : {}
      };
    } catch (e) {
      return { batch: "B1", marks: {} };
    }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {}
  }

  /* --- reading the timetable -------------------------------------------- */
  function classesOn(date) {
    var entries = TT[DAY_KEYS[date.getDay()]] || [];
    var out = [];
    entries.forEach(function (entry, i) {
      entry.subject.split(" · ").forEach(function (part) {
        var batch = part.match(/\((B[12])\)/);
        if (batch && batch[1] !== state.batch) return;   /* the other batch's lab */
        out.push({
          index: i,
          slot: entry.slot,
          name: part.replace(/\s*\(B[12]\)/, "").trim()
        });
      });
    });
    return out;
  }

  function iso(date) {
    return date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");
  }

  function markKey(date, item) {
    return iso(date) + "|" + item.index + "|" + item.name;
  }

  function datesInMonth(d) {
    var out = [];
    var probe = new Date(d.getFullYear(), d.getMonth(), 1);
    while (probe.getMonth() === d.getMonth()) {
      out.push(new Date(probe));
      probe.setDate(probe.getDate() + 1);
    }
    return out;
  }

  /* --- the numbers ------------------------------------------------------- */
  function compute() {
    var dates = datesInMonth(cursor);
    var per = {};
    var held = 0;

    dates.forEach(function (day) {
      classesOn(day).forEach(function (item) {
        var row = per[item.name] || (per[item.name] = { total: 0, present: 0, absent: 0 });
        row.total++;
        held++;
        var mark = state.marks[markKey(day, item)];
        if (mark === "P") row.present++;
        else if (mark === "A") row.absent++;
      });
    });

    return { per: per, held: held };
  }

  /* --- rendering --------------------------------------------------------- */
  var el = {
    month: document.querySelector("[data-month]"),
    summary: document.querySelector("[data-summary]"),
    subjects: document.querySelector("[data-subjects]"),
    days: document.querySelector("[data-days]"),
    batch: document.querySelectorAll("[data-batch]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    clear: document.querySelector("[data-clear]")
  };

  function monthName(d) {
    return d.toLocaleString("en-IN", { month: "long", year: "numeric" });
  }

  function pct(part, whole) {
    return whole ? Math.round((part / whole) * 100) : 0;
  }

  function renderStats() {
    var data = compute();
    var names = Object.keys(data.per).sort();
    var present = 0;
    names.forEach(function (n) { present += data.per[n].present; });

    el.month.textContent = monthName(cursor);
    el.batch.forEach(function (b) {
      var on = b.getAttribute("data-batch") === state.batch;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });

    el.summary.innerHTML =
      '<div class="att-figure"><span class="att-figure__num">' + present + "</span>" +
      '<span class="att-figure__of">/ ' + data.held + " classes</span></div>" +
      '<div class="att-figure__label">attended this month · ' + pct(present, data.held) + "%</div>";

    el.subjects.innerHTML = names.length ? names.map(function (n) {
      var r = data.per[n];
      var p = pct(r.present, r.total);
      return '<div class="att-card">' +
        '<div class="att-card__top"><span class="att-card__name">' + n + "</span>" +
        '<span class="att-card__count">' + r.present + " / " + r.total + "</span></div>" +
        '<div class="att-bar"><span style="width:' + p + '%"></span></div>' +
        '<div class="att-card__foot">' + p + "% attended" +
        (r.absent ? " · " + r.absent + " missed" : "") +
        (r.total - r.present - r.absent ? " · " + (r.total - r.present - r.absent) + " unmarked" : "") +
        "</div></div>";
    }).join("") : '<p class="body-copy">No classes in this month.</p>';

  }

  function renderDays() {
    var rows = [];
    datesInMonth(cursor).forEach(function (day) {
      var items = classesOn(day);
      if (!items.length) return;
      var chips = items.map(function (item) {
        var mark = state.marks[markKey(day, item)] || "";
        var cls = mark === "P" ? " is-present" : mark === "A" ? " is-absent" : "";
        return '<button type="button" class="att-chip' + cls + '" data-key="' +
          markKey(day, item).replace(/"/g, "&quot;") + '" aria-label="' + item.name +
          (mark === "P" ? ", present" : mark === "A" ? ", absent" : ", unmarked") + '">' +
          '<span class="att-chip__dot"></span>' + item.name + "</button>";
      }).join("");
      rows.push('<div class="att-day">' +
        '<div class="att-day__date"><b>' + day.getDate() + "</b>" +
        DAY_LONG[DAY_KEYS[day.getDay()]].slice(0, 3) + "</div>" +
        '<div class="att-day__chips">' + chips + "</div></div>");
    });

    el.days.innerHTML = rows.length ? rows.join("") :
      '<p class="body-copy">Nothing scheduled this month.</p>';
  }

  function render() {
    renderStats();
    renderDays();
  }

  /* --- interactions ------------------------------------------------------ */
  el.prev.addEventListener("click", function () {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
    render();
  });

  el.next.addEventListener("click", function () {
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    render();
  });

  el.batch.forEach(function (b) {
    b.addEventListener("click", function () {
      state.batch = b.getAttribute("data-batch");
      save();
      render();
    });
  });

  el.days.addEventListener("click", function (event) {
    var chip = event.target.closest(".att-chip");
    if (!chip) return;
    var key = chip.getAttribute("data-key");
    var now = state.marks[key] || "";
    if (!now) state.marks[key] = "P";
    else if (now === "P") state.marks[key] = "A";
    else delete state.marks[key];
    save();

    var mark = state.marks[key] || "";
    chip.classList.toggle("is-present", mark === "P");
    chip.classList.toggle("is-absent", mark === "A");
    chip.setAttribute("aria-label", chip.textContent.trim() +
      (mark === "P" ? ", present" : mark === "A" ? ", absent" : ", unmarked"));
    renderStats();
  });

  el.clear.addEventListener("click", function () {
    var prefix = iso(cursor).slice(0, 7);
    Object.keys(state.marks).forEach(function (k) {
      if (k.indexOf(prefix) === 0) delete state.marks[k];
    });
    save();
    render();
  });

  render();
})();
