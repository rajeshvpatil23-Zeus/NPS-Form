## Monthly Feedback Web App (BITSoM CEPD x Masai School)

### Setup

1. Copy env file

```bash
copy .env.example .env
```

2. Install deps (your machine currently has `node` but not `npm`; install Node.js from `https://nodejs.org/` to get npm, then)

```bash
npm install
```

3. Prisma

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

4. Run

```bash
npm run dev
```

### Cron reminders

Send reminders:

```bash
curl -X POST "http://localhost:3000/api/cron/send-reminders" -H "CRON_SECRET: <value>"
```

### Google Sheets Integration

This project is wired to use Google Sheets directly via a Google Service Account from `lib/sheets.ts`.

1. Create Google Sheet tabs:
   - `Students` with headers: `email,student_code,batch_name,phone_number,name`
   - `Submitted` with headers: `submitted_at,email,batch_name,cycle`
   - One response tab per batch named like `Your Batch - Response` with row-1 headers matching `rowData` keys in `lib/sheets.ts`

2. In Google Cloud:
   - Create/select a project
   - Enable **Google Sheets API**
   - Create a Service Account
   - Create and download a JSON key

3. Share your sheet with the Service Account email (Editor access)
   - Service account email looks like: `name@project-id.iam.gserviceaccount.com`

4. Set app env values in `.env`:

```env
GOOGLE_SHEET_ID=your-sheet-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5. Restart `npm run dev` and test:
   - Verify email: `GET /api/student?email=someone@example.com`
   - Submit feedback from UI or call `POST /api/submit-feedback`

