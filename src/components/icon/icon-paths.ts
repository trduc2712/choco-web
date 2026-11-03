import { ACTIONS_ICONS } from './icons/actions'
import { ARROWS_ICONS } from './icons/arrows'
import { COMMERCE_ICONS } from './icons/commerce'
import { COMMUNICATION_ICONS } from './icons/communication'
import { DATA_ICONS } from './icons/data'
import { DEVICES_ICONS } from './icons/devices'
import { FILES_ICONS } from './icons/files'
import { INTERFACE_ICONS } from './icons/interface'
import { MEDIA_ICONS } from './icons/media'
import { NATURE_ICONS } from './icons/nature'
import { OBJECTS_ICONS } from './icons/objects'
import { PEOPLE_ICONS } from './icons/people'
import { STATUS_ICONS } from './icons/status'
import { TEXT_ICONS } from './icons/text'
import { TIME_ICONS } from './icons/time'

export const ICON_CATEGORIES = {
  interface: INTERFACE_ICONS,
  arrows: ARROWS_ICONS,
  actions: ACTIONS_ICONS,
  text: TEXT_ICONS,
  communication: COMMUNICATION_ICONS,
  media: MEDIA_ICONS,
  files: FILES_ICONS,
  data: DATA_ICONS,
  time: TIME_ICONS,
  status: STATUS_ICONS,
  people: PEOPLE_ICONS,
  commerce: COMMERCE_ICONS,
  devices: DEVICES_ICONS,
  nature: NATURE_ICONS,
  objects: OBJECTS_ICONS,
} as const

type IconCategories = typeof ICON_CATEGORIES

export type IconCategory = keyof IconCategories

export type IconName = {
  [Category in IconCategory]: keyof IconCategories[Category]
}[IconCategory]

export const ICON_PATHS = Object.assign(
  {},
  ...Object.values(ICON_CATEGORIES),
) as Record<IconName, string>

export const ICON_NAMES = Object.keys(ICON_PATHS).sort() as IconName[]

export const ICON_CATEGORY_NAMES = Object.keys(
  ICON_CATEGORIES,
) as IconCategory[]

export function getIconsInCategory(category: IconCategory): IconName[] {
  return Object.keys(ICON_CATEGORIES[category]).sort() as IconName[]
}
