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
  document.querySelectorAll("#site-nav a").forEach(function (link) {
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
