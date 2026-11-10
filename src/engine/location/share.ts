// share.ts: build the emergency message + channel links
import type { GeoSnap } from '../../lib/types';
import { mapsLink } from '../../lib/format';

export function buildMessage(
  name: string,
  snap: GeoSnap | null,
  timeStr: string,
): string {
  const loc = snap
    ? `Live location: ${mapsLink(snap.lat, snap.lng)} Accuracy ±${Math.round(snap.accuracy)}m.`
    : 'Location unavailable.';
  return `🚨 EMERGENCY from ${name}. Possible distress detected at ${timeStr}. ${loc} Please call me or contact police (112).`;
}

export function whatsappLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function smsLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9+]/g, '');
  return `sms:${digits}?body=${encodeURIComponent(message)}`;
}

export function telLink(number: string): string {
  return `tel:${number}`;
}

export async function webShare(message: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Emergency — Shecurity', text: message });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // fallback
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    } catch {
      return false;
    }
  }
}
