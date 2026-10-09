# Professor Mailer - frontend

React (Vite) interface for the `prof-mailer` backend.

## Run (two terminals)
1. Backend, in the `prof-mailer` folder:
   `uvicorn app.main:app --reload`
2. Frontend, in this folder:
   ```
   npm install
   npm run dev
   ```
   Open http://localhost:5173

Requests to `/api/*` are forwarded to the backend at http://127.0.0.1:8000 (see `vite.config.js`).
If the backend has an `API_KEY` set, the app asks for it on first load and keeps it in your browser.

## Typical flow
1. **Message**: edit subject/body, upload your CV, send a test to yourself.
2. **Professors**: import your Excel file (University, Professor Name, Email).
3. **Schedule**: choose start time, gap, and emails per day.
4. Watch the progress bar. Failed emails show their error; use "Retry failed" to requeue them.
