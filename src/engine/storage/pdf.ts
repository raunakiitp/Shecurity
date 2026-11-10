// PDF report via jsPDF — clean brand-colored layout
import { jsPDF } from 'jspdf';
import type { ClipMeta } from '../../lib/types';
import { mapsLink } from '../../lib/format';

export function generateClipReport(meta: ClipMeta): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 56;

  // header band
  doc.setFillColor(20, 33, 61);
  doc.rect(0, 0, W, 92, 'F');
  doc.setTextColor(247, 244, 238);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Shecurity — Evidence Report', M, 42);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Tamper-evident audio evidence with SHA-256 integrity hash', M, 62);
  doc.setTextColor(111, 208, 192);
  doc.text(`Case ID: ${meta.id.slice(0, 8).toUpperCase()}`, W - M, 42, { align: 'right' });

  // meta block
  let y = 130;
  doc.setTextColor(27, 31, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Recording details', M, y);
  y += 22;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const rows: [string, string][] = [
    ['Timestamp (UTC)', new Date(meta.createdAt).toISOString()],
    ['Local time', meta.localTime],
    ['Duration', `${meta.duration.toFixed(1)} seconds (30s pre-roll + 30s post-roll)`],
    ['Trigger', meta.trigger],
    ['Peak scream score', `${(meta.peakScore * 100).toFixed(0)} / 100`],
    ['Device', meta.device],
  ];
  if (meta.duress) rows.push(['Alert type', 'Silent alert (duress PIN) — cancelled on screen, sent silently']);
  for (const [k, v] of rows) {
    doc.setTextColor(91, 100, 117);
    doc.text(k, M, y);
    doc.setTextColor(27, 31, 42);
    const lines = doc.splitTextToSize(v, W - M * 2 - 150);
    doc.text(lines, M + 160, y);
    y += Math.max(16, lines.length * 14);
  }

  // location
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(27, 31, 42);
  doc.text('Location', M, y);
  y += 20;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  if (meta.location) {
    doc.text(`Lat ${meta.location.lat.toFixed(6)}, Lng ${meta.location.lng.toFixed(6)}`, M, y);
    y += 16;
    doc.text(`Accuracy ±${Math.round(meta.location.accuracy)}m`, M, y);
    y += 16;
    doc.setTextColor(31, 122, 109);
    const link = mapsLink(meta.location.lat, meta.location.lng);
    const linkLines = doc.splitTextToSize(link, W - M * 2);
    doc.textWithLink(linkLines[0], M, y, { url: link });
    y += linkLines.length * 14;
  } else {
    doc.setTextColor(91, 100, 117);
    doc.text('Location not available at time of capture.', M, y);
    y += 16;
  }

  // hash block
  y += 8;
  doc.setFillColor(237, 231, 219);
  const boxH = 108;
  doc.roundedRect(M - 8, y - 14, W - M * 2 + 16, boxH, 6, 6, 'F');
  doc.setTextColor(27, 31, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('SHA-256 integrity hash', M, y + 6);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(20, 33, 61);
  const hashLines = doc.splitTextToSize(meta.sha256, W - M * 2 - 8);
  doc.text(hashLines, M, y + 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(91, 100, 117);
  doc.text('To verify: run `certutil -hashfile clip.wav SHA256` or use the /verify page of this app.', M, y + 62);
  doc.text('Any change to the audio file produces a different hash ("Tampered").', M, y + 76);

  y += boxH + 26;

  // disclaimer
  doc.setFontSize(9);
  doc.setTextColor(91, 100, 117);
  const disc = doc.splitTextToSize(
    'Disclaimer: This report was generated automatically by Shecurity, a browser-based safety application. Audio was captured and processed entirely on the user\'s device. The hash above evidences that the audio has not changed since capture; it does not certify the authenticity of the content itself. In an emergency always contact your local emergency services (India: 112).',
    W - M * 2,
  );
  doc.text(disc, M, y);

  // footer
  doc.setDrawColor(216, 210, 196);
  doc.line(M, 800, W - M, 800);
  doc.setFontSize(8);
  doc.text('Shecurity · HERHACK 2026 · Generated locally, no data left the device', M, 814);

  doc.save(`shecurity-evidence-${meta.id.slice(0, 8)}-${meta.createdAt.slice(0, 10)}.pdf`);
}
