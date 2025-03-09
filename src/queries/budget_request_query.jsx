import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getBudgetRequest,
  addBudgetRequest,
  updateBudgetRequest,
  deleteBudgetRequest,
  getBudgetRequestforApproval,
  updateBudgetRequestApproval
} from "../helpers/budgetrequest_backend_helper";

const BUDGET_REQUESTS_QUERY_KEY = ["budgetrequest"];

// Fetch budget_year
export const useFetchBudgetRequests = (params = {}) => {
  return useQuery({
    queryKey: [...BUDGET_REQUESTS_QUERY_KEY, params],
    queryFn: () => getBudgetRequest(params),
    staleTime: 1000 * 60 * 5,
    meta: { persist: true },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};

//search budget_year
export const useSearchBudgetRequests = (searchParams = {}, isActive) => {
  return useQuery({
    queryKey: [...BUDGET_REQUESTS_QUERY_KEY, searchParams],
    queryFn: () => {
      if (Object.keys(searchParams).length === 0) {
        return Promise.resolve([]);
      }
      return getBudgetRequest(searchParams);
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isActive, 
  });
};
export const useSearchBudgetRequestforApproval = (searchParams = {}) => {
  return useQuery({
    queryKey: [...BUDGET_REQUESTS_QUERY_KEY, searchParams],
    queryFn: () => getBudgetRequestforApproval(searchParams),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: searchParams.length > 0,
  });
};

export const useUpdateBudgetRequestApproval = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudgetRequestApproval,
    onSuccess: (updatedBudgetRequest, variables) => {
      const allQueries = queryClient
        .getQueriesData({ queryKey: BUDGET_REQUESTS_QUERY_KEY })
        .map(([key, data]) => ({ key, data }));

      allQueries.forEach(({ key }) => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.map((BudgetRequestData) =>
              BudgetRequestData.bdr_id === updatedBudgetRequest.data.bdr_id
                ? { ...BudgetRequestData, ...updatedBudgetRequest.data }
                : BudgetRequestData
            ),
          };
        });
      });
    },
  });
};
// Add budget_year
// export const useAddBudgetRequest = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: addBudgetRequest,
//     onSuccess: (newDataResponse) => {
//       queryClient.setQueryData(BUDGET_REQUESTS_QUERY_KEY, (oldData) => {
//         if (!oldData) return;
//         const newData = {
//           ...newDataResponse.data,
//           ...newDataResponse.previledge,
//         };
//         return {
//           ...oldData,
//           data: [newData, ...oldData.data],
//         };
//       });
//     },
//   });
// };

//update budget request
// export const useUpdateBudgetRequest = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: updateBudgetRequest,
//     onSuccess: (updatedBudgetRequest) => {
//       queryClient.setQueryData(BUDGET_REQUESTS_QUERY_KEY, (oldData) => {
//         if (!oldData) return;
//         return {
//           ...oldData,
//           data: oldData.data.map((BudgetRequestData) =>
//             BudgetRequestData.bdr_id === updatedBudgetRequest.data.bdr_id
//               ? { ...BudgetRequestData, ...updatedBudgetRequest.data }
//               : BudgetRequestData
//           ),
//         };
//       });
//     },
//   });
// };

export const useAddBudgetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addBudgetRequest,
    onSuccess: (newDataResponse) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_REQUESTS_QUERY_KEY });
    },
  });
};

export const useUpdateBudgetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBudgetRequest,
    onSuccess: (updatedBudgetRequest, variables) => {
      const allQueries = queryClient
        .getQueriesData({ queryKey: BUDGET_REQUESTS_QUERY_KEY })
        .map(([key, data]) => ({ key, data }));

      allQueries.forEach(({ key }) => {
        queryClient.setQueryData(key, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.map((BudgetRequestData) =>
              BudgetRequestData.bdr_id === updatedBudgetRequest.data.bdr_id
                ? { ...BudgetRequestData, ...updatedBudgetRequest.data }
                : BudgetRequestData
            ),
          };
        });
      });
    },
  });
};

// Delete budget_year
// export const useDeleteBudgetRequest = () => {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: deleteBudgetRequest,
//     onSuccess: (deletedData) => {
//       queryClient.setQueryData(BUDGET_REQUESTS_QUERY_KEY, (oldData) => {
//         if (!oldData) return;
//         return {
//           ...oldData,
//           data: oldData.data.filter(
//             (BudgetRequestData) =>
//               BudgetRequestData.bdr_id !== parseInt(deletedData.deleted_id)
//           ),
//         };
//       });
//     },
//   });
// };

export const useDeleteBudgetRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBudgetRequest,
    onSuccess: (deletedData) => {
      queryClient.invalidateQueries({ queryKey: BUDGET_REQUESTS_QUERY_KEY });
    },
  });
};
