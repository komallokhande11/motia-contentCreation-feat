# Motia Content Creation App

Minimal setup to run and test the content creation flow end-to-end.

## Setup

1) Install dependencies
```bash
npm install
```

2) (Optional) Set OpenAI key for better content quality
```bash
# .env
OPENAI_API_KEY=your_openai_api_key
```

3) Start the dev server
```bash
npx motia@latest dev
```

## Trigger a run

PowerShell:
```powershell
$body = Get-Content -Raw .\body.json
Invoke-RestMethod -Method POST -Uri "http://localhost:3000/api/content-request" -ContentType "application/json" -Body $body
```

CMD (curl):
```cmd
curl -X POST "http://localhost:3000/api/content-request" -H "Content-Type: application/json" --data-binary "@body.json"
```

## What to expect
- The flow runs: content-request → topic-research → ai-content-generator → quality-assurance → multi-platform-publisher → performance-tracker
- The publisher is stubbed and returns fake IDs (no real external posting)
- Check the terminal logs for:
  - "QA completed"
  - "Content published across platforms"






