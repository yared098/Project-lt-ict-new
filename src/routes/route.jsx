import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authProtectedRoutes } from ".";
import { Spinner } from "reactstrap";
import { post } from "../helpers/api_Lists";

// these are paths that are allowed if the user is authenticated
const allowedPathsIfAuthenticated = [
  "/",
  "/dashboard",
  "/profile",
  "/notifications",
  "/supersetdashboard"
];

function extractPaths(menuStructure) {
  const paths = [];

  function traverse(submenu) {
    submenu.forEach((item) => {
      if (item.path) paths.push(item.path);
      if (item.submenu) traverse(item.submenu);
    });
  }

  traverse(menuStructure);
  return [...paths, ...allowedPathsIfAuthenticated];
}

function extractAuthPaths(routes) {
  return routes.map((route) => route.path);
}

const SIDEDATA_CACHE_KEY = "sidedata_cache";

const AuthMiddleware = ({ children }) => {
  const [sidedata, setSidedata] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const currentPath = location.pathname;

  useEffect(() => {
    const cachedData = localStorage.getItem(SIDEDATA_CACHE_KEY);
    if (cachedData) {
      setSidedata(JSON.parse(cachedData));
      setIsLoading(false);
    } else {
      fetchSidedata();
    }
  }, []);

  const fetchSidedata = async () => {
    try {
      const { data } = await post(`menus`);
      // Group data by `parent_menu`
      const groupedData = data.reduce((acc, curr) => {
        const { parent_menu, link_name, link_url, link_icon } = curr;
        if (!acc[parent_menu]) {
          acc[parent_menu] = {
            title: parent_menu,
            icon: link_icon,
            submenu: [],
          };
        }
        acc[parent_menu].submenu.push({
          name: link_name.replace(/-/g, " "),
          path: `/${link_url}`,
        });
        return acc;
      }, {});

      const groupedSidedata = Object.values(groupedData);
      setSidedata(groupedSidedata);
      localStorage.setItem(SIDEDATA_CACHE_KEY, JSON.stringify(groupedSidedata));
    } catch (error) {
      console.error("Error fetching sidedata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const authPaths = extractAuthPaths(authProtectedRoutes);
  const allowedPaths = sidedata.length > 0 ? extractPaths(sidedata) : [];

  const isProjectPath = (path) => {
    const projectPathRegex = /^\/Project(\/\d+)?(\/\w+)?$/;
    return projectPathRegex.test(path);
  };

  const isProjectDetailPath = (path) => {
    const projectDetailPathRegex = /^\/projectdetail\/\d+$/;
    return projectDetailPathRegex.test(path);
  };


  if (isProjectPath(currentPath)) {
    allowedPaths.push(
      "/Project/:id",
      "/Project/:id/project_plan",
      "/Project/:id/budget_request",
      "/Project/:id/budget_expenditure",
      "/projectdetail/:id",
    );
  }

  const isAuthenticated = localStorage.getItem("authUser");

  if (isLoading) {
    return (
      <div
        style={{
          width: "100wh",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spinner color="primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} />;
  }

  if (!authPaths.includes(currentPath) && !isProjectPath(currentPath)) {
    // return <Navigate to="/not_found" />;
  }

  if (!allowedPaths.includes(currentPath) && !isProjectPath(currentPath)) {
    // return <Navigate to="/unauthorized" />;
  }

  return <React.Fragment>{children}</React.Fragment>;
};

export default AuthMiddleware;

// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";
// import { useQuery } from "@tanstack/react-query";
// import { Spinner } from "reactstrap";
// import { authProtectedRoutes } from ".";
// import { post } from "../helpers/api_Lists";

// const allowedPathsIfAuthenticated = [
//   "/",
//   "/dashboard",
//   "/profile",
//   "/notifications",
// ];

// function extractPaths(menuStructure) {
//   const paths = [];

//   function traverse(submenu) {
//     submenu.forEach((item) => {
//       if (item.path) paths.push(item.path);
//       if (item.submenu) traverse(item.submenu);
//     });
//   }

//   traverse(menuStructure);
//   return [...paths, ...allowedPathsIfAuthenticated];
// }

// function extractAuthPaths(routes) {
//   return routes.map((route) => route.path);
// }

// const SIDEDATA_CACHE_KEY = "sidedata_cache";

// const fetchSideData = async () => {
//   console.log("fetch started");
//   try {
//     const storedUser = JSON.parse(localStorage.getItem("authUser"));

//     console.log("storedUser", storedUser);
//     if (!storedUser || !storedUser.authorization) {
//       console.log(
//         "User is not authenticated or missing authorization details."
//       );
//       return {};
//     }
//     const { data } = await post(`menus`);
//     console.log("data", data);
//     // Group data by `parent_menu`
//     const groupedData = data.data.reduce((acc, curr) => {
//       const { parent_menu, link_name, link_url, link_icon } = curr;
//       if (!acc[parent_menu]) {
//         acc[parent_menu] = {
//           title: parent_menu,
//           icon: link_icon,
//           submenu: [],
//         };
//       }
//       acc[parent_menu].submenu.push({
//         name: link_name.replace(/-/g, " "),
//         path: `/${link_url}`,
//       });
//       return acc;
//     }, {});

//     const groupedSidedata = Object.values(groupedData);
//     localStorage.setItem(SIDEDATA_CACHE_KEY, JSON.stringify(groupedSidedata));
//     return groupedSidedata;
//   } catch (error) {}
// };

// export const useFetchSideData = () => {
//   return useQuery({
//     queryKey: ["sidedata"],
//     queryFn: () => fetchSideData(),
//     staleTime: 1000 * 60 * 5,
//     gcTime: 1000 * 60 * 10,
//   });
// };

// const AuthMiddleware = ({ children }) => {
//   const location = useLocation();
//   const currentPath = location.pathname;

//   const { data: sidedata, isLoading, error } = useFetchSideData();

//   console.log("sidedata", sidedata);
//   const authPaths = extractAuthPaths(authProtectedRoutes);
//   const allowedPaths = sidedata ? extractPaths(sidedata) : [];

//   const isProjectPath = (path) => {
//     const projectPathRegex = /^\/Project(\/\d+)?(\/\w+)?$/;
//     return projectPathRegex.test(path);
//   };

//   if (isProjectPath(currentPath)) {
//     allowedPaths.push(
//       "/Project/:id",
//       "/Project/:id/project_plan",
//       "/Project/:id/budget_request",
//       "/Project/:id/budget_expenditure"
//     );
//   }

//   const isAuthenticated = localStorage.getItem("authUser");

//   if (isLoading) {
//     return (
//       <div
//         style={{
//           width: "100wh",
//           height: "100vh",
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//         }}
//       >
//         <Spinner color="primary" />
//       </div>
//     );
//   }

//   // if (error) {
//   //   console.error("Error fetching sidedata:", error);
//   //   return <Navigate to="/error" state={{ from: location }} />;
//   // }

//   console.log("currentPath", currentPath);

//   if (!isAuthenticated) {
//     return <Navigate to="/login" state={{ from: location }} />;
//   }

//   if (!authPaths.includes(currentPath) && !isProjectPath(currentPath)) {
//     return <Navigate to="/not_found" />;
//   }

//   if (!allowedPaths.includes(currentPath) && !isProjectPath(currentPath)) {
//     return <Navigate to="/unauthorized" />;
//   }

//   return <React.Fragment>{children}</React.Fragment>;
// };

// export default AuthMiddleware;
