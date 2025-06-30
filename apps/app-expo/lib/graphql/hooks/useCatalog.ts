import { useState } from "react";
import { graphQLClient } from "../client";
import { GET_CATALOG_ITEMS, GET_CATALOG_ITEM } from "../queries/catalog";

type CatalogItem = {
  id: number;
  title: string;
  quantity: number;
  cover: {
    url: string;
    alt: string;
    sizes: {
      thumbnail: {
        url: string;
      };
    };
  };
  categories: Array<{
    id: number;
    singular_name: string;
  }>;
};

type CatalogItemDetail = CatalogItem & {
  content: any;
  reservations: {
    docs: Array<{
      id: number;
      reservationDate: string;
      user: {
        id: string;
        email: string;
      };
    }>;
  };
};

type UseCatalogReturn = {
  items: CatalogItem[];
  loading: boolean;
  error: Error | null;
  fetchItems: (params?: { limit?: number; page?: number }) => Promise<void>;
  fetchItemById: (id: number) => Promise<CatalogItemDetail | null>;
};

export function useCatalog(): UseCatalogReturn {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchItems = async (params?: { limit?: number; page?: number }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await graphQLClient<{
        CatalogItems: { docs: CatalogItem[] };
      }>(GET_CATALOG_ITEMS, {
        limit: params?.limit || 10,
        page: params?.page || 1,
      });

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      setItems(response.data?.CatalogItems.docs || []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Error fetching catalog items")
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchItemById = async (
    id: number
  ): Promise<CatalogItemDetail | null> => {
    try {
      const response = await graphQLClient<{ CatalogItem: CatalogItemDetail }>(
        GET_CATALOG_ITEM,
        { id }
      );

      if (response.errors) {
        throw new Error(response.errors[0].message);
      }

      return response.data?.CatalogItem || null;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Error fetching catalog item")
      );
      return null;
    }
  };

  return {
    items,
    loading,
    error,
    fetchItems,
    fetchItemById,
  };
}
