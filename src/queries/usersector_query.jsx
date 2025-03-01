import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getUserSector,
  updateUserSector,
  addUserSector,
  deleteUserSector,
} from "../helpers/usersector_backend_helper";

const USER_SECTOR_QUERY_KEY = ["usersector"];

// Fetch user_sector
export const useFetchUserSectors = (params = {}, isActive) => {
  return useQuery({
    queryKey: [...USER_SECTOR_QUERY_KEY, "fetch", params],
    queryFn: () => getUserSector(params),
    staleTime: 1000 * 60 * 5,
    meta: { persist: true },
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: isActive
  });
};

//search user_sector
export const useSearchUserSectors = (searchParams = {}) => {
  return useQuery({
    queryKey: [...USER_SECTOR_QUERY_KEY, "search", searchParams],
    queryFn: () => getUserSector(searchParams),
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: searchParams.length > 0,
  });
};

// Add user_sector
export const useAddUserSector = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addUserSector,
    onSuccess: (newDataResponse) => {
      queryClient.invalidateQueries({ queryKey: USER_SECTOR_QUERY_KEY })
    },
  });
};
// Update user_sector
export const useUpdateUserSector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserSector,
    onSuccess: (updatedUserSector) => {
      queryClient.invalidateQueries({ queryKey: USER_SECTOR_QUERY_KEY })
    },
  });
};
// Delete user_sector
export const useDeleteUserSector = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUserSector,
    onSuccess: (deletedData) => {
      queryClient.invalidateQueries({ queryKey: USER_SECTOR_QUERY_KEY })
    },
  });
};
