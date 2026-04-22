import { google, sheets_v4 } from "googleapis";

type StudentRow = {
  email: string;
  student_code: string;
  batch_name: string;
  phone_number: string;
  name: string;
};

type VerifyResult =
  | { found: false; already_submitted: false; cycle: string }
  | {
      found: true;
      already_submitted: boolean;
      cycle: string;
      student: StudentRow;
    };

const STUDENTS_TAB = "Students";
const SUBMITTED_TAB = "Submitted";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SUBMITTED_HEADERS = ["email", "batch_name", "cycle", "submitted_at"];
const CACHE_TTL_MS = 20_000;
const RESPONSE_HEADER = [
  "submitted_at",
  "email",
  "student_code",
  "name",
  "batch_name",
  "phone_number",
  "nps_score",
  "faculty_rating",
  "ta_rating",
  "coordinator_rating",
  "lms_rating",
  "ticketing_rating",
  "challenges_selected",
  "open_text_answer"
];

function required(name: string, value?: string) {
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function getCycleLabel(date = new Date()) {
  return date.toLocaleString("en-US", { month: "long", year: "numeric" });
}

export function getCurrentCycle() {
  return getCycleLabel();
}

function getBatchTabName(batchName: string, cycle: string) {
  void cycle;
  return `${batchName} - Response`;
}

function spreadsheetId() {
  return required("GOOGLE_SHEET_ID", process.env.GOOGLE_SHEET_ID);
}

function serviceAccountEmail() {
  return required(
    "GOOGLE_SERVICE_ACCOUNT_EMAIL",
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
  );
}

function serviceAccountPrivateKey() {
  return required(
    "GOOGLE_PRIVATE_KEY",
    process.env.GOOGLE_PRIVATE_KEY
  ).replace(/\\n/g, "\n");
}

let sheetsClient: sheets_v4.Sheets | null = null;
let submittedTabEnsured = false;

type CachedHeaders = HeaderMap & { expiresAt: number };
type CachedRows = { rows: string[][]; expiresAt: number };

const headerCache = new Map<string, CachedHeaders>();
const rowsCache = new Map<string, CachedRows>();

function getSheetsClient() {
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: serviceAccountEmail(),
    key: serviceAccountPrivateKey(),
    scopes: [SHEETS_SCOPE]
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type HeaderMap = {
  headers: string[];
  indexByHeader: Record<string, number>;
};

async function ensureTabWithHeader(tabName: string, requiredHeaders: string[]) {
  const sheets = getSheetsClient();
  const ssId = spreadsheetId();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: ssId });
  const existing = meta.data.sheets?.find((s) => s.properties?.title === tabName);

  if (!existing) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: ssId,
      requestBody: {
        requests: [{ addSheet: { properties: { title: tabName } } }]
      }
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: ssId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [requiredHeaders] }
    });
    invalidateTabCache(tabName);
    return;
  }

  const first = await sheets.spreadsheets.values.get({
    spreadsheetId: ssId,
    range: `${tabName}!1:1`
  });
  const current = (first.data.values?.[0] ?? []).map((v) => String(v).trim());
  const headerOk =
    current.length >= requiredHeaders.length &&
    requiredHeaders.every((h, i) => current[i] === h);

  if (!headerOk) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: ssId,
      range: `${tabName}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [requiredHeaders] }
    });
    invalidateTabCache(tabName);
  }
}

async function getHeaderMap(tabName: string): Promise<HeaderMap> {
  const cached = headerCache.get(tabName);
  if (cached && cached.expiresAt > Date.now()) {
    return { headers: cached.headers, indexByHeader: cached.indexByHeader };
  }

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${tabName}!1:1`
  });

  const headerRow = (res.data.values?.[0] ?? []).map((value) =>
    String(value).trim()
  );
  if (!headerRow.length) {
    throw new Error(`Tab "${tabName}" is missing header row`);
  }

  const indexByHeader: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i += 1) {
    indexByHeader[headerRow[i].toLowerCase()] = i;
  }

  headerCache.set(tabName, {
    headers: headerRow,
    indexByHeader,
    expiresAt: Date.now() + CACHE_TTL_MS
  });

  return { headers: headerRow, indexByHeader };
}

function getCell(row: string[], indexByHeader: Record<string, number>, header: string) {
  const idx = indexByHeader[header.toLowerCase()];
  if (idx === undefined) return "";
  return String(row[idx] ?? "");
}

async function getRows(tabName: string) {
  const cached = rowsCache.get(tabName);
  if (cached && cached.expiresAt > Date.now()) return cached.rows;

  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${tabName}!A2:Z`
  });
  const rows = (res.data.values ?? []).map((row) =>
    (row ?? []).map((cell) => String(cell ?? ""))
  );

  rowsCache.set(tabName, { rows, expiresAt: Date.now() + CACHE_TTL_MS });
  return rows;
}

function invalidateTabCache(tabName: string) {
  rowsCache.delete(tabName);
  headerCache.delete(tabName);
}

export async function getStudentByEmail(email: string) {
  const targetEmail = normalizeEmail(email);
  if (!targetEmail) return null;

  const { indexByHeader } = await getHeaderMap(STUDENTS_TAB);

  const emailIdx = indexByHeader.email;
  if (emailIdx === undefined) {
    throw new Error(`Tab "${STUDENTS_TAB}" must contain "email" header`);
  }

  const rows = await getRows(STUDENTS_TAB);

  for (const row of rows) {
    if (normalizeEmail(String(row[emailIdx] ?? "")) !== targetEmail) continue;

    return {
      email: normalizeEmail(getCell(row, indexByHeader, "email")),
      student_code: getCell(row, indexByHeader, "student_code"),
      batch_name: getCell(row, indexByHeader, "batch_name"),
      phone_number: getCell(row, indexByHeader, "phone_number"),
      name: getCell(row, indexByHeader, "name")
    } satisfies StudentRow;
  }

  return null;
}

export async function hasSubmitted(email: string, cycle: string) {
  const targetEmail = normalizeEmail(email);
  if (!targetEmail || !cycle) return false;

  if (!submittedTabEnsured) {
    await ensureTabWithHeader(SUBMITTED_TAB, SUBMITTED_HEADERS);
    submittedTabEnsured = true;
  }

  const { indexByHeader } = await getHeaderMap(SUBMITTED_TAB);
  const emailIdx = indexByHeader.email;
  const cycleIdx = indexByHeader.cycle;

  if (emailIdx === undefined || cycleIdx === undefined) {
    throw new Error(`Tab "${SUBMITTED_TAB}" must contain "email" and "cycle" headers`);
  }

  const rows = await getRows(SUBMITTED_TAB);

  return rows.some(
    (row) =>
      normalizeEmail(String(row[emailIdx] ?? "")) === targetEmail &&
      String(row[cycleIdx] ?? "").trim() === cycle
  );
}

export async function appendResponse(
  batchName: string,
  cycle: string,
  rowData: {
    submitted_at: string;
    email: string;
    student_code: string;
    name: string;
    batch_name: string;
    phone_number: string;
    nps_score: number;
    faculty_rating: number;
    ta_rating: number;
    coordinator_rating: number;
    lms_rating: number;
    ticketing_rating: number;
    challenges_selected: string;
    open_text_answer: string;
  }
) {
  const tab = getBatchTabName(batchName, cycle);
  await ensureTabWithHeader(tab, RESPONSE_HEADER);
  const sheets = getSheetsClient();
  const { headers } = await getHeaderMap(tab);
  const rowDataByKey = Object.fromEntries(
    Object.entries(rowData).map(([k, v]) => [k.toLowerCase(), v])
  ) as Record<string, string | number>;
  const row = headers.map((header) => {
    const value = rowDataByKey[header.toLowerCase()];
    return value === undefined ? "" : String(value);
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row]
    }
  });
  invalidateTabCache(tab);
}

export async function appendSubmitted(email: string, batchName: string, cycle: string) {
  await ensureTabWithHeader(SUBMITTED_TAB, SUBMITTED_HEADERS);
  submittedTabEnsured = true;
  const sheets = getSheetsClient();
  const { headers } = await getHeaderMap(SUBMITTED_TAB);
  const payload: Record<string, string> = {
    submitted_at: new Date().toISOString(),
    email: normalizeEmail(email),
    batch_name: batchName,
    cycle
  };
  const row = headers.map((header) => payload[header.toLowerCase()] ?? "");

  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${SUBMITTED_TAB}!A:Z`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [row]
    }
  });
  invalidateTabCache(SUBMITTED_TAB);
}

export async function verifyStudentSubmissionState(email: string): Promise<VerifyResult> {
  const cycle = getCurrentCycle();
  const student = await getStudentByEmail(email);
  if (!student) return { found: false, already_submitted: false, cycle };
  const already_submitted = await hasSubmitted(student.email, cycle);
  return { found: true, already_submitted, cycle, student };
}

