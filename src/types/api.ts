// --- Auth ---
export interface User {
  id: string;
  email: string;
}

// --- Consent ---
export interface Consent {
  id: string;
  userId: string;
  consentedAt: string;
  dataUsage: boolean;
  llmDataFlow: boolean;
  deletionRights: boolean;
}

// --- Patient ---
export interface Patient {
  id: string;
  userId: string;
  metriportPatientId: string;
  sandboxPersona: string;
  facilityId: string;
  status: "pending" | "querying" | "downloading" | "processing" | "partial" | "ready" | "failed";
  hasPartialData: boolean;
  queryRequestId: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
}

export type Persona = "Jane" | "Chris" | "Ollie" | "Kyla" | "Andreas";

export interface PatientStatus {
  status: "pending" | "querying" | "downloading" | "processing" | "partial" | "ready" | "failed";
}

// --- Citation ---
export interface Citation {
  resourceType: string;
  resourceId: string;
  excerpt: string | null;
  date: string | null;
  source: string | null;
}

// --- Dashboard ---
export interface DashboardResponse {
  patient: {
    id: string;
    sandboxPersona: string | null;
    status: string;
    lastSyncedAt: string | null;
  };
  summary: {
    totalResources: number;
    conditions: number;
    medications: number;
    activeMedications: number;
    observations: number;
    immunizations: number;
    encounters: number;
    procedures: number;
    diagnosticReports: number;
  };
  recentActivity: Array<{
    id: string;
    resourceType: string;
    displayText: string | null;
    dateRecorded: string | null;
    source: string | null;
    citation: Citation;
  }>;
}

// --- Timeline ---
export interface TimelineItem {
  id: string;
  resourceType: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface TimelineResponse {
  items: TimelineItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TimelineDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Medications ---
export interface MedicationItem {
  id: string;
  name: string | null;
  status: string | null;
  dosage: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface MedicationsResponse {
  active: MedicationItem[];
  other: MedicationItem[];
}

export interface MedicationDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Medication Insights ---
export interface DuplicateOccurrence {
  id: string;
  date: string | null;
  source: string | null;
  dosage: string | null;
  citation: Citation;
}

export interface DuplicateGroup {
  drug: string;
  occurrences: DuplicateOccurrence[];
  providers: string[];
  isMultiProvider: boolean;
}

export interface ChangeEntry {
  id: string;
  date: string | null;
  dosage: string | null;
  status: string | null;
  citation: Citation;
}

export interface ChangeGroup {
  drug: string;
  history: ChangeEntry[];
  summary: string;
}

export interface InsightFinding {
  text: string;
  severity: "info" | "warning";
  citations: Citation[];
}

export interface MedicationInsightsResponse {
  findings: InsightFinding[];
  narrativeSummary: string;
  insights: {
    duplicates: DuplicateGroup[];
    changes: ChangeGroup[];
    summary: {
      totalUnique: number;
      totalActive: number;
      totalStopped: number;
      providerCount: number;
      providers: string[];
    };
  };
  methodology: {
    description: string;
    steps: string[];
    limitations: string[];
  };
}

// --- Immunizations ---
export interface ImmunizationItem {
  id: string;
  name: string | null;
  status: string | null;
  dateRecorded: string | null;
  source: string | null;
  citation: Citation;
}

export interface ImmunizationsResponse {
  items: ImmunizationItem[];
  total: number;
}

export interface ImmunizationEntry {
  id: string;
  name: string;
  date: string | null;
  status: string | null;
  source: string | null;
  citation: Citation;
}

export interface VaccineGroup {
  vaccine: string;
  doses: ImmunizationEntry[];
  isMultiDose: boolean;
  providers: string[];
}

export interface ImmunizationInsightsResponse {
  findings: InsightFinding[];
  narrativeSummary: string;
  insights: {
    vaccines: VaccineGroup[];
    summary: {
      totalImmunizations: number;
      uniqueVaccines: number;
      providerCount: number;
      providers: string[];
      dateRange: { earliest: string | null; latest: string | null };
    };
  };
  timeline: ImmunizationEntry[];
  methodology: {
    description: string;
    steps: string[];
    limitations: string[];
  };
}

export interface ImmunizationDetail {
  id: string;
  resourceType: string;
  resourceId: string;
  displayText: string | null;
  dateRecorded: string | null;
  source: string | null;
  data: unknown;
  citation: Citation;
}

// --- Chat ---
export interface ChatCitation {
  index: number;
  resourceType: string;
  fhirResourceId: string;
  excerpt: string;
  date: string | null;
}

export type ChatSSEEvent =
  | { type: "text_delta"; text: string }
  | { type: "citations"; citations: ChatCitation[] }
  | { type: "done"; sessionId: string; messageId: string }
  | { type: "error"; error: string };

export interface ChatSession {
  id: string;
  createdAt: string;
  preview: string | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations: ChatCitation[] | null;
  createdAt: string;
}

// --- Upload SSE ---
export type UploadSSEEvent =
  | { type: "upload_created"; uploadId: string }
  | { type: "progress"; step: number; totalSteps: number; description: string; percent: number }
  | { type: "complete"; uploadId: string; resourceCount: number; resources: Array<{ resourceType: string; displayText: string | null }> }
  | { type: "resumed"; uploadId: string; chunksCompleted: number; totalChunks: number }
  | { type: "error"; error: string };

// --- Documents (Metriport source documents) ---
export interface DocumentItem {
  id: string;
  fileName: string;
  description?: string;
  status?: string;
  indexed?: string;
  mimeType?: string;
  size?: number;
  source?: "metriport" | "upload";
  fileUrl?: string | null;
  extractedCount?: number;
  type?: {
    coding?: Array<{
      system?: string | null;
      code?: string | null;
      display?: string | null;
    }>;
    text?: string;
  };
}

export interface DocumentListResponse {
  documents: DocumentItem[];
}

export interface DocumentUrlResponse {
  url: string;
}

export interface DocumentForResourceResponse {
  fileName: string | null;
  description: string | null;
  mimeType: string | null;
}

// --- Export ---
export interface ExportFormat {
  id: "pdf" | "csv" | "fhir" | "archive";
  name: string;
  description: string;
  fileType: string;
}

export interface ExportFormatsResponse {
  formats: ExportFormat[];
}

export interface ExportQuery {
  format: "pdf" | "csv" | "fhir" | "archive";
  sections?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export type ExportSection =
  | "conditions"
  | "medications"
  | "immunizations"
  | "allergies"
  | "encounters"
  | "procedures"
  | "observations"
  | "diagnosticReports";

// --- Settings ---
export interface SettingsResponse {
  aiModeEnabled: boolean;
  connectedPersona: string | null;
  hasPatient: boolean;
  patientStatus: string | null;
  lastSyncedAt: string | null;
}
