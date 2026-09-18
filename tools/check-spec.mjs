import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const index = JSON.parse(readFileSync('docs/REQUIREMENTS_INDEX.json', 'utf8'));
const bytes = readFileSync(index.masterPath);
const hash = input => createHash('sha256').update(input).digest('hex');
if (hash(bytes) !== index.masterSha256) throw Error('The preserved master changed');
const pieces = bytes.toString('utf8').replace(/\r\n/g, '\n').split(/(?=^## )/m);
if (pieces[0] !== index.preamble || pieces.length - 1 !== index.sections.length) throw Error('Coverage count differs');
for (const piece of pieces.slice(1)) {
  const id = piece.match(/^## (Project title|\d+[A-Z]?)/)[1];
  const entry = index.sections.find(e => e.section === id);
  if (!entry || hash(piece) !== entry.sha256 || !readFileSync(entry.document, 'utf8').includes(piece)) throw Error(`Requirement section ${id} missing or edited`);
}
console.log(`Master hash and all ${index.sections.length} source sections verified.`);
