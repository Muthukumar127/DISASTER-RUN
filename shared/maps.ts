export interface Bld { x: number; z: number; w: number; d: number; door: 0 | 1 | 2 | 3 } // door side: 0 +z, 1 -z, 2 +x, 3 -x
export type DKind = 'zone' | 'row' | 'strike' | 'global' | 'quake';
export interface Disaster { name: string; emoji: string; kind: DKind; color: number; sky: number; dmg: number; tip: string }
export const THEMES = [
  { id: 'desert', name: 'Dusty Town', ground: 0xe0b765, road: 0xb89050, sky: 0x8fd3ff, fog: 0xf0d9a0, wall: 0xd8b08a, roof: 0xb0522d, mt: 0xc98a52 },
  { id: 'volcano', name: 'Lava Village', ground: 0x4a3b36, road: 0x2e2522, sky: 0x6a4a44, fog: 0x7a554a, wall: 0x8a8f99, roof: 0x5a2d2d, mt: 0xb03a1a },
  { id: 'snow', name: 'Frozen Harbor', ground: 0xe8f2ff, road: 0xbcd0e6, sky: 0xb9d8f2, fog: 0xdbe9f6, wall: 0x9fc3e8, roof: 0x3f6fa8, mt: 0xdfe9f5 }] as const;
/** Every natural disaster in the game. kind decides the mechanic (see server GameSession). Indoors is safe from all except earthquakes. */
export const DISASTERS: Record<string, Disaster> = {
  wildfire: { name: 'Wildfire', emoji: '🔥', kind: 'zone', color: 0xff5a00, sky: 0xc86a30, dmg: 18, tip: 'Fire spreads outside – hide in a building!' },
  lava: { name: 'Volcanic Lava', emoji: '🌋', kind: 'zone', color: 0xff3300, sky: 0x8a3a20, dmg: 30, tip: 'Lava floods open ground – get inside!' },
  tornado: { name: 'Tornado', emoji: '🌪', kind: 'zone', color: 0x8a8078, sky: 0x8a7a6a, dmg: 32, tip: 'It chases you – shelter in a building!' },
  tsunami: { name: 'Tsunami', emoji: '🌊', kind: 'row', color: 0x2f8fff, sky: 0x5a8ab0, dmg: 28, tip: 'A giant wave sweeps the map – get inside!' },
  landslide: { name: 'Landslide', emoji: '⛰', kind: 'row', color: 0x7a5a3a, sky: 0x7a6a5a, dmg: 28, tip: 'Rocks roll down – hide in a building!' },
  lightning: { name: 'Thunderstorm', emoji: '⛈', kind: 'strike', color: 0xfff6a0, sky: 0x46505c, dmg: 55, tip: 'Lightning hits open ground!' },
  meteor: { name: 'Meteor Shower', emoji: '☄', kind: 'strike', color: 0xff7a1a, sky: 0x3a2a4a, dmg: 60, tip: 'Watch the red circles – or go indoors!' },
  hail: { name: 'Hailstorm', emoji: '🧊', kind: 'strike', color: 0xdff3ff, sky: 0x6a7a8a, dmg: 20, tip: 'Ice rocks fall outside – go indoors!' },
  acid: { name: 'Acid Rain', emoji: '☣', kind: 'global', color: 0x9eff4a, sky: 0x7d9a3a, dmg: 7, tip: 'Acid burns outdoors – get under a roof!' },
  sandstorm: { name: 'Sandstorm', emoji: '🏜', kind: 'global', color: 0xd9b36a, sky: 0xb89050, dmg: 5, tip: 'Sand shreds you outdoors – go inside!' },
  blizzard: { name: 'Blizzard', emoji: '❄', kind: 'global', color: 0xffffff, sky: 0xcfdcea, dmg: 6, tip: 'Freezing cold outdoors – find a building!' },
  heatwave: { name: 'Heatwave', emoji: '🥵', kind: 'global', color: 0xffb040, sky: 0xe89a50, dmg: 6, tip: 'Scorching heat – cool off indoors!' },
  hurricane: { name: 'Hurricane', emoji: '🌀', kind: 'global', color: 0xbfd8ff, sky: 0x4a5a6a, dmg: 5, tip: 'Violent wind outdoors – shelter inside!' },
  earthquake: { name: 'Earthquake', emoji: '🫨', kind: 'quake', color: 0x888888, sky: 0x9a8a7a, dmg: 8, tip: 'Buildings collapse – RUN OUTSIDE!' } };
export const POOL: Record<string, string[]> = {
  desert: ['sandstorm', 'wildfire', 'tornado', 'heatwave', 'meteor', 'earthquake', 'hurricane'],
  volcano: ['lava', 'meteor', 'earthquake', 'acid', 'wildfire', 'landslide', 'lightning'],
  snow: ['blizzard', 'tsunami', 'hail', 'lightning', 'hurricane', 'earthquake', 'landslide'] };
const mk = (s: number) => () => (s = s * 16807 % 2147483647) / 2147483647;
const cache: Record<string, Bld[]> = {};
/** 12 enterable buildings on a 4x4 grid (centre plaza left open); doors face the nearest street. Same data on client and server. */
export function buildingsOf(map: string): Bld[] { if (cache[map]) return cache[map]; const rnd = mk(99 + map.length * 31 + map.charCodeAt(0)), out: Bld[] = [], c = [-30, -10, 10, 30];
  for (const x of c) for (const z of c) { if (Math.abs(x) === 10 && Math.abs(z) === 10) continue; const w = 8 + rnd() * 3 | 0, d = 8 + rnd() * 3 | 0, door = (Math.abs(x) > Math.abs(z) ? (x > 0 ? 3 : 2) : (z > 0 ? 1 : 0)) as 0 | 1 | 2 | 3; out.push({ x: x + (rnd() * 4 - 2), z: z + (rnd() * 4 - 2), w, d, door }); } return cache[map] = out; }
/** Wall boxes [x1,z1,x2,z2] with a 3.2 wide doorway. */
export function wallsOf(b: Bld): number[][] { const t = .2, x0 = b.x - b.w / 2, x1 = b.x + b.w / 2, z0 = b.z - b.d / 2, z1 = b.z + b.d / 2, g = 1.6, o: number[][] = [];
  const H = (z: number, door: boolean) => door ? (o.push([x0 - t, z - t, b.x - g, z + t], [b.x + g, z - t, x1 + t, z + t])) : o.push([x0 - t, z - t, x1 + t, z + t]);
  const V = (x: number, door: boolean) => door ? (o.push([x - t, z0 - t, x + t, b.z - g], [x - t, b.z + g, x + t, z1 + t])) : o.push([x - t, z0 - t, x + t, z1 + t]);
  H(z1, b.door === 0); H(z0, b.door === 1); V(x1, b.door === 2); V(x0, b.door === 3); return o; }
export const insideB = (b: Bld, x: number, z: number) => Math.abs(x - b.x) < b.w / 2 - .35 && Math.abs(z - b.z) < b.d / 2 - .35;
