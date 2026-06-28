import { customerClient } from "./customer-client";

export interface CustomerProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  phone: string;
  company: string;
  orders_count: number;
  total_spent: string;
  loyalty_points: number;
  created_at: string;
}

export interface CustomerAuthTokens {
  access: string;
  refresh: string;
}

export interface CustomerAuthResponse {
  customer: CustomerProfile;
  tokens: CustomerAuthTokens;
}

export const customerAuthApi = {
  register: async (
    storeSlug: string,
    payload: {
      email: string;
      password: string;
      first_name?: string;
      last_name?: string;
      phone?: string;
    },
  ): Promise<CustomerAuthResponse> => {
    const { data } = await customerClient.post(
      `/customers/auth/${storeSlug}/register/`,
      payload,
    );
    return data;
  },

  login: async (
    storeSlug: string,
    payload: { email: string; password: string },
  ): Promise<CustomerAuthResponse> => {
    const { data } = await customerClient.post(
      `/customers/auth/${storeSlug}/login/`,
      payload,
    );
    return data;
  },

  me: async (): Promise<CustomerProfile> => {
    const { data } = await customerClient.get("/customers/auth/me/");
    return data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await customerClient.post("/customers/auth/logout/", {
      refresh: refreshToken,
    });
  },
};
