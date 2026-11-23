import type { Server } from 'socket.io';
import { E } from '../../../shared/events.js';
import { MAP_HALF, RUN, WALK } from '../../../shared/constants.js';
import { DISASTERS, POOL, buildingsOf, insideB, wallsOf } from '../../../shared/maps.js';
import type { Anim, InputMsg, StateMsg } from '../../../shared/types.js';
import type { Room } from '../network/RoomManager.js';
import { num } from '../security/Validation.js';
const PREP = 30, WARN = 5, ON = 15, REST = 5, CYC = WARN + ON + REST, EVENTS = 6, R = .45, rr = (a: number, b: number) => a + Math.random() * (b - a), cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const STRIKE: Record<string, [number, number, number]> = { lightning: [.9, 3.5, 1.2], meteor: [.6, 5, 1.5], hail: [.2, 2.2, .8] }; // interval, radius, warning time
interface P { x: number; y: number; z: number; vy: number; ry: number; in: InputMsg; anim: Anim; hp: number; dead: boolean; lastIn: number }
interface Hz { t: 0 | 1; x: number; z: number; r: number; w?: number; dn?: number; vx?: number; vz?: number }
/** Server-authoritative: movement + wall collision, disaster timeline (30 s prep, 6 disasters), damage. Indoors = safe (except earthquakes). */
export class GameSession { players = new Map<string, P>(); last = Date.now(); t0 = Date.now(); seq: string[] = []; hz: Hz[] = []; ph = ''; idx = -2; sa = 0; over = false; blds; walls: number[][];
  constructor(private io: Server, private room: Room) { this.blds = buildingsOf(room.map); this.walls = this.blds.flatMap(wallsOf); const pool = POOL[room.map] || POOL.desert;
    for (let i = 0; i < EVENTS; i++) { let t: string; do t = pool[Math.random() * pool.length | 0]; while (t === this.seq[i - 1]); this.seq.push(t); }
    [...room.members.keys()].forEach((id, i) => this.players.set(id, { x: -3 + i * 2, y: 0, z: 0, vy: 0, ry: 0, in: { dx: 0, dz: 0, run: false, jump: false, ry: 0 }, anim: 'idle', hp: 100, dead: false, lastIn: Date.now() })); }
  spawns() { return Object.fromEntries([...this.players].map(([id, p]) => [id, [p.x, p.z]])); }
  input(id: string, m: InputMsg) { const p = this.players.get(id); if (!p || !m) return; let dx = num(m.dx, 1), dz = num(m.dz, 1); const l = Math.hypot(dx, dz); if (l > 1) { dx /= l; dz /= l; } p.lastIn = Date.now(); p.in = { dx, dz, run: !!m.run, jump: p.in.jump || !!m.jump, ry: 0 }; }
  remove(id: string) { this.players.delete(id); }
  private inside(x: number, z: number) { return this.blds.some(b => insideB(b, x, z)); }
  private free(): { x: number; z: number } { for (let k = 0; k < 20; k++) { const x = rr(-36, 36), z = rr(-36, 36); if (!this.inside(x, z)) return { x, z }; } return { x: 0, z: 0 }; }
  private spawn(ty: string, idx: number, alive: P[]) { const D = DISASTERS[ty], k = Math.max(0, idx);
    if (ty === 'wildfire' || ty === 'lava') for (let i = 0; i < 4 + (k >> 1); i++) { const q = alive.length ? alive[Math.random() * alive.length | 0] : { x: 0, z: 0 }; let x = q.x + rr(-20, 20), z = q.z + rr(-20, 20); if (this.inside(x, z)) ({ x, z } = this.free()); this.hz.push({ t: 0, x: cl(x, -MAP_HALF, MAP_HALF), z: cl(z, -MAP_HALF, MAP_HALF), r: 5 }); }
    if (ty === 'tornado') for (let i = 0; i < 1 + (k > 2 ? 1 : 0); i++) { const a = rr(0, 6.28); this.hz.push({ t: 0, x: Math.cos(a) * 55, z: Math.sin(a) * 55, r: 4.5 }); }
    if (ty === 'tsunami') for (let i = 0; i < 7; i++) this.hz.push({ t: 0, x: -MAP_HALF - 14, z: -36 + i * 12, r: 12, vx: 9, vz: 0 });
    if (ty === 'landslide') for (let i = 0; i < 7; i++) this.hz.push({ t: 0, x: -36 + i * 12, z: -MAP_HALF - 14, r: 12, vx: 0, vz: 9 }); void D; }
  private update(ty: string, dt: number, alive: P[], idx: number) { const D = DISASTERS[ty], st = STRIKE[ty];
    if (st) { this.sa -= dt; if (this.sa <= 0 && alive.length) { this.sa = st[0]; const q = alive[Math.random() * alive.length | 0], s = ty === 'hail' ? 14 : 9; this.hz.push({ t: 1, x: q.x + rr(-s, s), z: q.z + rr(-s, s), r: st[1], w: st[2], dn: 0 }); } }
    for (const h of this.hz) { if (h.t === 1) { if (h.w! > 0) { h.w! -= dt; if (h.w! <= 0) { h.w = 0; h.dn = .4; for (const p of alive) if (Math.hypot(p.x - h.x, p.z - h.z) < h.r && !this.inside(p.x, p.z)) p.hp -= D.dmg; } } else h.dn! -= dt; continue; }
      if (ty === 'wildfire' || ty === 'lava') h.r = Math.min(10, h.r + .3 * dt);
      else if (ty === 'tornado') { const q = alive.reduce<P | null>((b, p) => !b || Math.hypot(p.x - h.x, p.z - h.z) < Math.hypot(b.x - h.x, b.z - h.z) ? p : b, null); if (q) { const l = Math.hypot(q.x - h.x, q.z - h.z) || 1, sp = 4 + idx * .25; h.x += (q.x - h.x) / l * sp * dt; h.z += (q.z - h.z) / l * sp * dt; } }
      else { h.x += (h.vx || 0) * dt; h.z += (h.vz || 0) * dt; } }
    this.hz = this.hz.filter(h => h.t !== 1 || h.w! > 0 || h.dn! > 0); }
  private finish(res: 'won' | 'lost') { this.over = true; this.room.phase = 'over' as never; this.io.to(this.room.code).emit(E.end, { res, surv: [...this.players.values()].map((p, i) => ({ p, n: [...this.room.members.values()][i]?.name })).filter(o => !o.p.dead).map(o => o.n), t: Math.round((Date.now() - this.t0) / 1000) }); }
  tick() { if (this.over) return; const now = Date.now(), dt = Math.min(.1, (now - this.last) / 1000); this.last = now; const T = (now - this.t0) / 1000;
    let ph: 'prep' | 'warn' | 'on' | 'rest' = 'prep', idx = -1, tl = Math.ceil(PREP - T);
    if (T >= PREP) { const k = T - PREP; idx = Math.floor(k / CYC); if (idx >= EVENTS) return this.finish('won'); const w = k - idx * CYC; ph = w < WARN ? 'warn' : w < WARN + ON ? 'on' : 'rest'; tl = Math.ceil(ph === 'warn' ? WARN - w : ph === 'on' ? WARN + ON - w : CYC - w); }
    const ty = this.seq[Math.max(0, idx)], D = DISASTERS[ty], alive = [...this.players.values()].filter(p => !p.dead);
    if (idx !== this.idx) { this.idx = idx; this.ph = ''; this.sa = 0; } if (this.ph !== ph) { this.ph = ph; this.hz = []; if (ph === 'warn') this.spawn(ty, idx, alive); }
    if (ph === 'on') this.update(ty, dt, alive, idx);
    const o: StateMsg = { p: {}, hz: [], ph, i: idx, ty, tl };
    this.players.forEach((p, id) => { const i = p.in; if (now - p.lastIn > 400) { i.dx = 0; i.dz = 0; } // no input for 0.4 s => stop (fixes "moves by itself")
      const l = Math.hypot(i.dx, i.dz), sp = i.run ? RUN : WALK; if (!p.dead) { p.x += i.dx * sp * dt; p.z += i.dz * sp * dt;
        for (let k = 0; k < 2; k++) for (const w of this.walls) { const cx = cl(p.x, w[0], w[2]), cz = cl(p.z, w[1], w[3]), ex = p.x - cx, ez = p.z - cz, d = Math.hypot(ex, ez); if (d < R) { if (d > 1e-4) { p.x = cx + ex / d * R; p.z = cz + ez / d * R; } else p.x += R; } }
        p.x = cl(p.x, -MAP_HALF, MAP_HALF); p.z = cl(p.z, -MAP_HALF, MAP_HALF); if (l > .1) p.ry = Math.atan2(i.dx, i.dz); if (i.jump && p.y === 0) p.vy = 7; }
      i.jump = false; p.vy -= 20 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0;
      const inb = this.inside(p.x, p.z); let dmg = 0;
      if (!p.dead && ph === 'on') { if (D.kind === 'quake') { if (inb) dmg += D.dmg; } else if (!inb) { if (D.kind === 'global') dmg += D.dmg; else if (D.kind !== 'strike') for (const h of this.hz) if (Math.hypot(p.x - h.x, p.z - h.z) < h.r) dmg += D.dmg; } }
      p.hp -= dmg * dt; if (!dmg && inb && !p.dead) p.hp = Math.min(100, p.hp + 3 * dt); if (p.hp <= 0) { p.hp = 0; p.dead = true; }
      p.anim = p.dead ? 'idle' : p.y > 0 ? 'jump' : l < .1 ? 'idle' : i.run ? 'run' : 'walk'; o.p[id] = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.anim, Math.round(p.hp), p.dead ? 1 : 0]; });
    o.hz = this.hz.map(h => [h.t, +h.x.toFixed(1), +h.z.toFixed(1), +h.r.toFixed(1), h.t === 1 ? (h.w! > 0 ? 1 : 0) : (ph === 'warn' ? 1 : 0)]);
    this.io.to(this.room.code).emit(E.state, o); if (this.players.size && ![...this.players.values()].some(p => !p.dead)) this.finish('lost'); } }
