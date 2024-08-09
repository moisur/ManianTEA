const cors = require('cors');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb'); 
require('dotenv').config(); // Charger les variables d'environnement à partir du fichier .env
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

const app = express();
const port = process.env.PORT || 10000; 

const uri = process.env.MONGODB_URI;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;

const recaptchaClient = new RecaptchaEnterpriseServiceClient();

let db; // Variable globale pour la base de données

// Connexion à MongoDB lors du démarrage du serveur
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.connect()
    .then(() => {
        db = client.db("Manian"); // Assignation de la base de données à la variable globale
        console.log("Connexion à MongoDB réussie !");
    })
    .catch((err) => {
        console.error("Erreur lors de la connexion à MongoDB", err);
    });

app.use(cors()); 
app.use(express.json()); 

// Route pour ajouter des abonnés à la base de données avec validation du reCAPTCHA
app.post('/api/subscribers', async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body; 
        
        // Validation du token reCAPTCHA
        const recaptchaResponse = await recaptchaClient.assessments.createAssessment({
            parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}`,
            assessment: {
                event: {
                    token: recaptchaToken,
                    siteKey: process.env.RECAPTCHA_SITE_KEY,
                    expectedAction: 'LOGIN', // Remplacez par l'action appropriée
                },
            },
        });

        const recaptchaScore = recaptchaResponse[0].result.score;

        if (recaptchaScore < 0.5) { // Adjust threshold as needed
            return res.status(400).json({ msg: 'Validation reCAPTCHA échouée. Veuillez réessayer.' });
        }

        // Si le reCAPTCHA est validé, ajoutez l'email à la base de données
        const subscribers = db.collection("Mails");
        const result = await subscribers.insertOne({ email });
        res.status(201).json({ msg: 'Merci de votre inscription !' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
