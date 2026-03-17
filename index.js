const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

// Inicializa Firebase Admin
const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Rota de status
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Performance Culture API rodando!' });
});

// Rota para receber KPIs do n8n
app.post('/kpi', async (req, res) => {
  try {
    const data = req.body;

    if (!data.colaborador_id || !data.mes || !data.ano) {
      return res.status(400).json({ error: 'Campos obrigatórios: colaborador_id, mes, ano' });
    }

    const docId = `${data.colaborador_id}_${data.mes}_${data.ano}`;
    const docRef = db.collection('kpi_lancamentos').doc(docId);

    await docRef.set({
      ...data,
      atualizado_em: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    res.json({ success: true, id: docId });
  } catch (err) {
    console.error('Erro ao salvar KPI:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API rodando na porta ${PORT}`);
});
