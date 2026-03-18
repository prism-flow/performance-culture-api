const express = require('express');
const admin = require('firebase-admin');
const app = express();

app.use(express.json());

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const MO = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

function ckey(mes, ano) {
  const idx = MO.findIndex(m => m.toLowerCase() === String(mes).toLowerCase());
  if (idx === -1) return null;
  return `${ano}-${idx + 1}`;
}

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Performance Culture API rodando!' });
});

app.post('/kpi', async (req, res) => {
  try {
    const data = req.body;
    if (!data.colaborador_id || !data.mes || !data.ano) {
      return res.status(400).json({ error: 'Campos obrigatórios: colaborador_id, mes, ano' });
    }
    const key = ckey(data.mes, data.ano);
    if (!key) return res.status(400).json({ error: `Mes invalido: ${data.mes}` });

    const kpiData = {};
    const campos = [
      'ixc_qty','opa_qty','pabx_qty',
      'opa_eval_pct','opa_avg',
      'pabx_eval_pct','pabx_avg',
      'resolucao','resolucao_n1','resolucao_n2',
      'qualitativa','iqi','fcr',
      'proj_completos','reinc_pf','reinc_pj',
      'escal_n2','escal_analista','escal_tecnico',
      'assiduidade'
    ];
    campos.forEach(campo => {
      const val = data[campo];
      if (val !== null && val !== undefined && val !== '') {
        const num = parseFloat(val);
        if (!isNaN(num)) kpiData[campo] = num;
      }
    });

    const docRef = db.collection('app').doc('state');
    await docRef.set({
      records: { [key]: { [data.colaborador_id]: kpiData } }
    }, { merge: true });

    console.log(`KPI salvo: ${data.colaborador_id} - ${data.mes} ${data.ano} - chave ${key}`);
    res.json({ success: true, key, colaborador: data.colaborador_id });
  } catch (err) {
    console.error('Erro ao salvar KPI:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
