import { post, get } from "./api_Lists";

const apiUrl = import.meta.env.VITE_BASE_API_URL;
const GET_ADDRESS_STRUCTURE = "address_structure/listaddress";
// const GET_ADDRESS_STRUCTURE = "address_structure/listgrid";
const ADD_ADDRESS_STRUCTURE = "address_structure/insertgrid";
const UPDATE_ADDRESS_STRUCTURE = "address_structure/updategrid";
const DELETE_ADDRESS_STRUCTURE = "address_structure/deletegrid";

// get Projects
export const getAddressStructure = async () => {
  try {
    const response = await post(apiUrl + GET_ADDRESS_STRUCTURE);
    return response;
  } catch (error) {
    console.log(error); // Handle any errors
  }
};

export const addAddressStructure = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString
    ? `${ADD_ADDRESS_STRUCTURE}?${queryString}`
    : ADD_ADDRESS_STRUCTURE;
  return post(url);
};

// update objectNames
export const updateAddressStructure = (params) => {
  const queryString = new URLSearchParams(params).toString();
  const url = queryString
    ? `${UPDATE_ADDRESS_STRUCTURE}?${queryString}`
    : UPDATE_ADDRESS_STRUCTURE;
  return post(url);
};

// delete objectNames
export const deleteAddressStructure = (objectName) =>
  post(`${apiUrl}` + DELETE_ADDRESS_STRUCTURE + `?id=${objectName}`);
