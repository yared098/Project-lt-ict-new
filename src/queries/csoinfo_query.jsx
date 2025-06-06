import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCsoInfo,
  updateCsoInfo,
  addCsoInfo,
  deleteCsoInfo,
} from "../helpers/csoinfo_backend_helper";

const CSO_INFO_QUERY_KEY = ["csoinfo"];

// Fetch cso_info
export const useFetchCsoInfos = () => {
  return useQuery({
    queryKey: CSO_INFO_QUERY_KEY,
    queryFn: () => getCsoInfo(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 6,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

//search cso_info
export const useSearchCsoInfos = (searchParams = {}) => {
  return useQuery({
    queryKey: [...CSO_INFO_QUERY_KEY, searchParams],
    queryFn: () => getCsoInfo(searchParams),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: searchParams.length > 0,
  });
};

// Add cso_info
export const useAddCsoInfo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCsoInfo,
    onSuccess: (newDataResponse) => {
      queryClient.setQueryData(CSO_INFO_QUERY_KEY, (oldData) => {
        if (!oldData) return;
        const newData = {
          ...newDataResponse.data,
          ...newDataResponse.previledge,
        };
        return {
          ...oldData,
          data: [newData, ...oldData.data],
        };
      });
    },
  });
};
// Update cso_info
export const useUpdateCsoInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCsoInfo,
    onSuccess: (updatedCsoInfo) => {
      queryClient.setQueryData(CSO_INFO_QUERY_KEY, (oldData) => {
        if (!oldData) return;

        return {
          ...oldData,
          data: oldData.data.map((CsoInfoData) =>
            CsoInfoData.cso_id === updatedCsoInfo.data.cso_id
              ? { ...CsoInfoData, ...updatedCsoInfo.data }
              : CsoInfoData
          ),
        };
      });
    },
  });
};
// Delete cso_info
export const useDeleteCsoInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCsoInfo,
    onSuccess: (deletedData) => {
      queryClient.setQueryData(CSO_INFO_QUERY_KEY, (oldData) => {
        if (!oldData) return;
        return {
          ...oldData,
          data: oldData.data.filter(
            (CsoInfoData) => CsoInfoData.cso_id !== parseInt(deletedData.deleted_id)
          ),
        };
      });
    },
  });
};
