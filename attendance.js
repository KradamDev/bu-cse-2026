/* BU CSE 2026 — attendance tracker.
   Reads the class list from the timetable in script.js, so there is one
   source of truth. Everything is stored in this browser only. */
(function () {
  "use strict";

  var TT = window.BU_TIMETABLE || {};
  var DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var DAY_LONG = {
    Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
    Thu: "Thursday", Fri: "Friday", Sat: "Saturday", Sun: "Sunday"
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

  function dayState(date, items) {
    var p = 0, a = 0;
    items.forEach(function (item) {
      var mark = state.marks[markKey(date, item)];
      if (mark === "P") p++;
      else if (mark === "A") a++;
    });
    if (p && !a && p === items.length) return "all-present";
    if (a && !p && a === items.length) return "all-absent";
    if (p || a) return "partial";
    return "none";
  }

  /* --- the numbers ------------------------------------------------------- */
  function compute() {
    var per = {}, held = 0;
    datesInMonth(cursor).forEach(function (day) {
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

  /* --- elements ---------------------------------------------------------- */
  var el = {
    month: document.querySelector("[data-month]"),
    summary: document.querySelector("[data-summary]"),
    subjects: document.querySelector("[data-subjects]"),
    cal: document.querySelector("[data-calendar]"),
    batch: document.querySelectorAll("[data-batch]"),
    prev: document.querySelector("[data-prev]"),
    next: document.querySelector("[data-next]"),
    clear: document.querySelector("[data-clear]"),
    modal: document.querySelector("[data-modal]"),
    modalTitle: document.querySelector("[data-modal-title]"),
    modalBody: document.querySelector("[data-modal-body]"),
    modalClose: document.querySelector("[data-modal-close]")
  };

  function pct(part, whole) {
    return whole ? Math.round((part / whole) * 100) : 0;
  }

  function renderStats() {
    var data = compute();
    var names = Object.keys(data.per).sort();
    var present = 0;
    names.forEach(function (n) { present += data.per[n].present; });

    el.month.textContent = cursor.toLocaleString("en-IN", { month: "long", year: "numeric" });
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

  function renderCalendar() {
    var first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    var lead = (first.getDay() + 6) % 7;                 /* Monday-first grid */
    var today = iso(new Date());
    var cells = [];

    for (var i = 0; i < lead; i++) cells.push('<span class="att-cal__pad"></span>');

    datesInMonth(cursor).forEach(function (day) {
      var items = classesOn(day);
      var n = items.length;
      var state_ = n ? dayState(day, items) : "empty";
      var isToday = iso(day) === today;
      var label = day.getDate() + " " + DAY_LONG[DAY_KEYS[day.getDay()]];
      cells.push(
        '<button type="button" class="att-cal__day is-' + state_ + (isToday ? " is-today" : "") +
        '" data-date="' + iso(day) + '"' + (n ? "" : " disabled") +
        ' aria-label="' + label + (n ? ", " + n + " classes" : ", no classes") + '">' +
        '<span class="att-cal__num">' + day.getDate() + "</span>" +
        (n ? '<span class="att-cal__count">' + n + "</span>" : "") +
        "</button>");
    });

    el.cal.innerHTML =
      ['Mon', "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        .map(function (d) { return '<span class="att-cal__head">' + d + "</span>"; }).join("") +
      cells.join("");
  }

  function render() {
    renderStats();
    renderCalendar();
  }

  /* --- the popup --------------------------------------------------------- */
  function openDay(isoDate) {
    var parts = isoDate.split("-");
    var day = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var items = classesOn(day);
    if (!items.length) return;

    el.modalTitle.innerHTML = DAY_LONG[DAY_KEYS[day.getDay()]] + ", " + day.getDate() +
      ' <span class="att-modal__sub">' + cursor.toLocaleString("en-IN", { month: "long", year: "numeric" }) + "</span>";

    el.modalBody.innerHTML = items.map(function (item) {
      var mark = state.marks[markKey(day, item)] || "";
      var cls = mark === "P" ? " is-present" : mark === "A" ? " is-absent" : "";
      return '<button type="button" class="att-chip att-chip--wide' + cls + '" data-key="' +
        markKey(day, item).replace(/"/g, "&quot;") + '">' +
        '<span class="att-chip__dot"></span>' +
        '<span class="att-chip__text"><b>' + item.name + "</b>" +
        '<span class="att-chip__slot">' + item.slot + "</span></span></button>";
    }).join("");

    if (typeof el.modal.showModal === "function") el.modal.showModal();
    else el.modal.setAttribute("open", "");
  }

  /* --- events ------------------------------------------------------------ */
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

  el.cal.addEventListener("click", function (event) {
    var day = event.target.closest(".att-cal__day");
    if (day) openDay(day.getAttribute("data-date"));
  });

  el.modalBody.addEventListener("click", function (event) {
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
    renderStats();
    renderCalendar();
  });

  el.modalClose.addEventListener("click", function () {
    if (typeof el.modal.close === "function") el.modal.close();
    else el.modal.removeAttribute("open");
  });

  el.modal.addEventListener("click", function (event) {
    if (event.target === el.modal) el.modalClose.click();   /* click the backdrop */
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
