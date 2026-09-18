import type { Scope } from '../game/model';
export const arrival = [
  { id: 'letter', label: 'Read the sealed letter', x: 330, y: 275, scope: 'personal' as Scope,
    title: 'A letter that waited', text: 'The paper smells faintly of orange peel. "If the house lets you in, leave a light burning. Some memories need a way home." Beneath the signature, someone has pressed a ring of six tiny spoons into the wax.' },
  { id: 'hearth', label: 'Light the household hearth', x: 552, y: 265, scope: 'shared_world' as Scope,
    title: 'The house exhales', text: 'Amber light runs through the cold ironwork. Somewhere upstairs, a door stops rattling. Whoever else comes to live here will find this warmth waiting.' },
  { id: 'pantry', label: 'Open your welcome parcel', x: 785, y: 300, scope: 'personal' as Scope,
    title: 'A practical welcome', text: 'Three cacao beans, wrapped in a flour sack. The note reads: "The forge opens in the morning. Bring the broken latch, not the whole door. — Rook"' },
] as const;
export type ArrivalId = typeof arrival[number]['id'];
export function validateContent() {
  const ids = arrival.map(entry => entry.id);
  if (new Set(ids).size !== ids.length) throw Error('Duplicate arrival content ID');
}
