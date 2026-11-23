import type { Server } from 'socket.io';
import { E } from '../../../shared/events.js';
import { MAP_HALF, RUN, WALK } from '../../../shared/constants.js';
import type { Anim, InputMsg, StateMsg } from '../../../shared/types.js';
import type { Room } from '../network/RoomManager.js';
import { num } from '../security/Validation.js';
interface P { x: number; y: number; z: number; vy: number; ry: number; in: InputMsg; anim: Anim }
/** Server-authoritative simulation: clients send intent (direction/run/jump); the server moves players, clamps speed and bounds. */
export class GameSession { players = new Map<string, P>(); last = Date.now();
  constructor(private io: Server, private room: Room) { [...room.members.keys()].forEach((id, i) => this.players.set(id, { x: -2 + i * 1.6, y: 0, z: 3, vy: 0, ry: 0, in: { dx: 0, dz: 0, run: false, jump: false, ry: 0 }, anim: 'idle' })); }
  spawns() { return Object.fromEntries([...this.players].map(([id, p]) => [id, [p.x, p.z]])); }
  input(id: string, m: InputMsg) { const p = this.players.get(id); if (!p || !m) return; let dx = num(m.dx, 1), dz = num(m.dz, 1); const l = Math.hypot(dx, dz); if (l > 1) { dx /= l; dz /= l; } p.in = { dx, dz, run: !!m.run, jump: p.in.jump || !!m.jump, ry: num(m.ry, 7) }; }
  remove(id: string) { this.players.delete(id); }
  tick() { const now = Date.now(), dt = Math.min(.1, (now - this.last) / 1000); this.last = now; const o: StateMsg = { p: {} };
    this.players.forEach((p, id) => { const i = p.in, l = Math.hypot(i.dx, i.dz), sp = i.run ? RUN : WALK;
      p.x = Math.max(-MAP_HALF, Math.min(MAP_HALF, p.x + i.dx * sp * dt)); p.z = Math.max(-MAP_HALF, Math.min(MAP_HALF, p.z + i.dz * sp * dt)); if (l > .1) p.ry = Math.atan2(i.dx, i.dz);
      if (i.jump && p.y === 0) p.vy = 7; i.jump = false; p.vy -= 20 * dt; p.y = Math.max(0, p.y + p.vy * dt); if (p.y === 0) p.vy = 0;
      p.anim = p.y > 0 ? 'jump' : l < .1 ? 'idle' : i.run ? 'run' : 'walk'; o.p[id] = [+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2), +p.ry.toFixed(2), p.anim]; });
    this.io.to(this.room.code).emit(E.state, o); } }
