import type { Server, Socket } from 'socket.io';
import { E } from '../../../shared/events.js';
import { CHARACTERS, MAPS } from '../../../shared/constants.js';
import type { Ack, InputMsg } from '../../../shared/types.js';
import { RoomManager, Room } from './RoomManager.js';
import { GameSession } from '../game/GameSession.js';
import { cleanName, RateLimiter } from '../security/Validation.js';
export class SocketManager { rm = new RoomManager(); rl = new RateLimiter();
  constructor(private io: Server) { io.on('connection', s => this.bind(s)); setInterval(() => this.rm.rooms.forEach(r => r.session?.tick()), 1000 / 20); }
  private room(s: Socket): Room | undefined { return this.rm.rooms.get(s.data.room); }
  private push(r: Room) { this.io.to(r.code).emit(E.lobby, r.lobby()); }
  private enter(s: Socket, r: Room, name: string) { r.members.set(s.id, { id: s.id, name, character: r.freeCharacter(), ready: false }); if (!r.host) r.host = s.id; s.join(r.code); s.data.room = r.code; this.push(r); }
  private bind(s: Socket) {
    s.on(E.create, (n: string, ack: Ack) => { const name = cleanName(n); if (!name) return ack?.({ ok: false, err: 'Name: 2–12 letters/numbers' }); if (s.data.room) return ack?.({ ok: false, err: 'Already in a room' });
      const r = this.rm.create(); this.enter(s, r, name); ack?.({ ok: true, code: r.code }); });
    s.on(E.join, (c: string, n: string, ack: Ack) => { const name = cleanName(n); if (!name) return ack?.({ ok: false, err: 'Name: 2–12 letters/numbers' }); if (s.data.room) return ack?.({ ok: false, err: 'Already in a room' });
      const r = this.rm.find(c), err = this.rm.canJoin(r); if (err || !r) return ack?.({ ok: false, err: err ?? 'Room not found' }); this.enter(s, r, name); ack?.({ ok: true, code: r.code }); });
    s.on(E.character, (c: number) => { const r = this.room(s), m = r?.members.get(s.id); if (!r || !m || r.phase !== 'lobby' || !CHARACTERS[c]) return;
      if ([...r.members.values()].some(o => o.id !== s.id && o.character === c)) return s.emit(E.error, 'Character already taken'); m.character = c; m.ready = false; this.push(r); });
    s.on(E.ready, (v: boolean) => { const r = this.room(s), m = r?.members.get(s.id); if (!r || !m || r.phase !== 'lobby') return; m.ready = !!v; this.push(r); });
    s.on(E.map, (id: string) => { const r = this.room(s); if (!r || r.host !== s.id || r.phase !== 'lobby') return; const mp = MAPS.find(m => m.id === id); if (!mp) return; if (!mp.playable) return s.emit(E.error, mp.name + ' is coming soon'); r.map = id; this.push(r); });
    s.on(E.start, () => { const r = this.room(s); if (!r || r.host !== s.id || r.phase !== 'lobby') return; const wait = [...r.members.values()].filter(m => m.id !== r.host && !m.ready);
      if (wait.length) return s.emit(E.error, 'Waiting for: ' + wait.map(m => m.name).join(', ')); r.phase = 'play'; r.session = new GameSession(this.io, r); this.io.to(r.code).emit(E.started, { map: r.map, spawn: r.session.spawns(), seq: r.session.seq }); this.push(r); });
    s.on(E.input, (m: InputMsg) => { const r = this.room(s); if (r?.session && this.rl.ok(s.id, 40)) r.session.input(s.id, m); });
    s.on('disconnect', () => { const r = this.room(s); this.rl.drop(s.id); if (!r) return; r.members.delete(s.id); r.session?.remove(s.id); if (!r.members.size) return void this.rm.rooms.delete(r.code);
      if (r.host === s.id) r.host = [...r.members.keys()][0]; this.push(r); }); } }
