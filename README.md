# Text Justifier API

## Présentation

Ce projet propose une API REST permettant de justifier un texte en lignes de 80 caractères.
L'accès est contrôlé via un token par email pour limiter l'usage (maximum 80 000 mots par token).

### Technologies utilisées

- **Node.js + Express** - Framework web
- **TypeScript** - Typage statique
- **Vitest + Supertest** - Tests unitaires et d'intégration
- **tsx** - Exécution TypeScript en développement

---

## Structure du projet

```
text-justifier/
│
├─ .github/
│   └─ workflows/
│       └─ ci.yml           # CI/CD GitHub Actions
│
├─ src/
│   ├─ index.ts             # Point d'entrée de l'API
│   ├─ tokenManagement.ts   # Gestion des tokens et usage
│   └─ index.test.ts        # Tests unitaires avec Vitest
│
├─ package.json
├─ tsconfig.json
├─ vitest.config.ts
└─ README.md
```

---

## Installation

### 1. Cloner le projet

```bash
git clone <repo-url>
cd text-justifier
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Lancer le serveur en développement

```bash
npm run dev
```

### 4. Lancer les tests

```bash
npm test
```

---

## Configuration TypeScript

Exemple de `tsconfig.json` :

```json
{
  "compilerOptions": {
    "module": "nodenext",
    "target": "esnext",
    "types": ["node", "vitest/globals"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## Configuration Vitest

**vitest.config.ts** :

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

---

## Scripts npm

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Installation complète des dépendances

```bash
# Utiliser Node.js 20.x
nvm use 20

# Dépendances de production
npm install express

# Dépendances de développement
npm install --save-dev typescript tsx @types/express @types/node vitest @types/supertest supertest

# Initialiser TypeScript (si besoin)
npx tsc --init
```

---

## API - Endpoints

### Base URL

```
http://localhost:3000/api
```

### Routes disponibles

#### 1. **GET /api/**

**Description** : Vérifie la disponibilité de l'API

- **Méthode** : `GET`
- **Headers** : Aucun
- **Body** : Aucun

**Réponse** :
```
✨Justify API is running Prepare your text !✨
```

---

#### 2. **POST /api/generatetoken**

**Description** : Génère un token unique pour un email donné

- **Méthode** : `POST`
- **Headers** : `Content-Type: application/json`
- **Body** :
```json
{
  "email": "user@example.com"
}
```

**Réponse** (200) :
```
Token generated: <token_hex>
```

**Erreurs** :
- `400` : Email manquant ou invalide

**Remarque** : Le token est stocké en mémoire avec une limite d'usage de 80 000 mots et expire après 24 heures.

---

#### 3. **POST /api/justify**

**Description** : Justifie un texte en lignes de 80 caractères

- **Méthode** : `POST`
- **Headers** :
  - `Authorization: Bearer <token>`
  - `Content-Type: text/plain`
- **Body** : Texte brut à justifier

**Exemple** :
```
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
```

**Réponse** (200) : Texte justifié (format `text/plain`)
```
Lorem  ipsum  dolor  sit  amet,     consectetur  adipiscing  elit,     sed  do
eiusmod tempor incididunt ut labore et dolore magna aliqua.
```

**Codes d'erreur** :
- `400` : Texte manquant ou vide
- `401` : Token manquant, invalide ou expiré
- `402` : Limite de 80 000 mots dépassée (Payment Required)
- `403` : Usage quotidien dépassé

---

## Logique métier

### Gestion des tokens

Les tokens sont stockés en mémoire avec les informations suivantes :

- `token` : Chaîne hexadécimale aléatoire (générée avec `crypto.randomBytes`)
- `email` : Adresse email de l'utilisateur
- `created_at` : Date de création
- `end_at` : Date d'expiration (24h après création)
- `word_usage` : Nombre de mots consommés
- `token_usage` : Nombre d'utilisations du token

### Justification du texte

L'algorithme de justification suit ces étapes :

1. **Découpage** : Le texte est découpé en mots via l'expression régulière `/\s+/`
2. **Construction des lignes** : Les mots sont ajoutés ligne par ligne tant que la longueur ≤ 80 caractères
3. **Padding intelligent** : Les espaces manquants sont **répartis uniformément** après chaque ponctuation (`,` `;` `.` `:`) présente dans la ligne
   - Calcul : `espaces par ponctuation = padding total ÷ nombre de ponctuations`
   - Les espaces restants (modulo) sont distribués aux premières ponctuations
4. **Dernière ligne** : La dernière ligne n'est pas justifiée, les espaces sont ajoutés à la fin

**Exemple de répartition** :

Ligne originale (50 caractères) :
```
Bonjour, comment allez-vous? Très bien, merci.
```

Avec 30 espaces à ajouter (3 ponctuations → 10 espaces chacune) :
```
Bonjour,          comment allez-vous?          Très bien,          merci.
```

### Limite d'usage

- Si `word_usage + mots du texte actuel > 80 000` → **402 Payment Required**
- Chaque appel incrémente le compteur `word_usage` du token
- Le dépassement est vérifié **avant** la justification pour éviter les traitements inutiles

---

## Tests (Vitest + Supertest)

### Objectifs

- Vérifier le bon fonctionnement de tous les endpoints
- Tester les cas d'erreur (token invalide, texte vide, limite dépassée)
- Valider l'algorithme de justification

### Exemple de test

```typescript
import { describe, test, expect } from 'vitest';
import request from "supertest";
import app from "./index.js";

describe("Justify API - Tests", () => {
  let token: string;

  test("POST /api/generatetoken should generate a token", async () => {
    const res = await request(app)
      .post("/api/generatetoken")
      .send({ email: "test@example.com" })
      .set("Content-Type", "application/json");

    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Token generated/);
    
    const match = res.text.match(/Token generated: (\w+)/);
    token = match ? match[1] : "";
    expect(token).not.toBe("");
  });

  test("POST /api/justify without token returns 401", async () => {
    const res = await request(app)
      .post("/api/justify")
      .set("Content-Type", "text/plain")
      .send("Texte de test");
    
    expect(res.status).toBe(401);
  });

  test("POST /api/justify with valid token returns justified text", async () => {
    const text = "Ceci est un texte pour tester la justification de lignes.";
    const res = await request(app)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send(text);

    expect(res.status).toBe(200);
    expect(res.type).toBe("text/plain");
    expect(res.text.length).toBeGreaterThan(0);
    
    // Vérifie que chaque ligne fait 80 caractères (sauf peut-être la dernière)
    const lines = res.text.split('\n');
    lines.forEach((line, index) => {
      if (index < lines.length - 1) {
        expect(line.length).toBe(80);
      }
    });
  });
});
```

### Scénarios testés

- ✅ Création de token
- ✅ Token manquant → 401
- ✅ Token invalide → 401
- ✅ Token expiré → 401
- ✅ Texte vide → 400
- ✅ Limite de 80 000 mots dépassée → 402
- ✅ Justification correcte du texte

---

## Algorithme de justification détaillé

### Problématique

Partitionner un texte en lignes ordonnées de **exactement 80 caractères** telles que :

1. La réunion des lignes contient tous les mots dans l'ordre initial
2. Un mot n'appartient qu'à une seule ligne
3. Chaque ligne fait exactement 80 caractères (padding inclus)

### Cas triviaux

- **Texte vide** : Retourner une erreur 400
- **Dépassement de quota** : Si `word_usage + nombre de mots > 80 000`, retourner 402 immédiatement

### Algorithme

1. **Initialisation** :
   - Créer une liste vide `lines` pour stocker les lignes finales
   - Créer une variable `currentLine` (chaîne vide)

2. **Parcours des mots** :
   - Pour chaque mot du texte :
     - Si `longueur(currentLine + espace + mot) ≤ 80` :
       - Ajouter le mot à `currentLine`
     - Sinon :
       - **Justifier `currentLine`** (voir étape 3)
       - Ajouter `currentLine` à `lines`
       - Commencer une nouvelle ligne avec le mot courant

3. **Justification d'une ligne** :
   - Calculer `padding = 80 - longueur(currentLine)`
   - Si `padding > 0` :
     - Trouver toutes les ponctuations (`,` `;` `.` `:`) dans la ligne
     - Si au moins une ponctuation existe :
       - `espacesParPonctuation = padding ÷ nombreDePonctuations` (division entière)
       - `espacesRestants = padding % nombreDePonctuations` (modulo)
       - Pour chaque ponctuation :
         - Ajouter `espacesParPonctuation` espaces après
         - Pour les `espacesRestants` premières ponctuations, ajouter 1 espace supplémentaire
     - Sinon (pas de ponctuation) :
       - Ajouter tous les espaces à la fin de la ligne

4. **Dernière ligne** :
   - Compléter avec des espaces à la fin (pas de justification)
   - Ajouter à `lines`

5. **Retour** : Joindre les lignes avec `\n`

### Complexité

- **Temps** : O(n × m) où n = nombre de mots, m = longueur moyenne d'une ligne
- **Espace** : O(L) où L = longueur totale du texte justifié

---

## CI/CD avec GitHub Actions

Le projet inclut une configuration GitHub Actions (`.github/workflows/ci.yml`) qui :

- ✅ S'exécute sur chaque push et pull request (branches `main`, `master`, `dev`)
- ✅ Vérifie la compilation TypeScript
- ✅ Lance les tests automatiquement
- ✅ Utilise le cache npm pour accélérer les builds

---

## Améliorations futures

- [ ] Persistance des tokens en base de données (Redis/PostgreSQL)
- [ ] Système de paiement pour renouveler le quota
- [ ] Rate limiting par IP
- [ ] Métriques et monitoring (Prometheus/Grafana)
- [ ] Support de différentes largeurs de ligne (paramètre optionnel)
- [ ] API de statistiques d'usage

---

## Licence

MIT

---

## Auteur

Développé avec ❤️ pour le projet Text Justifier API