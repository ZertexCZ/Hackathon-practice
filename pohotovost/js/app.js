(function () {
  "use strict";

  var DATA = window.POHOTOVOST_DATA;
  var S = window.Schedule;

  var TYPES = [
    { id: "adult", label: "Pohotovost pro dospělé", short: "Dospělí",
      icon: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>' },
    { id: "child", label: "Pohotovost pro děti a dorost", short: "Děti",
      icon: '<circle cx="12" cy="6" r="3.2"/><path d="M6 21v-5.5A4.5 4.5 0 0 1 10.5 11h3a4.5 4.5 0 0 1 4.5 4.5V21h-3.5v-5h-5v5z"/>' },
    { id: "dental", label: "Stomatologická pohotovost", short: "Zubní",
      icon: '<path d="M7.5 3C4.5 3 3 5.2 3 8c0 3 1.3 4.6 2 7 .6 2.2.9 6 2.9 6 1.8 0 1.7-4.6 4.1-4.6s2.3 4.6 4.1 4.6c2 0 2.3-3.8 2.9-6 .7-2.4 2-4 2-7 0-2.8-1.5-5-4.5-5-2 0-3 1-4.5 1S9.5 3 7.5 3z"/>' },
    { id: "pharmacy", label: "Lékárenská pohotovost", short: "Lékárna",
      icon: '<path d="M4.2 13.3l9.1-9.1a4.3 4.3 0 0 1 6.1 6.1l-9.1 9.1a4.3 4.3 0 0 1-6.1-6.1zm3.2-3.2l6.5 6.5 4.1-4.1a2.3 2.3 0 0 0-3.2-3.2l-1.1 1.1z"/>' }
  ];
  var COLORS = { adult: "#c8102e", child: "#1f6fd1", dental: "#7a3fc2", pharmacy: "#128a4a" };

  var state = { townId: "kv", date: S.startOfDay(new Date()) };
  var els = {
    towns: document.getElementById("towns"),
    date: document.getElementById("date"),
    dayinfo: document.getElementById("dayinfo"),
    results: document.getElementById("results"),
    week: document.getElementById("week"),
    mapnote: document.getElementById("mapnote"),
    sources: document.getElementById("sources")
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function town() { return DATA.towns.filter(function (t) { return t.id === state.townId; })[0]; }
  function townName(id) {
    var t = DATA.towns.filter(function (x) { return x.id === id; })[0];
    return t ? t.name : id;
  }
  function isToday() { return S.sameDay(state.date, new Date()); }
  function telHref(p) { return "tel:+420" + String(p).replace(/\s+/g, ""); }
  function navHref(i) { return "https://www.google.com/maps/dir/?api=1&destination=" + i.lat + "," + i.lon; }
  function fmtKm(km) { return km < 1 ? "v místě" : (km < 10 ? km.toFixed(1).replace(".", ",") : Math.round(km)) + " km"; }
  function fmtDate(d, withYear) {
    return S.DAY_NAME[d.getDay()] + " " + d.getDate() + ". " + (d.getMonth() + 1) + "." + (withYear ? " " + d.getFullYear() : "");
  }
  function relDay(d) {
    var diff = Math.round((S.startOfDay(d) - S.startOfDay(new Date())) / 86400000);
    if (diff === 0) return "dnes";
    if (diff === 1) return "zítra";
    return fmtDate(d);
  }
  function svg(icon) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + icon + "</svg>"; }

  /* ---------------- Ovládání ---------------- */

  function renderTowns() {
    els.towns.innerHTML = DATA.towns.map(function (t) {
      var on = t.id === state.townId;
      return '<button type="button" role="radio" class="chip' + (on ? " on" : "") + '" aria-checked="' + on +
        '" data-town="' + t.id + '">' + esc(t.name) + '<small>okr. ' + esc(t.okres) + "</small></button>";
    }).join("");
  }

  els.towns.addEventListener("click", function (e) {
    var b = e.target.closest("[data-town]");
    if (!b) return;
    setTown(b.getAttribute("data-town"));
  });
  els.towns.addEventListener("keydown", function (e) {
    if (["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"].indexOf(e.key) === -1) return;
    var ids = DATA.towns.map(function (t) { return t.id; });
    var i = ids.indexOf(state.townId) + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1);
    setTown(ids[(i + ids.length) % ids.length]);
    var btn = els.towns.querySelector('[data-town="' + state.townId + '"]');
    if (btn) btn.focus();
    e.preventDefault();
  });

  function setTown(id) {
    state.townId = id;
    try { localStorage.setItem("pohotovost-town", id); } catch (e) { /* ignore */ }
    render(true);
  }
  function setDate(d) { state.date = S.startOfDay(d); render(true); }

  els.date.addEventListener("change", function () {
    if (els.date.value) setDate(S.parseISODate(els.date.value));
  });
  document.getElementById("btn-today").addEventListener("click", function () { setDate(new Date()); });
  document.getElementById("btn-tomorrow").addEventListener("click", function () { setDate(S.addDays(new Date(), 1)); });
  document.getElementById("btn-locate").addEventListener("click", function () {
    var btn = this;
    if (!navigator.geolocation) { alert("Prohlížeč nepodporuje zjištění polohy."); return; }
    btn.disabled = true;
    navigator.geolocation.getCurrentPosition(function (pos) {
      btn.disabled = false;
      var best = DATA.towns.slice().sort(function (a, b) {
        return S.distanceKm(pos.coords.latitude, pos.coords.longitude, a.lat, a.lon) -
          S.distanceKm(pos.coords.latitude, pos.coords.longitude, b.lat, b.lon);
      })[0];
      setTown(best.id);
    }, function () {
      btn.disabled = false;
      alert("Polohu se nepodařilo zjistit. Vyberte prosím město ručně.");
    }, { timeout: 10000 });
  });

  /* ---------------- Karty ---------------- */

  function statusPill(service) {
    if (!isToday()) return "";
    var st = S.statusAt(service, new Date());
    if (st.state === "open") return '<span class="pill open">Otevřeno do ' + S.fmtTime(st.until) + "</span>";
    if (st.state === "later") return '<span class="pill later">Otevře v ' + S.fmtTime(st.next) + "</span>";
    if (st.state === "closed") return '<span class="pill closed">Zavřeno · další ' + relDay(st.next) + " " + S.fmtTime(st.next) + "</span>";
    return '<span class="pill closed">Zavřeno</span>';
  }

  function entryBody(r, t) {
    var i = r.instance;
    var away = i.town !== t.id;
    return '<h3>' + esc(i.name) + (i.specialty ? ' <span class="tag">' + esc(i.specialty) + "</span>" : "") + "</h3>" +
      (i.doctor ? '<p class="doctor">' + esc(i.doctor) + ' <span class="muted">· ' + esc(i.provider) + "</span></p>"
        : '<p class="muted">' + esc(i.provider) + "</p>") +
      '<dl>' +
      "<dt>Ordinuje</dt><dd><strong>" + esc(S.intervalsText(r.intervals)) + "</strong></dd>" +
      "<dt>Adresa</dt><dd>" + esc(i.address) +
      (away ? ' <span class="away">' + esc(townName(i.town)) + ", " + fmtKm(r.distance) + "</span>" : "") + "</dd>" +
      "<dt>Telefon</dt><dd><a href=\"" + telHref(i.phone) + '">' + esc(i.phone) + "</a></dd>" +
      "<dt>Rozpis</dt><dd class=\"muted\">" + esc(S.scheduleText(i.schedule)) +
      (i.rotation ? " · místo se střídá po dnech" : "") + "</dd>" +
      "</dl>";
  }

  function actions(r) {
    var i = r.instance;
    return '<div class="actions">' +
      '<a class="btn primary" href="' + telHref(i.phone) + '">Zavolat</a>' +
      '<a class="btn" href="' + navHref(i) + '" target="_blank" rel="noopener">Navigovat</a>' +
      '<button type="button" class="btn ghost" data-focus="' + esc(i.id) + '">Na mapě</button>' +
      "</div>";
  }

  function renderCards() {
    var t = town();
    var html = TYPES.map(function (type) {
      var list = S.onDuty(DATA.services, type.id, state.date, t);
      var head = '<header class="cardhead"><span class="ticon">' + svg(type.icon) + '</span><span class="tlabel">' +
        esc(type.label) + "</span>";

      if (!list.length) {
        var next = S.nextDutyDay(DATA.services, type.id, state.date, t);
        return '<article class="card ' + type.id + ' empty">' + head + "</header>" +
          '<h3>V tento den nikde neslouží</h3>' +
          (next ? '<p>Nejbližší služba: <strong>' + esc(fmtDate(next.date)) + "</strong> – " +
            esc(next.list[0].instance.name) + ", " + esc(S.intervalsText(next.list[0].intervals)) + "</p>" +
            '<p class="muted">Mimo ordinační hodiny volejte 155 nebo navštivte urgentní příjem nemocnice.</p>' : "") +
          "</article>";
      }

      var main = list[0];
      var others = list.slice(1);
      return '<article class="card ' + type.id + '">' + head + statusPill(main.service) + "</header>" +
        entryBody(main, t) + actions(main) +
        (others.length ? '<details class="more"><summary>Další pracoviště (' + others.length + ")</summary>" +
          others.map(function (o) {
            return '<div class="other">' + (isToday() ? statusPill(o.service) : "") + entryBody(o, t) + actions(o) + "</div>";
          }).join("") + "</details>" : "") +
        "</article>";
    }).join("");
    els.results.innerHTML = html;
  }

  els.results.addEventListener("click", function (e) {
    var b = e.target.closest("[data-focus]");
    if (!b || !map) return;
    var m = markers[b.getAttribute("data-focus")];
    if (m) {
      map.setView(m.getLatLng(), 15);
      m.openPopup();
      document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  /* ---------------- Týdenní rozpis ---------------- */

  function renderWeek() {
    var t = town();
    var rows = [];
    for (var d = 0; d < 7; d++) {
      var day = S.addDays(state.date, d);
      var hol = S.holidayName(day);
      var key = S.dayKey(day);
      var weekend = key === "so" || key === "ne" || key === "sv";
      var cells = TYPES.map(function (type) {
        var list = S.onDuty(DATA.services, type.id, day, t);
        if (!list.length) return '<td class="none">—</td>';
        var i = list[0].instance;
        return "<td><span class=\"where\">" + esc(townName(i.town)) + "</span>" +
          (i.doctor ? '<span class="who">' + esc(i.doctor) + "</span>" : "") +
          '<span class="when">' + esc(S.intervalsText(list[0].intervals)) + "</span></td>";
      }).join("");
      rows.push('<tr class="' + (weekend ? "we" : "") + (S.sameDay(day, new Date()) ? " now" : "") + '"><th scope="row">' +
        esc(fmtDate(day)) + (hol ? '<span class="hol" title="' + esc(hol) + '">svátek</span>' : "") + "</th>" + cells + "</tr>");
    }
    els.week.innerHTML = "<thead><tr><th scope=\"col\">Den</th>" + TYPES.map(function (type) {
      return '<th scope="col"><i class="dot ' + type.id + '"></i>' + esc(type.short) + "</th>";
    }).join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody>";
  }

  /* ---------------- Mapa ---------------- */

  var map = null, layer = null, markers = {};

  function initMap() {
    if (typeof L === "undefined") {
      els.mapnote.hidden = false;
      return;
    }
    map = L.map("map", { scrollWheelZoom: false }).setView([50.15, 12.7], 9);
    var tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    var errors = 0;
    tiles.on("tileerror", function () { if (++errors > 3) els.mapnote.hidden = false; });
    tiles.on("tileload", function () { errors = 0; els.mapnote.hidden = true; });
    layer = L.layerGroup().addTo(map);
  }

  function renderMap(refit) {
    if (!map) return;
    layer.clearLayers();
    markers = {};
    var t = town();
    var bounds = [[t.lat, t.lon]];

    L.circleMarker([t.lat, t.lon], {
      radius: 7, color: "#555", weight: 2, dashArray: "3 3", fillColor: "#fff", fillOpacity: 0.9
    }).bindTooltip(t.name).addTo(layer);

    TYPES.forEach(function (type) {
      S.onDuty(DATA.services, type.id, state.date, t).forEach(function (r, idx) {
        var i = r.instance;
        var m = L.circleMarker([i.lat, i.lon], {
          radius: idx === 0 ? 10 : 7, color: "#fff", weight: 2,
          fillColor: COLORS[type.id], fillOpacity: idx === 0 ? 1 : 0.6
        }).bindPopup(
          "<strong>" + esc(i.name) + "</strong><br>" + (i.doctor ? esc(i.doctor) + "<br>" : "") +
          esc(i.address) + "<br>Ordinuje: " + esc(S.intervalsText(r.intervals)) +
          '<br><a href="' + telHref(i.phone) + '">' + esc(i.phone) + "</a> · " +
          '<a href="' + navHref(i) + '" target="_blank" rel="noopener">Navigovat</a>'
        ).bindTooltip(type.short + ": " + townName(i.town)).addTo(layer);
        markers[i.id] = m;
        if (idx === 0) bounds.push([i.lat, i.lon]);
      });
    });

    if (refit) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
  }

  /* ---------------- Celek ---------------- */

  function renderDayInfo() {
    var d = state.date;
    var hol = S.holidayName(d);
    var key = S.dayKey(d);
    var kind = key === "sv" ? "státní svátek – platí víkendové/sváteční hodiny"
      : (key === "so" || key === "ne") ? "víkend – platí víkendové hodiny" : "pracovní den – platí hodiny Po–Pá";
    els.dayinfo.innerHTML = "<strong>" + esc(fmtDate(d, true)) + "</strong>" + (isToday() ? " (dnes)" : "") +
      " · " + esc(kind) + (hol ? ' · <span class="hol">' + esc(hol) + "</span>" : "");
    els.date.value = S.toISODate(d);
  }

  function render(refit) {
    renderTowns();
    renderDayInfo();
    renderCards();
    renderWeek();
    renderMap(refit);
  }

  try {
    var saved = localStorage.getItem("pohotovost-town");
    if (saved && DATA.towns.some(function (t) { return t.id === saved; })) state.townId = saved;
  } catch (e) { /* ignore */ }

  els.sources.innerHTML = "Zdroje dat: " + DATA.meta.sources.map(function (s) {
    return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + "</a>";
  }).join(" · ");

  initMap();
  render(true);

  // Každou minutu obnovit stav „otevřeno/zavřeno" (a přejít na nový den o půlnoci)
  var lastDay = S.startOfDay(new Date());
  setInterval(function () {
    var today = S.startOfDay(new Date());
    if (!S.sameDay(today, lastDay)) {
      if (S.sameDay(state.date, lastDay)) state.date = today;
      lastDay = today;
      render(true);
    } else if (isToday()) {
      renderCards();
    }
  }, 60000);
})();
