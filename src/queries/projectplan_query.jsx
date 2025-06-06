import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProjectPlan,
  updateProjectPlan,
  addProjectPlan,
  deleteProjectPlan,
} from "../helpers/projectplan_backend_helper";

const PROJECT_PLAN_QUERY_KEY = ["projectplan"];

// Fetch project_plan
export const useFetchProjectPlans = (param = {}, isActive) => {
  return useQuery({
    queryKey: [...PROJECT_PLAN_QUERY_KEY, "fetch", param],
    queryFn: () => getProjectPlan(param),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: isActive,
  });
};

//search project_plan
export const useSearchProjectPlans = (searchParams = {}) => {
  return useQuery({
    queryKey: [...PROJECT_PLAN_QUERY_KEY, "search", searchParams],
    queryFn: () => getProjectPlan(searchParams),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: searchParams.length > 0,
  });
};

// Add project_plan
export const useAddProjectPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addProjectPlan,
    onSuccess: (newDataResponse) => {
      const queries = queryClient.getQueriesData({
        queryKey: PROJECT_PLAN_QUERY_KEY,
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

// Update project_plan
export const useUpdateProjectPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateProjectPlan,
    onSuccess: (updatedData) => {
      const queries = queryClient.getQueriesData({
        queryKey: PROJECT_PLAN_QUERY_KEY,
      });

      queries.forEach(([queryKey, oldData]) => {
        queryClient.setQueryData(queryKey, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.map((data) =>
              data.pld_id === updatedData.data.pld_id
                ? { ...data, ...updatedData.data }
                : data
            ),
          };
        });
      });
    },
  });
};

// Delete project_plan
export const useDeleteProjectPlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteProjectPlan,
    onSuccess: (deletedData, variable) => {
      const queries = queryClient.getQueriesData({
        queryKey: PROJECT_PLAN_QUERY_KEY,
      });

      queries.forEach(([queryKey, oldData]) => {
        queryClient.setQueryData(queryKey, (oldData) => {
          if (!oldData) return;
          return {
            ...oldData,
            data: oldData.data.filter(
              (dept) => dept.pld_id !== parseInt(variable)
            ),
          };
        });
      });
    },
  });
};
