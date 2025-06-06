import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRequestFollowup,
  updateRequestFollowup,
  addRequestFollowup,
  deleteRequestFollowup,
} from "../helpers/requestfollowup_backend_helper";

const REQUEST_FOLLOWUP_QUERY_KEY = ["requestfollowup"];

// Fetch request_followup
export const useFetchRequestFollowups = () => {
  return useQuery({
    queryKey: REQUEST_FOLLOWUP_QUERY_KEY,
    queryFn: () => getRequestFollowup(),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

//search request_followup
export const useSearchRequestFollowups = (searchParams = {}, enabled) => {
  return useQuery({
    queryKey: [...REQUEST_FOLLOWUP_QUERY_KEY, searchParams],
    queryFn: () => getRequestFollowup(searchParams),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled
  });
};

// Add request_followup
export const useAddRequestFollowup = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addRequestFollowup,
    onSuccess: (newDataResponse) => {
      const queries = queryClient.getQueriesData({
        queryKey: REQUEST_FOLLOWUP_QUERY_KEY,
      });

      const newData = {
        ...newDataResponse.data,
        ...newDataResponse.previledge,
      };

      queries.forEach(([queryKey, oldData]) => {
        queryClient.setQueryData(queryKey, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: [newData, ...oldData.data],
          };
        });
      });
    },
  });
};
// Update request_followup
export const useUpdateRequestFollowup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateRequestFollowup,
    onSuccess: (updatedData) => {
      const queries = queryClient.getQueriesData({
        queryKey: REQUEST_FOLLOWUP_QUERY_KEY,
      });

      queries.forEach(([queryKey, oldData]) => {
        queryClient.setQueryData(queryKey, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.map((data) =>
              data.rqf_id === updatedData.data.rqf_id
                ? { ...data, ...updatedData.data }
                : data
            ),
          };
        });
      });
    },
  });
};
// Delete request_followup
export const useDeleteRequestFollowup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRequestFollowup,
    onSuccess: (deletedData) => {
      queryClient.setQueryData(REQUEST_FOLLOWUP_QUERY_KEY, (oldData) => {
        if (!oldData) return;
        return {
          ...oldData,
          data: oldData.data.filter(
            (RequestFollowupData) => RequestFollowupData.rqf_id !== parseInt(deletedData.deleted_id)
          ),
        };
      });
    },
  });
};
