import { CatalogItem } from '@/modules/catalog/collections/CatalogItem'
import { Reservation } from '@/modules/catalog/collections/Reservation'
import { Categories } from './Categories'
import { Cases } from './Cases'
import { Media } from './Media'
import { Pages } from './Pages'
import { Pdf } from './Pdf'
import { Posts } from './Posts'
import { Tasks } from './Tasks'
import { TasksCompleted } from './TasksCompleted'
import { Users } from './Users'

export const collections = [Reservation, CatalogItem, Cases, Tasks, TasksCompleted, Categories, Media, Users, Pages, Posts, Pdf]
