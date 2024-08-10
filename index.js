const cors = require('cors');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');

const app = express();
const port = process.env.PORT || 10000;

const corsOptions = {
  origin: 'https://moisur.github.io', 
  optionsSuccessStatus: 200 
};
const uri = process.env.MONGODB_URI;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
const recaptchaSiteKey =  '6Ld37SIqAAAAALzGUoYS1444GFxYwR6OODSRm6V7'; // <-- Assurez-vous que c'est la bonne clé

const recaptchaClient = new RecaptchaEnterpriseServiceClient();

let db;

// MongoDB Connection
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

client.connect()
    .then(() => {
        db = client.db("Manian");
        console.log("Connexion à MongoDB réussie !");
    })
    .catch((err) => {
        console.error("Erreur lors de la connexion à MongoDB", err);
    });

app.use(cors());
app.use(express.json());

app.post('/api/subscribers', async (req, res) => {
    try {
        const { email, recaptchaToken } = req.body;

        // Vérification reCAPTCHA Enterprise
        const recaptchaResponse = await recaptchaClient.assessments.createAssessment({
            parent: `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}`,
            assessment: {
                event: {
                    token: recaptchaToken,
                    siteKey: recaptchaSiteKey, // <-- Utiliser la variable ici
                    expectedAction: 'subscribe', // <-- Action correspondante
                },
            },
        });

        const recaptchaScore = recaptchaResponse[0].result.score;

        if (recaptchaScore < 0.5) { 
            return res.status(400).json({ msg: 'Validation reCAPTCHA échouée. Veuillez réessayer.' });
        }

        // Insertion dans MongoDB
        const subscribers = db.collection("Mails");
        const result = await subscribers.insertOne({ email });
        console.log(`Email ${email} ajouté à la base de données.`);
        res.status(201).json({ msg: 'Merci de votre inscription !' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
