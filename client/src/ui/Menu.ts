import { CHARACTERS, MAPS } from '../../../shared/constants';
import type { LobbyState } from '../../../shared/types';
import type { NetworkManager } from '../multiplayer/NetworkManager';
import { settings } from '../core/Game';
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
/** Main menu, character selection, settings, credits and the 4-slot lobby. */
export class Menu { name = localStorage.getItem('dr_name') || ''; screen = 'main'; err = '';
  constructor(private net: NetworkManager, private root: HTMLElement) { net.onLobby = l => { if (l.phase === 'lobby') this.render(l); }; net.onError = e => { this.err = e; this.render(net.lobby); }; const code = new URLSearchParams(location.search).get('room'); if (code) { this.screen = 'join'; this.pre = code.toUpperCase().slice(0, 6); } this.render(null); }
  pre = ''; hide() { this.root.innerHTML = ''; }
  private nameBox() { return `<input id="nm" placeholder="Your name" maxlength="12" value="${this.name}">`; }
  private grab(): boolean { const v = (document.getElementById('nm') as HTMLInputElement | null)?.value ?? this.name; this.name = v.trim(); localStorage.setItem('dr_name', this.name); return this.name.length >= 2; }
  private ack = (r: { ok: boolean; err?: string }) => { if (!r.ok) { this.err = r.err || 'Failed'; this.render(null); } else history.replaceState(null, '', location.pathname); };
  render(l: LobbyState | null) { const R = this.root, e = `<div class="err">${this.err}</div>`; this.err = '';
    if (l) return this.lobby(l, e);
    const logo = `<h1>DISASTER RUN</h1><div class="tag">SURVIVE TOGETHER. ESCAPE TOGETHER.</div>`;
    if (this.screen === 'main') R.innerHTML = `<div class="panel">${logo}${this.nameBox()}<div class="row"><button id="play">▶ Play (solo)</button><button id="cr">Create Room</button><button id="jr" class="alt">Join Room</button></div><div class="row"><button id="cs">Character</button><button id="st">Settings</button><button id="cd">Credits</button><button id="ex" class="alt">Exit</button></div>${e}</div>`;
    if (this.screen === 'join') R.innerHTML = `<div class="panel">${logo}${this.nameBox()}<input id="code" placeholder="ROOM CODE" maxlength="6" value="${this.pre}" style="text-transform:uppercase"><div class="row"><button id="go">Join</button><button id="bk" class="alt">Back</button></div>${e}</div>`;
    if (this.screen === 'settings') R.innerHTML = `<div class="panel"><h1 style="font-size:44px">Settings</h1><label>Camera sensitivity <input id="sens" type="range" min="0.4" max="2.5" step="0.1" value="${settings.sensitivity}"></label><button id="bk">Back</button></div>`;
    if (this.screen === 'credits') R.innerHTML = `<div class="panel"><h1 style="font-size:44px">Credits</h1><p>DISASTER RUN – built with Three.js, TypeScript, Node.js & Socket.IO.<br>Characters: MAX, NEO, COCO, REX (original).</p><button id="bk">Back</button></div>`;
    if (this.screen === 'chars') R.innerHTML = `<div class="panel"><h1 style="font-size:44px">Characters</h1><div class="row">${CHARACTERS.map(c => `<div class="slot" style="background:${hex(c.color)}">${c.name}<br><small>${c.role}</small></div>`).join('')}</div><p>Pick yours inside the lobby.</p><button id="bk">Back</button></div>`;
    this.wire(); }
  private wire() { const $ = (id: string) => document.getElementById(id), on = (id: string, f: () => void) => { const b = $(id); if (b) b.onclick = f; };
    on('play', () => { if (!this.grab()) return this.fail('Enter a name (2–12 characters)'); this.net.create(this.name, r => { this.ack(r); if (r.ok) setTimeout(() => this.net.start(), 150); }); });
    on('cr', () => { if (!this.grab()) return this.fail('Enter a name (2–12 characters)'); this.net.create(this.name, this.ack); });
    on('jr', () => { this.screen = 'join'; this.render(null); }); on('bk', () => { this.screen = 'main'; this.render(null); }); on('cs', () => { this.screen = 'chars'; this.render(null); }); on('st', () => { this.screen = 'settings'; this.render(null); }); on('cd', () => { this.screen = 'credits'; this.render(null); });
    on('ex', () => { window.close(); this.fail('Close this tab to exit'); }); on('go', () => { if (!this.grab()) return this.fail('Enter a name (2–12 characters)'); this.net.join((($('code') as HTMLInputElement).value || '').toUpperCase(), this.name, this.ack); });
    const s = $('sens') as HTMLInputElement | null; if (s) s.oninput = () => settings.sensitivity = +s.value; }
  private fail(m: string) { this.err = m; this.render(null); }
  private lobby(l: LobbyState, e: string) { const me = l.players.find(p => p.id === this.net.id), host = !!me?.host, taken = l.players.map(p => p.character);
    const slots = Array.from({ length: 4 }, (_, i) => { const p = l.players[i]; return p ? `<div class="slot" style="background:${hex(CHARACTERS[p.character].color)}">${p.host ? '★ ' : ''}${p.name}${p.id === this.net.id ? ' (you)' : ''}<br><small>${CHARACTERS[p.character].name}</small><br>${p.ready || p.host ? '✅ Ready' : '⌛ Not ready'}</div>` : `<div class="slot" style="border-style:dashed">Open slot<br><small>share the code</small></div>`; }).join('');
    this.root.innerHTML = `<div class="panel"><h1 style="font-size:46px">Room ${l.code}</h1><div class="row"><button id="inv">📨 Invite friends</button><button id="wa" class="alt">💬 WhatsApp</button></div><div class="row">${slots}</div>
    <div class="row">${CHARACTERS.map(c => `<button data-c="${c.id}" class="${me?.character === c.id ? 'sel' : ''} ${taken.includes(c.id) && me?.character !== c.id ? 'off' : ''}" style="background:${hex(c.color)};color:#2a1a12">${c.name}</button>`).join('')}</div>
    <div class="row">${MAPS.map(m => `<button data-m="${m.id}" class="${l.map === m.id ? 'sel' : ''} ${m.playable ? '' : 'off'}" ${host ? '' : 'disabled'}>${m.name}${m.playable ? '' : ' 🔒'}</button>`).join('')}</div>
    <div class="row">${host ? '<button id="st">▶ Start game</button>' : `<button id="rd">${me?.ready ? 'Not ready' : '✔ Ready'}</button>`}</div>${e}</div>`;
    const q = (s: string) => this.root.querySelectorAll<HTMLElement>(s); q('[data-c]').forEach(b => b.onclick = () => this.net.character(+b.dataset.c!)); q('[data-m]').forEach(b => b.onclick = () => this.net.map(b.dataset.m!));
    const url = `${location.origin}${location.pathname}?room=${l.code}`, txt = `Join my DISASTER RUN game! Room code: ${l.code} ${url}`; const st = document.getElementById('st'), rd = document.getElementById('rd');
    if (st) st.onclick = () => this.net.start(); if (rd) rd.onclick = () => this.net.ready(!me?.ready);
    document.getElementById('inv')!.onclick = async () => { try { await navigator.clipboard.writeText(txt); this.err = '✅ Invite link copied!'; } catch { this.err = 'Code: ' + l.code; } this.render(l); }; document.getElementById('wa')!.onclick = () => window.open('https://wa.me/?text=' + encodeURIComponent(txt), '_blank'); } }
