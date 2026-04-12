/**
 * U.S. Driver's License Generator & PDF417 Encoder
 * AAMVA DL/ID Card Design Standard 2020 — educational / data visualization
 * No backend required — all logic runs client-side.
 */

'use strict';

// ═══════════════════════════════════════════════════════════════════════════
//  Per-state DL number format rules (AAMVA DL/ID Card Design Standard 2020)
//  Sources: AAMVA spec §6, individual state DMV websites
// ═══════════════════════════════════════════════════════════════════════════

const DL_FORMATS = {
  AL: { regex: /^\d{1,7}$/,               label: '1–7 digits' },
  AK: { regex: /^\d{1,7}$/,               label: '1–7 digits' },
  AZ: { regex: /^[A-Z]\d{8}$|^\d{9}$/,   label: '1 letter + 8 digits  OR  9 digits' },
  AR: { regex: /^\d{4,9}$/,               label: '4–9 digits' },
  CA: { regex: /^[A-Z]\d{7}$/,            label: '1 letter + 7 digits  (e.g. J1234567)' },
  CO: { regex: /^\d{9}$/,                 label: '9 digits' },
  CT: { regex: /^\d{9}$/,                 label: '9 digits' },
  DE: { regex: /^\d{1,7}$/,               label: '1–7 digits' },
  FL: { regex: /^[A-Z]\d{12}$/,           label: '1 letter + 12 digits' },
  GA: { regex: /^\d{7,9}$/,               label: '7–9 digits' },
  HI: { regex: /^H\d{8}$|^\d{9}$/,        label: 'H + 8 digits  OR  9 digits' },
  ID: { regex: /^[A-Z]{2}\d{6}[A-Z]$/,   label: '2 letters + 6 digits + 1 letter' },
  IL: { regex: /^[A-Z]\d{11,12}$/,        label: '1 letter + 11–12 digits' },
  IN: { regex: /^\d{9,10}$/,              label: '9–10 digits' },
  IA: { regex: /^\d{9}$|^\d{3}[A-Z]{2}\d{4}$/, label: '9 digits  OR  ###AA####' },
  KS: { regex: /^[A-Z]\d{8}$/,            label: '1 letter + 8 digits' },
  KY: { regex: /^[A-Z]\d{8,9}$/,          label: '1 letter + 8–9 digits' },
  LA: { regex: /^\d{9}$/,                 label: '9 digits' },
  ME: { regex: /^\d{7}[A-Z]?$/,           label: '7 digits + optional letter' },
  MD: { regex: /^[A-Z]\d{12}$/,           label: '1 letter + 12 digits' },
  MA: { regex: /^S\d{8}$|^\d{9}$/,        label: 'S + 8 digits  OR  9 digits' },
  MI: { regex: /^[A-Z]\d{12}$/,           label: '1 letter + 12 digits' },
  MN: { regex: /^[A-Z]\d{12}$/,           label: '1 letter + 12 digits' },
  MS: { regex: /^\d{9}$/,                 label: '9 digits' },
  MO: { regex: /^[A-Z]\d{5,9}$|^\d{9}$/, label: '1 letter + 5–9 digits  OR  9 digits' },
  MT: { regex: /^\d{13}$|^\d{9}$/,        label: '13 digits  OR  9 digits' },
  NE: { regex: /^[A-Z]\d{6,8}$/,          label: '1 letter + 6–8 digits' },
  NV: { regex: /^\d{12}$|^X\d{8}$/,       label: '12 digits  OR  X + 8 digits' },
  NH: { regex: /^\d{2}[A-Z]{3}\d{5}$/,    label: 'NN + AAA + NNNNN' },
  NJ: { regex: /^[A-Z]\d{14}$/,           label: '1 letter + 14 digits' },
  NM: { regex: /^\d{9}$/,                 label: '9 digits' },
  NY: { regex: /^\d{9}$/,                 label: '9 digits' },
  NC: { regex: /^\d{1,12}$/,              label: '1–12 digits' },
  ND: { regex: /^[A-Z]{3}\d{6}$|^\d{9}$/, label: 'AAA + 6 digits  OR  9 digits' },
  OH: { regex: /^[A-Z]{2}\d{6}$/,         label: '2 letters + 6 digits' },
  OK: { regex: /^[A-Z]\d{9}$/,            label: '1 letter + 9 digits' },
  OR: { regex: /^\d{1,9}$/,               label: '1–9 digits' },
  PA: { regex: /^\d{8}$/,                 label: '8 digits' },
  RI: { regex: /^\d{7}$|^V\d{6}$/,        label: '7 digits  OR  V + 6 digits' },
  SC: { regex: /^\d{5,11}$/,              label: '5–11 digits' },
  SD: { regex: /^\d{6,10}$/,              label: '6–10 digits' },
  TN: { regex: /^\d{7,9}$/,               label: '7–9 digits' },
  TX: { regex: /^\d{8}$/,                 label: '8 digits' },
  UT: { regex: /^\d{4,10}$/,              label: '4–10 digits' },
  VT: { regex: /^\d{8}$|^\d{7}A$/,        label: '8 digits  OR  7 digits + A' },
  VA: { regex: /^[A-Z]\d{9}$|^\d{9}$/,   label: '1 letter + 9 digits  OR  9 digits' },
  WA: { regex: /^[A-Z0-9]{12}$/,          label: '12-char name-based code (Soundex method)' },
  WV: { regex: /^[A-Z]{1,2}\d{5,6}$/,    label: '1–2 letters + 5–6 digits' },
  WI: { regex: /^[A-Z]\d{13}$/,           label: '1 letter + 13 digits' },
  WY: { regex: /^\d{9,10}$/,              label: '9–10 digits' },
  DC: { regex: /^\d{7}$/,                 label: '7 digits' },
};

// ══════════════════════════════════════════════════════════════════════
//  AAMVA Issuer Identification Numbers (IIN) — one per state
//  Source: AAMVA DL/ID Specification, Appendix D
// ══════════════════════════════════════════════════════════════════════

const AAMVA_IIN = {
  AL:'636033', AK:'636059', AZ:'636026', AR:'636021', CA:'636014',
  CO:'636020', CT:'636006', DE:'636011', FL:'636010', GA:'636055',
  HI:'636047', ID:'636050', IL:'636035', IN:'636037', IA:'636018',
  KS:'636022', KY:'636056', LA:'636007', ME:'636041', MD:'636003',
  MA:'636002', MI:'636032', MN:'636038', MS:'636051', MO:'636030',
  MT:'636008', NE:'636054', NV:'636049', NH:'636039', NJ:'636036',
  NM:'636013', NY:'636001', NC:'636004', ND:'636034', OH:'636023',
  OK:'636058', OR:'636029', PA:'636025', RI:'636052', SC:'636005',
  SD:'636042', TN:'636053', TX:'636015', UT:'636031', VT:'636044',
  VA:'636000', WA:'636045', WV:'636061', WI:'636043', WY:'636060',
  DC:'636043',
};

// AAMVA field codes and human-readable names for the reference table
const AAMVA_FIELDS = [
  ['DAQ', 'License / ID Number'],
  ['DCS', 'Last Name'],
  ['DAC', 'First Name'],
  ['DAD', 'Middle Name'],
  ['DBA', 'Expiry Date (MMDDYYYY)'],
  ['DBB', 'Date of Birth (MMDDYYYY)'],
  ['DBD', 'Issue Date (MMDDYYYY)'],
  ['DBC', 'Sex (1=M, 2=F, 9=X)'],
  ['DAY', 'Eye Color'],
  ['DAZ', 'Hair Color'],
  ['DAU', 'Height (inches, e.g. 510 = 5\'10")'],
  ['DAW', 'Weight (lbs)'],
  ['DAG', 'Street Address'],
  ['DAI', 'City'],
  ['DAJ', 'State'],
  ['DAK', 'ZIP Code (11 chars padded)'],
  ['DCA', 'Vehicle Class'],
  ['DCB', 'Restrictions'],
  ['DCD', 'Endorsements'],
  ['DCF', 'Document Discriminator (DD)'],
  ['DCG', 'Country'],
];

// ══════════════════════════════════════════════════════════════════════
//  Utility functions
// ══════════════════════════════════════════════════════════════════════

/** djb2 hash → deterministic numeric seed from a string */
function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h, 33) ^ str.charCodeAt(i);
  }
  return Math.abs(h >>> 0);        // unsigned 32-bit int
}

function pad(n, len) { return String(n).padStart(len, '0'); }

function randomLetters(seed, count) {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for (let i = 0; i < count; i++) {
    s += alpha[seed % 26];
    seed = Math.floor(seed / 26) || (seed + 17);      // avoid zero
  }
  return s;
}

/** Format a date string (YYYY-MM-DD) as MMDDYYYY for AAMVA */
function toAamvaDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return (m || '') + (d || '') + (y || '');
}

/** Subtract N years from an ISO date (YYYY-MM-DD) */
function subtractYears(iso, n) {
  const d = new Date(iso + 'T00:00:00');
  d.setFullYear(d.getFullYear() - n);
  return d.toISOString().slice(0, 10);
}

// ══════════════════════════════════════════════════════════════════════
//  Per-state DL number generator
// ══════════════════════════════════════════════════════════════════════

function generateLicenseNumber(state, lastName, firstName, dob) {
  const key = (lastName + firstName + dob + state).toUpperCase().replace(/\W/g, '');
  const h  = djb2(key);
  const h2 = djb2(key + state);
  const L  = (lastName.charAt(0).toUpperCase()) || 'X';

  switch (state) {
    // ── 1 letter + N digits ────────────────────────────────────────
    case 'CA': return L + pad(h % 9_000_000  + 1_000_000, 7);
    case 'FL': return L + pad(h % 9e11       + 1e11, 12);
    case 'IL': return L + pad(h % 90_000_000_000 + 10_000_000_000, 11);
    case 'MD': return L + pad(h % 9e11       + 1e11, 12);
    case 'MI': return L + pad(h % 9e11       + 1e11, 12);
    case 'MN': return L + pad(h % 9e11       + 1e11, 12);
    case 'NJ': return L + pad(h % 9e13       + 1e13, 14);
    case 'WI': return L + pad(h % 9e12       + 1e12, 13);
    case 'KS': return L + pad(h % 90_000_000 + 10_000_000, 8);
    case 'KY': return L + pad(h % 90_000_000 + 10_000_000, 8);
    case 'MO': return L + pad(h % 9_000_000  + 1_000_000, 7);
    case 'NE': return L + pad(h % 9_000_000  + 1_000_000, 7);
    case 'OK': return L + pad(h % 900_000_000 + 100_000_000, 9);
    case 'VA': return L + pad(h % 900_000_000 + 100_000_000, 9);

    // ── Mostly digits ──────────────────────────────────────────────
    case 'AL': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'AK': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'AR': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'CO': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'CT': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'DE': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'GA': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'IN': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'LA': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'MS': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'MT': return pad(h % 9e12       + 1e12, 13);
    case 'NM': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'NY': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'NC': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'OR': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'PA': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'SC': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'SD': return pad(h % 9_000_000  + 1_000_000, 7);
    case 'TN': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'TX': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'UT': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'WY': return pad(h % 900_000_000 + 100_000_000, 9);
    case 'DC': return pad(h % 9_000_000  + 1_000_000, 7);

    // ── Special formats ────────────────────────────────────────────
    case 'AZ': return L + pad(h % 90_000_000 + 10_000_000, 8);
    case 'HI': return 'H' + pad(h % 90_000_000 + 10_000_000, 8);
    case 'ID': return randomLetters(h, 2) + pad(h2 % 1_000_000, 6) + randomLetters(h2, 1);
    case 'IA': return pad(h2 % 900, 3) + randomLetters(h, 2) + pad(h % 10_000, 4);
    case 'MA': return 'S' + pad(h % 90_000_000 + 10_000_000, 8);
    case 'ME': return pad(h % 9_000_000 + 1_000_000, 7);
    case 'NE': return L + pad(h % 9_000_000 + 1_000_000, 7);
    case 'NH': return pad(h2 % 90 + 10, 2) + randomLetters(h, 3) + pad(h % 100_000, 5);
    case 'ND': return randomLetters(h, 3) + pad(h2 % 1_000_000, 6);
    case 'NV': return pad(h % 9e11 + 1e11, 12);
    case 'OH': return randomLetters(h, 2) + pad(h2 % 1_000_000, 6);
    case 'RI': return 'V' + pad(h % 1_000_000, 6);
    case 'VT': return pad(h % 90_000_000 + 10_000_000, 8);
    case 'WA': {
      // Washington WDLID: name-hash based 12-char code (educational approximation)
      const part1 = (lastName.substring(0, 1) + pad(h % 999, 3)).padEnd(4, 'Z');
      const part2 = randomLetters(h2, 2);
      const part3 = pad(h2 % 1_000_000, 6);
      return (part1 + part2 + part3).substring(0, 12).toUpperCase();
    }
    case 'WV': return randomLetters(h, 1) + pad(h2 % 900_000 + 100_000, 6);
    default:   return pad(h % 90_000_000 + 10_000_000, 8);
  }
}

function validateLicenseNumber(state, number) {
  const fmt = DL_FORMATS[state];
  return fmt ? fmt.regex.test(number) : true;
}

// ══════════════════════════════════════════════════════════════════════
//  Issue-date and Document Discriminator helpers
// ══════════════════════════════════════════════════════════════════════

/**
 * Calculate issue date from expiry date.
 * California DLs are issued for 5 years. Other states vary but 4–5 is common.
 */
function calculateISS(expISO) {
  return subtractYears(expISO, 5);
}

/**
 * Generate a Document Discriminator (DCF field).
 * The exact format is state-proprietary; this produces an educational approximation.
 * Real CA DD example: "10132015529RB/DDFD/25"
 */
function generateDD(issISO, licenseNum, state) {
  const seed = djb2(issISO + licenseNum + state);
  const aamvaIss = toAamvaDate(issISO);           // MMDDYYYY
  const alphaSuffix = randomLetters(seed, 4);
  const numSuffix   = pad(seed % 10000, 4);
  return `${aamvaIss}${numSuffix}${alphaSuffix}`;
}

// ══════════════════════════════════════════════════════════════════════
//  AAMVA PDF417 data string builder
//  Source: AAMVA DL/ID Card Design Standard 2020, Section 7
// ══════════════════════════════════════════════════════════════════════

function buildAamvaString(d) {
  const iin = AAMVA_IIN[d.state] || '636000';
  const ver  = '08';                 // AAMVA version 08 (2016/2020)
  const hdr  = `ANSI ${iin}${ver}00`;

  const heightInches = (parseInt(d.heightFt, 10) * 12) + parseInt(d.heightIn, 10);
  const heightCode   = pad(heightInches, 3);       // e.g. 070 for 5'10"
  const zipPadded    = (d.zip + '0000000000').substring(0, 11);

  // Build data element lines  (3-char code + value, newline-separated per AAMVA §7)
  const elements = [
    `DAQ${d.licenseNumber}`,
    `DCS${d.lastName}`,
    `DAC${d.firstName}`,
    `DAD${d.middleName || 'NONE'}`,
    `DBA${toAamvaDate(d.exp)}`,
    `DBB${toAamvaDate(d.dob)}`,
    `DBD${toAamvaDate(d.iss)}`,
    `DBC${d.sex}`,
    `DAY${d.eyes}`,
    `DAZ${d.hair}`,
    `DAU${heightCode}`,
    `DAW${pad(parseInt(d.weight, 10), 3)}`,
    `DAG${d.street}`,
    `DAI${d.city}`,
    `DAJ${d.state}`,
    `DAK${zipPadded}`,
    `DCA${d.dlClass}`,
    `DCB${d.restrictions || 'NONE'}`,
    `DCD${d.endorsements || 'NONE'}`,
    `DCF${d.dd}`,
    `DCG${d.country || 'USA'}`,
  ].join('\n');

  // AAMVA file header: compliance indicator + linefeed + RS + CR + "ANSI ..."
  const ANSI_HDR = '@\n\x1e\r' + hdr;

  return `${ANSI_HDR}\nDL\n${elements}\r`;
}

// ══════════════════════════════════════════════════════════════════════
//  PDF417 rendering via bwip-js  (replaces broken pdf417-js CDN)
//  bwip-js docs: https://github.com/metafloor/bwip-js
// ══════════════════════════════════════════════════════════════════════

function renderPDF417(canvasEl, text) {
  try {
    bwipjs.toCanvas(canvasEl, {
      bcid:        'pdf417',
      text:        text,
      scale:       2,
      height:      10,
      includetext: false,
      eclevel:     5,
    });
    return true;
  } catch (err) {
    console.error('bwip-js render error:', err);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════
//  UI helpers
// ══════════════════════════════════════════════════════════════════════

function buildFieldDisplay(data) {
  const dl = document.getElementById('fieldDisplay');
  dl.innerHTML = '';
  const rows = [
    ['DAQ', 'License Number', data.licenseNumber],
    ['DCS', 'Last Name',      data.lastName],
    ['DAC', 'First Name',     data.firstName],
    ['DAD', 'Middle Name',    data.middleName || '—'],
    ['DBB', 'Date of Birth',  toAamvaDate(data.dob)],
    ['DBA', 'Expiry',         toAamvaDate(data.exp)],
    ['DBD', 'Issued',         toAamvaDate(data.iss)],
    ['DBC', 'Sex',            data.sex === '1' ? '1 (Male)' : data.sex === '2' ? '2 (Female)' : '9 (Not Specified)'],
    ['DAY', 'Eyes',           data.eyes],
    ['DAZ', 'Hair',           data.hair],
    ['DAU', 'Height',         `${data.heightFt}'${data.heightIn}" (${(parseInt(data.heightFt)*12+parseInt(data.heightIn))} in)`],
    ['DAW', 'Weight',         data.weight + ' lbs'],
    ['DCA', 'Class',          data.dlClass],
    ['DCB', 'Restrictions',   data.restrictions || 'NONE'],
    ['DAG', 'Street',         data.street],
    ['DAI', 'City',           data.city],
    ['DAJ', 'State',          data.state],
    ['DAK', 'ZIP',            data.zip],
    ['DCF', 'Doc Discriminator', data.dd],
  ];
  for (const [code, name, val] of rows) {
    const dt = document.createElement('dt');
    dt.innerHTML = `<code>${code}</code> ${name}`;
    const dd = document.createElement('dd');
    dd.textContent = val;
    dl.appendChild(dt);
    dl.appendChild(dd);
  }
}

function buildFieldTable(data) {
  const tbody = document.getElementById('fieldTableBody');
  tbody.innerHTML = '';
  const lookup = {
    DAQ: data.licenseNumber, DCS: data.lastName, DAC: data.firstName,
    DAD: data.middleName || 'NONE', DBA: toAamvaDate(data.exp), DBB: toAamvaDate(data.dob),
    DBD: toAamvaDate(data.iss), DBC: data.sex, DAY: data.eyes, DAZ: data.hair,
    DAU: pad(parseInt(data.heightFt)*12+parseInt(data.heightIn), 3),
    DAW: data.weight, DAG: data.street, DAI: data.city, DAJ: data.state,
    DAK: (data.zip+'00000000000').substring(0,11),
    DCA: data.dlClass, DCB: data.restrictions, DCD: data.endorsements, DCF: data.dd, DCG: 'USA',
  };
  for (const [code, name] of AAMVA_FIELDS) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><code>${code}</code></td><td>${name}</td><td>${lookup[code] ?? '—'}</td>`;
    tbody.appendChild(tr);
  }
}

// ══════════════════════════════════════════════════════════════════════
//  Main generate handler
// ══════════════════════════════════════════════════════════════════════

function onGenerate() {
  const state       = document.getElementById('state').value;
  const lastName    = document.getElementById('lastName').value.trim().toUpperCase();
  const firstName   = document.getElementById('firstName').value.trim().toUpperCase();
  const middleName  = document.getElementById('middleName').value.trim().toUpperCase();
  const dob         = document.getElementById('dob').value;
  const exp         = document.getElementById('exp').value;
  const sex         = document.getElementById('sex').value;
  const eyes        = document.getElementById('eyes').value;
  const hair        = document.getElementById('hair').value;
  const heightFt    = document.getElementById('heightFt').value;
  const heightIn    = document.getElementById('heightIn').value;
  const weight      = document.getElementById('weight').value;
  const restrictions  = document.getElementById('restrictions').value.trim().toUpperCase() || 'NONE';
  const endorsements  = document.getElementById('endorsements').value.trim().toUpperCase() || 'NONE';
  const street      = document.getElementById('street').value.trim().toUpperCase();
  const city        = document.getElementById('city').value.trim().toUpperCase();
  const zip         = document.getElementById('zip').value.trim();
  const dlClass     = document.getElementById('dlClass').value;

  if (!lastName || !firstName || !dob || !exp || !state) {
    alert('Please fill in Last Name, First Name, DOB, Expiry, and State.');
    return;
  }

  const issISO       = calculateISS(exp);
  document.getElementById('iss').value = issISO;

  const licenseNumber = generateLicenseNumber(state, lastName, firstName, dob);
  const dd            = generateDD(issISO, licenseNumber, state);
  const valid         = validateLicenseNumber(state, licenseNumber);

  const data = {
    state, lastName, firstName, middleName, dob, exp, iss: issISO,
    sex, eyes, hair, heightFt, heightIn, weight, restrictions, endorsements,
    street, city, zip, dlClass, licenseNumber, dd, country: 'USA',
  };

  const aamvaStr = buildAamvaString(data);

  // Show result panel
  document.getElementById('resultPanel').removeAttribute('hidden');

  // Validation badge
  const badge = document.getElementById('validationBadge');
  badge.textContent = valid
    ? `\u2713 ${licenseNumber}  matches ${state} format: ${DL_FORMATS[state]?.label}`
    : `\u26A0 ${licenseNumber}  does NOT match ${state} format`;
  badge.className = 'badge validation-badge ' + (valid ? 'badge--ok' : 'badge--warn');

  // Data card
  buildFieldDisplay(data);
  buildFieldTable(data);

  // Raw AAMVA string display (escape control chars for readability)
  document.getElementById('aamvaRaw').textContent =
    aamvaStr.replace(/\x1e/g, '<RS>').replace(/\r/g, '<CR>').replace(/\n/g, '<LF>\n');

  // Algorithm note
  document.getElementById('algorithmNote').textContent =
    `State: ${state}\nFormat: ${DL_FORMATS[state]?.label ?? 'unknown'}\n` +
    `IIN: ${AAMVA_IIN[state] ?? 'N/A'}\n` +
    `Hash seed: djb2("${lastName}${firstName}${dob}${state}") = ${djb2((lastName+firstName+dob+state).replace(/\W/g,''))}\n` +
    `Generated: ${licenseNumber}\n` +
    `Valid format: ${valid}`;

  // PDF417 barcode
  const canvas = document.getElementById('barcodeCanvas');
  const ok = renderPDF417(canvas, aamvaStr);
  if (!ok) {
    canvas.getContext('2d').fillText('Barcode render failed — check console', 10, 20);
  }

  // Scroll result into view on mobile
  document.getElementById('resultPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ══════════════════════════════════════════════════════════════════════
//  Event listeners
// ══════════════════════════════════════════════════════════════════════

document.getElementById('generateBtn').addEventListener('click', onGenerate);

// State change → update IIN + format label
document.getElementById('state').addEventListener('change', function () {
  document.getElementById('iinDisplay').textContent = AAMVA_IIN[this.value] ?? 'N/A';
  document.getElementById('fmtDisplay').textContent = DL_FORMATS[this.value]?.label ?? 'varies';
  // Auto-recalculate ISS when exp is already filled
  const exp = document.getElementById('exp').value;
  if (exp) document.getElementById('iss').value = calculateISS(exp);
});

// Expiry change → recalculate ISS
document.getElementById('exp').addEventListener('change', function () {
  if (this.value) document.getElementById('iss').value = calculateISS(this.value);
});

// Photo upload preview
document.getElementById('photoUpload').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  document.getElementById('photoPreview').src = url;
});

// Download barcode as PNG
document.getElementById('downloadPngBtn').addEventListener('click', () => {
  const canvas = document.getElementById('barcodeCanvas');
  if (!canvas.width) { alert('Generate a barcode first.'); return; }
  const a = document.createElement('a');
  a.href = canvas.toDataURL('image/png');
  a.download = 'dl-barcode-pdf417.png';
  a.click();
});

// Download raw AAMVA text
document.getElementById('downloadTxtBtn').addEventListener('click', () => {
  const raw = document.getElementById('aamvaRaw').textContent;
  if (!raw) { alert('Generate data first.'); return; }
  const blob = new Blob([raw], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'dl-aamva-data.txt';
  a.click();
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
  const html = document.documentElement;
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
});

// ── Init: pre-fill ISS from default EXP on load ──────────────────────
(function init() {
  const exp = document.getElementById('exp').value;
  if (exp) document.getElementById('iss').value = calculateISS(exp);
})();

