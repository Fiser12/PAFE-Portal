import { Platform } from "react-native";

const DEV_HOST_IP = Platform.OS === "android" ? "10.0.2.2" : "localhost";
const GRAPHQL_ENDPOINT =
  process.env.EXPO_PUBLIC_GRAPHQL_ENDPOINT ||
  `http://${DEV_HOST_IP}:3000/api/graphql`;

export type GraphQLResponse<T> = {
  data?: T;
  errors?: {
    message: string;
    locations: {
      line: number;
      column: number;
    }[];
    path: string[];
  }[];
};

type FetchOptions = {
  headers?: HeadersInit;
};

export async function graphQLClient<T = any>(
  query: string,
  variables?: Record<string, any>,
  options: FetchOptions = {}
): Promise<GraphQLResponse<T>> {
  const { headers: customHeaders } = options;

  try {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error("GraphQL request failed:", error);
    throw error;
  }
}
