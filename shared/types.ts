export interface LobbyPlayer { id: string; name: string; character: number; ready: boolean; host: boolean }
export interface LobbyState { code: string; map: string; phase: 'lobby' | 'play'; players: LobbyPlayer[] }
export interface InputMsg { dx: number; dz: number; run: boolean; jump: boolean; ry: number }
export type Ack = (r: { ok: boolean; err?: string; code?: string }) => void;
export type Anim = 'idle' | 'walk' | 'run' | 'jump';
/** player id -> [x, y, z, rotationY, anim] */
export type StateMsg = { p: Record<string, [number, number, number, number, Anim]> };
