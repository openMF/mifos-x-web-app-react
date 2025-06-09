import axios from "axios";

const fineract = axios.create({
  baseURL: "https://localhost:8443/fineract-provider/api/v1",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

fineract.interceptors.request.use((config) => {
  const token = localStorage.getItem("mifosToken"); 
  if (token) {
    config.headers["Authorization"] = `Basic ${token}`;
    config.headers["Fineract-Platform-TenantId"] = "default";
  }
  return config;
});

export default fineract;
