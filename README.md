# Hushållet

Hushållet hjälper personer som bor tillsammans att fördela och följa upp hemmets sysslor. Medlemmar kan se vad som behöver göras, markera sysslor som klara och jämföra arbetsfördelningen i statistik som tar hänsyn till sysslornas vikt. Ägare kan administrera hushållet, hantera medlemsförfrågningar och schemalägga återkommande sysslegrupper.

## Teknik och projektstruktur

| Mapp      | Innehåll                                                                                     |
| --------- | -------------------------------------------------------------------------------------------- |
| `app/`    | Mobilappen: React Native, Expo SDK 57, TypeScript och Expo Router.                           |
| `api/`    | Servern: Hono, Better Auth och Prisma 7 med SQLite. Även bilder och ljud lagras i databasen. |
| `shared/` | Zod-scheman och typer som delas av servern och appen.                                        |

## Kom igång

### Förutsättningar

- Git och Node.js 24 med npm. Projektets CI använder Node.js 24.
- En telefon med Expo Go som stöder SDK 57, eller en Android-emulator/iOS-simulator med motsvarande stöd. iOS-simulator kräver macOS och Xcode.
- Telefonen och datorn behöver kunna nå varandra över nätverket när API:t körs lokalt.

Instruktionerna nedan utgår från en ny lokal utvecklingsmiljö. Ingen separat databasserver behövs; SQLite lagrar databasen i en lokal fil.

### 1. Hämta projektet och installera beroenden

```sh
git clone https://github.com/biggieliten/household-manager.git
cd household-manager
npm ci
cd shared
npm ci
cd ../api
npm ci
cd ../app
npm ci
cd ..
```

Kommandona hämtar projektet från GitHub och installerar beroendena i roten samt i `shared/`, `api/` och `app/`.

### 2. Ange miljövariabler

#### API – `api/.env`

Kopiera [`api/.env.example`](api/.env.example) till `api/.env` och fyll i:

- `DATABASE_URL`: SQLite-anslutning.
- `GITHUB_CLIENT_ID`: GitHub OAuth-appens klient-ID.
- `GITHUB_CLIENT_SECRET`: GitHub OAuth-appens klienthemlighet.

GitHub-uppgifterna behövs för GitHub-inloggning. OAuth-appens callback ska vara API-basadressen följd av `/api/auth/callback/github`.

##### Skapa en GitHub OAuth-app (om du vill använda GitHub som login)

1. Öppna GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**.
2. Ange **Application name**, exempelvis `Hushållet`, och **Homepage URL**, exempelvis projektets GitHub-adress.
3. Ange **Authorization callback URL** till API:ts basadress följd av `/api/auth/callback/github`, exempelvis `http://localhost:3000/api/auth/callback/github`. På en fysisk telefon behöver adressen vara nåbar från telefonen.
4. Klicka på **Register application** och sedan **Generate a new client secret**. Kopiera **Client ID** och hemligheten till `GITHUB_CLIENT_ID` respektive `GITHUB_CLIENT_SECRET` i `api/.env`. Hemligheten ska aldrig checkas in.

#### App – `app/.env`

Kopiera [`app/.env.example`](app/.env.example) till `app/.env` och ange:

- `EXPO_PUBLIC_API_URL`: API:ts basadress med protokoll och port 3000, utan avslutande snedstreck eller API-sökväg.

Välj adress efter hur appen körs:

- **Samma dator/iOS-simulator:** använd `localhost`.
- **Fysisk telefon över lokalt nätverk:** använd datorns lokala IP-adress.
- **Androids standardemulator:** använd `10.0.2.2`. Om du vill använda `localhost` kom ihåg att använda `adb reverse` kommandot.
- **Android via USB/ADB:** se instruktionerna i appens exempelfil.

Hemligheter ska endast finnas i API:ts miljöfil; `EXPO_PUBLIC_`-värden är offentliga. Starta om API:t respektive Expo och ladda om appen efter ändringar i miljöfilerna.

### 3. Skapa Prisma-klienten och databasen

Kör från `api/` för att generera Prisma-klienten och skapa databastabellerna:

```sh
npm run db:generate
npm run db:push
```

Använd en ny lokal databas eller säkerhetskopiera befintliga data före schemaändringar.

För att fylla databasen med testdata, kör valfritt:

```sh
npm run db:seed
```

Seed-kommandot raderar befintlig data.

### 4. Starta API:t

Kör från `api/`:

```sh
npm run dev
```

API:t körs på port 3000.

### 5. Starta appen

Kör i en separat terminal från `app/`:

```sh
npm start
```

Öppna appen via QR-koden i Expo Go eller välj en emulator/simulator i terminalen.

### Bygga projektet

**API**, från `api/`:

```sh
npm run build
npm start
```

Stoppa eventuell utvecklingsserver först.

**Android**, från `app/` (kräver Android Studio/Android SDK):

```sh
npm run android
```

**iOS**, från `app/` (kräver macOS och Xcode):

```sh
npm run ios
```

## Uppfyllda krav (G och VG)

Uppgiften innehåller 40 krav. G kräver de 20 obligatoriska kraven, markerade med `*` i uppgiften. VG kräver minst 32 uppfyllda krav totalt, inklusive de obligatoriska.

### Obligatoriska krav för G (20)

- [x] Designad logga, splashscreen och appikon används.
- [x] Appen byggs med React Native, Expo och TypeScript.
- [x] Designen utgår från skisser; godkända avvikelser dokumenteras.
- [x] Hushåll har ändringsbart namn och genererad anslutningskod.
- [x] Användare kan registrera sig och logga in.
- [x] Användare kan skapa hushåll.
- [x] Användare kan gå med via hushållets kod.
- [x] Användare kan ange sitt namn.
- [x] Avatar väljs från fördefinierade djur och färger.
- [x] Upptagna avatarer kan inte väljas av andra i hushållet.
- [x] Avatar visar vad användaren har gjort.
- [x] Ägare kan lägga till sysslor.
- [x] Sysslor har namn, textbeskrivning, intervall i dagar och vikt.
- [x] Ägare kan redigera sysslor.
- [x] Alla sysslor listas i en dagsvy.
- [x] Dagsvyn visar utförare, dagar sedan senast och försening.
- [x] Sysslans beskrivning visas och den kan markeras som gjord med ett tryck.
- [x] Statistik visar fördelningen av utförda sysslor mellan medlemmar.
- [x] Statistik visar viktad totalfördelning och fördelning per syssla.
- [x] Statistik finns för nuvarande vecka.

### Ytterligare krav för VG (20)

- [x] Information skickas till och från en server.
- [x] Alla medlemmar kan se vilka som tillhör hushållet.
- [x] Ägare kan se anslutningsförfrågningar.
- [x] Ägare kan acceptera och neka förfrågningar.
- [x] Ägare kan göra andra till ägare.
- [x] Ägare kan pausa medlemmar, som undantas under pausen.
- [x] Statistik normaliseras när någon är pausad en del av perioden.
- [x] En ägare måste godkänna en ny medlem.
- [x] Användare kan lämna ett hushåll.
- [x] Användare kan välja ljust, mörkt eller automatiskt tema.
- [x] Användare kan växla mellan sina hushåll.
- [x] Sysslor kan kompletteras med bild och ljudinspelning.
- [x] Ägare kan ta bort sysslor.
- [x] Borttagning varnar om förlorad statistik och erbjuder arkivering.
- [x] Statistik finns för förra veckan.
- [x] Statistik finns för förra månaden.
- [x] Statistikperioder utan data visas inte.
- [x] Ägare kan tilldela och ta bort sysslor från medlemmar.
- [x] Medlemmar ser tilldelade sysslor i sitt gränssnitt.
- [x] Ägare kan skapa sysslegrupper som tilldelas och roteras med intervall i dagar.

### Förslag på manuell acceptanskontroll

1. Registrera två konton, skapa ett hushåll och prova kod, förfrågan, nekande och godkännande.
2. Kontrollera namnbyte, unika avatarer, temaval, hushållsbyte, ägarbyte, paus och att lämna hushållet.
3. Skapa och redigera sysslor med olika vikter och intervall samt bild och ljud. Kontrollera tilldelning, roterande grupper och utföranden i dagsvyn.
4. Kontrollera viktad statistik, normalisering, de tre perioderna och att tomma perioder döljs. Tidigare perioder kräver historiska utföranden i testdatabasen.
5. Prova arkivering och separat borttagning i ett testhushåll med data som får raderas. Kontrollera att arkivering bevarar statistiken och att borttagning raderar den.
6. Kontrollera logga, splashscreen och egna ikoner i native-byggen för respektive plattform samt jämför designen med godkända avvikelser.

## Avvikelser från skisserna

Följande avvikelser från de ursprungliga skisserna har gjorts.

### Dagsvyn (Sysslor)

- En veckoremsa (M T O T F L S) har lagts till under datumrubriken, så att man kan välja och gå tillbaka till tidigare dagar.
- Knapparna "Lägg till" och "Ändra" har ersatts av en rund "+"-knapp som bara visas för ägare. En syssla redigeras genom att öppna den.
- Varje syssla visar sin vikt som en etikett (t.ex. "⚡ 2p").
- Antal dagar visas som "3 d", och "Inte gjord än" om sysslan aldrig har gjorts.
- En pausad användare ser en gul banner, "Du är pausad".

### Navigering

- En flikrad längst ned (Sysslor, Statistik, Hushåll) har lagts till.

### Statistik

- Diagrammen är ringdiagram i stället för fyllda cirkeldiagram.
- Perioden visar även veckonummer och datum (t.ex. "v. 43 • 21–27 okt").
- Under totalen visas varje medlem med avatar och procentandel, och varje syssla visar hur många gånger den har gjorts.

### Skapa syssla

- Rubriken är "Lägg till syssla" i stället för "Skapa en ny syssla".
- Viktvärdena (1, 2, 4, 6, 8) har namn: Lätt, Normal, Tung, Krävande, Mycket tung.
- Nya fält: bild, röstmeddelande och val av medlemmar.
- Knapparna heter "Spara syssla" och "Avbryt" i stället för "Spara" och "Stäng".

### Vyer som saknas i skisserna

- Inloggning, hushåll, profil, sysslegrupper och detaljvy för en syssla har designats av gruppen.

### Färger

- Appens accentfärg är mörkröd (#A3393A, ljust tema).
- En försenad syssla har en ljusröd bakgrund och en röd dagsetikett.
- Små etiketter och avatarcirklar har en ljuslila bakgrund.
- Appen har både ljust och mörkt tema med egna färger.

### Sidhuvud

- Rubriken "Sysslor" har ersatts av ett sidhuvud med logga, hushållets namn och en profilknapp.
- Genom att trycka på hushållets namn öppnas en meny där man kan byta mellan sina hushåll.

### Godkännande

- Godkänt av produktägaren: 2026-10-28
