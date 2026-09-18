import Dexie, { type EntityTable } from 'dexie';
import { z } from 'zod';
import { parseWorld, StoredWorldSchema, type Slot, type World } from '../game/model';

export interface SaveRecord { slot: Slot; world: World; savedAt: string; lastBackupAt: string | null }
export interface Mirror { worldId: string; playerId: string; key: string; world: World; savedAt: string }
interface Recovery { slot: Slot; world: World; savedAt: string }
export class GameDatabase extends Dexie {
  saves!: EntityTable<SaveRecord, 'slot'>;
  mirrors!: EntityTable<Mirror, 'worldId'>;
  recovery!: EntityTable<Recovery, 'slot'>;
  settings!: EntityTable<{ key: string; value: unknown }, 'key'>;
  constructor(name = 'twilight-v1') {
    super(name);
    this.version(1).stores({ saves: 'slot', mirrors: 'worldId', recovery: 'slot', settings: 'key' });
  }
  async save(slot: Slot, raw: World, options: { replace?: boolean; create?: boolean } = {}) {
    const world = parseWorld(raw);
    await this.transaction('rw', this.saves, this.recovery, async () => {
      const previous = await this.saves.get(slot);
      if (options.create && previous) throw Error('This world slot is already occupied.');
      if (previous && !options.replace && (previous.world.worldId !== world.worldId || previous.world.epoch !== world.epoch || world.revision !== previous.world.revision + 1)) {
        throw Error('Save conflict. Another copy has changed this world. Reload before continuing.');
      }
      if (previous && (!await this.recovery.get(slot) || options.replace || world.revision % 100 === 0)) {
        await this.recovery.put({ slot, world: previous.world, savedAt: previous.savedAt });
      }
      await this.saves.put({ slot, world, savedAt: new Date().toISOString(), lastBackupAt: previous?.lastBackupAt ?? null });
    });
  }
  async load(slot: Slot) {
    const record = await this.saves.get(slot);
    return record ? { ...record, world: parseWorld(record.world) } : undefined;
  }
  async mirror(record: Mirror) {
    parseWorld(record.world);
    if (record.world.guestId !== record.playerId || record.world.guestKey !== record.key || record.worldId !== record.world.worldId) throw Error('Recovery identity mismatch');
    await this.transaction('rw', this.mirrors, async () => {
      const previous = await this.mirrors.get(record.worldId);
      if (previous && (previous.world.epoch !== record.world.epoch || previous.world.revision > record.world.revision)) throw Error('A newer recovery copy already exists.');
      await this.mirrors.put(record);
    });
  }
  async backup(slots: Slot[]) {
    const records = (await Promise.all(slots.map(slot => this.load(slot)))).filter((r): r is SaveRecord => !!r);
    const exportedAt = new Date().toISOString();
    return JSON.stringify({ format: 'twilight-world-backup', version: 1, exportedAt, worlds: records.map(r => ({ slot: r.slot, world: r.world })) }, null, 2);
  }
  async markBackup(slots: Slot[]) {
    await this.transaction('rw', this.saves, async () => {
      for (const slot of slots) await this.saves.update(slot, { lastBackupAt: new Date().toISOString() });
    });
  }
  async restore(text: string, replace: boolean) {
    const backup = parseBackup(text);
    await this.transaction('rw', this.saves, this.recovery, async () => {
      for (const entry of backup.worlds) {
        if (await this.saves.get(entry.slot) && !replace) throw Error('An imported slot is occupied. Confirm replacement first.');
        await this.save(entry.slot, entry.world, { replace: true });
      }
    });
  }
}
const BackupSchema = z.object({ format: z.literal('twilight-world-backup'), version: z.literal(1), exportedAt: z.string().datetime(),
  worlds: z.array(z.object({ slot: z.union([z.literal(1), z.literal(2)]), world: StoredWorldSchema }).strict()).min(1).max(2),
}).strict().refine(value => new Set(value.worlds.map(w => w.slot)).size === value.worlds.length, 'Duplicate world slots');
export function parseBackup(text: string) {
  if (text.length > 4_000_000) throw Error('This backup is too large.');
  return BackupSchema.parse(JSON.parse(text));
}
export const db = new GameDatabase();
