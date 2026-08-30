#!/usr/bin/env node
// Genereert een nieuw artikel op basis van de eerstvolgende niet-geschreven topic in
// scripts/topics.json en slaat het op als markdown in src/content/articles/.
//
// Vereist: ANTHROPIC_API_KEY in de omgeving (zie .env.example).
// Gebruik: npm run generate

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const ARTICLES_DIR = path.join(ROOT, 'src/content/articles');
const TOPICS_PATH = path.join(__dirname, 'topics.json');
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const SYSTEM_PROMPT = `Je schrijft voor een Nederlandstalige contentsite ("AI Tools Gids") die AI-software
bespreekt voor freelancers en kleine bedrijven. Regels waar je je STRIKT aan houdt:

1. Verzin GEEN persoonlijke ervaringen, testresultaten, klantcases of testimonials
   ("ik heb dit 3 maanden getest", "onze klant X behaalde Y%"). Schrijf objectief en
   informatief, gebaseerd op algemeen bekende, publieke kenmerken van de tool
   (functies, doelgroep, type prijsmodel).
2. Verzin GEEN exacte prijzen, cijfers of statistieken die je niet zeker weet. Gebruik
   in plaats daarvan algemene aanduidingen ("een instapabonnement", "een proefperiode")
   en zet er een duidelijke opmerking bij dat de lezer actuele prijzen op de officiële
   site moet checken.
3. Wees eerlijk over beperkingen en voor wie de tool NIET geschikt is. Geen
   overdreven marketingtaal ("baanbrekend", "game changer" vermijden).
4. Structuur: pakkende inleiding (2-3 zinnen), H2 secties (Wat is het, Belangrijkste
   functies, Voor wie is het geschikt, Beperkingen, Conclusie), gebruik bullet points
   waar nuttig.
5. Output is PURE markdown voor de artikel-body (geen frontmatter, geen \`\`\`markdown
   code fences, geen H1 titel — de titel wordt apart toegevoegd).
6. Lengte: 500-800 woorden. Taal: Nederlands.`;

async function loadTopics() {
  const raw = await readFile(TOPICS_PATH, 'utf-8');
  return JSON.parse(raw);
}

async function existingSlugs() {
  await mkdir(ARTICLES_DIR, { recursive: true });
  const files = await readdir(ARTICLES_DIR);
  return new Set(files.map((f) => f.replace(/\.md$/, '')));
}

function toFrontmatter(topic, title, description) {
  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    `publishDate: ${new Date().toISOString().slice(0, 10)}`,
    `tool: ${JSON.stringify(topic.tool)}`,
    `affiliateProgram: ${JSON.stringify(topic.affiliateProgram || '')}`,
  ];
  if (topic.affiliateUrl) {
    lines.push(`affiliateUrl: ${JSON.stringify(topic.affiliateUrl)}`);
  }
  lines.push('draft: false', '---', '');
  return lines.join('\n');
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY ontbreekt. Zet die in je omgeving of .env (zie .env.example).');
    process.exit(1);
  }

  const topics = await loadTopics();
  const done = await existingSlugs();
  const next = topics.find((t) => !done.has(t.slug));

  if (!next) {
    console.log('Alle topics in topics.json zijn al gepubliceerd. Voeg nieuwe topics toe aan scripts/topics.json.');
    return;
  }

  console.log(`Genereer artikel voor: ${next.tool} (${next.slug})`);

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Schrijf een artikel over "${next.tool}". Invalshoek: ${next.angle}\n\nGeef ook een titel (max 65 tekens) en een meta-omschrijving (max 155 tekens) apart terug, in dit exacte formaat vooraan je antwoord:\n\nTITLE: <titel>\nDESCRIPTION: <omschrijving>\n---BODY---\n<markdown body>`,
      },
    ],
  });

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');

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

  const frontmatter = toFrontmatter(next, title, description);
  const outPath = path.join(ARTICLES_DIR, `${next.slug}.md`);
  await writeFile(outPath, frontmatter + body + '\n', 'utf-8');

  console.log(`Geschreven: ${outPath}`);
  console.log('Let op: controleer het artikel op feitelijke juistheid (met name prijzen) voordat je live gaat.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
