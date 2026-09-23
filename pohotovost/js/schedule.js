/*
 * Rozvrhový engine: svátky, pravidla Po–Pá / So / Ne / Sv, rotace pracovišť,
 * služby přes půlnoc, stav „otevřeno teď" a hledání nejbližší sloužící služby.
 */
window.Schedule = (function () {
  "use strict";

  var DAY_KEYS = ["ne", "po", "ut", "st", "ct", "pa", "so"];
  var DAY_ORDER = ["po", "ut", "st", "ct", "pa", "so", "ne", "sv"];
  var DAY_LABEL = { po: "Po", ut: "Út", st: "St", ct: "Čt", pa: "Pá", so: "So", ne: "Ne", sv: "Sv" };
  var DAY_NAME = ["neděle", "pondělí", "úterý", "středa", "čtvrtek", "pátek", "sobota"];

  var FIXED_HOLIDAYS = {
    "1-1": "Nový rok, Den obnovy samostatného českého státu",
    "5-1": "Svátek práce",
    "5-8": "Den vítězství",
    "7-5": "Den slovanských věrozvěstů Cyrila a Metoděje",
    "7-6": "Den upálení mistra Jana Husa",
    "9-28": "Den české státnosti",
    "10-28": "Den vzniku samostatného československého státu",
    "11-17": "Den boje za svobodu a demokracii",
    "12-24": "Štědrý den",
    "12-25": "1. svátek vánoční",
    "12-26": "2. svátek vánoční"
  };

  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function parseISODate(s) {
    var p = s.split("-");
    return new Date(+p[0], +p[1] - 1, +p[2]);
  }
  function toISODate(d) {
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function daysBetween(a, b) {
    var ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
    var ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((ub - ua) / 86400000);
  }
  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function toMinutes(hhmm) { var p = hhmm.split(":"); return (+p[0]) * 60 + (+p[1]); }
  function fmtTime(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }

  // Velikonoční neděle (anonymní gregoriánský algoritmus)
  function easterSunday(y) {
    var a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    var f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    var month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(y, month - 1, day);
  }

  function holidayName(date) {
    var fixed = FIXED_HOLIDAYS[(date.getMonth() + 1) + "-" + date.getDate()];
    if (fixed) return fixed;
    var easter = easterSunday(date.getFullYear());
    if (sameDay(date, addDays(easter, -2))) return "Velký pátek";
    if (sameDay(date, addDays(easter, 1))) return "Velikonoční pondělí";
    return null;
  }

  function dayKey(date) { return holidayName(date) ? "sv" : DAY_KEYS[date.getDay()]; }

  // Konkrétní podoba služby pro daný den (u rotace dosadí pracoviště a lékaře)
  function instanceFor(service, date) {
    if (!service.rotation) return service;
    var sites = service.rotation.sites;
    var n = daysBetween(parseISODate(service.rotation.anchor), date);
    var idx = ((n % sites.length) + sites.length) % sites.length;
    var inst = {};
    for (var k in service) inst[k] = service[k];
    var site = sites[idx];
    for (var s in site) inst[s] = site[s];
    inst.rotationIndex = idx;
    return inst;
  }

  function rulesFor(schedule, date) {
    var key = dayKey(date);
    return schedule.filter(function (r) { return r.days.indexOf(key) !== -1; });
  }

  // Časové intervaly služby začínající v daný den
  function intervalsFor(service, date) {
    var day = startOfDay(date);
    return rulesFor(service.schedule, day).map(function (r) {
      var from = toMinutes(r.from), to = toMinutes(r.to);
      if (to <= from) to += 1440;
      return {
        start: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, from),
        end: new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, to),
        from: r.from, to: r.to, overnight: to > 1440
      };
    }).sort(function (a, b) { return a.start - b.start; });
  }

  function intervalsText(intervals) {
    return intervals.map(function (iv) {
      return iv.from + "–" + iv.to + (iv.overnight ? " (+1 den)" : "");
    }).join(", ");
  }

  // Aktuální stav: otevřeno / otevře později / zavřeno
  function statusAt(service, now) {
    var today = startOfDay(now);
    for (var back = -1; back <= 0; back++) {
      var d = addDays(today, back);
      var ivs = intervalsFor(instanceFor(service, d), d);
      for (var i = 0; i < ivs.length; i++) {
        if (ivs[i].start <= now && now < ivs[i].end) {
          return { state: "open", until: ivs[i].end, instance: instanceFor(service, d) };
        }
      }
    }
    for (var fwd = 0; fwd < 14; fwd++) {
      var day = addDays(today, fwd);
      var list = intervalsFor(instanceFor(service, day), day).filter(function (iv) { return iv.start > now; });
      if (list.length) {
        return { state: fwd === 0 ? "later" : "closed", next: list[0].start, instance: instanceFor(service, day) };
      }
    }
    return { state: "none" };
  }

  function distanceKm(aLat, aLon, bLat, bLon) {
    var R = 6371, toRad = Math.PI / 180;
    var dLat = (bLat - aLat) * toRad, dLon = (bLon - aLon) * toRad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(aLat * toRad) * Math.cos(bLat * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  // Všechny služby daného typu, které v daný den slouží, seřazené dle vzdálenosti
  function onDuty(services, type, date, origin) {
    return services.filter(function (s) { return s.type === type; }).map(function (s) {
      var inst = instanceFor(s, date);
      return {
        service: s, instance: inst, intervals: intervalsFor(inst, date),
        distance: distanceKm(origin.lat, origin.lon, inst.lat, inst.lon)
      };
    }).filter(function (r) { return r.intervals.length > 0; })
      // Specializované služby (např. stomatochirurgie) až za běžnými
      .sort(function (a, b) {
        return (a.instance.specialty ? 1 : 0) - (b.instance.specialty ? 1 : 0) || a.distance - b.distance;
      });
  }

  // Když v daný den nikdo neslouží, najdi nejbližší další den se službou
  function nextDutyDay(services, type, date, origin) {
    for (var i = 1; i <= 14; i++) {
      var d = addDays(date, i);
      var list = onDuty(services, type, d, origin);
      if (list.length) return { date: d, list: list };
    }
    return null;
  }

  // Lidský zápis rozpisu, např. „Po–Pá 16:00–22:00 · So, Ne, Sv 08:00–20:00"
  function scheduleText(schedule) {
    var groups = [];
    schedule.forEach(function (r) {
      var key = r.days.slice().sort(function (a, b) { return DAY_ORDER.indexOf(a) - DAY_ORDER.indexOf(b); }).join(",");
      var g = groups.filter(function (x) { return x.key === key; })[0];
      if (!g) { g = { key: key, days: key.split(","), times: [] }; groups.push(g); }
      g.times.push(r.from + "–" + r.to);
    });
    return groups.map(function (g) { return daysText(g.days) + " " + g.times.join(" a "); }).join(" · ");
  }

  function daysText(days) {
    var idx = days.map(function (d) { return DAY_ORDER.indexOf(d); });
    var parts = [], i = 0;
    while (i < idx.length) {
      var j = i;
      while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1 && idx[j + 1] <= 6) j++;
      if (j - i >= 2) parts.push(DAY_LABEL[DAY_ORDER[idx[i]]] + "–" + DAY_LABEL[DAY_ORDER[idx[j]]]);
      else for (var k = i; k <= j; k++) parts.push(DAY_LABEL[DAY_ORDER[idx[k]]]);
      i = j + 1;
    }
    return parts.join(", ");
  }

  return {
    startOfDay: startOfDay, addDays: addDays, sameDay: sameDay,
    parseISODate: parseISODate, toISODate: toISODate, fmtTime: fmtTime,
    holidayName: holidayName, dayKey: dayKey, DAY_NAME: DAY_NAME,
    instanceFor: instanceFor, intervalsFor: intervalsFor, intervalsText: intervalsText,
    statusAt: statusAt, distanceKm: distanceKm,
    onDuty: onDuty, nextDutyDay: nextDutyDay, scheduleText: scheduleText
  };
})();
