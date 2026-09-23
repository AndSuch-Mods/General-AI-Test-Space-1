import type { World } from '../game/model';
import { clampPlacement, getRoomObjects, objectOffset, roomLayout, ROTATABLE_FURNITURE, type FurnitureId, type Placement, type RoomLayout, type RoomMap, type Turn } from '../content/room';
import { layoutError, layoutKey } from '../content/furnishing';

/** A private draft. Only Save sends it to the world authority. */
export class LayoutDesigner {
  readonly expected: RoomLayout;
  layout: RoomLayout;
  selected?: FurnitureId;
  private gesture?: { id: FurnitureId; before: RoomLayout; offset: Placement };
  private validationKey = '';
  private validationInvalid = false;

  constructor(readonly map: RoomMap, private world: () => World, private changed: () => void) {
    this.expected = structuredClone(roomLayout(world(), map));
    this.layout = structuredClone(this.expected);
  }

  get invalid() {
    const world = this.world(), key = `${world.revision}:${layoutKey(this.layout)}`;
    if (key !== this.validationKey) {
      this.validationKey = key;
      this.validationInvalid = layoutError(world, this.map, this.layout) !== null;
    }
    return this.validationInvalid;
  }
  get dirty() { return layoutKey(this.layout) !== layoutKey(this.expected); }
  get state() { return { layout: this.layout, selected: this.selected, invalid: this.invalid }; }

  select(id: FurnitureId) {
    this.cancelDrag();
    const object = getRoomObjects(this.map, this.layout).find(piece => piece.id === id);
    if (!object || Object.values(this.world().players).some(player => player.map === this.map &&
      (player.interaction === id || player.seated?.id === id || id === 'bed' && player.fatigue.sleeping))) return;
    this.selected = id;
    this.gesture = { id, before: structuredClone(this.layout), offset: { ...objectOffset(id, this.layout), rotation: object.rotation ?? 0 } };
    this.changed();
  }

  drag(id: FurnitureId, dx: number, dy: number) {
    if (this.gesture?.id !== id || !Number.isFinite(dx) || !Number.isFinite(dy)) return;
    const start = this.gesture.offset;
    this.layout = { ...this.gesture.before, [id]: clampPlacement(this.map, id, { ...start, x: start.x + dx, y: start.y + dy }, this.gesture.before) };
    this.changed();
  }

  drop(id: FurnitureId) {
    if (this.gesture?.id !== id) return;
    if (this.invalid) this.layout = this.gesture.before;
    this.gesture = undefined;
    this.changed();
  }

  rotate(id: FurnitureId) {
    if (this.gesture?.id !== id) return;
    if (!(ROTATABLE_FURNITURE as readonly FurnitureId[]).includes(id)) { this.gesture = undefined; this.changed(); return; }
    const next = { ...this.gesture.before, [id]: { ...this.gesture.offset, rotation: ((this.gesture.offset.rotation ?? 0) + 1) % 4 as Turn } };
    if (layoutError(this.world(), this.map, next) === null) this.layout = next;
    this.gesture = undefined;
    this.changed();
  }

  cancelDrag() {
    if (!this.gesture) return;
    this.layout = this.gesture.before;
    this.gesture = undefined;
    this.changed();
  }
}
