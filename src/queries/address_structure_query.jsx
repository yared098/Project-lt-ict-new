import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAddressStructure,
  addAddressStructure,
  updateAddressStructure,
  deleteAddressStructure,
} from "../helpers/addressstructure_backend_helper";

// Custom hook for fetching folders
export const useFetchFolders = () => {
  return useQuery({
    queryKey: ["folders"],
    queryFn: () => getAddressStructure(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    select: (data) => buildTree(data?.data),
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

// Custom hook for adding a folder
export const useAddFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passed) => {
      console.log(passed);
      return addAddressStructure(passed);
    },
    onSuccess: (newFolder) => {
      queryClient.setQueryData(["folders"], (oldData) => {
        const updatedData = addSubFolder(oldData, newFolder.rootId, newFolder);
        return updatedData;
      });
    },
  });
};

// Custom hook for renaming a folder
export const useRenameFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, rootId, name }) =>
      updateAddressStructure(id, rootId, name),
    onSuccess: (updatedFolder) => {
      queryClient.setQueryData(["folders"], (oldData) => {
        const updatedData = renameFolder(
          oldData,
          updatedFolder.id,
          updatedFolder.name
        );
        return updatedData;
      });
    },
  });
};

// Custom hook for deleting a folder
export const useDeleteFolder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => deleteAddressStructure(id),
    onSuccess: (deletedId, variable) => {
      queryClient.setQueryData(["folders"], (oldData) => {
        if (!oldData) return oldData;

        const updatedData = deleteFolder(oldData?.data, variable);
        return {
          ...oldData,
          data: updatedData,
        };
      });
    },
  });
};

// Helper functions
const buildTree = (data) => {
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid data format for building the tree:", data);
    return [];
  }
  const oromia = [
    {
      id: 1,
      name: "Oromia",
      rootId: null,
      level: "region",
      children: [],
    },
  ];
  oromia[0].children = [...data];
  return oromia;
};

const addSubFolder = (tree, parentId, newFolder) => {
  return tree.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: [...(node.children || []), newFolder],
      };
    } else if (node.children) {
      return {
        ...node,
        children: addSubFolder(node.children, parentId, newFolder),
      };
    }
    return node;
  });
};

const deleteFolder = (tree, folderId) => {
  return tree
    .filter((node) => node.id !== folderId)
    .map((node) => ({
      ...node,
      children: node.children ? deleteFolder(node.children, folderId) : [],
    }));
};

const renameFolder = (tree, folderId, newName) => {
  return tree.map((node) => {
    if (node.id === folderId) {
      return {
        ...node,
        name: newName,
      };
    } else if (node.children) {
      return {
        ...node,
        children: renameFolder(node.children, folderId, newName),
      };
    }
    return node;
  });
};
