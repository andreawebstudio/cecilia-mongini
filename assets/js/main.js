/* Cecilia Mongini — JavaScript essenziale, nessuna libreria esterna */
(function () {
  "use strict";
  document.documentElement.classList.remove("no-js");

  /* ---------- Header: ombra leggera allo scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Menu mobile ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("main-nav");
  var mq = window.matchMedia("(max-width: 1099px)");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
    nav.classList.toggle("is-open", open);
    document.body.classList.toggle("nav-open", open);
  }
  function syncNavA11y() {
    // su mobile il menu chiuso non deve essere raggiungibile da tastiera
    if (mq.matches) {
      nav.toggleAttribute("inert", !nav.classList.contains("is-open"));
    } else {
      nav.removeAttribute("inert");
      setMenu(false);
    }
  }
  toggle.addEventListener("click", function () {
    setMenu(toggle.getAttribute("aria-expanded") !== "true");
    syncNavA11y();
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a") && mq.matches) { setMenu(false); syncNavA11y(); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && nav.classList.contains("is-open")) {
      setMenu(false); syncNavA11y(); toggle.focus();
    }
  });
  (mq.addEventListener ? mq.addEventListener("change", syncNavA11y) : mq.addListener(syncNavA11y));
  syncNavA11y();

  /* ---------- Voce di menu attiva ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav-list a"));
  if ("IntersectionObserver" in window) {
    var map = {};
    links.forEach(function (a) { map[a.getAttribute("href").slice(1)] = a; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.removeAttribute("aria-current"); });
          map[en.target.id].setAttribute("aria-current", "true");
        }
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    Object.keys(map).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) spy.observe(s);
    });
  }

  /* ---------- Fade-in discreto ---------- */
  var reveals = document.querySelectorAll(".reveal");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------- Come funziona: la linea si disegna e i passaggi si accendono in sequenza ---------- */
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    var steps = timeline.querySelectorAll(".step");
    var delays = [150, 1100, 1600, 2500];
    var playTimeline = function () {
      timeline.classList.add("is-drawn");
      steps.forEach(function (s, i) {
        if (reduce) { s.classList.add("is-on"); return; }
        setTimeout(function () { s.classList.add("is-on"); }, delays[i] || i * 700);
      });
    };
    if (reduce || !("IntersectionObserver" in window)) {
      playTimeline();
    } else {
      var tio = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { playTimeline(); tio.disconnect(); }
      }, { threshold: 0.35 });
      tio.observe(timeline);
    }
  }

  /* ---------- FAQ accordion accessibile ---------- */
  document.querySelectorAll(".faq-trigger").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var item = btn.closest(".faq-item");
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!open));
      item.classList.toggle("is-open", !open);
    });
  });

  /* ---------- Modulo di contatto ----------
     Il modulo NON simula invii. Funziona soltanto quando nell'attributo
     data-endpoint del <form> viene configurato un servizio di invio reale e sicuro
     (es. un endpoint HTTPS del proprio hosting o un servizio form conforme GDPR).
     L'endpoint deve rispondere con uno stato HTTP 2xx in caso di successo. */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var messages = {
      nome: "Inserisci il tuo nome.",
      email: "Inserisci un indirizzo email valido (es. nome@dominio.it).",
      messaggio: "Scrivi un breve messaggio.",
      privacy: "Per inviare la richiesta è necessario accettare l'informativa privacy."
    };

    function showError(field, msg) {
      var err = document.getElementById(field.id + "-error");
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      if (err) err.textContent = msg || "";
    }
    function validate(field) {
      var name = field.name;
      if (!messages[name]) return true;
      var ok = field.type === "checkbox" ? field.checked : field.checkValidity() && field.value.trim() !== "";
      showError(field, ok ? "" : messages[name]);
      return ok;
    }
    form.querySelectorAll("input, textarea").forEach(function (f) {
      f.addEventListener("blur", function () { if (f.getAttribute("aria-invalid") === "true") validate(f); });
      f.addEventListener("change", function () { if (f.getAttribute("aria-invalid") === "true") validate(f); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      status.textContent = "";
      status.classList.remove("is-error");

      var firstInvalid = null;
      ["nome", "email", "messaggio", "privacy"].forEach(function (n) {
        var f = form.elements[n];
        if (!validate(f) && !firstInvalid) firstInvalid = f;
      });
      if (firstInvalid) { firstInvalid.focus(); return; }

      var endpoint = (form.getAttribute("data-endpoint") || "").trim();
      if (!endpoint) {
        status.classList.add("is-error");
        status.textContent = "Il modulo di contatto è in fase di attivazione e al momento non può inviare messaggi. La tua richiesta non è stata inviata.";
        return;
      }

      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      status.textContent = "Invio in corso…";
      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { "Accept": "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        status.textContent = "Grazie, la tua richiesta è stata inviata.";
      }).catch(function () {
        status.classList.add("is-error");
        status.textContent = "Non è stato possibile inviare la richiesta. Riprova più tardi.";
      }).then(function () { btn.disabled = false; });
    });
  }

  /* Anno nel footer */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
})();
