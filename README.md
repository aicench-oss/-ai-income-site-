# AI Tools Gids

Een grotendeels geautomatiseerde contentsite over AI-tools voor freelancers en kleine
bedrijven. Content wordt gegenereerd via de Claude API, gepubliceerd als statische
Astro-site, en verdient (potentieel) via affiliate links.

**Belangrijk:** dit systeem automatiseert het schrijven en publiceren van content. Het
garandeert geen inkomsten — dat hangt af van verkeer, welke affiliate-programma's je
aansluit, en of mensen daadwerkelijk doorklikken en kopen. Reken op maanden voordat er
meetbaar resultaat is.

## Hoe het werkt

1. `scripts/topics.json` bevat een wachtrij van artikel-onderwerpen (AI-tools + invalshoek).
2. `scripts/generate-article.mjs` pakt het eerstvolgende onderwerp, laat Claude een
   feitelijk, niet-verzonnen artikel schrijven, en slaat het op in
   `src/content/articles/`.
3. Astro bouwt hier een statische site van (`npm run build`).
4. GitHub Actions (`.github/workflows/generate-content.yml`) draait dit script
   wekelijks automatisch, commit het nieuwe artikel, en pusht — waarna je hosting
   (Vercel/Netlify) automatisch een nieuwe versie deployt.

Jij hoeft normaal gesproken alleen: nieuwe onderwerpen toe te voegen aan
`topics.json`, en artikelen af en toe te controleren op feitelijke juistheid
(vooral prijzen, die snel verouderen).

## Wat JIJ zelf moet doen (eenmalig, ~1-2 uur)

Dit zijn stappen die ik niet voor je kan zetten omdat ze jouw identiteit, e-mailadres
of betaalgegevens vereisen.

### 1. Anthropic API key (voor de contentgenerator)
- Ga naar https://console.anthropic.com, maak een account, genereer een API key.
- Zet 'm lokaal in een `.env` bestand (zie `.env.example`) om lokaal te testen:
  ```
  cp .env.example .env
  # vul ANTHROPIC_API_KEY in
  npm install
  npm run generate
  ```
- Kosten: een paar cent per artikel, ruim binnen budget.

### 2. Code naar GitHub
- Maak een gratis GitHub-account/repo aan.
- `git init && git add . && git commit -m "init"` en push naar je nieuwe repo.
- Voeg je Anthropic API key toe als GitHub Actions secret: repo → Settings →
  Secrets and variables → Actions → New repository secret → naam
  `ANTHROPIC_API_KEY`.
- Zonder deze stap draait de wekelijkse automatische generatie niet.

### 3. Hosting (gratis)
- Maak een account op https://vercel.com (of Netlify) en koppel je GitHub-repo.
- Vercel detecteert Astro automatisch. Elke push naar `main` deployt vanzelf.
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
| `npm run generate` | Genereer het volgende artikel via de Claude API |
| `npm run dev` | Lokale dev server op `localhost:4321` |
| `npm run build` | Bouw de statische site naar `./dist/` |
| `npm run preview` | Preview de build lokaal |
