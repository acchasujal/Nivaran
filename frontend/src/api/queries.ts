import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';
import type {
  Issue,
  IssueDetailResponse,
  IssuesListResponse,
  ActionDraft,
  Escalation,
  DraftsListResponse,
  ImpactSummary,
} from './types';

export interface PublicConfig {
  whatsapp_enabled: boolean;
  whatsapp_number: string;
  environment: string;
  gemini_model: string;
  escalation_threshold: number;
}

// Fetch public application configuration
export const usePublicConfig = () => {
  return useQuery<PublicConfig>({
    queryKey: ['publicConfig'],
    queryFn: async () => {
      const response = await apiClient.get<PublicConfig>('/config');
      return response.data;
    },
    staleTime: 300000, // 5 minutes cache to prevent duplicate requests across component mounts
  });
};

// Fetch all issues
export const useIssues = (clusterId?: string) => {
  return useQuery<IssuesListResponse>({
    queryKey: ['issues', { clusterId }],
    queryFn: async () => {
      const response = await apiClient.get<IssuesListResponse>('/issues', {
        params: clusterId ? { cluster_id: clusterId } : {},
      });
      return response.data;
    },
    staleTime: 30000, // 30 seconds cache to eliminate duplicate concurrent queries
  });
};

// Fetch issue details
export const useIssueDetail = (id: string) => {
  return useQuery<IssueDetailResponse>({
    queryKey: ['issue', id],
    queryFn: async () => {
      const response = await apiClient.get<IssueDetailResponse>(`/issues/${id}`);
      return response.data;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data as IssueDetailResponse | undefined;
      const status = data?.issue?.status;
      if (status && status !== 'drafted' && status !== 'approved' && status !== 'escalated') {
        return 2000;
      }
      return false;
    },
  });
};

// Submit a new issue (multipart/form-data)
export const useCreateIssue = () => {
  const queryClient = useQueryClient();
  return useMutation<Issue, Error, { photo: File; latitude: number; longitude: number; user_note?: string }>({
    mutationFn: async ({ photo, latitude, longitude, user_note }) => {
      const formData = new FormData();
      formData.append('photo', photo);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      if (user_note) {
        formData.append('user_note', user_note);
      }

      const response = await apiClient.post<Issue>('/issues', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
};

// Update action draft status (PATCH /action-drafts/{id})
export const useApproveDraft = (issueId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ActionDraft, Error, { draftId: string; status: 'approved' | 'rejected' }>({
    mutationFn: async ({ draftId, status }) => {
      const response = await apiClient.patch<ActionDraft>(`/action-drafts/${draftId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    },
  });
};

// Update action draft content and/or status
export const useUpdateDraft = (issueId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ActionDraft, Error, { draftId: string; status?: string; content?: string }>({
    mutationFn: async ({ draftId, status, content }) => {
      const response = await apiClient.patch<ActionDraft>(`/action-drafts/${draftId}`, { status, content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    },
  });
};

// Improve draft content via Gemini
export const useImproveDraft = () => {
  return useMutation<{ refined_text: string }, Error, { draftId: string; content: string; prompt?: string }>({
    mutationFn: async ({ draftId, content, prompt }) => {
      const response = await apiClient.post<{ refined_text: string }>(`/action-drafts/${draftId}/improve`, { content, prompt });
      return response.data;
    },
  });
};

// Trigger escalation (POST /escalations)
export const useEscalateDraft = (issueId: string) => {
  const queryClient = useQueryClient();
  return useMutation<Escalation, Error, { draftId: string; method: 'email' | 'pdf_export'; recipient?: string }>({
    mutationFn: async ({ draftId, method, recipient }) => {
      const response = await apiClient.post<Escalation>('/escalations', {
        draft_id: draftId,
        method,
        recipient: method === 'email' ? recipient : undefined,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    },
  });
};

// Trigger Agent 3 Manually (POST /clusters/{id}/impact)
export const useTriggerImpact = (issueId: string, clusterId: string) => {
  const queryClient = useQueryClient();
  return useMutation<ImpactSummary, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<ImpactSummary>(`/clusters/${clusterId}/impact`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    },
  });
};

// Trigger Agent 4 Manually (POST /clusters/{id}/generate-drafts)
export const useTriggerDrafts = (issueId: string, clusterId: string) => {
  const queryClient = useQueryClient();
  return useMutation<DraftsListResponse, Error, void>({
    mutationFn: async () => {
      const response = await apiClient.post<DraftsListResponse>(`/clusters/${clusterId}/generate-drafts`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issue', issueId] });
    },
  });
};

export interface ValidationMetrics {
  rejected_uploads: number;
  accepted_uploads: number;
  gemini_calls_saved: number;
  cache_hits: number;
  average_validation_latency_ms: number;
  total_validations: number;
}

// Fetch validation gate metrics
export const useValidationMetrics = () => {
  return useQuery<ValidationMetrics>({
    queryKey: ['validationMetrics'],
    queryFn: async () => {
      const response = await apiClient.get<ValidationMetrics>('/issues/metrics');
      return response.data;
    },
    refetchInterval: 5000,
  });
};

// Submit a community repair-verification vote (POST /cases/{id}/verify)
export const useSubmitVerificationVote = () => {
  return useMutation<
    { status: string; verification_status: string; votes_passed: number; votes_failed: number },
    Error,
    { caseId: string; vote: 'confirm' | 'not-repaired' | 'uncertain' }
  >({
    mutationFn: async ({ caseId, vote }) => {
      const response = await apiClient.post(`/cases/${caseId}/verify`, {
        vote_passed: vote === 'confirm',
      });
      return response.data;
    },
  });
};

export interface AnalyzeImageResult {
  ai_available: boolean;
  photo_url: string;
  gps_coords: [number, number] | null;
  autofill: {
    category: string;
    title: string;
    description: string;
    severity: string;
    department: string;
    confidence: number;
    hazards: string[];
    tags: string[];
    risk_level: string;
    duplicate_probability: number;
  };
}

// Analyze image and return auto-fill structured data
export const useAnalyzeImage = () => {
  return useMutation<AnalyzeImageResult, Error, { photo: File }>({
    mutationFn: async ({ photo }) => {
      const formData = new FormData();
      formData.append('photo', photo);
      const response = await apiClient.post<AnalyzeImageResult>('/issues/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
  });
};

// Fetch nearby issues within radius for duplicate warning
export const useNearbyIssues = (lat?: number, lng?: number, radius: number = 200) => {
  return useQuery<Issue[]>({
    queryKey: ['nearbyIssues', { lat, lng, radius }],
    queryFn: async () => {
      if (!lat || !lng) return [];
      const response = await apiClient.get<Issue[]>('/issues/nearby', {
        params: { latitude: lat, longitude: lng, radius_meters: radius },
      });
      return response.data;
    },
    enabled: !!lat && !!lng,
  });
};

