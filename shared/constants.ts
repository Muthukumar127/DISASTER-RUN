export const MAX_PLAYERS = 4, TICK_HZ = 20, MAP_HALF = 40, WALK = 5.5, RUN = 9;
export const CHARACTERS = [
  { id: 0, name: 'MAX', color: 0xffd23f, role: 'Brave leader' }, { id: 1, name: 'NEO', color: 0x2f7df6, role: 'Intelligent engineer' },
  { id: 2, name: 'COCO', color: 0x3ec56b, role: 'Funny explorer' }, { id: 3, name: 'REX', color: 0xe84a3a, role: 'Energetic adventurer' }] as const;
export const MAPS = [{ id: 'desert', name: 'Desert Apocalypse', playable: true }, { id: 'island', name: 'Tsunami Island', playable: false }, { id: 'volcano', name: 'Volcano Panic', playable: false },
  { id: 'flood', name: 'Flood City', playable: false }, { id: 'snow', name: 'Frozen World', playable: false }, { id: 'coast', name: 'Hurricane Zero', playable: false }] as const;
