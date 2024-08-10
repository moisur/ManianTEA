const cors = require('cors');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 10000; 

const corsOptions = {
  origin: 'https://moisur.github.io',
  optionsSuccessStatus: 200 
};

const uri = process.env.MONGODB_URI;
const recaptchaSecretKey = process.env.RECAPTCHA_SECRET_KEY;
const recaptchaSiteKey =  '6Ld37SIqAAAAALzGUoYS1444GFxYwR6OODSRm6V7'; // <-- Vérifiez cette clé

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
        process.exit(1); 
    });

// Configuration du middleware CORS
app.use(cors(corsOptions));
app.use(express.json()); 

if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
  fs.writeFileSync('/tmp/google-credentials.json', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/google-credentials.json';
}
app.post('/api/subscribers', async (req, res) => {
    console.log('Received request to /api/subscribers');
    try {
        console.log('Request body:', req.body);
        const { email, token } = req.body;
        console.log('Extracted email:', email);

        // Vérification reCAPTCHA
        const client = new RecaptchaEnterpriseServiceClient();
        const projectPath = client.projectPath(process.env.GOOGLE_CLOUD_PROJECT);
        const request = {
            parent: projectPath,
            assessment: {
                event: {
                    token: token,
                    siteKey: recaptchaSiteKey
                }
            }
        };
        const [response] = await client.createAssessment(request);

        if (!response.tokenProperties.valid) {
            throw new Error('Invalid reCAPTCHA token');
        }

        if (response.riskAnalysis.score < 0.5) {
            throw new Error('reCAPTCHA score too low');
        }

        // Si la vérification reCAPTCHA est passée, procédez à l'insertion
        const subscribers = db.collection("Mails");
        console.log('Got subscribers collection');
        const result = await subscribers.insertOne({ email });
        console.log('Insert result:', result);
        res.status(201).json({ msg: 'Merci de votre inscription !' });
        console.log('Sent success response');
    } catch (error) {
        console.error('Error in /api/subscribers:', error);
        if (error.message === 'Invalid reCAPTCHA token' || error.message === 'reCAPTCHA score too low') {
            res.status(400).json({ msg: 'Vérification reCAPTCHA échouée.' });
        } else {
            res.status(500).json({ msg: 'Erreur serveur.' });
        }
    }
});


app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
