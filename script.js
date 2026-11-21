/* BU CSE 2026 — small behaviours, no dependencies. */
(function () {
  "use strict";

  /* --- Mobile navigation ------------------------------------------------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector("#site-nav");

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  /* --- Active nav item (works for stubs too) ----------------------------- */
  var here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("#site-nav a, .bottom-nav a").forEach(function (link) {
    var target = link.getAttribute("href");
    if (target === here) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  /* --- Scroll reveal ----------------------------------------------------- */
  var revealables = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!("IntersectionObserver" in window) || reduce) {
    revealables.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* --- Campus clock (IST) ------------------------------------------------ */
  var clock = document.querySelector("#clock");
  if (clock) {
    var tick = function () {
      var now = new Date();
      var time = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).format(now);
      var day = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        weekday: "short"
      }).format(now);
      clock.textContent = time;
      var zone = document.querySelector("#clock-zone");
      if (zone) zone.textContent = day + " · Campus time · IST";
    };
    tick();
    setInterval(tick, 15000);
  }

  /* --- Student list filter (one or more searchable lists) ---------------- */
  document.querySelectorAll("[data-student-block]").forEach(function (block) {
    var search = block.querySelector("[data-student-search]");
    var list = block.querySelector("[data-student-list]");
    if (!search || !list) return;

    var empty = list.querySelector("[data-student-empty]");
    var rows = Array.prototype.slice.call(list.querySelectorAll("li[data-name]"));

    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var shown = 0;

      rows.forEach(function (row) {
        var hit = !q || row.getAttribute("data-name").toLowerCase().indexOf(q) !== -1;
        row.classList.toggle("is-hidden", !hit);
        if (hit) shown++;
      });

      if (empty) empty.hidden = shown !== 0;
    });
  });

  /* --- Photo lightbox ---------------------------------------------------- */
  var lightbox = document.querySelector("#lightbox");
  var tiles = document.querySelectorAll("[data-full]");

  if (lightbox && tiles.length && typeof lightbox.showModal === "function") {
    var lbImg = lightbox.querySelector(".lightbox__img");
    var lbCap = lightbox.querySelector(".lightbox__caption");
    var lbClose = lightbox.querySelector(".lightbox__close");

    tiles.forEach(function (tile) {
      tile.addEventListener("click", function () {
        var full = tile.getAttribute("data-full");
        var alt = tile.querySelector("img").getAttribute("alt");
        lbImg.setAttribute("src", full);
        lbImg.setAttribute("alt", alt);
        lbCap.textContent = tile.getAttribute("data-caption") || "";
        lightbox.showModal();
      });
    });

    lbClose.addEventListener("click", function () { lightbox.close(); });
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener("close", function () {
      lbImg.removeAttribute("src");
      lbImg.setAttribute("alt", "");
    });
  }

  /* --- Progressive photo wall -------------------------------------------- */
  var wall = document.querySelector("[data-photo-wall]");
  var moreBtn = document.querySelector("[data-load-more]");

  if (wall && moreBtn) {
    var wallItems = Array.prototype.slice.call(wall.querySelectorAll(".photo-wall__item"));
    var STEP = 15;
    var shown = Math.min(STEP, wallItems.length);

    wallItems.forEach(function (item, i) {
      if (i >= shown) item.classList.add("is-pending");
    });

    function updateMore() {
      var left = wallItems.length - shown;
      if (left <= 0) {
        moreBtn.hidden = true;
        return;
      }
      moreBtn.hidden = false;
      moreBtn.textContent = left > STEP
        ? "Load " + STEP + " more photos"
        : "Load the last " + left + (left === 1 ? " photo" : " photos");
    }

    moreBtn.addEventListener("click", function () {
      var next = Math.min(shown + STEP, wallItems.length);
      for (var i = shown; i < next; i++) wallItems[i].classList.remove("is-pending");
      shown = next;
      updateMore();
    });

    updateMore();
  }

  /* --- Timetable: today's classes and today's row ------------------------ */
  var TIMETABLE = {
    Mon: [
      { slot: "I · 10–11", subject: "Environment & Ecology", who: "A. K. Giri" },
      { slot: "II · 11–12", subject: "Engg. Mathematics", who: "Mrs. Ritu Masandra" },
      { slot: "III · 12–1", subject: "Professional Communication", who: "Dr. Manisha Jain" },
      { slot: "IV–V · 2–4", subject: "CCP Lab (B2) · Mechanics Lab (B1)", who: "Er. B. B. Niranjan · Er. Rajat Kushwaha", lab: true }
    ],
    Tue: [
      { slot: "I · 10–11", subject: "Environment & Ecology", who: "A. K. Giri" },
      { slot: "II · 11–12", subject: "Engg. Mathematics", who: "Mrs. Ritu Masandra" },
      { slot: "III · 12–1", subject: "Professional Communication", who: "Dr. Manisha Jain" },
      { slot: "IV–V · 2–4", subject: "Professional Communication Lab", who: "Dr. Manisha Jain · Communication Lab", lab: true }
    ],
    Wed: [
      { slot: "I · 10–11", subject: "Engg. Physics", who: "Dr. Anjita Srivastava" },
      { slot: "II · 11–12", subject: "Engg. Mathematics", who: "Mrs. Ritu Masandra" },
      { slot: "III · 12–1", subject: "Professional Communication", who: "Dr. Manisha Jain" },
      { slot: "IV–V · 2–4", subject: "Mechanics Lab (B2) · CAD Lab (B1)", who: "Er. Rajat Kushwaha · Dr. Satendra Upadhyay", lab: true }
    ],
    Thu: [
      { slot: "I · 10–11", subject: "Engg. Physics", who: "Dr. Anjita Srivastava" },
      { slot: "II · 11–12", subject: "Engg. Mechanics", who: "Er. Rajat Kushwaha" },
      { slot: "III · 12–1", subject: "CCP", who: "Er. B. B. Niranjan" },
      { slot: "IV–V · 2–4", subject: "CCP Lab (B2)", who: "Dr. Satendra Upadhyay · Mech. Dept.", lab: true }
    ],
    Fri: [
      { slot: "II · 11–12", subject: "Engg. Mechanics", who: "Er. Rajat Kushwaha" },
      { slot: "III · 12–1", subject: "CCP", who: "Er. B. B. Niranjan" },
      { slot: "IV–V · 2–4", subject: "CCP Lab (B1)", who: "Er. B. B. Niranjan · Lab 1", lab: true }
    ],
    Sat: [
      { slot: "II · 11–12", subject: "Engg. Mechanics", who: "Er. Rajat Kushwaha" },
      { slot: "III · 12–1", subject: "CCP", who: "Er. B. B. Niranjan" }
    ]
  };

  var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var FULL_DAYS = {
    Sun: "Sunday", Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
    Thu: "Thursday", Fri: "Friday", Sat: "Saturday"
  };
  var todayKey = DAY_NAMES[new Date().getDay()];

  /* home page: compact strip */
  var strip = document.querySelector("[data-today-classes]");
  if (strip) {
    var dayLabel = strip.querySelector("[data-today-day]");
    var dateLabel = strip.querySelector("[data-today-date]");
    var list = strip.querySelector("[data-today-list]");
    var entries = TIMETABLE[todayKey] || [];

    if (dayLabel) dayLabel.textContent = FULL_DAYS[todayKey] || todayKey;
    if (dateLabel) {
      dateLabel.textContent = new Intl.DateTimeFormat("en-IN", {
        day: "numeric", month: "long"
      }).format(new Date());
    }

    if (list) {
      if (!entries.length) {
        var empty = document.createElement("li");
        empty.className = "today-strip__empty";
        empty.textContent = "No classes today. The full week is on the info page.";
        list.appendChild(empty);
        list.classList.add("is-empty");
      } else {
        entries.forEach(function (e) {
          var li = document.createElement("li");
          var slot = document.createElement("span");
          slot.className = "slot";
          slot.textContent = e.slot;
          var subject = document.createElement("span");
          subject.className = "subject";
          subject.textContent = e.subject;
          var who = document.createElement("span");
          who.className = "who";
          who.textContent = e.who;
          li.appendChild(slot);
          li.appendChild(subject);
          li.appendChild(who);
          list.appendChild(li);
        });
      }
    }
  }

  /* info page: mark today's row */
  var grid = document.querySelector(".timetable--grid");
  if (grid && todayKey !== "Sun") {
    Array.prototype.forEach.call(grid.querySelectorAll("tbody tr"), function (row) {
      var head = row.querySelector('th[scope="row"]');
      if (head && head.textContent.trim() === todayKey) {
        row.classList.add("is-today");
        head.setAttribute("aria-current", "date");
      }
    });
  }

  /* --- Footer year ------------------------------------------------------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* --- mailto forms: prefill a tidy subject ----------------------------- */
  document.querySelectorAll("[data-mail-form]").forEach(function (form) {
    form.addEventListener("submit", function () {
      var topic = form.querySelector('[name="topic"]');
      var name = form.querySelector('[name="name"]');
      var subject = "BU CSE 2026 — " + (topic ? topic.value : "Feedback");
      if (name && name.value.trim()) subject += " (" + name.value.trim() + ")";
      form.setAttribute(
        "action",
        "mailto:kradam2557@gmail.com?subject=" + encodeURIComponent(subject)
      );
    });
  });
})();
