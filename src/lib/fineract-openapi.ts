//This file has the configuration for base url for fineract using openapi generator

import { Configuration } from "@/fineract-api";

export const getConfiguration = () => {
  return new Configuration({
    basePath: "/api",
    baseOptions: {
      headers: {
        "Fineract-Platform-TenantId": "default",
        "Authorization": `Basic ${localStorage.getItem("mifosToken")}`,
      },
      withCredentials: true,
    },
  });
};
