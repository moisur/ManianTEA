const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb'); 

const app = express();
const port = process.env.PORT || 3000; 

const uri = "mongodb+srv://yervantj:iOJGJr40ZCTwKUYJ@manian.6e0opjx.mongodb.net/?retryWrites=true&w=majority&appName=Manian
"; 
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

app.use(express.json()); 

app.post('/api/subscribers', async (req, res) => {
    try {
        await client.connect();
        const db = client.db("Manian"); 
        const subscribers = db.collection("subscribers");

        const { email } = req.body; 
        const result = await subscribers.insertOne({ email });
        res.status(201).json({ msg: 'Merci de votre inscription !' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Erreur serveur.' });
    } finally {
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Serveur en écoute sur le port ${port}`);
});
