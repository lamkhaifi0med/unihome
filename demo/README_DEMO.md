# UniHome Demo (Visual Report)

This demo generates a visual HTML report from the live API.

## Prereqs
- API running on http://localhost:8080
- Basic auth credentials (default: admin/admin)
- A valid logementId in DB
- Two photo files for upload

## Run (GET only)
```powershell
powershell -ExecutionPolicy Bypass -File .\demo\run-demo.ps1
```

## Run (POST + GET)
```powershell
powershell -ExecutionPolicy Bypass -File .\demo\run-demo.ps1 -DoPost \
  -LogementId "<LOGEMENT_ID>" \
  -Photo1 "C:\\path\\to\\photo1.jpg" \
  -Photo2 "C:\\path\\to\\photo2.jpg"
```

## Output
The report is generated here:
- demo\report.html

Open it in a browser to show the demo visually.

## Notes
- If the AI microservice is not running, the POST still works with fallback (EN_ATTENTE).
- The report includes status codes and response bodies for proof.

