import { NetworkManager } from './multiplayer/NetworkManager';
import { Game } from './core/Game';
import { Menu } from './ui/Menu';
const net = new NetworkManager(), root = document.getElementById('ui')!, game = new Game(net, root), menu = new Menu(net, root);
net.onStart = d => { menu.hide(); game.buildMap(d.map, d.seq); net.lobby?.players.forEach(p => game.addPlayer(p.id, p.character, p.name, d.spawn[p.id]?.[0], d.spawn[p.id]?.[1])); game.start(); };
net.onState = m => game.applyState(m);
net.onEnd = r => { document.getElementById('hud')!.style.display = 'none'; root.innerHTML = `<div class="panel"><h1 style="font-size:44px">${r.res === 'won' ? '🏆 YOU SURVIVED ALL DISASTERS!' : '💀 Nobody survived…'}</h1><div style="font-weight:700">Survivors: ${r.surv.join(', ') || 'none'} · ${r.t}s</div><button onclick="location.reload()">Play again</button></div>`; };
