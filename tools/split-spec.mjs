import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const masterPath = 'docs/master/Haunted_Chocolatier_Twilight_AGENTS.md';
const bytes = readFileSync(masterPath);
const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== 'bba12cd0da0a2f79143924186f2d9dc95839b7f722e3475098ad6a769c5edf44') throw Error('Master source changed');
const source = bytes.toString('utf8').replace(/\r\n/g, '\n');
const sections = source.split(/(?=^## )/m);
const groups = {
  'GAME_DESIGN.md': ['Project title', '0', '2', '4', '12', '45', '49', '50'],
  'PROJECT_RULES.md': ['1', '47', '48'],
  'REFERENCE_AND_ART.md': ['3', '8', '9'],
  'MULTIPLAYER.md': ['4A'],
  'TECHNICAL_ARCHITECTURE.md': ['5', '6', '7', '41'],
  'OFFLINE_AND_PWA.md': ['10', '43'],
  'SAVE_FORMAT.md': ['11'],
  'WORLD_BIBLE.md': ['13', '28', '30', '34', '36', '38', '39'],
  'SYSTEMS.md': ['14', '15', '16', '17', '18', '19', '20', '21', '22', '27', '29', '35', '37', '40'],
  'NPCS_AND_RELATIONSHIPS.md': ['23', '24', '25', '33'],
  'STORY_BIBLE.md': ['26', '32'],
  'CONTENT_TARGETS.md': ['31'],
  'TEST_PLAN.md': ['42', '46'],
  'PHASES.md': ['44'],
};
const byId = new Map(sections.filter(s => s.startsWith('## ')).map(s => [s.match(/^## (Project title|\d+[A-Z]?)/)[1], s]));
const seen = new Set();
const manifest = [];
mkdirSync('docs', { recursive: true });
for (const [file, ids] of Object.entries(groups)) {
  const header = `# ${file.replace('.md', '').toLowerCase().replaceAll('_', ' ')}\n\nSource requirements below are preserved verbatim from the master specification. They describe the target game, not a claim of implemented functionality. See ROADMAP.md and IMPLEMENTATION_STATUS.md for current evidence. User instructions take precedence over the master.\n\n`;
  const contents = ids.map(id => {
    if (!byId.has(id) || seen.has(id)) throw Error(`Missing or duplicate section ${id}`);
    seen.add(id);
    manifest.push({ section: id, document: `docs/${file}`, sha256: createHash('sha256').update(byId.get(id)).digest('hex') });
    return byId.get(id);
  }).join('');
  writeFileSync(`docs/${file}`, header + contents);
}
if (seen.size !== byId.size) throw Error('Unmapped master sections');
writeFileSync('docs/REQUIREMENTS_INDEX.json', JSON.stringify({ masterPath, masterSha256: hash, preamble: sections[0], sections: manifest }, null, 2) + '\n');
console.log(`Preserved ${seen.size} sections across ${Object.keys(groups).length} documents.`);
