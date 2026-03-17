# Performance Culture API

API intermediária para importar KPIs do Google Sheets via n8n para o Firebase.

## Variáveis de ambiente necessárias no Render:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL  
- FIREBASE_PRIVATE_KEY

## Endpoint:
POST /importar-kpis
Body: { "records": { "2026-3": { "gustavo": { "opa_avg": 4.9 } } } }
