/*
 * Lékařská a lékárenská pohotovostní služba v Karlovarském kraji
 * Vydavatel: Krajský úřad Karlovarského kraje · Souřadnicový systém: WGS 1984
 *
 * DEMO DATA – lokální kopie ve tvaru otevřené datové sady (NKOD / datazapad.cz).
 * Uloženo jako .js (ne .json), aby aplikace fungovala i po otevření index.html
 * přímo z disku (prohlížeče blokují fetch() lokálních souborů přes file://).
 *
 * Rozpis (schedule) – pravidla podle dne:
 *   days: "po" "ut" "st" "ct" "pa" "so" "ne" a "sv" (státní svátek)
 *   Ve svátek platí VÝHRADNĚ pravidla se "sv" (i když svátek padne na pracovní den).
 *   from/to "HH:MM"; pokud to <= from, služba končí až následující den (přes půlnoc).
 *
 * Rotace (rotation) – pracoviště se střídá po dnech:
 *   index = (počet dní od "anchor") mod počet pracovišť
 */
window.POHOTOVOST_DATA = {
  meta: {
    name: "Lékařská a lékárenská pohotovostní služba v Karlovarském kraji",
    publisher: "Krajský úřad Karlovarského kraje",
    crs: "WGS 1984",
    version: "demo-2026-09",
    sources: [
      { label: "data.gov.cz (NKOD)", url: "https://data.gov.cz/datasets" },
      { label: "datazapad.cz", url: "https://www.datazapad.cz/search?collection=dataset&layout=grid" }
    ]
  },

  towns: [
    { id: "kv", name: "Karlovy Vary", okres: "Karlovy Vary", lat: 50.2305, lon: 12.8712 },
    { id: "cheb", name: "Cheb", okres: "Cheb", lat: 50.0796, lon: 12.3739 },
    { id: "sokolov", name: "Sokolov", okres: "Sokolov", lat: 50.1813, lon: 12.6401 },
    { id: "ml", name: "Mariánské Lázně", okres: "Cheb", lat: 49.9646, lon: 12.7012 },
    { id: "as", name: "Aš", okres: "Cheb", lat: 50.2239, lon: 12.1950 },
    { id: "ostrov", name: "Ostrov", okres: "Karlovy Vary", lat: 50.3059, lon: 12.9390 },
    { id: "chodov", name: "Chodov", okres: "Sokolov", lat: 50.2413, lon: 12.7466 },
    { id: "kraslice", name: "Kraslice", okres: "Sokolov", lat: 50.3238, lon: 12.5174 }
  ],

  services: [
    /* ---------- Lékařská pohotovost pro dospělé ---------- */
    {
      id: "lps-dosp-kv", type: "adult",
      name: "LPS pro dospělé – Karlovy Vary",
      provider: "Karlovarská krajská nemocnice a.s.",
      address: "Bezručova 1367/19e, 360 01 Karlovy Vary",
      town: "kv", okres: "Karlovy Vary", lat: 50.2262, lon: 12.8617,
      phone: "354 225 601",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "16:00", to: "22:00" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "20:00" }
      ]
    },
    {
      id: "lps-dosp-cheb", type: "adult",
      name: "LPS pro dospělé – Cheb",
      provider: "Karlovarská krajská nemocnice a.s., Nemocnice Cheb",
      address: "17. listopadu 1553/7, 350 02 Cheb",
      town: "cheb", okres: "Cheb", lat: 50.0773, lon: 12.3812,
      phone: "354 547 222",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "16:00", to: "21:00" },
        { days: ["so", "ne", "sv"], from: "09:00", to: "19:00" }
      ]
    },
    {
      id: "lps-dosp-as", type: "adult",
      name: "LPS pro dospělé – Aš",
      provider: "Karlovarská krajská nemocnice a.s.",
      address: "Nemocniční 1709/2, 352 01 Aš",
      town: "as", okres: "Cheb", lat: 50.2208, lon: 12.1987,
      phone: "354 546 111",
      schedule: [
        { days: ["pa"], from: "17:00", to: "21:00" },
        { days: ["so", "ne", "sv"], from: "09:00", to: "15:00" }
      ]
    },
    {
      id: "lps-dosp-ml", type: "adult",
      name: "LPS pro dospělé – Mariánské Lázně",
      provider: "Karlovarská krajská nemocnice a.s.",
      address: "Tepelská 263/35, 353 01 Mariánské Lázně",
      town: "ml", okres: "Cheb", lat: 49.9701, lon: 12.7155,
      phone: "354 624 111",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "16:30", to: "20:30" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "18:00" }
      ]
    },
    {
      id: "lps-dosp-sokolov", type: "adult",
      name: "LPS pro dospělé – Sokolov",
      provider: "Nemocnice Sokolov (KKN a.s.)",
      address: "Slovenská 545, 356 01 Sokolov",
      town: "sokolov", okres: "Sokolov", lat: 50.1776, lon: 12.6485,
      phone: "352 520 411",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "15:30", to: "22:00" },
        { days: ["so", "ne", "sv"], from: "07:00", to: "19:00" }
      ]
    },

    /* ---------- Lékařská pohotovost pro děti a dorost ---------- */
    {
      id: "lps-deti-kv", type: "child",
      name: "LPS pro děti a dorost – Karlovy Vary",
      provider: "Karlovarská krajská nemocnice a.s., dětské oddělení",
      address: "Bezručova 1367/19e, 360 01 Karlovy Vary",
      town: "kv", okres: "Karlovy Vary", lat: 50.2266, lon: 12.8609,
      phone: "354 225 360",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "15:30", to: "19:00" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "18:00" }
      ]
    },
    {
      id: "lps-deti-cheb", type: "child",
      name: "LPS pro děti a dorost – Cheb",
      provider: "Karlovarská krajská nemocnice a.s., Nemocnice Cheb",
      address: "17. listopadu 1553/7, 350 02 Cheb",
      town: "cheb", okres: "Cheb", lat: 50.0769, lon: 12.3820,
      phone: "354 547 350",
      schedule: [
        { days: ["so", "ne", "sv"], from: "09:00", to: "17:00" }
      ]
    },
    {
      id: "lps-deti-sokolov", type: "child",
      name: "LPS pro děti a dorost – Sokolov",
      provider: "Nemocnice Sokolov (KKN a.s.)",
      address: "Slovenská 545, 356 01 Sokolov",
      town: "sokolov", okres: "Sokolov", lat: 50.1779, lon: 12.6478,
      phone: "352 520 470",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "16:00", to: "19:00" },
        { days: ["so", "ne", "sv"], from: "09:00", to: "17:00" }
      ]
    },

    /* ---------- Stomatologická pohotovost (rotuje KV ↔ Sokolov po dnech) ---------- */
    {
      id: "stoma-rotace", type: "dental",
      name: "Stomatologická pohotovost",
      provider: "Rozpis zubních lékařů Karlovarského kraje",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "17:00", to: "21:00" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "13:00" }
      ],
      rotation: {
        anchor: "2026-01-01",
        sites: [
          {
            doctor: "MUDr. Jana Nováková",
            provider: "Zubní ordinace Nováková s.r.o.",
            address: "Sokolovská 54/20, 360 05 Karlovy Vary",
            town: "kv", okres: "Karlovy Vary", lat: 50.2355, lon: 12.8551, phone: "353 222 145"
          },
          {
            doctor: "MDDr. Petr Svoboda",
            provider: "Stomatologie Svoboda",
            address: "Rokycanova 1929, 356 01 Sokolov",
            town: "sokolov", okres: "Sokolov", lat: 50.1812, lon: 12.6427, phone: "352 623 410"
          },
          {
            doctor: "MUDr. Eva Dvořáková",
            provider: "Poliklinika Drahovice – zubní",
            address: "Moskevská 1352/26, 360 01 Karlovy Vary",
            town: "kv", okres: "Karlovy Vary", lat: 50.2280, lon: 12.8702, phone: "353 118 902"
          },
          {
            doctor: "MUDr. Tomáš Černý",
            provider: "Dentál Sokolov s.r.o.",
            address: "Jednoty 1698, 356 01 Sokolov",
            town: "sokolov", okres: "Sokolov", lat: 50.1760, lon: 12.6390, phone: "352 604 777"
          },
          {
            doctor: "MDDr. Lucie Procházková",
            provider: "Zubní centrum Rybáře",
            address: "Západní 1777/9, 360 01 Karlovy Vary",
            town: "kv", okres: "Karlovy Vary", lat: 50.2338, lon: 12.8404, phone: "353 441 263"
          },
          {
            doctor: "MUDr. Martin Kučera",
            provider: "Stomatologie Kučera",
            address: "Husitská 2031, 356 01 Sokolov",
            town: "sokolov", okres: "Sokolov", lat: 50.1742, lon: 12.6533, phone: "352 312 008"
          }
        ]
      }
    },
    {
      id: "stoma-chir-ml", type: "dental",
      name: "Stomatochirurgická pohotovost – Mariánské Lázně",
      provider: "Karlovarská krajská nemocnice a.s., stomatochirurgie",
      address: "Tepelská 263/35, 353 01 Mariánské Lázně",
      town: "ml", okres: "Cheb", lat: 49.9705, lon: 12.7148,
      phone: "354 624 190",
      specialty: "chirurgická",
      schedule: [
        { days: ["so", "ne", "sv"], from: "08:00", to: "12:00" }
      ]
    },

    /* ---------- Lékárenská pohotovost ---------- */
    {
      id: "lekarna-sokolov", type: "pharmacy",
      name: "Nemocniční lékárna Sokolov",
      provider: "Nemocnice Sokolov (KKN a.s.)",
      address: "Slovenská 545, 356 01 Sokolov",
      town: "sokolov", okres: "Sokolov", lat: 50.1772, lon: 12.6490,
      phone: "352 520 280",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "07:00", to: "16:00" },
        { days: ["po", "ut", "st", "ct", "pa"], from: "19:00", to: "22:00" },
        { days: ["so", "ne", "sv"], from: "16:00", to: "19:00" }
      ]
    },
    {
      id: "lekarna-kv", type: "pharmacy",
      name: "Lékárna KKN Karlovy Vary",
      provider: "Karlovarská krajská nemocnice a.s.",
      address: "Bezručova 1367/19e, 360 01 Karlovy Vary",
      town: "kv", okres: "Karlovy Vary", lat: 50.2259, lon: 12.8625,
      phone: "354 225 900",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "07:00", to: "20:00" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "18:00" }
      ]
    },
    {
      id: "lekarna-cheb", type: "pharmacy",
      name: "Lékárna Nemocnice Cheb",
      provider: "Karlovarská krajská nemocnice a.s.",
      address: "17. listopadu 1553/7, 350 02 Cheb",
      town: "cheb", okres: "Cheb", lat: 50.0777, lon: 12.3805,
      phone: "354 547 280",
      schedule: [
        { days: ["po", "ut", "st", "ct", "pa"], from: "07:30", to: "18:00" },
        { days: ["so", "ne", "sv"], from: "08:00", to: "12:00" }
      ]
    }
  ]
};
