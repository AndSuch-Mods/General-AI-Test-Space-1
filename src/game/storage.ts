import type { Player, World } from './model';
export const STORAGE_IDS = ['chest', 'pantry', 'desk', 'side-table', 'bookshelf', 'worktop'] as const;
export type StorageId = typeof STORAGE_IDS[number];
export const STORED_ITEMS = ['cacao-bean', 'welcome-letter'] as const;
export function storageKey(map: Player['map'], id: StorageId, drawer: Player['drawer'] = 'left') {
  return `${map}:${id}${id === 'desk' ? ':' + drawer : ''}`;
}
export function storedItems(world: World, map: Player['map'], id: StorageId, drawer: Player['drawer'] = 'left'): Record<string, number> {
  return map === 'castle' && id === 'chest' ? world.chest : world.containers[storageKey(map, id, drawer)] ?? {};
}
export function writableStorage(world: World, map: Player['map'], id: StorageId, drawer: Player['drawer'] = 'left') {
  if (map === 'castle' && id === 'chest') return world.chest;
  return world.containers[storageKey(map, id, drawer)] ??= {};
}
export function storageCapacity(id: StorageId) { return id === 'side-table' ? 2 : id === 'desk' ? 8 : 24; }
