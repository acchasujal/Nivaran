export type IssueType = 'road_damage' | 'street_lighting' | 'garbage' | 'water' | 'footpath' | 'dumping';
export type IssueStatus = 'classified' | 'clustered' | 'pending_review' | 'drafted' | 'approved' | 'escalated';
export type RiskLevel = 'low' | 'moderate' | 'high';
export type DraftType = 'complaint' | 'rti' | 'community_summary';
export type DraftStatus = 'pending_review' | 'approved' | 'rejected';
export type EscalationMethod = 'email' | 'pdf_export';
export type EscalationStatus = 'sent' | 'failed' | 'exported';

export interface Issue {
  id: string;
  photo_url: string;
  latitude: number;
  longitude: number;
  user_note: string | null;
  issue_type: IssueType;
  severity: number;
  description: string;
  credibility_score: number;
  cluster_id: string | null;
  status: IssueStatus;
  created_at: string;
}

export interface Cluster {
  id: string;
  area_label: string;
  center_lat: number;
  center_lng: number;
  report_count: number;
  first_reported_at: string;
  last_reported_at: string;
}

export interface ImpactSummary {
  id: string;
  cluster_id: string;
  affected_area_description: string;
  potential_consequences: string;
  risk_level: RiskLevel;
  evidence_count: number;
  generated_at: string;
}

export interface ActionDraft {
  id: string;
  cluster_id: string;
  draft_type: DraftType;
  content: string;
  status: DraftStatus;
  created_at: string;
  reviewed_at: string | null;
  escalation?: Escalation | null; // Optional nested escalation if fetched
}

export interface Escalation {
  id: string;
  draft_id: string;
  method: EscalationMethod;
  recipient: string | null;
  status: EscalationStatus;
  provider_response: string | null;
  sent_at: string | null;
  created_at: string;
  pdf_download_url?: string; // PDF URL if status is exported
}

// API Response Shapes
export interface IssuesListResponse {
  issues: Issue[];
}

export interface IssueDetailResponse {
  issue: Issue;
  cluster: Cluster | null;
  impact_summary: ImpactSummary | null;
  action_drafts: ActionDraft[];
  image_integrity_status?: string | null;
  image_integrity_similarity?: number | null;
  verification_similarity?: number | null;
  verification_threshold?: number | null;
  verification_decision?: string | null;
}

export interface ClusterDetailResponse {
  cluster: Cluster;
  issues: Issue[];
}

export interface DraftsListResponse {
  drafts: ActionDraft[];
}

export interface ValidationErrors {
  error: 'validation_error';
  fields: Record<string, string>;
}

export interface AIUnavailableError {
  error: 'ai_unavailable';
  retryable: boolean;
}
