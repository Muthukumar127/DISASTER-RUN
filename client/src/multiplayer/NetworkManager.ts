import { io, Socket } from 'socket.io-client';
import { E } from '../../../shared/events';
import type { Ack, InputMsg, LobbyState, StateMsg } from '../../../shared/types';
export class NetworkManager { s: Socket; id = ''; lobby: LobbyState | null = null; onLobby: (l: LobbyState) => void = () => {}; onStart: (d: { map: string; spawn: Record<string, [number, number]> }) => void = () => {}; onState: (m: StateMsg) => void = () => {}; onError: (e: string) => void = () => {};
  constructor() { this.s = io(); this.s.on('connect', () => this.id = this.s.id!); this.s.on(E.lobby, (l: LobbyState) => { this.lobby = l; this.onLobby(l); }); this.s.on(E.started, d => this.onStart(d));
    this.s.on(E.state, (m: StateMsg) => this.onState(m)); this.s.on(E.error, (e: string) => this.onError(e)); this.s.on('disconnect', () => this.onError('Connection lost – refresh to reconnect')); this.s.on('connect_error', () => this.onError('Cannot reach server')); }
  create(name: string, ack: Ack) { this.s.emit(E.create, name, ack); } join(code: string, name: string, ack: Ack) { this.s.emit(E.join, code, name, ack); }
  character(c: number) { this.s.emit(E.character, c); } ready(v: boolean) { this.s.emit(E.ready, v); } map(id: string) { this.s.emit(E.map, id); } start() { this.s.emit(E.start); } input(m: InputMsg) { this.s.volatile.emit(E.input, m); } }
