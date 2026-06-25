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
