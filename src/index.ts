import express from 'express';

const app = express();
app.use(express.text()); // pour accepter text/plain

app.get("/", (req, res) =>{
    res.send("Justify API is running");
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
