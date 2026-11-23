import { MAX_PLAYERS } from '../../../shared/constants.js';
import type { LobbyState } from '../../../shared/types.js';
import type { GameSession } from '../game/GameSession.js';
export interface Member { id: string; name: string; character: number; ready: boolean }
export class Room { host = ''; map = 'desert'; phase: 'lobby' | 'play' = 'lobby'; members = new Map<string, Member>(); session?: GameSession; constructor(public code: string) {}
  lobby(): LobbyState { return { code: this.code, map: this.map, phase: this.phase, players: [...this.members.values()].map(m => ({ ...m, host: m.id === this.host })) }; }
  freeCharacter(): number { const used = [...this.members.values()].map(m => m.character); return [0, 1, 2, 3].find(c => !used.includes(c)) ?? 0; } }
export class RoomManager { rooms = new Map<string, Room>();
  create(): Room { let c: string; do c = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random() * 32 | 0]).join(''); while (this.rooms.has(c)); const r = new Room(c); this.rooms.set(c, r); return r; }
  find(code: string) { return this.rooms.get(String(code || '').toUpperCase()); }
  canJoin(r?: Room): string | null { if (!r) return 'Room not found'; if (r.phase !== 'lobby') return 'Game already started'; if (r.members.size >= MAX_PLAYERS) return 'Room is full (4 max)'; return null; } }
