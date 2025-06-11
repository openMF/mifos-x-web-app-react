import fineract from "@/lib/axios";

export const loginFineract = async (username: string, password: string) => {
    const response = await fineract.post(
        "/authentication",
        { username, password },
        {
            params: {
                tenantIdentifier: "default",
            }
        }
    );
    return response.data;
}