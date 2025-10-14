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
+ Need of a token to consume the api
+ Rate limit 80000
+ When the limit of 80 000 tokens has been reached you couldn't use the api anymore unless you pay and you have
+ this message of 402 Payment required

## Documentation