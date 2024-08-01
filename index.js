const cors = require('cors');
const express = require('express');
const fetch = require('node-fetch');
const { MongoClient, ServerApiVersion } = require('mongodb'); 

const app = express();
const port = process.env.PORT || 10000; 

const uri = process.env.MONGODB_URI; 
const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY; 

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(cors()); 
app.use(express.json()); 

app.post('/api/subscribers', async (req, res) => {
    try {
        const { email, 'g-recaptcha-response': recaptchaToken } = req.body;

        // 1. Validation de l'email
        if (!validateEmail(email)) {
            return res.status(400).json({ msg: 'Email invalide' }); 
        }

        // 2. Vérification du token reCAPTCHA 
        const recaptchaResponse = await fetch(`https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaToken}`, { method: 'POST' });
        const recaptchaData = await recaptchaResponse.json();

        // 3. Vérification du score reCAPTCHA
        if (recaptchaData.success && recaptchaData.score > 0.5) { 
            await client.connect();
            const db = client.db("Manian"); 
            const subscribers = db.collection("Mails");

            const result = await subscribers.insertOne({ email });
            res.status(201).json({ msg: 'Merci de votre inscription !' });
        } else {
            // Score reCAPTCHA suspect
            console.error("Requête suspecte bloquée (reCAPTCHA)");
            res.status(400).json({ msg: 'Activité suspecte détectée' }); 
        } 
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur serveur.' });
    } finally {
        await client.close();
    }
});

function validateEmail(email) {
    const re = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/;
    return re.test(email);
}

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
