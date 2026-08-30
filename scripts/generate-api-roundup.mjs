#!/usr/bin/env node
// Genereert een "beste gratis [categorie] API's"-overzichtsartikel op basis van de
// echte, geëxtraheerde data in scripts/data/apis.json (bron: public-apis/public-apis
// op GitHub). Omdat de feiten (naam, beschrijving, url, auth) al kloppen, hoeft het
// model alleen wervende/uitleggende tekst eromheen te schrijven — niet te verzinnen.
//
// Vereist: GEMINI_API_KEY in de omgeving (zie .env.example).
// Gebruik: npm run generate:apis

import { GoogleGenAI } from '@google/genai';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src/content/articles');
const APIS_PATH = path.join(__dirname, 'data/apis.json');
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

const MIN_ENTRIES_PER_CATEGORY = 5;
const MAX_ENTRIES_IN_ARTICLE = 10;

const SYSTEM_PROMPT = `Je schrijft voor een Nederlandstalige contentsite ("AI Tools Gids") die
freelancers en kleine bedrijven helpt met software en tools. Je krijgt een lijst met
ECHTE, geverifieerde API's (naam, beschrijving, url, auth-vereiste) voor één categorie.

Regels waar je je STRIKT aan houdt:

1. Gebruik ALLEEN de aangeleverde feiten (naam, beschrijving, auth-vereiste, url). Verzin
   GEEN extra functies, prijzen, limieten of statistieken die niet zijn meegegeven.
2. Verzin GEEN persoonlijke ervaringen of testresultaten ("ik heb dit getest").
3. Schrijf per API een korte, informatieve alinea (2-4 zinnen): wat het doet, of er een
   API-key nodig is, en voor welk type project het handig is. Gebruik de exacte naam en
   url zoals aangeleverd, in markdown-linkformaat: [Naam](url).
4. Structuur: pakkende inleiding (2-3 zinnen over waarom deze categorie relevant is voor
   freelancers/developers), dan een H2 sectie per API of een lijst, en een korte
   conclusie/afsluiting.
5. Output is PURE markdown voor de artikel-body (geen frontmatter, geen \`\`\`markdown
   code fences, geen H1 titel — de titel wordt apart toegevoegd).
6. Lengte: 500-900 woorden. Taal: Nederlands.
7. Sluit af met een korte opmerking dat API's kunnen veranderen (endpoints, limieten,
   of ophouden te bestaan) en dat de lezer de officiële documentatie moet checken.`;

async function loadApis() {
  const raw = await readFile(APIS_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function existingSlugs() {
  await mkdir(ARTICLES_DIR, { recursive: true });
  const files = await readdir(ARTICLES_DIR);
  return new Set(files.map((f) => f.replace(/\.md$/, '')));
}

function slugify(category) {
  return `beste-gratis-${category
    .toLowerCase()
    .replace(/&/g, 'en')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')}-apis`;
}

function groupByCategory(entries) {
  const map = new Map();
  for (const entry of entries) {
    if (!map.has(entry.category)) map.set(entry.category, []);
    map.get(entry.category).push(entry);
  }
  return map;
}

function toFrontmatter(title, description) {
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `publishDate: ${new Date().toISOString().slice(0, 10)}`,
    'draft: false',
    '---',
    '',
  ];
  return lines.join('\n');
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY ontbreekt. Zet die in je omgeving of .env (zie .env.example).');
    process.exit(1);
  }

  const apis = await loadApis();
  const byCategory = groupByCategory(apis);
  const done = await existingSlugs();

  const next = [...byCategory.entries()]
    .filter(([, list]) => list.length >= MIN_ENTRIES_PER_CATEGORY)
    .find(([category]) => !done.has(slugify(category)));

  if (!next) {
    console.log('Alle categorieën uit apis.json zijn al verwerkt tot een artikel.');
    return;
  }

  const [category, allEntries] = next;
  const entries = allEntries
    .filter((e) => e.auth === 'No') // gratis, geen API-key nodig = laagste drempel voor lezers
    .slice(0, MAX_ENTRIES_IN_ARTICLE);
  const selected = entries.length >= 4 ? entries : allEntries.slice(0, MAX_ENTRIES_IN_ARTICLE);

  console.log(`Genereer API-overzicht voor categorie: ${category} (${selected.length} API's)`);

  const client = new GoogleGenAI({ apiKey });
  const dataBlock = selected
    .map((e) => `- naam: ${e.name}\n  url: ${e.url}\n  beschrijving: ${e.description}\n  auth: ${e.auth}\n  https: ${e.https}`)
    .join('\n');

  const response = await client.models.generateContent({
    model: MODEL,
    contents: `Categorie: ${category}\n\nAangeleverde API's (gebruik uitsluitend deze data):\n${dataBlock}\n\nGeef ook een titel (max 65 tekens) en een meta-omschrijving (max 155 tekens) apart terug, in dit exacte formaat vooraan je antwoord:\n\nTITLE: <titel>\nDESCRIPTION: <omschrijving>\n---BODY---\n<markdown body>`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      maxOutputTokens: 4000,
    },
  });

  const text = response.text;

  const titleMatch = text.match(/TITLE:\s*(.+)/);
  const descMatch = text.match(/DESCRIPTION:\s*(.+)/);
  const bodyMatch = text.split('---BODY---')[1];

  if (!titleMatch || !descMatch || !bodyMatch) {
    console.error('Onverwacht antwoordformaat van het model:\n', text);
    process.exit(1);
  }

  const title = titleMatch[1].trim();
  const description = descMatch[1].trim();
  const body = bodyMatch.trim();

  const slug = slugify(category);
  const frontmatter = toFrontmatter(title, description);
  const outPath = path.join(ARTICLES_DIR, `${slug}.md`);
  await writeFile(outPath, frontmatter + body + '\n', 'utf-8');

  console.log(`Geschreven: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
