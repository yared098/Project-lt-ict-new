import { useEffect, useState } from "react";
import { post } from "../../helpers/api_Lists";
import { useQuery } from "@tanstack/react-query";
import TreeNode from "../AddressTreeStructure/TreeNode";
import { useTranslation } from "react-i18next";
const url = "address_structure/listgrid";

const getAddress = async () => {
  try {
    const response = await post(url);
    return response;
  } catch (error) {
    console.error("Error in fetching data:", error);
    throw new Error("Failed to fetch address structure");
  }
};

const buildTree = (data) => {
  if (!data || !Array.isArray(data)) {
    console.warn("Invalid data format for building the tree:", data);
    return [];
  }

  const map = {};
  const result = [];

  data.forEach((item) => {
    map[item.id] = { ...item, children: [] };
  });

  data.forEach((item) => {
    if (item.rootId === null || item.rootId == 0) {
      result.push(map[item.id]);
    } else {
      if (map[item.rootId]) {
        map[item.rootId].children.push(map[item.id]);
      }
    }
  });

  const assignLevels = (node) => {
    if (node.children.length === 0) {
      node.level = "woreda";
    } else {
      const hasGrandChildren = node.children.some(
        (child) => child.children.length > 0
      );

      if (hasGrandChildren) {
        node.level = "region";
      } else {
        node.level = "zone";
      }
      node.children.forEach(assignLevels);
    }
  };
  result.forEach(assignLevels);
  return result;
};

const AddressStructureForProject = ({ onNodeSelect, setIsAddressLoading }) => {
  const { t } = useTranslation();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["address_structure"],
    queryFn: getAddress,
  });

  useEffect(() => {
    setIsAddressLoading(isLoading);
  }, [isLoading, setIsAddressLoading]);

  if (isLoading) {
    return (
      <div
        style={{ minHeight: "450px" }}
        className="w-20 flex-shrink-0 p-3 bg-white border-end overflow-auto shadow-sm"
      >
        <h4 className="mb-2 text-secondary">{t("address_tree_Search")}</h4>
        <hr className="text-dark" />
        <p>Loading...</p>
      </div>
    );
  }

  if (isError) {
    return <div>Error fetching address structure</div>;
  }

  const treeData = buildTree(data?.data);

  return (
    <div
      className="w-20 flex-shrink-0 p-3 bg-white border-end overflow-auto shadow-sm"
      style={{ minHeight: "450px" }}
    >
      <h4 className="mb-2 text-secondary">{t("address_tree_Search")}</h4>
      <hr className="text-dark" />

      {treeData.length > 0 ? (
        treeData.map((node) => (
          <TreeNode key={node.id} node={node} onNodeClick={onNodeSelect} />
        ))
      ) : (
        <div>No address structure data available.</div>
      )}
    </div>
  );
};

export default AddressStructureForProject;
