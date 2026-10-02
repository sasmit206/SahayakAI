/**
 * printReport.ts
 * Builds a complete A4 government-style HTML application form and opens
 * it in a new tab, then triggers window.print() after 900ms so the
 * browser fully paints before the print dialog appears.
 *
 * No React / ReactDOM involved — pure HTML string so there is zero
 * timing issue with blank pages.
 *
 * Printout sections:
 *   1. Header       — logo, title, application ID, date, scheme, citizen name
 *   2. Citizen profile table
 *   3. Scheme details — benefits, eligibility, documents, how to apply
 *   4. Collected application answers
 *   5. AI-generated summary (if available)
 *   6. Declaration + 3 signature lines
 *   7. Footer — disclaimer, QR placeholder, page number
 */

import { CitizenProfile, SchemeRecommendation } from '../services/api';

export interface PrintOptions {
  profile: CitizenProfile;
  schemeName: string;
  schemeDetail: SchemeRecommendation | null;
  applicationAnswers: Record<string, any>;
  formFieldLabels: Record<string, string>;   // field key → human-readable label
  summaryReport: string | null;
  applicationId: string;
  generatedDate: string;
}

/* ── tiny helpers ─────────────────────────────────────────────────────────── */

function esc(s: string | null | undefined): string {
  if (s === null || s === undefined) return '—';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function rupees(n: number | null | undefined): string {
  if (n == null) return '—';
  return `₹${n.toLocaleString('en-IN')}`;
}

/* ── CSS ──────────────────────────────────────────────────────────────────── */

const CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', 'Noto Sans', Arial, sans-serif;
  font-size: 12px;
  color: #1a1a2e;
  background: #fff;
}

.page {
  width: 210mm;
  min-height: 297mm;
  margin: 0 auto;
  padding: 13mm 15mm 18mm 15mm;
  background: #fff;
}

/* ── header ── */
.hdr {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 3px solid #1a365d;
  padding-bottom: 11px;
  margin-bottom: 12px;
  gap: 16px;
}
.hdr-left { display: flex; align-items: center; gap: 12px; }
.emblem {
  width: 54px; height: 54px; background: #1a365d; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #fff; font-size: 22px; font-weight: 800; flex-shrink: 0;
}
.org-name { font-size: 17px; font-weight: 800; color: #1a365d; line-height: 1.2; }
.org-sub  { font-size: 9.5px; color: #555; margin-top: 2px; line-height: 1.4; }
.hdr-right { text-align: right; flex-shrink: 0; }
.doc-title { font-size: 13px; font-weight: 700; color: #1a365d; }
.doc-meta { margin-top: 5px; font-size: 10px; color: #444; line-height: 1.85; }
.doc-meta b { color: #1a365d; }

/* ── blue strip ── */
.strip {
  background: #1a365d; color: #fff;
  text-align: center; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.12em; text-transform: uppercase;
  padding: 5px 0; margin-bottom: 14px;
}

/* ── sections ── */
.sec { margin-bottom: 14px; page-break-inside: avoid; }
.sec-title {
  font-size: 10.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: #fff; background: #1a365d;
  padding: 5px 10px; margin-bottom: 0;
}

/* ── generic table ── */
table { width: 100%; border-collapse: collapse; }
td, th { border: 1px solid #c8d6e5; padding: 6px 9px; font-size: 11.5px; vertical-align: top; }
th {
  background: #eef2f7; font-weight: 700; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.05em; color: #2c5282;
}
tr:nth-child(even) td { background: #f8fafc; }
.lbl { font-weight: 600; color: #2d3748; width: 36%; white-space: nowrap; }
.val { color: #1a202c; }

/* ── info box (scheme details) ── */
.ibox { border: 1.5px solid #c8d6e5; border-radius: 4px; overflow: hidden; }
.irow { display: flex; border-bottom: 1px solid #e2e8f0; }
.irow:last-child { border-bottom: none; }
.ilbl {
  width: 26%; background: #eef2f7; font-weight: 700; font-size: 10px;
  color: #2c5282; padding: 7px 10px; flex-shrink: 0;
  text-transform: uppercase; letter-spacing: 0.05em;
  display: flex; align-items: flex-start;
}
.ival { padding: 7px 10px; font-size: 11.5px; color: #1a202c; line-height: 1.55; flex: 1; }

/* ── summary / declaration ── */
.prose {
  border: 1.5px solid #c8d6e5; border-radius: 4px;
  padding: 10px 12px; font-size: 11.5px; line-height: 1.7;
  color: #1a202c; white-space: pre-wrap; background: #fafcff;
}
.decl {
  border: 1.5px solid #c8d6e5; border-radius: 4px;
  padding: 10px 12px; font-size: 11px; line-height: 1.7;
  color: #333; background: #fffbf0;
}
.sig-grid {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  gap: 22px; margin-top: 16px;
}
.sig-box { text-align: center; }
.sig-line { border-bottom: 1.5px solid #1a365d; height: 38px; margin-bottom: 4px; }
.sig-lbl { font-size: 9.5px; color: #555; }

/* ── footer ── */
.ftr {
  display: flex; align-items: flex-start; justify-content: space-between;
  border-top: 2px solid #1a365d; padding-top: 10px; margin-top: 18px;
  font-size: 9px; color: #666; gap: 16px;
}
.ftr-disc { max-width: 66%; line-height: 1.5; }
.ftr-right { text-align: right; flex-shrink: 0; }
.qr {
  width: 54px; height: 54px; border: 1.5px dashed #aab; border-radius: 4px;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #aab; margin: 0 0 4px auto;
}

/* ── print rules ── */
@media print {
  @page { size: A4 portrait; margin: 0; }
  body { padding: 0; }
  .page { width: 100%; padding: 11mm 13mm 15mm 13mm; }
  .sec, .ibox, table, .decl { page-break-inside: avoid; }
  .sec-title { page-break-after: avoid; }
  thead { display: table-header-group; }
}
`;

/* ── HTML builder ─────────────────────────────────────────────────────────── */

export function buildPrintHtml(opts: PrintOptions): string {
  const {
    profile, schemeName, schemeDetail,
    applicationAnswers, formFieldLabels,
    summaryReport, applicationId, generatedDate,
  } = opts;

  /* citizen profile rows */
  const profileHtml = [
    ['Full Name',       profile.name           ?? '—'],
    ['Age',             profile.age != null ? `${profile.age} years` : '—'],
    ['Gender',          profile.gender         ?? '—'],
    ['Residing State',  profile.state          ?? '—'],
    ['Social Category', profile.category       ?? '—'],
    ['Occupation',      profile.occupation     ?? '—'],
    ['Annual Income',   rupees(profile.income)],
    ['Marital Status',  profile.maritalStatus  ?? '—'],
    ['Disability',      profile.disabilityStatus === true ? 'Yes' : profile.disabilityStatus === false ? 'No' : '—'],
  ].map(([k, v]) => `<tr><td class="lbl">${esc(k)}</td><td class="val">${esc(v)}</td></tr>`).join('');

  /* scheme details */
  const schemeHtml = schemeDetail ? `
    <div class="ibox">
      <div class="irow"><div class="ilbl">Benefits</div><div class="ival">${esc(schemeDetail.benefits)}</div></div>
      <div class="irow"><div class="ilbl">Eligibility</div><div class="ival">${esc(schemeDetail.eligibilityText)}</div></div>
      <div class="irow"><div class="ilbl">Documents Required</div><div class="ival">${esc(schemeDetail.documents)}</div></div>
      <div class="irow"><div class="ilbl">How to Apply</div><div class="ival">${esc(schemeDetail.application)}</div></div>
      <div class="irow">
        <div class="ilbl">Level / Dept.</div>
        <div class="ival">${esc(schemeDetail.level)} &nbsp;·&nbsp; ${schemeDetail.category.slice(0,3).map(esc).join(', ') || '—'}</div>
      </div>
      <div class="irow">
        <div class="ilbl">Match Score</div>
        <div class="ival"><b>${schemeDetail.score} pts</b> &nbsp;—&nbsp; ${schemeDetail.reasons.map(esc).join('; ')}</div>
      </div>
    </div>` : `<p style="color:#888;font-style:italic;padding:8px 0">Scheme details not available.</p>`;

  /* application answers */
  const entries = Object.entries(applicationAnswers);
  const answersHtml = entries.length === 0
    ? `<p style="color:#888;font-style:italic;padding:8px 0">No answers collected.</p>`
    : `<table>
        <thead><tr><th style="width:40%">Field</th><th>Answer Provided</th></tr></thead>
        <tbody>
          ${entries.map(([key, val]) => `
            <tr>
              <td class="lbl">${esc(formFieldLabels[key] ?? key)}</td>
              <td class="val">${esc(String(val))}</td>
            </tr>`).join('')}
        </tbody>
      </table>`;

  /* AI summary */
  const summaryHtml = summaryReport
    ? `<div class="sec">
        <div class="sec-title">Section 4 — AI-Generated Application Summary</div>
        <div class="prose">${esc(summaryReport)}</div>
       </div>`
    : '';

  /* eligibility reasons for declaration */
  const reasons = schemeDetail?.reasons?.length
    ? '\n\nEligibility verified by Sahayak AI:\n' + schemeDetail.reasons.map(r => `• ${r}`).join('\n')
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <title>Sahayak AI — Scheme Application</title>
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="hdr">
    <div class="hdr-left">
      <div class="emblem">S</div>
      <div>
        <div class="org-name">Sahayak AI</div>
        <div class="org-sub">Government Welfare Scheme Assistance Platform</div>
        <div class="org-sub">Ministry of Social Justice &amp; Empowerment · Digital India Initiative</div>
      </div>
    </div>
    <div class="hdr-right">
      <div class="doc-title">SCHEME APPLICATION FORM</div>
      <div class="doc-meta">
        Application ID: <b>${esc(applicationId)}</b><br/>
        Date: <b>${esc(generatedDate)}</b><br/>
        Scheme: <b>${esc(schemeName)}</b><br/>
        Applicant: <b>${esc(profile.name)}</b>
      </div>
    </div>
  </div>

  <div class="strip">Official Application · For Submission to Government Office</div>

  <!-- SECTION 1: CITIZEN PROFILE -->
  <div class="sec">
    <div class="sec-title">Section 1 — Citizen Profile</div>
    <table>
      <thead><tr><th style="width:36%">Field</th><th>Details</th></tr></thead>
      <tbody>${profileHtml}</tbody>
    </table>
  </div>

  <!-- SECTION 2: SCHEME DETAILS -->
  <div class="sec">
    <div class="sec-title">Section 2 — Scheme Details: ${esc(schemeName)}</div>
    ${schemeHtml}
  </div>

  <!-- SECTION 3: APPLICATION ANSWERS -->
  <div class="sec">
    <div class="sec-title">Section 3 — Collected Application Information</div>
    ${answersHtml}
  </div>

  <!-- SECTION 4: AI SUMMARY (conditional) -->
  ${summaryHtml}

  <!-- SECTION 5: DECLARATION -->
  <div class="sec">
    <div class="sec-title">Section ${summaryReport ? 5 : 4} — Declaration</div>
    <div class="decl">
      I, <b>${esc(profile.name)}</b>, hereby declare that the information provided in this application
      is true, complete, and correct to the best of my knowledge and belief. I understand that any
      false statement or misrepresentation may result in rejection of my application or recovery of
      benefits already provided. I consent to verification of this information by the concerned
      government department.${esc(reasons)}

      <div class="sig-grid">
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">Applicant Signature / Thumb Impression</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">Date</div>
        </div>
        <div class="sig-box">
          <div class="sig-line"></div>
          <div class="sig-lbl">Caseworker / NGO Representative</div>
        </div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="ftr">
    <div class="ftr-disc">
      <b>Disclaimer:</b> This document was generated by Sahayak AI to assist caseworkers in preparing
      scheme applications. It is not an official government document. Final eligibility is determined
      by the concerned government department. Application ID: ${esc(applicationId)}.
    </div>
    <div class="ftr-right">
      <div class="qr">QR</div>
      <div>Generated by Sahayak AI</div>
      <div>${esc(generatedDate)}</div>
      <div style="margin-top:2px">Page 1 of 1</div>
    </div>
  </div>

</div>
</body>
</html>`;
}

/**
 * Opens the printout in a new tab and auto-triggers print after 900ms.
 * The 900ms delay ensures the browser fully paints before the dialog opens.
 */
export function openAndPrint(opts: PrintOptions): void {
  const html = buildPrintHtml(opts);
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups for this site to generate the printout.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
  setTimeout(() => {
    try { win.print(); } catch { /* user may have closed the tab */ }
  }, 900);
}