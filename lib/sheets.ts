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

export type ResponseView = {
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
  cycle: string;
};

const STUDENTS_TAB = "Students";
const SUBMITTED_TAB = "Submitted";
const ALL_RESPONSES_TAB = "All Responces";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SUBMITTED_HEADERS = [
  "email",
  "batch_name",
  "cycle",
  "submitted_at",
  "idempotency_key"
];
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

function normalizeGeneric(value: string) {
  return value.trim().toLowerCase();
}

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isRetriableError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const status = (error as Error & { code?: number | string }).code;
  const message = error.message.toLowerCase();
  if (typeof status === "number" && [408, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }
  return (
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("timeout") ||
    message.includes("econnreset") ||
    message.includes("socket hang up") ||
    message.includes("internal error")
  );
}

async function withRetry<T>(task: () => Promise<T>, attempts = 4): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await task();
    } catch (error) {
      lastError = error;
      if (attempt >= attempts || !isRetriableError(error)) {
        throw error;
      }
      const backoffMs = 150 * 2 ** (attempt - 1) + Math.floor(Math.random() * 120);
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

function cycleFromDateString(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return getCycleLabel(date);
}

type HeaderMap = {
  headers: string[];
  indexByHeader: Record<string, number>;
};

async function ensureTabWithHeader(tabName: string, requiredHeaders: string[]) {
  const sheets = getSheetsClient();
  const ssId = spreadsheetId();
  const meta = await withRetry(() =>
    sheets.spreadsheets.get({ spreadsheetId: ssId })
  );
  const existing = meta.data.sheets?.find((s) => s.properties?.title === tabName);

  if (!existing) {
    await withRetry(() =>
      sheets.spreadsheets.batchUpdate({
        spreadsheetId: ssId,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tabName } } }]
        }
      })
    );
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: ssId,
        range: `${tabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [requiredHeaders] }
      })
    );
    invalidateTabCache(tabName);
    return;
  }

  const first = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: ssId,
      range: `${tabName}!1:1`
    })
  );
  const current = (first.data.values?.[0] ?? []).map((v) => String(v).trim());
  const headerOk =
    current.length >= requiredHeaders.length &&
    requiredHeaders.every((h, i) => current[i] === h);

  if (!headerOk) {
    await withRetry(() =>
      sheets.spreadsheets.values.update({
        spreadsheetId: ssId,
        range: `${tabName}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [requiredHeaders] }
      })
    );
    invalidateTabCache(tabName);
  }
}

async function getHeaderMap(tabName: string): Promise<HeaderMap> {
  const cached = headerCache.get(tabName);
  if (cached && cached.expiresAt > Date.now()) {
    return { headers: cached.headers, indexByHeader: cached.indexByHeader };
  }

  const sheets = getSheetsClient();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${tabName}!1:1`
    })
  );

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
  const res = await withRetry(() =>
    sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId(),
      range: `${tabName}!A2:Z`
    })
  );
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

function isTabCacheFresh(tabName: string) {
  const now = Date.now();
  const headers = headerCache.get(tabName);
  const rows = rowsCache.get(tabName);
  return Boolean(headers && rows && headers.expiresAt > now && rows.expiresAt > now);
}

function toHeaderMap(headers: string[]): HeaderMap {
  const indexByHeader: Record<string, number> = {};
  for (let i = 0; i < headers.length; i += 1) {
    indexByHeader[headers[i].toLowerCase()] = i;
  }
  return { headers, indexByHeader };
}

function cacheTabData(tabName: string, headers: string[], rows: string[][]) {
  const expiresAt = Date.now() + CACHE_TTL_MS;
  const headerMap = toHeaderMap(headers);
  headerCache.set(tabName, { ...headerMap, expiresAt });
  rowsCache.set(tabName, { rows, expiresAt });
}

async function warmVerifyCachesFromBatchGet() {
  const sheets = getSheetsClient();
  const res = await withRetry(() =>
    sheets.spreadsheets.values.batchGet({
      spreadsheetId: spreadsheetId(),
      ranges: [
        `${STUDENTS_TAB}!1:1`,
        `${STUDENTS_TAB}!A2:Z`,
        `${SUBMITTED_TAB}!1:1`,
        `${SUBMITTED_TAB}!A2:Z`
      ]
    })
  );

  const ranges = res.data.valueRanges ?? [];
  const studentsHeaders = (ranges[0]?.values?.[0] ?? []).map((v) =>
    String(v ?? "").trim()
  );
  const studentsRows = (ranges[1]?.values ?? []).map((row) =>
    (row ?? []).map((cell) => String(cell ?? ""))
  );
  const submittedHeaders = (ranges[2]?.values?.[0] ?? []).map((v) =>
    String(v ?? "").trim()
  );
  const submittedRows = (ranges[3]?.values ?? []).map((row) =>
    (row ?? []).map((cell) => String(cell ?? ""))
  );

  if (studentsHeaders.length > 0) {
    cacheTabData(STUDENTS_TAB, studentsHeaders, studentsRows);
  }

  // Submitted tab can be missing for a fresh sheet; treat as empty.
  if (submittedHeaders.length > 0) {
    cacheTabData(SUBMITTED_TAB, submittedHeaders, submittedRows);
  } else {
    rowsCache.set(SUBMITTED_TAB, {
      rows: [],
      expiresAt: Date.now() + CACHE_TTL_MS
    });
    headerCache.delete(SUBMITTED_TAB);
  }
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

export async function getStudentByIdentifier(identifier: string) {
  const raw = identifier.trim();
  if (!raw) return null;
  const normalized = normalizeGeneric(raw);
  const normalizedPhone = normalizePhone(raw);

  const { indexByHeader } = await getHeaderMap(STUDENTS_TAB);
  const emailIdx = indexByHeader.email;
  const codeIdx = indexByHeader.student_code;
  const phoneIdx = indexByHeader.phone_number;

  if (emailIdx === undefined) {
    throw new Error(`Tab "${STUDENTS_TAB}" must contain "email" header`);
  }

  const rows = await getRows(STUDENTS_TAB);
  for (const row of rows) {
    const rowEmail = normalizeEmail(String(row[emailIdx] ?? ""));
    const rowCode = codeIdx === undefined ? "" : normalizeGeneric(String(row[codeIdx] ?? ""));
    const rowPhone =
      phoneIdx === undefined ? "" : normalizePhone(String(row[phoneIdx] ?? ""));

    if (
      rowEmail === normalized ||
      (rowCode !== "" && rowCode === normalized) ||
      (normalizedPhone !== "" && rowPhone !== "" && rowPhone === normalizedPhone)
    ) {
      return {
        email: normalizeEmail(getCell(row, indexByHeader, "email")),
        student_code: getCell(row, indexByHeader, "student_code"),
        batch_name: getCell(row, indexByHeader, "batch_name"),
        phone_number: getCell(row, indexByHeader, "phone_number"),
        name: getCell(row, indexByHeader, "name")
      } satisfies StudentRow;
    }
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
  void batchName;
  void cycle;
  const tab = ALL_RESPONSES_TAB;
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

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId(),
      range: `${tab}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row]
      }
    })
  );
  invalidateTabCache(tab);
}

export async function appendSubmitted(
  email: string,
  batchName: string,
  cycle: string,
  idempotencyKey?: string
) {
  await ensureTabWithHeader(SUBMITTED_TAB, SUBMITTED_HEADERS);
  submittedTabEnsured = true;
  const sheets = getSheetsClient();
  const { headers } = await getHeaderMap(SUBMITTED_TAB);
  const payload: Record<string, string> = {
    submitted_at: new Date().toISOString(),
    email: normalizeEmail(email),
    batch_name: batchName,
    cycle,
    idempotency_key: (idempotencyKey ?? "").trim()
  };
  const row = headers.map((header) => payload[header.toLowerCase()] ?? "");

  await withRetry(() =>
    sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId(),
      range: `${SUBMITTED_TAB}!A:Z`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row]
      }
    })
  );
  invalidateTabCache(SUBMITTED_TAB);
}

export async function hasIdempotencyKey(idempotencyKey: string) {
  const key = idempotencyKey.trim();
  if (!key) return false;
  await ensureTabWithHeader(SUBMITTED_TAB, SUBMITTED_HEADERS);
  const { indexByHeader } = await getHeaderMap(SUBMITTED_TAB);
  const keyIdx = indexByHeader.idempotency_key;
  if (keyIdx === undefined) return false;
  const rows = await getRows(SUBMITTED_TAB);
  return rows.some((row) => String(row[keyIdx] ?? "").trim() === key);
}

export async function verifyStudentSubmissionState(
  identifier: string
): Promise<VerifyResult> {
  const cycle = getCurrentCycle();
  if (!identifier.trim()) return { found: false, already_submitted: false, cycle };

  // Fast path: one API call can warm both Students + Submitted caches.
  if (!isTabCacheFresh(STUDENTS_TAB) || !isTabCacheFresh(SUBMITTED_TAB)) {
    await warmVerifyCachesFromBatchGet();
  }

  const student = await getStudentByIdentifier(identifier);
  if (!student) return { found: false, already_submitted: false, cycle };

  // Avoid ensure/create here to keep verify path fast; missing Submitted means no prior submissions.
  const submittedHeader = headerCache.get(SUBMITTED_TAB);
  const submittedRows = rowsCache.get(SUBMITTED_TAB)?.rows ?? [];
  const emailIdx = submittedHeader?.indexByHeader.email;
  const cycleIdx = submittedHeader?.indexByHeader.cycle;

  let already_submitted = false;
  if (emailIdx !== undefined && cycleIdx !== undefined) {
    already_submitted = submittedRows.some(
      (row) =>
        normalizeEmail(String(row[emailIdx] ?? "")) === student.email &&
        String(row[cycleIdx] ?? "").trim() === cycle
    );
  }

  return { found: true, already_submitted, cycle, student };
}

export async function getCurrentCycleResponseByEmail(email: string) {
  const cycle = getCurrentCycle();
  const student = await getStudentByEmail(email);
  if (!student) return null;

  await ensureTabWithHeader(SUBMITTED_TAB, SUBMITTED_HEADERS);

  const submittedHeader = await getHeaderMap(SUBMITTED_TAB);
  const submittedRows = await getRows(SUBMITTED_TAB);
  const emailIdx = submittedHeader.indexByHeader.email;
  const cycleIdx = submittedHeader.indexByHeader.cycle;

  if (emailIdx === undefined || cycleIdx === undefined) {
    return null;
  }

  const submittedForCycle = submittedRows
    .filter(
      (row) =>
        normalizeEmail(String(row[emailIdx] ?? "")) === student.email &&
        String(row[cycleIdx] ?? "").trim() === cycle
    )
    .at(-1);

  if (!submittedForCycle) return null;

  const responseTab = ALL_RESPONSES_TAB;
  await ensureTabWithHeader(responseTab, RESPONSE_HEADER);
  const responseHeader = await getHeaderMap(responseTab);
  const responseRows = await getRows(responseTab);
  const responseEmailIdx = responseHeader.indexByHeader.email;
  const responseSubmittedAtIdx = responseHeader.indexByHeader.submitted_at;

  if (responseEmailIdx === undefined || responseSubmittedAtIdx === undefined) {
    return null;
  }

  const matched = responseRows
    .filter((row) => normalizeEmail(String(row[responseEmailIdx] ?? "")) === student.email)
    .filter((row) => cycleFromDateString(String(row[responseSubmittedAtIdx] ?? "")) === cycle)
    .at(-1);

  if (!matched) return null;

  const readNumber = (header: string) => Number(getCell(matched, responseHeader.indexByHeader, header) || 0);

  return {
    submitted_at: getCell(matched, responseHeader.indexByHeader, "submitted_at"),
    email: getCell(matched, responseHeader.indexByHeader, "email"),
    student_code: getCell(matched, responseHeader.indexByHeader, "student_code"),
    name: getCell(matched, responseHeader.indexByHeader, "name"),
    batch_name: getCell(matched, responseHeader.indexByHeader, "batch_name"),
    phone_number: getCell(matched, responseHeader.indexByHeader, "phone_number"),
    nps_score: readNumber("nps_score"),
    faculty_rating: readNumber("faculty_rating"),
    ta_rating: readNumber("ta_rating"),
    coordinator_rating: readNumber("coordinator_rating"),
    lms_rating: readNumber("lms_rating"),
    ticketing_rating: readNumber("ticketing_rating"),
    challenges_selected: getCell(matched, responseHeader.indexByHeader, "challenges_selected"),
    open_text_answer: getCell(matched, responseHeader.indexByHeader, "open_text_answer"),
    cycle
  } satisfies ResponseView;
}

