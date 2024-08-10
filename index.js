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
        // Gérer l'erreur de connexion à MongoDB, par exemple, arrêter l'application.
        process.exit(1); 
    });

// Configuration du middleware CORS
app.use(cors(corsOptions));
app.use(express.json()); 

app.post('/api/subscribers', async (req, res) => {
    try {
        console.log("Requête reçue !", req.body); //  <--  Ajoutez un log ici
        res.status(200).json({ msg: 'Requête reçue avec succès !' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur serveur.' });
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
