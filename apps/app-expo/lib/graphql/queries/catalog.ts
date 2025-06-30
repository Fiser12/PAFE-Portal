export const GET_CATALOG_ITEMS = `
  query GetCatalogItems($limit: Int, $page: Int, $where: CatalogItem_where) {
    CatalogItems(limit: $limit, page: $page, where: $where) {
      docs {
        id
        title
        quantity
        cover {
          url
          alt
          sizes {
            thumbnail {
              url
            }
          }
        }
        categories {
          id
          singular_name
        }
      }
    }
  }
`;

export const GET_CATALOG_ITEM = `
  query GetCatalogItem($id: Int!) {
    CatalogItem(id: $id) {
      id
      title
      content
      quantity
      cover {
        url
        alt
        sizes {
          medium {
            url
          }
        }
      }
      categories {
        id
        singular_name
      }
      reservations {
        docs {
          id
          reservationDate
          user {
            id
            email
          }
        }
      }
    }
  }
`;
