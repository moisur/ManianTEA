const cors = require('cors');
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb'); 
require('dotenv').config(); // Charger les variables d'environnement à partir du fichier .env

const app = express();
const port = process.env.PORT || 10000; 

const uri = process.env.MONGODB_URI;

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

app.post('https://backend-maniantea.onrender.com/api/subscribers', async (req, res) => {
    try {
        const subscribers = db.collection("Mails");

        const { email } = req.body; 
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
