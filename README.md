# Presentation
Ce projet propose une API REST permettant de justifier un texte en ligne de 80 caractères.
L’accès est contrôlé via un token par email pour limiter l’usage (max 80 000 mots).

Technologies utilisées :
Node.js + Express
TypeScript
Jest + Supertest pour les tests
ts-jest pour transformer TypeScript dans Jest


## Structure du projet 
Structure du projet
text-justifier/
│
├─ src/
│   ├─ index.ts          # Point d’entrée de l’API
│   ├─ tokenManagement.ts# Gestion des tokens et usage
│   └─ test.ts           # Tests unitaires avec Jest
│
├─ package.json
├─ tsconfig.json
└─ jest.config.cjs

## Installation
Installation

Cloner le projet :

git clone <repo-url>
cd text-justifier


Installer les dépendances :

npm install


Lancer le serveur en développement :

npm run dev   # ou ts-node src/index.ts


Lancer les tests :

npm test

## Configuration typescript
Exemple minimal :

{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "types": ["node", "jest"]
  },
  "include": ["src"]
}


## Configuration Jest (jest.config.cjs)
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
};


## script installation des dépendences 
nvm use node 20.19.2
npm install express
npm install --save-dev typescript ts-node-dev @types/express jest ts-jest @types/jest
npx tsc --init


## API development
Endpoint unique token api/token
methods : POST 
body : {"email" : "foo@bar.com"}

Endpoint justify-text /api/justify
- Need of a token to consume the api
- Rate limit 80000
- When the limit of 80 000 tokens has been reached you couldn't use the api anymore unless you pay and you have
- this message of 402 Payment required


##  API
6.1 Base URL
http://localhost:3000/api/

6.2 Routes
6.2.1 GET /api/

Description : Test de disponibilité de l’API

Méthode : GET

Headers : Aucun

Body : Aucun

Réponse :

✨Justify API is running Prepare your text !✨

6.2.2 POST /api/generatetoken

Description : Génère un token unique pour un email

Méthode : POST

Headers : Content-Type: application/json

Body :

{
  "email": "user@example.com"
}


Réponse :

Token generated: <token_hex>


Erreur 400 : si l’email est absent

Remarque : Le token est stocké en mémoire avec une limite d’usage et une date d’expiration (24h).

6.2.3 POST /api/justify

Description : Justifie un texte en lignes de 80 caractères

Méthode : POST

Headers :

Authorization: Bearer <token>

Content-Type: text/plain

Body : Texte brut à justifier

Lorem ipsum dolor sit amet, consectetur adipiscing elit...


Réponse : Texte justifié sur plusieurs lignes (80 caractères)

Codes d’erreur possibles :

401 : token manquant, invalide ou expiré

403 : limite de mots dépassée (80 000)

400 : texte absent

402 : dépassement cumulatif de l’usage pour le token

## Logique métier

Gestion des tokens

Stockage en mémoire avec :

token (chaîne aléatoire)

email

created_at

end_at (expiration)

word_usage / token_usage

Justification du texte

Découpe en mots via /\s+/

Remplit une ligne tant que longueur ≤ 80

Complète les lignes avec espaces après la dernière ponctuation de la ligne : , ; . :

Ajoute des lignes successives jusqu’à épuisement du texte

Limite d’usage

Si le cumul de word_usage + texte actuel > 80 000 → 402 Payment Required

Chaque appel incrémente le compteur word_usage du token

## Tests Jest + Supertest
8.1 Objectif

Vérifier que les endpoints fonctionnent correctement

Tester les cas d’erreur

Tester la justification de texte

8.2 Exemple de test
import request from "supertest";
import app from "./index.js";

describe("Justify API", () => {
  let token: string;

  test("POST /api/generatetoken", async () => {
    const res = await request(app)
      .post("/api/generatetoken")
      .send({ email: "test@example.com" });
    expect(res.status).toBe(200);
    const match = res.text.match(/Token generated: (\w+)/);
    token = match ? match[1] : "";
    expect(token).not.toBe("");
  });

  test("POST /api/justify with token", async () => {
    const text = "Ceci est un texte pour tester la justification.";
    const res = await request(app)
      .post("/api/justify")
      .set("Authorization", `Bearer ${token}`)
      .set("Content-Type", "text/plain")
      .send(text);

    expect(res.status).toBe(200);
    expect(res.type).toBe("text/plain");
    expect(res.text.length).toBeGreaterThan(0);
  });
});


On teste : création de token, texte absent, token manquant, token expiré, texte justifié.

## Algorithme de justification 
Le problème consiste à partitionner le texte de façon ordonné en plusieurs lignes de telle sorte que la réunion de ces lignes contient tous les mots dans l'ordre initial du texte, et tel qu'un mot ne peut pas appartenir à deux lignes différentes et tel que le nombre de caractère total d'une ligne est égal exactement à 80.
Cas trivia : S'il n'y a pas de texte , retourner une erreur
Si le nombre de mots du texte plus le  word_usage de l'utilisateur dépasse 80 000
envoyer directement 402 Payment Required

Nous utiliserons des listes pour stocker les lignes, aet ajouteront tous les mots suivants du textes tant que la longueur cumulée ne dépasse pas 80 ce qui marque la fin de la ligne. Nous rajouterons des espaces après le séparateur (',', ';', '.', ':') la plus proche pour compléter la longueur du texte à 80 si nécessaire 