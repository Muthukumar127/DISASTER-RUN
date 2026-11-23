export const cleanName = (n: unknown): string | null => { const s = String(n ?? '').trim().replace(/\s+/g, ' '); return s.length >= 2 && s.length <= 12 && /^[\p{L}\p{M}\p{N}_ ]+$/u.test(s) ? s : null; };
const fin = (v: unknown, lim: number) => { const x = Number(v); return Number.isFinite(x) ? Math.max(-lim, Math.min(lim, x)) : 0; };
export const num = fin;
export class RateLimiter { private b = new Map<string, { t: number; n: number }>();
  ok(id: string, perSec: number) { const now = Date.now(), e = this.b.get(id); if (!e || now - e.t > 1000) { this.b.set(id, { t: now, n: 1 }); return true; } return ++e.n <= perSec; }
  drop(id: string) { this.b.delete(id); } }
