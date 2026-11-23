import { CHARACTERS } from '../../shared/constants';
import { NetworkManager } from './multiplayer/NetworkManager';
import { Game } from './core/Game';
import { Menu } from './ui/Menu';
const net = new NetworkManager(), root = document.getElementById('ui')!, game = new Game(net, root), menu = new Menu(net, root);
net.onStart = d => { menu.hide(); game.buildDesert(); net.lobby?.players.forEach(p => game.addPlayer(p.id, p.character, p.name, d.spawn[p.id]?.[0], d.spawn[p.id]?.[1])); game.start();
  document.getElementById('hud')!.innerHTML = `DISASTER RUN · Desert Apocalypse<br>WASD move · Shift run · Space jump · drag = camera`; };
net.onState = m => game.applyState(m); void CHARACTERS;
