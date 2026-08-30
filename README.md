# AI Tools Gids

Een grotendeels geautomatiseerde contentsite over AI-tools voor freelancers en kleine
bedrijven. Content wordt gegenereerd via de gratis Gemini API, gepubliceerd als
statische Astro-site, en verdient (potentieel) via affiliate links.

**Belangrijk:** dit systeem automatiseert het schrijven en publiceren van content. Het
garandeert geen inkomsten — dat hangt af van verkeer, welke affiliate-programma's je
aansluit, en of mensen daadwerkelijk doorklikken en kopen. Reken op maanden voordat er
meetbaar resultaat is.

## Hoe het werkt

Er zijn twee onafhankelijke contentstromen, die allebei in `src/content/articles/`
belanden en dus samen op de homepage verschijnen:

**1. Tool-vergelijkingen** (affiliate-gericht)
- `scripts/topics.json` bevat een wachtrij van artikel-onderwerpen (AI-tools + invalshoek).
- `scripts/generate-article.mjs` pakt het eerstvolgende onderwerp en laat Gemini een
  feitelijk, niet-verzonnen artikel schrijven.
- Draait wekelijks via `.github/workflows/generate-content.yml`.

**2. API-overzichten** (SEO/verkeer-gericht)
- `scripts/data/apis.json` bevat 1700+ echte, publieke API's (geëxtraheerd uit de
  [public-apis/public-apis](https://github.com/public-apis/public-apis) GitHub-repo),
  gegroepeerd per categorie (Weather, Finance, Games, etc.).
- `scripts/generate-api-roundup.mjs` pakt de eerstvolgende categorie die nog geen
  artikel heeft, en laat Gemini een "beste gratis [categorie] API's"-overzicht
  schrijven — **op basis van de echte, aangeleverde data**, dus het model verzint geen
  namen, urls of features, alleen de begeleidende tekst.
- Draait elke twee weken via `.github/workflows/generate-api-roundup.yml`.
- Dit soort listicles scoort van nature goed in zoekmachines ("beste gratis weather
  api" etc.) en trekt developers/freelancers aan — precies de doelgroep van de site.
  Deze artikelen hebben zelf geen affiliate-link, maar bouwen verkeer en autoriteit op
  die de tool-vergelijkingsartikelen (en straks advertenties) ten goede komt.

Astro bouwt van alle artikelen samen een statische site (`npm run build`), en je
hosting (Vercel/Netlify) deployt automatisch bij elke push naar `main`.

Jij hoeft normaal gesproken alleen: af en toe nieuwe onderwerpen toevoegen aan
`topics.json`, en artikelen af en toe controleren op feitelijke juistheid (vooral
prijzen, die snel verouderen — de API-data zelf verandert veel minder snel).

## Wat JIJ zelf moet doen (eenmalig, ~1-2 uur)

Dit zijn stappen die ik niet voor je kan zetten omdat ze jouw identiteit, e-mailadres
of betaalgegevens vereisen.

### 1. Gemini API key (voor de contentgenerator, gratis tier)
- Ga naar https://aistudio.google.com/apikey, log in met je Google-account, genereer
  een API key.
- Zet 'm lokaal in een `.env` bestand (zie `.env.example`) om lokaal te testen:
  ```
  cp .env.example .env
  # vul GEMINI_API_KEY in
  npm install
  npm run generate
  ```
- Kosten: gratis tier (`gemini-3.6-flash`), ruim voldoende voor dit gebruik. Let op de
  rate limits van de gratis tier als je snel achter elkaar test.
- Google deprecate modelversies regelmatig. Als een generate-commando faalt met een
  "model not found"-fout, zet dan tijdelijk `GEMINI_MODEL=<nieuwe-modelnaam>` in `.env`
  (zie de foutmelding zelf voor het aanbevolen alternatief) totdat de code is bijgewerkt.

### 2. Code naar GitHub ✅ (al gedaan)
- Repo staat op GitHub en is gekoppeld aan Vercel.
- Voeg je Gemini API key toe als GitHub Actions secret: repo → Settings →
  Secrets and variables → Actions → New repository secret → naam
  `GEMINI_API_KEY`.
- Zonder deze stap draaien de automatische workflows niet.

### 3. Hosting ✅ (al gedaan)
- Vercel is gekoppeld aan de repo. Elke push naar `main` deployt automatisch.
- Update `site` in `astro.config.mjs` naar je echte domein zodra je die hebt.

### 4. Domeinnaam (optioneel, ~€10/jaar)
- Een eigen domein oogt betrouwbaarder dan een `vercel.app`-subdomein, wat helpt voor
  SEO en voor goedkeuring bij affiliate-programma's. Kan later.

### 5. Affiliate-programma's (de inkomstenbron)
Voor elk tool in `scripts/topics.json` meld je je aan bij het bijbehorende
affiliate-programma (zie `affiliateProgram` veld). Meestal via:
- Het programma direct bij de tool zelf (zoek "[tool] affiliate program")
- Een affiliate-netwerk zoals Impact, PartnerStack of ShareASale

Zodra je bent goedgekeurd, krijg je een unieke affiliate-link. Vul die in bij het
betreffende artikel in `src/content/articles/<slug>.md` als `affiliateUrl:`, of in
`scripts/topics.json` zodat nieuwe generaties hem meteen gebruiken.

**Let op:** de meeste affiliate-programma's willen een live site met echte content
zien voordat ze je goedkeuren. Publiceer dus eerst een paar artikelen (stap 2-3),
meld je daarna pas aan.

### 6. Advertenties (optioneel, later)
Zodra je meetbaar verkeer hebt (Google Search Console instellen om dit te volgen),
kun je Google AdSense aanvragen als extra inkomstenbron naast affiliate links.

### 7. Wettelijke verplichting: disclosure
De site heeft al een `/disclosure` pagina en een disclaimer bij elke affiliate-link.
Dit is wettelijk verplicht (ACM-richtlijnen in Nederland, FTC in de VS) — verwijder
dit niet.

## Content uitbreiden

Voeg nieuwe onderwerpen toe aan `scripts/topics.json` in dit formaat:

```json
{
  "slug": "unieke-url-slug",
  "tool": "Toolnaam",
  "angle": "Waar het artikel over moet gaan",
  "affiliateProgram": "Naam van het affiliate-programma",
  "affiliateUrl": ""
}
```

Het script schrijft automatisch het eerstvolgende onderwerp dat nog geen bestaand
artikel heeft in `src/content/articles/`.

## Commando's

| Command | Actie |
| :--- | :--- |
| `npm install` | Installeer dependencies |
| `npm run generate` | Genereer het volgende tool-vergelijkingsartikel |
| `npm run generate:apis` | Genereer het volgende API-overzichtsartikel |
| `npm run dev` | Lokale dev server op `localhost:4321` |
| `npm run build` | Bouw de statische site naar `./dist/` |
| `npm run preview` | Preview de build lokaal |
