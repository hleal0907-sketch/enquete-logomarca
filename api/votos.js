const { MongoClient } = require('mongodb');

// Substitua pela sua connection string do MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://seu-usuario:sua-senha@cluster0.xxxxx.mongodb.net/enquete-logomarca?retryWrites=true&w=majority';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  cachedClient = client;
  return client;
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const client = await connectToDatabase();
    const db = client.db('enquete-logomarca');
    const collection = db.collection('votos');

    if (req.method === 'GET') {
      // Retorna todos os votos ordenados por data
      const votos = await collection.find({}).sort({ createdAt: -1 }).toArray();
      res.status(200).json(votos);
    } 
    else if (req.method === 'POST') {
      // Registra novo voto
      const { nome, logo, nota } = req.body;

      if (!nome || !logo || nota === undefined) {
        res.status(400).json({ error: 'Dados incompletos' });
        return;
      }

      const voto = {
        nome: nome.trim(),
        logo,
        nota: parseFloat(nota),
        createdAt: new Date()
      };

      await collection.insertOne(voto);
      res.status(201).json({ success: true, voto });
    } 
    else {
      res.status(405).json({ error: 'Método não permitido' });
    }
  } catch (error) {
    console.error('Erro no servidor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
