import { Categories } from "./Categories";
import { Media } from "./Media";
import { Pages } from "./Pages";
import { Posts } from "./Posts";
import { Users } from "./Users";
import { Pdf } from "./Pdf";
import { Reservation } from "./Catalog/Reservation";
import { CatalogItem } from "./Catalog/CatalogItem";

export const collections = [
    Reservation,
    CatalogItem,
    Categories,
    Media,
    Users,
    Pages,
    Posts,
    Pdf,
]
