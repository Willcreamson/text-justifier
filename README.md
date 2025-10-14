# text-justifier
This project is an API written in Node and Typescript that returns a justify text from a text in input

## Settings and environment 
- For this project we choose to use Docker, because we want to have an environment easy to configure that will run our api
- Node.js (node v20.19.2)
- Typescript
- Jest (tests)
- Docker (déploiement)


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

## Documentation

### Mécanisme d'authentification et de génération des tokens
Nous souhaitons générer un token unique en fonction d'un email envoyé dans le body de la requête poste 
Nous avons deux choix, soit le token associé à un email ne change pas , soit le token associé à un email change

Puisque nous souhaitons fixer une limite de 80 000 lettres/tokens de textes conommés par l'api par jour, nous allons générer un token unique par email par jour ce qui facilitera le comptage

On peut utiliser cet objet :
    TokenManagement { 
        email : string, 
        token : string,
        words_limit : int, 
        created_at : Date,
        end_at : creation_date + 1jour  
    }
### Algorithme de justification 
Le problème consiste à partitionner le texte de façon ordonné en plusieurs lignes de telle sorte que la réunion de ces lignes contient tous les mots dans l'ordre initial du texte, et tel qu'un mot ne peut pas appartenir à deux lignes différentes et tel que le nombre de caractère total d'une ligne est égal exactement à 80.
Cas trivia : S'il n'y a pas de texte , retourner une erreur
Si le nombre de mots du texte plus le  word_usage de l'utilisateur dépasse 80 000
envoyer directement 402 Payment Required

Nous utiliserons des listes pour stocker les lignes, aet ajouteront tous les mots suivants du textes tant que la longueur cumulée ne dépasse pas 80 ce qui marque la fin de la ligne. Nous rajouterons des espaces après le séparateur (',', ';', '.', ':') la plus proche pour compléter la longueur du texte à 80 si nécessaire 
