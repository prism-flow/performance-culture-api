const express = require('express');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
app.use(express.json({ limit: '10mb' }));

// Inicializa Firebase Admin com as credenciais do projeto
initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore();

// Rota de saúde
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Performance Culture API rodando!' });
});

// Rota para salvar KPIs
app.post('/importar-kpis', async (req, res) => {
  try {
    const { records } = req.body;
    if (!records) {
      return res.status(400).json({ error: 'Campo records é obrigatório' });
    }

    const ref = db.collection('app').doc('state');
    const snap = await ref.get();

    // Mescla os records novos com os existentes
    const existing = snap.exists ? (snap.data().records || {}) : {};
    const merged = { ...existing };

    for (const [mesAno, colabs] of Object.entries(records)) {
      if (!merged[mesAno]) merged[mesAno] = {};
      for (const [colabId, kpis] of Object.entries(colabs)) {
        merged[mesAno][colabId] = {
          ...(merged[mesAno][colabId] || {}),
          ...kpis
        };
      }
    }

    await ref.set({ records: merged }, { merge: true });

    res.json({
      status: 'sucesso',
      mensagem: `KPIs importados com sucesso!`,
      meses: Object.keys(records),
      colaboradores: [...new Set(Object.values(records).flatMap(m => Object.keys(m)))]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
