import { CatalogItem } from '@/modules/catalog/collections/CatalogItem'
import { Reservation } from '@/modules/catalog/collections/Reservation'
import { Categories } from './Categories'
import { Media } from './Media'
import { Pages } from './Pages'
import { Pdf } from './Pdf'
import { Posts } from './Posts'
import { Users } from './Users'

export const collections = [Reservation, CatalogItem, Categories, Media, Users, Pages, Posts, Pdf]
