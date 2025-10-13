# text-justifier
This project is an API written in Node and Typescript that returns a justify text from a text in input

## Settings and environment 
- For this project we choose to use Docker, because we want to have an environment easy to configure that will run our api
- Node.js
- Typescript
- Jest (tests)
- Docker (déploiement)

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
