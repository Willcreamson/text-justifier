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
            // Répartir les espaces après les ponctuations
            let padding = 80 - currentLine.length;
            if (padding > 0) {
                // Trouve toutes les ponctuations dans la ligne
                const punctuationRegex = /[,;.:]/g;
                const matches = [...currentLine.matchAll(punctuationRegex)];
                
                if (matches.length > 0) {
                    // Calcule combien d'espaces ajouter après chaque ponctuation
                    const spacesPerPunctuation = Math.floor(padding / matches.length);
                    const extraSpaces = padding % matches.length;
                    
                    // Reconstruit la ligne en ajoutant les espaces après chaque ponctuation
                    let newLine = "";
                    let lastIndex = 0;
                    
                    matches.forEach((match, idx) => {
                        const punctIndex = match.index!;
                        // Ajoute le texte jusqu'à la ponctuation (incluse)
                        newLine += currentLine.slice(lastIndex, punctIndex + 1);
                        // Ajoute les espaces uniformes
                        newLine += " ".repeat(spacesPerPunctuation);
                        // Ajoute un espace supplémentaire aux premières ponctuations (pour les restes)
                        if (idx < extraSpaces) {
                            newLine += " ";
                        }
                        lastIndex = punctIndex + 1;
                    });
                    
                    // Ajoute le reste de la ligne
                    newLine += currentLine.slice(lastIndex);
                    currentLine = newLine;
                } else {
                    // Pas de ponctuation : ajoute les espaces à la fin
                    currentLine += " ".repeat(padding);
                }
            }
            lines.push(currentLine);
            currentLine = word ?? "";
        }
    }
    
    // Ajoute la dernière ligne (sans justification)
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
    if (!email) {
        return res.status(400).json({ msg: "Email is required", token: null });
    }

    const result = addToken(email);
    res.json(result); // renvoie { msg: "...", token: "..." }
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