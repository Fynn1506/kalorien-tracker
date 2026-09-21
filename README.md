# Kalorien Tracker (PWA)

Eine Progressive Web App zum Tracken von Ernährung und Kalorien, optimiert für die
Nutzung auf dem iPhone (Home-Bildschirm-Icon, Safe-Area-Insets, Offline-Unterstützung
für bereits geladene Daten).

## Tech-Stack

- **Frontend**: React + Vite + TypeScript, Tailwind CSS, React Router, Recharts (Statistik),
  ZXing (Barcode-Scanner), `vite-plugin-pwa` (Manifest + Service Worker)
- **Backend**: Node.js + Express + TypeScript, Prisma ORM, PostgreSQL
- **Datenquellen**: Open Food Facts (primär, kein API-Key nötig), optional USDA FoodData
  Central und FatSecret Platform als Fallback (Adapter-Pattern, siehe unten)

## Projektstruktur

```
backend/
  prisma/schema.prisma      Datenmodell (Profile, Food, DiaryEntry, Favorite)
  src/adapters/             Ein Adapter pro Food-API (gemeinsames FoodSource-Interface)
  src/services/             Kalorien-/TDEE-Berechnung, Food-Suche mit Cache + Fallback
  src/routes/                REST-Endpunkte (/api/profile, /api/foods, /api/diary, /api/stats)
frontend/
  src/pages/                 Dashboard, Tagebuch, Hinzufügen, Statistik, Profil, Onboarding
  src/components/            Wiederverwendbare UI-Bausteine (ProgressRing, Sheet, ...)
  src/api/client.ts          Typisierter Fetch-Client zum Backend (ruft nur /api/* auf)
  public/icons/              PWA-Icons in allen benötigten Größen (inkl. iOS)
```

Die API-Keys für Fallback-Quellen liegen ausschließlich im Backend (`.env`) und werden
niemals an das Frontend ausgeliefert – das Frontend spricht nur mit dem eigenen Backend
unter `/api/...`.

## Setup

Voraussetzung: Node.js 20+ (getestet mit Node 24 LTS) und eine erreichbare PostgreSQL-
Datenbank (lokal installiert, oder z. B. die im Deployment-Abschnitt erzeugte kostenlose
Render-Postgres-Instanz auch für die lokale Entwicklung mitbenutzen).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # DATABASE_URL eintragen, bei Bedarf USDA_FDC_API_KEY / FATSECRET_*
npx prisma db push     # erstellt das Schema in der Datenbank aus DATABASE_URL
npm run dev            # läuft auf http://localhost:3001
```

### 2. Frontend

In einem zweiten Terminal:

```bash
cd frontend
npm install
npm run dev             # läuft auf http://localhost:5173, proxyt /api zu Port 3001
```

Danach im Browser `http://localhost:5173` öffnen. Beim ersten Start führt die App
durch ein kurzes Onboarding (Alter, Gewicht, Größe, Aktivität, Ziel) und berechnet
daraus dein Tageskalorienziel (Mifflin-St-Jeor-Formel).

### 3. Production-Build

```bash
cd frontend && npm run build   # erzeugt frontend/dist inkl. Service Worker & Manifest
cd backend && npm run build && npm start
```

Für einen echten Produktivbetrieb müsste der Build aus `frontend/dist` über HTTPS
ausgeliefert werden (PWA-Installation und Kamera-Zugriff für den Barcode-Scanner
setzen einen sicheren Kontext voraus – `localhost` ist davon ausgenommen und
funktioniert daher auch unverschlüsselt für die lokale Entwicklung).

## Deployment (GitHub Pages + Render)

Das Frontend läuft als statische PWA auf **GitHub Pages**, das Backend (Express +
PostgreSQL) auf **Render** (kostenloser Tier). Beides deployt automatisch bei jedem
Push nach `main`.

### 1. Backend + Datenbank auf Render

1. Auf [render.com](https://render.com) einloggen (Login per GitHub geht am schnellsten).
2. **New → Blueprint** wählen und das GitHub-Repo `kalorien-tracker` verbinden.
   Render liest automatisch [`render.yaml`](render.yaml) und schlägt zwei Ressourcen vor:
   - `kalorien-tracker-db` – kostenlose PostgreSQL-Datenbank
   - `kalorien-tracker-api` – der Node/Express-Backend-Service
3. **Apply** klicken. Render baut das Backend aus `backend/` und verbindet automatisch
   die `DATABASE_URL` der Datenbank mit dem Service (kein manuelles Kopieren nötig).
4. Nach dem ersten erfolgreichen Deploy die Service-URL notieren, z. B.
   `https://kalorien-tracker-api.onrender.com` (unter dem Service-Namen im Dashboard
   sichtbar – falls der Name schon vergeben war, hat Render ihn leicht abgewandelt).
5. Optional: `USDA_FDC_API_KEY` / `FATSECRET_CLIENT_ID` / `FATSECRET_CLIENT_SECRET` im
   Render-Dashboard unter **Environment** nachtragen, falls gewünscht.

**Wichtige Einschränkungen des kostenlosen Render-Tiers:**
- Der Web-Service schläft nach ~15 Minuten Inaktivität ein; die erste Anfrage danach
  braucht ca. 30–60 Sekunden zum Aufwachen (danach wieder normal schnell).
- Die kostenlose PostgreSQL-Datenbank läuft laut aktueller Render-Doku nur befristet
  (Stand jetzt: läuft nach einigen Wochen ab und muss dann neu angelegt werden – Render's
  genaue Free-Tier-Regeln ändern sich gelegentlich, im Zweifel im Render-Dashboard prüfen).
  Für dauerhaften Betrieb müsste irgendwann auf einen bezahlten Plan gewechselt werden.

### 2. Frontend auf GitHub Pages

1. Im GitHub-Repo unter **Settings → Pages** bei **Source** auf **"GitHub Actions"** stellen
   (einmalig).
2. Unter **Settings → Secrets and variables → Actions → Variables** eine neue Repository-
   Variable anlegen: `VITE_API_BASE_URL` = die Render-Backend-URL aus Schritt 1
   (z. B. `https://kalorien-tracker-api.onrender.com`, **ohne** abschließenden Slash).
3. Bei jedem Push nach `main` baut [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml)
   das Frontend und veröffentlicht es unter `https://<github-user>.github.io/kalorien-tracker/`.
   Manuell auslösen geht über den Tab **Actions → Deploy Frontend to GitHub Pages → Run workflow**.

Da GitHub Pages `https://` verwendet, funktionieren PWA-Installation und Kamera-Zugriff
für den Barcode-Scanner dort ohne Einschränkung (im Gegensatz zu einem unverschlüsselten
eigenen Server).

### 3. CORS

Der Backend-Service erlaubt standardmäßig alle Origins. In `render.yaml` ist `CORS_ORIGIN`
bereits auf die GitHub-Pages-URL gesetzt – bei einem anderen GitHub-Usernamen/Repo-Namen
oder einer eigenen Domain den Wert im Render-Dashboard unter **Environment** anpassen
(mehrere Origins kommagetrennt möglich).

## App aufs iPhone-Homescreen installieren

1. Die App im mobilen Safari öffnen: die deployte Pages-URL
   `https://<github-user>.github.io/kalorien-tracker/`, oder im lokalen Netzwerk
   z. B. `http://<Rechner-IP>:5173` während der Entwicklung.
2. Auf das Teilen-Symbol tippen (Quadrat mit Pfeil nach oben).
3. **"Zum Home-Bildschirm"** auswählen.
4. Name bestätigen und **"Hinzufügen"** tippen.

Die App startet danach im Vollbildmodus (ohne Safari-UI), verwendet das App-Icon
und respektiert die Safe-Area-Insets (Notch/Dynamic Island, Home-Indicator).
Bereits geladene Tage/Daten bleiben dank Service-Worker-Caching auch offline sichtbar;
neue Einträge und Suchen benötigen weiterhin eine Verbindung zum Backend.

## Food-Adapter / Fallback-Verhalten

Jede Quelle implementiert das `FoodSource`-Interface (`search`, `getByBarcode`,
`isConfigured`) in `backend/src/adapters/`:

- `openFoodFactsAdapter.ts` – aktiv, kein Key nötig
- `usdaAdapter.ts` – aktiviert sich automatisch, sobald `USDA_FDC_API_KEY` in `.env` gesetzt ist
- `fatSecretAdapter.ts` – Gerüst mit OAuth2-Client-Credentials-Flow; aktiviert sich, sobald
  `FATSECRET_CLIENT_ID`/`FATSECRET_CLIENT_SECRET` gesetzt sind (ungetestet ohne echten
  Account – Response-Felder ggf. gegen die aktuelle FatSecret-Doku prüfen)

Die Suche (`foodService.searchFoods`) prüft zuerst den lokalen Postgres-Cache, dann die
konfigurierten Quellen der Reihe nach, bricht ab sobald genug Ergebnisse vorliegen, und
dedupliziert über Barcode bzw. Name+Marke. Ist eine Quelle nicht erreichbar oder nicht
konfiguriert, wird sie übersprungen bzw. ihr Fehler separat zurückgegeben, statt die
ganze Suche fehlschlagen zu lassen.
