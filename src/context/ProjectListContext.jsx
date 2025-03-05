import React, { createContext, useState, useContext, useEffect } from "react";
import { useSearchProjects } from "../queries/project_query";
import FetchErrorHandler from "../components/Common/FetchErrorHandler";

// Create the context
const ProjectListContext = createContext();

// Provider component
const ProjectListProvider = ({ children }) => {
  const [searchResults, setSearchResults] = useState(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [showSearchResult, setShowSearchResult] = useState(false);

  const [projectParams, setProjectParams] = useState({});
  const [prjLocationRegionId, setPrjLocationRegionId] = useState(null);
  const [prjLocationZoneId, setPrjLocationZoneId] = useState(null);
  const [prjLocationWoredaId, setPrjLocationWoredaId] = useState(null);
  const [include, setInclude] = useState(0);

  const [params, setParams] = useState({});
  const [searchParams, setSearchParams] = useState({});
  const {
    data: searchData,
    error: srError,
    isError: isSrError,
    refetch: search,
  } = useSearchProjects(searchParams);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsSearchLoading(true);
        await search();
        setShowSearchResult(true);
      } catch (error) {
        console.error("Error during search:", error);
      } finally {
        setIsSearchLoading(false);
      }
    };
    if (Object.keys(searchParams).length > 0) {
      fetchData();
    }
  }, [searchParams]);

  useEffect(() => {
    setProjectParams({
      ...(prjLocationRegionId && {
        prj_location_region_id: prjLocationRegionId,
      }),
      ...(prjLocationZoneId && { prj_location_zone_id: prjLocationZoneId }),
      ...(prjLocationWoredaId && {
        prj_location_woreda_id: prjLocationWoredaId,
      }),
      ...(include === 1 && { include: include }),
    });
  }, [prjLocationRegionId, prjLocationZoneId, prjLocationWoredaId, include]);

  if (isSrError) {
    //return <FetchErrorHandler error={srError} refetch={search} />;
  }

  return (
    <ProjectListContext.Provider
      value={{
        searchResults,
        setSearchResults,
        isSearchLoading,
        setIsSearchLoading,
        searchError,
        setSearchError,
        showSearchResult,
        setShowSearchResult,
        projectParams,
        setProjectParams,
        prjLocationRegionId,
        setPrjLocationRegionId,
        prjLocationZoneId,
        setPrjLocationZoneId,
        prjLocationWoredaId,
        setPrjLocationWoredaId,
        params,
        setParams,
        searchParams,
        setSearchParams,
        searchData,
        setInclude,
      }}
    >
      {children}
    </ProjectListContext.Provider>
  );
};

export default ProjectListProvider;
// Custom hook for using the context
export const useProjectListContext = () => {
  const context = useContext(ProjectListContext);
  if (!context) {
    throw new Error("useProjectListContext must be used within a ProjectListProvider");
  }
  return context;
};