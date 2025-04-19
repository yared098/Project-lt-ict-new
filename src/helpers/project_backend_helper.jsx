import { post, get } from "./api_Lists";

const apiUrl = import.meta.env.VITE_BASE_API_URL;
const GET_PROJECT = "project/listgrid";
const GET_CHILD_PROJECTS = "project/listprojectbyparent";
const ADD_PROJECT = "project/insertgrid";
const UPDATE_PROJECT = "project/updategrid";
const DELETE_PROJECT = "project/deletegrid";

const GET_SEARCH_PROJECT = "project/listgridsearch";
// get project
export const getProject = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${GET_PROJECT}?${queryString}` : GET_PROJECT;
  try {
    const response = await post(url);
    return response;
  } catch (error) {
    throw error;
  }
};

// get child project
export const getChildProjects = async (params = {}) => {
  const hasWoredaId = 'prj_owner_woreda_id' in params;

  const url = hasWoredaId
    ? `${GET_PROJECT}?${new URLSearchParams(params).toString()}`
    : `${GET_CHILD_PROJECTS}?${new URLSearchParams(params).toString()}`;

  try {
    const response = await post(url);
    return response;
  } catch (error) {
    throw error;
  }
};


export const getSearchProject = async (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString ? `${GET_SEARCH_PROJECT}?${queryString}` : GET_SEARCH_PROJECT;
  try {
    const response = await post(url);
    return response;
  } catch (error) {
    throw error;
  }
};

export const fetchProject = async (prj_id) => {
  try {
    const response = await get(`/project/${prj_id}`);
    return response;
  } catch (error) {
    throw error;
  }
};

// add project
export const addProject = async (objectName) =>
  post(`${apiUrl}` + ADD_PROJECT, objectName);

// update project
export const updateProject = (objectName) =>
  post(
    `${apiUrl}` + UPDATE_PROJECT + `?prj_id=${objectName?.prj_id}`,
    objectName
  );

// delete  project
export const deleteProject = (objectName) =>
  post(`${apiUrl}` + DELETE_PROJECT + `?prj_id=${objectName}`);

export const fetchSingleProjectApi = async (prj_id) => {
  try {
    const response = await get(`/project/${prj_id}`);
    return response;
  } catch (error) {
    console.log(error);
  }
};
