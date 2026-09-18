import type { Scope } from '../game/model';
export const arrival = [
  { id: 'letter', label: 'Read the sealed letter', x: 330, y: 275, scope: 'personal' as Scope,
    title: 'A letter that waited', text: 'The paper smells faintly of orange peel. "If the house lets you in, leave a light burning. Some memories need a way home." Beneath the signature, someone has pressed a ring of six tiny spoons into the wax.' },
  { id: 'hearth', label: 'Light the household hearth', x: 552, y: 265, scope: 'shared_world' as Scope,
    title: 'The house exhales', text: 'Amber light runs through the cold ironwork. Somewhere upstairs, a door stops rattling. Whoever else comes to live here will find this warmth waiting.' },
  { id: 'pantry', label: 'Open your welcome parcel', x: 785, y: 300, scope: 'personal' as Scope,
    title: 'A practical welcome', text: 'Three cacao beans, wrapped in a flour sack. The note reads: "The forge opens in the morning. Bring the broken latch, not the whole door. — Rook"' },
  { id: 'bed', label: 'Inspect the bed', x: 210, y: 345, scope: 'personal' as Scope,
    title: 'A room kept ready', text: 'The quilt is dry and smells of cedar. Someone has turned down one corner, although the rest of the room has been empty for years. Beside the pillow, six stitches have been picked out in silver thread.' },
  { id: 'desk', label: 'Examine the writing desk', x: 382, y: 289, scope: 'personal' as Scope,
    title: 'Recipes in the grain', text: 'Knife marks run across the old writing desk. The deepest cut is filled with a trace of dark cacao. On the underside of the drawer, someone has written: "Warm the bowl before you ask it to remember."' },
  { id: 'bookshelf', label: 'Read the household ledger', x: 132, y: 232, scope: 'personal' as Scope,
    title: 'The books remember supper', text: 'A household ledger lists candles, orange peel, and more spoons than one person could need. The last entry is unfinished: "Set another place if the west window opens."' },
  { id: 'chest', label: 'Open the household chest', x: 804, y: 415, scope: 'personal' as Scope,
    title: 'Room for both of you', text: 'Two small keys hang from the same ribbon. This chest belongs to the household. Anything left here is available to the other resident, even after you leave.' },
  { id: 'plant', label: 'Examine the moonfern', x: 842, y: 347, scope: 'personal' as Scope,
    title: 'A patient green thing', text: 'The fern turns its pale leaves toward the window. A faded label asks for cool water and no direct sun. Whoever cared for it expected to come back.' },
  { id: 'side-table', label: 'Read the little inscription', x: 272, y: 446, scope: 'personal' as Scope,
    title: 'A light left for someone', text: 'The brass candle dish rests on a ring burned into the wood. Under it is a small inscription: "Leave enough light for the last one home."' },
  { id: 'window-west', label: 'Look through the west window', x: 270, y: 218, scope: 'personal' as Scope,
    title: 'The way into Gloambridge', text: 'Below the hill, a handful of town windows are still lit. The forge chimney carries a thread of smoke. There will be people to meet when the road opens.' },
  { id: 'window-east', label: 'Look through the east window', x: 680, y: 218, scope: 'personal' as Scope,
    title: 'Beyond the lamplight', text: 'A blue glimmer passes between the distant trees. It pauses when you do. Then the branches close around it, leaving only the ordinary moon.' },
  { id: 'candle-desk', label: 'Tend the desk candle', x: 382, y: 289, scope: 'shared_world' as Scope,
    title: 'The desk candle', text: 'A small flame changes the shape of the room. Its light belongs to everyone in the house.' },
  { id: 'candle-table', label: 'Tend the bedside candle', x: 272, y: 446, scope: 'shared_world' as Scope,
    title: 'The bedside candle', text: 'The brass dish is warm beneath your fingers. You tend the wick and watch the shadows settle.' },
] as const;
export type ArrivalId = typeof arrival[number]['id'];
export function validateContent() {
  const ids = arrival.map(entry => entry.id);
  if (new Set(ids).size !== ids.length) throw Error('Duplicate arrival content ID');
}
