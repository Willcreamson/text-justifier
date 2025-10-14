import express , {type Request, type Response, type NextFunction} from 'express';
import { addToken, incrementTokenUsage, tokenManager } from './tokenManagement.js';
import type TokenData from './tokenManagement.js';


const app = express();

function authenticate(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).send("Token is required");

    const tokenData = Array.from(tokenManager.values()).find(
        (t: TokenData) => t.token === token
    );

    if (!tokenData) return res.status(401).send("Invalid token");
    if (new Date() > tokenData.end_at) return res.status(401).send("Token expired");

    incrementTokenUsage(tokenData.email);
    if (tokenData.word_usage > 80000) return res.status(403).send("Token limit exceeded");

    (req as any).tokenData = tokenData;

    next();
}

function justifyText(text: string, wordUsage: number): string[] {
    if (!text || text.trim().length === 0) {
        throw new Error("Text cannot be empty");
    }

    const words = text.trim().split(/\s+/);

    if (words.length + wordUsage > 80000) {
        throw { status: 402, message: "Payment Required: usage limit exceeded" };
    }

    const lines: string[] = [];
    let currentLine = "";
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        if ((currentLine + (currentLine ? " " : "") + word).length <= 80) {
            currentLine += (currentLine ? " " : "") + word;
        } else {
            // compléter avec espaces après la ponctuation la plus proche
            let padding = 80 - currentLine.length;
            if (padding > 0) {
                // cherche la dernière ponctuation dans la ligne
                const match = currentLine.match(/[,;.:](?!.*[,;.:])/);
                if (match) {
                    const index = currentLine.lastIndexOf(match[0]) + 1;
                    currentLine = currentLine.slice(0, index) + " ".repeat(padding) + currentLine.slice(index);
                } else {
                    // sinon ajoute simplement des espaces à la fin
                    currentLine += " ".repeat(padding);
                }
            }
            lines.push(currentLine);
            currentLine = word ?? ""; // démarrer nouvelle ligne avec le mot courant
        }
    }
    // Ajoute la dernière ligne
    if (currentLine) {
        let padding = 80 - currentLine.length;
        if (padding > 0) currentLine += " ".repeat(padding);
        lines.push(currentLine);
    }

    return lines;
}

app.use(express.json()); // pour accepter application/json

app.use(express.text({ type: 'text/plain' }));

app.use(express.urlencoded({ extended: true })); // Formulaire urlencoded parser

app.get("/api/", (req, res) =>{
    res.send("✨Justify API is running Prepare your text !✨");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server listening on port ${PORT}`));


// Génération d'un token unique pour une adresse email
app.post("/api/generatetoken", (req, res) => { 
    const email = req.body.email;
    console.log("email", email);
    if (!email) {
        return res.status(400).send("Email is required");
    }

    // Associe un nouveau token avec un email si l'email n'a pas déjà un token actif
    addToken(email, res);
    res.end();
});

app.post("/api/justify", authenticate, (req, res) => {
    const text = req.body; // ici, req.body est directement une string
    if (!text || typeof text !== "string") {
        return res.status(400).send("Text is required");
    }

    const tokenData = (req as any).tokenData;
    const justifiedLines = justifyText(text, tokenData.word_usage);

    // Réponse au format text/plain
    res.type("text/plain").send(justifiedLines.join("\n"));
});


export default app;
//  Merci pour ce projet :)