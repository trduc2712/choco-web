import type { ReactNode } from 'react'

import { DESIGN_SYSTEM_PATH } from '@/constants/routes'

import { AccordionEntry } from './entries/accordion-entry'
import { AlertDialogEntry } from './entries/alert-dialog-entry'
import { AlertEntry } from './entries/alert-entry'
import { AspectRatioEntry } from './entries/aspect-ratio-entry'
import { AvatarEntry } from './entries/avatar-entry'
import { AvatarGroupEntry } from './entries/avatar-group-entry'
import { BadgeEntry } from './entries/badge-entry'
import { BannerEntry } from './entries/banner-entry'
import { BreadcrumbEntry } from './entries/breadcrumb-entry'
import { ButtonEntry } from './entries/button-entry'
import { CalendarEntry } from './entries/calendar-entry'
import { CardEntry } from './entries/card-entry'
import { CheckboxEntry } from './entries/checkbox-entry'
import { CheckboxGroupEntry } from './entries/checkbox-group-entry'
import { CodeBlockEntry } from './entries/code-block-entry'
import { ComboboxEntry } from './entries/combobox-entry'
import { CommandPaletteEntry } from './entries/command-palette-entry'
import { ContainerEntry } from './entries/container-entry'
import { ContextMenuEntry } from './entries/context-menu-entry'
import { CopyButtonEntry } from './entries/copy-button-entry'
import { DatePickerEntry } from './entries/date-picker-entry'
import { DescriptionListEntry } from './entries/description-list-entry'
import { DialogEntry } from './entries/dialog-entry'
import { DividerEntry } from './entries/divider-entry'
import { DrawerEntry } from './entries/drawer-entry'
import { EmptyStateEntry } from './entries/empty-state-entry'
import { FieldsetEntry } from './entries/fieldset-entry'
import { FileUploadEntry } from './entries/file-upload-entry'
import { FormEntry } from './entries/form-entry'
import {
  ColorsEntry,
  RadiusEntry,
  ShadowsEntry,
  SpacingEntry,
  TypographyEntry,
} from './entries/foundations'
import { GridEntry } from './entries/grid-entry'
import { HeadingEntry } from './entries/heading-entry'
import { HoverCardEntry } from './entries/hover-card-entry'
import { IconEntry } from './entries/icon-entry'
import { ImageEntry } from './entries/image-entry'
import { InputEntry } from './entries/input-entry'
import { KbdEntry } from './entries/kbd-entry'
import { LinkEntry } from './entries/link-entry'
import { MenuEntry } from './entries/menu-entry'
import { NavListEntry } from './entries/nav-list-entry'
import { NumberInputEntry } from './entries/number-input-entry'
import { PaginationEntry } from './entries/pagination-entry'
import { PasswordInputEntry } from './entries/password-input-entry'
import { PinInputEntry } from './entries/pin-input-entry'
import { PopoverEntry } from './entries/popover-entry'
import { PortalEntry } from './entries/portal-entry'
import { ProgressEntry } from './entries/progress-entry'
import { RadioGroupEntry } from './entries/radio-group-entry'
import { RatingEntry } from './entries/rating-entry'
import { ScrollAreaEntry } from './entries/scroll-area-entry'
import { SearchInputEntry } from './entries/search-input-entry'
import { SegmentedControlEntry } from './entries/segmented-control-entry'
import { SelectEntry } from './entries/select-entry'
import { SidebarEntry } from './entries/sidebar-entry'
import { SkeletonEntry } from './entries/skeleton-entry'
import { SkipLinkEntry } from './entries/skip-link-entry'
import { SliderEntry } from './entries/slider-entry'
import { SpinnerEntry } from './entries/spinner-entry'
import { StackEntry } from './entries/stack-entry'
import { StatEntry } from './entries/stat-entry'
import { StepperEntry } from './entries/stepper-entry'
import { SwitchEntry } from './entries/switch-entry'
import { TableEntry } from './entries/table-entry'
import { TabsEntry } from './entries/tabs-entry'
import { TagEntry } from './entries/tag-entry'
import { TagInputEntry } from './entries/tag-input-entry'
import { TextEntry } from './entries/text-entry'
import { TextareaEntry } from './entries/textarea-entry'
import { ThemeToggleEntry } from './entries/theme-toggle-entry'
import { TimeFieldEntry } from './entries/time-field-entry'
import { TimelineEntry } from './entries/timeline-entry'
import { ToastEntry } from './entries/toast-entry'
import { ToggleButtonEntry } from './entries/toggle-button-entry'
import { ToggleGroupEntry } from './entries/toggle-group-entry'
import { TooltipEntry } from './entries/tooltip-entry'
import { TreeViewEntry } from './entries/tree-view-entry'
import type { ShowcaseEntryId } from './entry-docs'
import { AccordionUsage } from './usage/accordion-usage'
import accordionUsageCode from './usage/accordion-usage.tsx?raw'
import { AlertDialogUsage } from './usage/alert-dialog-usage'
import alertDialogUsageCode from './usage/alert-dialog-usage.tsx?raw'
import { AlertUsage } from './usage/alert-usage'
import alertUsageCode from './usage/alert-usage.tsx?raw'
import { AspectRatioUsage } from './usage/aspect-ratio-usage'
import aspectRatioUsageCode from './usage/aspect-ratio-usage.tsx?raw'
import { AvatarGroupUsage } from './usage/avatar-group-usage'
import avatarGroupUsageCode from './usage/avatar-group-usage.tsx?raw'
import { AvatarUsage } from './usage/avatar-usage'
import avatarUsageCode from './usage/avatar-usage.tsx?raw'
import { BadgeUsage } from './usage/badge-usage'
import badgeUsageCode from './usage/badge-usage.tsx?raw'
import { BannerUsage } from './usage/banner-usage'
import bannerUsageCode from './usage/banner-usage.tsx?raw'
import { BreadcrumbUsage } from './usage/breadcrumb-usage'
import breadcrumbUsageCode from './usage/breadcrumb-usage.tsx?raw'
import { ButtonUsage } from './usage/button-usage'
import buttonUsageCode from './usage/button-usage.tsx?raw'
import { CalendarUsage } from './usage/calendar-usage'
import calendarUsageCode from './usage/calendar-usage.tsx?raw'
import { CardUsage } from './usage/card-usage'
import cardUsageCode from './usage/card-usage.tsx?raw'
import { CheckboxGroupUsage } from './usage/checkbox-group-usage'
import checkboxGroupUsageCode from './usage/checkbox-group-usage.tsx?raw'
import { CheckboxUsage } from './usage/checkbox-usage'
import checkboxUsageCode from './usage/checkbox-usage.tsx?raw'
import { CodeBlockUsage } from './usage/code-block-usage'
import codeBlockUsageCode from './usage/code-block-usage.tsx?raw'
import { ColorsUsage } from './usage/colors-usage'
import colorsUsageCode from './usage/colors-usage.module.scss?raw'
import { ComboboxUsage } from './usage/combobox-usage'
import comboboxUsageCode from './usage/combobox-usage.tsx?raw'
import { CommandPaletteUsage } from './usage/command-palette-usage'
import commandPaletteUsageCode from './usage/command-palette-usage.tsx?raw'
import { ContainerUsage } from './usage/container-usage'
import containerUsageCode from './usage/container-usage.tsx?raw'
import { ContextMenuUsage } from './usage/context-menu-usage'
import contextMenuUsageCode from './usage/context-menu-usage.tsx?raw'
import { CopyButtonUsage } from './usage/copy-button-usage'
import copyButtonUsageCode from './usage/copy-button-usage.tsx?raw'
import { DatePickerUsage } from './usage/date-picker-usage'
import datePickerUsageCode from './usage/date-picker-usage.tsx?raw'
import { DescriptionListUsage } from './usage/description-list-usage'
import descriptionListUsageCode from './usage/description-list-usage.tsx?raw'
import { DialogUsage } from './usage/dialog-usage'
import dialogUsageCode from './usage/dialog-usage.tsx?raw'
import { DividerUsage } from './usage/divider-usage'
import dividerUsageCode from './usage/divider-usage.tsx?raw'
import { DrawerUsage } from './usage/drawer-usage'
import drawerUsageCode from './usage/drawer-usage.tsx?raw'
import { EmptyStateUsage } from './usage/empty-state-usage'
import emptyStateUsageCode from './usage/empty-state-usage.tsx?raw'
import { FieldsetUsage } from './usage/fieldset-usage'
import fieldsetUsageCode from './usage/fieldset-usage.tsx?raw'
import { FileUploadUsage } from './usage/file-upload-usage'
import fileUploadUsageCode from './usage/file-upload-usage.tsx?raw'
import { FormUsage } from './usage/form-usage'
import formUsageCode from './usage/form-usage.tsx?raw'
import { GridUsage } from './usage/grid-usage'
import gridUsageCode from './usage/grid-usage.tsx?raw'
import { HeadingUsage } from './usage/heading-usage'
import headingUsageCode from './usage/heading-usage.tsx?raw'
import { HoverCardUsage } from './usage/hover-card-usage'
import hoverCardUsageCode from './usage/hover-card-usage.tsx?raw'
import { IconUsage } from './usage/icon-usage'
import iconUsageCode from './usage/icon-usage.tsx?raw'
import { ImageUsage } from './usage/image-usage'
import imageUsageCode from './usage/image-usage.tsx?raw'
import { InputUsage } from './usage/input-usage'
import inputUsageCode from './usage/input-usage.tsx?raw'
import { KbdUsage } from './usage/kbd-usage'
import kbdUsageCode from './usage/kbd-usage.tsx?raw'
import { LinkUsage } from './usage/link-usage'
import linkUsageCode from './usage/link-usage.tsx?raw'
import { MenuUsage } from './usage/menu-usage'
import menuUsageCode from './usage/menu-usage.tsx?raw'
import { NavListUsage } from './usage/nav-list-usage'
import navListUsageCode from './usage/nav-list-usage.tsx?raw'
import { NumberInputUsage } from './usage/number-input-usage'
import numberInputUsageCode from './usage/number-input-usage.tsx?raw'
import { PaginationUsage } from './usage/pagination-usage'
import paginationUsageCode from './usage/pagination-usage.tsx?raw'
import { PasswordInputUsage } from './usage/password-input-usage'
import passwordInputUsageCode from './usage/password-input-usage.tsx?raw'
import { PinInputUsage } from './usage/pin-input-usage'
import pinInputUsageCode from './usage/pin-input-usage.tsx?raw'
import { PopoverUsage } from './usage/popover-usage'
import popoverUsageCode from './usage/popover-usage.tsx?raw'
import { PortalUsage } from './usage/portal-usage'
import portalUsageCode from './usage/portal-usage.tsx?raw'
import { ProgressUsage } from './usage/progress-usage'
import progressUsageCode from './usage/progress-usage.tsx?raw'
import { RadioGroupUsage } from './usage/radio-group-usage'
import radioGroupUsageCode from './usage/radio-group-usage.tsx?raw'
import { RadiusUsage } from './usage/radius-usage'
import radiusUsageCode from './usage/radius-usage.module.scss?raw'
import { RatingUsage } from './usage/rating-usage'
import ratingUsageCode from './usage/rating-usage.tsx?raw'
import { ScrollAreaUsage } from './usage/scroll-area-usage'
import scrollAreaUsageCode from './usage/scroll-area-usage.tsx?raw'
import { SearchInputUsage } from './usage/search-input-usage'
import searchInputUsageCode from './usage/search-input-usage.tsx?raw'
import { SegmentedControlUsage } from './usage/segmented-control-usage'
import segmentedControlUsageCode from './usage/segmented-control-usage.tsx?raw'
import { SelectUsage } from './usage/select-usage'
import selectUsageCode from './usage/select-usage.tsx?raw'
import { ShadowsUsage } from './usage/shadows-usage'
import shadowsUsageCode from './usage/shadows-usage.module.scss?raw'
import { SidebarUsage } from './usage/sidebar-usage'
import sidebarUsageCode from './usage/sidebar-usage.tsx?raw'
import { SkeletonUsage } from './usage/skeleton-usage'
import skeletonUsageCode from './usage/skeleton-usage.tsx?raw'
import { SkipLinkUsage } from './usage/skip-link-usage'
import skipLinkUsageCode from './usage/skip-link-usage.tsx?raw'
import { SliderUsage } from './usage/slider-usage'
import sliderUsageCode from './usage/slider-usage.tsx?raw'
import { SpacingUsage } from './usage/spacing-usage'
import spacingUsageCode from './usage/spacing-usage.module.scss?raw'
import { SpinnerUsage } from './usage/spinner-usage'
import spinnerUsageCode from './usage/spinner-usage.tsx?raw'
import { StackUsage } from './usage/stack-usage'
import stackUsageCode from './usage/stack-usage.tsx?raw'
import { StatUsage } from './usage/stat-usage'
import statUsageCode from './usage/stat-usage.tsx?raw'
import { StepperUsage } from './usage/stepper-usage'
import stepperUsageCode from './usage/stepper-usage.tsx?raw'
import { SwitchUsage } from './usage/switch-usage'
import switchUsageCode from './usage/switch-usage.tsx?raw'
import { TableUsage } from './usage/table-usage'
import tableUsageCode from './usage/table-usage.tsx?raw'
import { TabsUsage } from './usage/tabs-usage'
import tabsUsageCode from './usage/tabs-usage.tsx?raw'
import { TagInputUsage } from './usage/tag-input-usage'
import tagInputUsageCode from './usage/tag-input-usage.tsx?raw'
import { TagUsage } from './usage/tag-usage'
import tagUsageCode from './usage/tag-usage.tsx?raw'
import { TextUsage } from './usage/text-usage'
import textUsageCode from './usage/text-usage.tsx?raw'
import { TextareaUsage } from './usage/textarea-usage'
import textareaUsageCode from './usage/textarea-usage.tsx?raw'
import { ThemeToggleUsage } from './usage/theme-toggle-usage'
import themeToggleUsageCode from './usage/theme-toggle-usage.tsx?raw'
import { TimeFieldUsage } from './usage/time-field-usage'
import timeFieldUsageCode from './usage/time-field-usage.tsx?raw'
import { TimelineUsage } from './usage/timeline-usage'
import timelineUsageCode from './usage/timeline-usage.tsx?raw'
import { ToastUsage } from './usage/toast-usage'
import toastUsageCode from './usage/toast-usage.tsx?raw'
import { ToggleButtonUsage } from './usage/toggle-button-usage'
import toggleButtonUsageCode from './usage/toggle-button-usage.tsx?raw'
import { ToggleGroupUsage } from './usage/toggle-group-usage'
import toggleGroupUsageCode from './usage/toggle-group-usage.tsx?raw'
import { TooltipUsage } from './usage/tooltip-usage'
import tooltipUsageCode from './usage/tooltip-usage.tsx?raw'
import { TreeViewUsage } from './usage/tree-view-usage'
import treeViewUsageCode from './usage/tree-view-usage.tsx?raw'
import { TypographyUsage } from './usage/typography-usage'
import typographyUsageCode from './usage/typography-usage.module.scss?raw'

export const SHOWCASE_GROUPS = [
  'foundations',
  'actions',
  'forms',
  'display',
  'feedback',
  'navigation',
  'overlays',
  'layout',
  'utilities',
] as const

export type ShowcaseGroup = (typeof SHOWCASE_GROUPS)[number]

export type ShowcaseUsage = {
  Component: () => ReactNode
  code: string
  language: 'tsx' | 'scss'
}

export type ShowcaseEntry = {
  id: ShowcaseEntryId
  name: string
  group: ShowcaseGroup
  Component: () => ReactNode
  usage: ShowcaseUsage
  importFrom?: string
}

export const SHOWCASE_ENTRIES: ShowcaseEntry[] = [
  {
    id: 'colors',
    name: 'Colors',
    group: 'foundations',
    Component: ColorsEntry,
    usage: { Component: ColorsUsage, code: colorsUsageCode, language: 'scss' },
  },
  {
    id: 'typography',
    name: 'Typography',
    group: 'foundations',
    Component: TypographyEntry,
    usage: {
      Component: TypographyUsage,
      code: typographyUsageCode,
      language: 'scss',
    },
  },
  {
    id: 'spacing',
    name: 'Spacing',
    group: 'foundations',
    Component: SpacingEntry,
    usage: {
      Component: SpacingUsage,
      code: spacingUsageCode,
      language: 'scss',
    },
  },
  {
    id: 'radius',
    name: 'Radius',
    group: 'foundations',
    Component: RadiusEntry,
    usage: { Component: RadiusUsage, code: radiusUsageCode, language: 'scss' },
  },
  {
    id: 'shadows',
    name: 'Shadows',
    group: 'foundations',
    Component: ShadowsEntry,
    usage: {
      Component: ShadowsUsage,
      code: shadowsUsageCode,
      language: 'scss',
    },
  },
  {
    id: 'button',
    name: 'Button',
    group: 'actions',
    Component: ButtonEntry,
    usage: { Component: ButtonUsage, code: buttonUsageCode, language: 'tsx' },
  },
  {
    id: 'copy-button',
    name: 'CopyButton',
    group: 'actions',
    Component: CopyButtonEntry,
    usage: {
      Component: CopyButtonUsage,
      code: copyButtonUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'link',
    name: 'Link',
    group: 'actions',
    Component: LinkEntry,
    usage: { Component: LinkUsage, code: linkUsageCode, language: 'tsx' },
  },
  {
    id: 'menu',
    name: 'Menu',
    group: 'actions',
    Component: MenuEntry,
    usage: { Component: MenuUsage, code: menuUsageCode, language: 'tsx' },
  },
  {
    id: 'toggle-button',
    name: 'ToggleButton',
    group: 'actions',
    Component: ToggleButtonEntry,
    usage: {
      Component: ToggleButtonUsage,
      code: toggleButtonUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'toggle-group',
    name: 'ToggleGroup',
    group: 'actions',
    Component: ToggleGroupEntry,
    usage: {
      Component: ToggleGroupUsage,
      code: toggleGroupUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'calendar',
    name: 'Calendar',
    group: 'forms',
    Component: CalendarEntry,
    usage: {
      Component: CalendarUsage,
      code: calendarUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'checkbox',
    name: 'Checkbox',
    group: 'forms',
    Component: CheckboxEntry,
    usage: {
      Component: CheckboxUsage,
      code: checkboxUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'checkbox-group',
    name: 'CheckboxGroup',
    group: 'forms',
    Component: CheckboxGroupEntry,
    usage: {
      Component: CheckboxGroupUsage,
      code: checkboxGroupUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'combobox',
    name: 'Combobox',
    group: 'forms',
    Component: ComboboxEntry,
    usage: {
      Component: ComboboxUsage,
      code: comboboxUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'date-picker',
    name: 'DatePicker',
    group: 'forms',
    Component: DatePickerEntry,
    usage: {
      Component: DatePickerUsage,
      code: datePickerUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'fieldset',
    name: 'Fieldset',
    group: 'forms',
    Component: FieldsetEntry,
    usage: {
      Component: FieldsetUsage,
      code: fieldsetUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'file-upload',
    name: 'FileUpload',
    group: 'forms',
    Component: FileUploadEntry,
    usage: {
      Component: FileUploadUsage,
      code: fileUploadUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'form',
    name: 'Form',
    group: 'forms',
    Component: FormEntry,
    usage: {
      Component: FormUsage,
      code: formUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'input',
    name: 'Input',
    group: 'forms',
    Component: InputEntry,
    usage: { Component: InputUsage, code: inputUsageCode, language: 'tsx' },
  },
  {
    id: 'number-input',
    name: 'NumberInput',
    group: 'forms',
    Component: NumberInputEntry,
    usage: {
      Component: NumberInputUsage,
      code: numberInputUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'password-input',
    name: 'PasswordInput',
    group: 'forms',
    Component: PasswordInputEntry,
    usage: {
      Component: PasswordInputUsage,
      code: passwordInputUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'pin-input',
    name: 'PinInput',
    group: 'forms',
    Component: PinInputEntry,
    usage: {
      Component: PinInputUsage,
      code: pinInputUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'radio-group',
    name: 'RadioGroup',
    group: 'forms',
    Component: RadioGroupEntry,
    usage: {
      Component: RadioGroupUsage,
      code: radioGroupUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'rating',
    name: 'Rating',
    group: 'forms',
    Component: RatingEntry,
    usage: {
      Component: RatingUsage,
      code: ratingUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'search-input',
    name: 'SearchInput',
    group: 'forms',
    Component: SearchInputEntry,
    usage: {
      Component: SearchInputUsage,
      code: searchInputUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'segmented-control',
    name: 'SegmentedControl',
    group: 'forms',
    Component: SegmentedControlEntry,
    usage: {
      Component: SegmentedControlUsage,
      code: segmentedControlUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'select',
    name: 'Select',
    group: 'forms',
    Component: SelectEntry,
    usage: { Component: SelectUsage, code: selectUsageCode, language: 'tsx' },
  },
  {
    id: 'slider',
    name: 'Slider',
    group: 'forms',
    Component: SliderEntry,
    usage: {
      Component: SliderUsage,
      code: sliderUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'switch',
    name: 'Switch',
    group: 'forms',
    Component: SwitchEntry,
    usage: { Component: SwitchUsage, code: switchUsageCode, language: 'tsx' },
  },
  {
    id: 'tag-input',
    name: 'TagInput',
    group: 'forms',
    Component: TagInputEntry,
    usage: {
      Component: TagInputUsage,
      code: tagInputUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'textarea',
    name: 'Textarea',
    group: 'forms',
    Component: TextareaEntry,
    usage: {
      Component: TextareaUsage,
      code: textareaUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'time-field',
    name: 'TimeField',
    group: 'forms',
    Component: TimeFieldEntry,
    usage: {
      Component: TimeFieldUsage,
      code: timeFieldUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'accordion',
    name: 'Accordion',
    group: 'display',
    Component: AccordionEntry,
    usage: {
      Component: AccordionUsage,
      code: accordionUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'avatar',
    name: 'Avatar',
    group: 'display',
    Component: AvatarEntry,
    usage: { Component: AvatarUsage, code: avatarUsageCode, language: 'tsx' },
  },
  {
    id: 'avatar-group',
    name: 'AvatarGroup',
    group: 'display',
    Component: AvatarGroupEntry,
    usage: {
      Component: AvatarGroupUsage,
      code: avatarGroupUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'badge',
    name: 'Badge',
    group: 'display',
    Component: BadgeEntry,
    usage: { Component: BadgeUsage, code: badgeUsageCode, language: 'tsx' },
  },
  {
    id: 'card',
    name: 'Card',
    group: 'display',
    Component: CardEntry,
    usage: { Component: CardUsage, code: cardUsageCode, language: 'tsx' },
  },
  {
    id: 'code-block',
    name: 'CodeBlock',
    group: 'display',
    Component: CodeBlockEntry,
    usage: {
      Component: CodeBlockUsage,
      code: codeBlockUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'description-list',
    name: 'DescriptionList',
    group: 'display',
    Component: DescriptionListEntry,
    usage: {
      Component: DescriptionListUsage,
      code: descriptionListUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'heading',
    name: 'Heading',
    group: 'display',
    Component: HeadingEntry,
    usage: { Component: HeadingUsage, code: headingUsageCode, language: 'tsx' },
  },
  {
    id: 'icon',
    name: 'Icon',
    group: 'display',
    Component: IconEntry,
    usage: { Component: IconUsage, code: iconUsageCode, language: 'tsx' },
  },
  {
    id: 'image',
    name: 'Image',
    group: 'display',
    Component: ImageEntry,
    usage: {
      Component: ImageUsage,
      code: imageUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'kbd',
    name: 'Kbd',
    group: 'display',
    Component: KbdEntry,
    usage: { Component: KbdUsage, code: kbdUsageCode, language: 'tsx' },
  },
  {
    id: 'skeleton',
    name: 'Skeleton',
    group: 'display',
    Component: SkeletonEntry,
    usage: {
      Component: SkeletonUsage,
      code: skeletonUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'stat',
    name: 'Stat',
    group: 'display',
    Component: StatEntry,
    usage: {
      Component: StatUsage,
      code: statUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'table',
    name: 'Table',
    group: 'display',
    Component: TableEntry,
    usage: {
      Component: TableUsage,
      code: tableUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'tag',
    name: 'Tag',
    group: 'display',
    Component: TagEntry,
    usage: { Component: TagUsage, code: tagUsageCode, language: 'tsx' },
  },
  {
    id: 'text',
    name: 'Text',
    group: 'display',
    Component: TextEntry,
    usage: { Component: TextUsage, code: textUsageCode, language: 'tsx' },
  },
  {
    id: 'timeline',
    name: 'Timeline',
    group: 'display',
    Component: TimelineEntry,
    usage: {
      Component: TimelineUsage,
      code: timelineUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'tree-view',
    name: 'TreeView',
    group: 'display',
    Component: TreeViewEntry,
    usage: {
      Component: TreeViewUsage,
      code: treeViewUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'alert',
    name: 'Alert',
    group: 'feedback',
    Component: AlertEntry,
    usage: { Component: AlertUsage, code: alertUsageCode, language: 'tsx' },
  },
  {
    id: 'banner',
    name: 'Banner',
    group: 'feedback',
    Component: BannerEntry,
    usage: {
      Component: BannerUsage,
      code: bannerUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'empty-state',
    name: 'EmptyState',
    group: 'feedback',
    Component: EmptyStateEntry,
    usage: {
      Component: EmptyStateUsage,
      code: emptyStateUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'progress',
    name: 'Progress',
    group: 'feedback',
    Component: ProgressEntry,
    usage: {
      Component: ProgressUsage,
      code: progressUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'spinner',
    name: 'Spinner',
    group: 'feedback',
    Component: SpinnerEntry,
    usage: { Component: SpinnerUsage, code: spinnerUsageCode, language: 'tsx' },
  },
  {
    id: 'toast',
    name: 'Toast',
    group: 'feedback',
    Component: ToastEntry,
    usage: { Component: ToastUsage, code: toastUsageCode, language: 'tsx' },
  },
  {
    id: 'breadcrumb',
    name: 'Breadcrumb',
    group: 'navigation',
    Component: BreadcrumbEntry,
    usage: {
      Component: BreadcrumbUsage,
      code: breadcrumbUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'command-palette',
    name: 'CommandPalette',
    group: 'navigation',
    Component: CommandPaletteEntry,
    usage: {
      Component: CommandPaletteUsage,
      code: commandPaletteUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'nav-list',
    name: 'NavList',
    group: 'navigation',
    Component: NavListEntry,
    usage: {
      Component: NavListUsage,
      code: navListUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'pagination',
    name: 'Pagination',
    group: 'navigation',
    Component: PaginationEntry,
    usage: {
      Component: PaginationUsage,
      code: paginationUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'skip-link',
    name: 'SkipLink',
    group: 'navigation',
    Component: SkipLinkEntry,
    usage: {
      Component: SkipLinkUsage,
      code: skipLinkUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'stepper',
    name: 'Stepper',
    group: 'navigation',
    Component: StepperEntry,
    usage: {
      Component: StepperUsage,
      code: stepperUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'tabs',
    name: 'Tabs',
    group: 'navigation',
    Component: TabsEntry,
    usage: { Component: TabsUsage, code: tabsUsageCode, language: 'tsx' },
  },
  {
    id: 'alert-dialog',
    name: 'AlertDialog',
    group: 'overlays',
    Component: AlertDialogEntry,
    usage: {
      Component: AlertDialogUsage,
      code: alertDialogUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'context-menu',
    name: 'ContextMenu',
    group: 'overlays',
    Component: ContextMenuEntry,
    usage: {
      Component: ContextMenuUsage,
      code: contextMenuUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'dialog',
    name: 'Dialog',
    group: 'overlays',
    Component: DialogEntry,
    usage: { Component: DialogUsage, code: dialogUsageCode, language: 'tsx' },
  },
  {
    id: 'drawer',
    name: 'Drawer',
    group: 'overlays',
    Component: DrawerEntry,
    usage: {
      Component: DrawerUsage,
      code: drawerUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'hover-card',
    name: 'HoverCard',
    group: 'overlays',
    Component: HoverCardEntry,
    usage: {
      Component: HoverCardUsage,
      code: hoverCardUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'popover',
    name: 'Popover',
    group: 'overlays',
    Component: PopoverEntry,
    usage: {
      Component: PopoverUsage,
      code: popoverUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'tooltip',
    name: 'Tooltip',
    group: 'overlays',
    Component: TooltipEntry,
    usage: { Component: TooltipUsage, code: tooltipUsageCode, language: 'tsx' },
  },
  {
    id: 'aspect-ratio',
    name: 'AspectRatio',
    group: 'layout',
    Component: AspectRatioEntry,
    usage: {
      Component: AspectRatioUsage,
      code: aspectRatioUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'container',
    name: 'Container',
    group: 'layout',
    Component: ContainerEntry,
    usage: {
      Component: ContainerUsage,
      code: containerUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'divider',
    name: 'Divider',
    group: 'layout',
    Component: DividerEntry,
    usage: { Component: DividerUsage, code: dividerUsageCode, language: 'tsx' },
  },
  {
    id: 'grid',
    name: 'Grid',
    group: 'layout',
    Component: GridEntry,
    usage: {
      Component: GridUsage,
      code: gridUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'scroll-area',
    name: 'ScrollArea',
    group: 'layout',
    Component: ScrollAreaEntry,
    usage: {
      Component: ScrollAreaUsage,
      code: scrollAreaUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'sidebar',
    name: 'Sidebar',
    group: 'layout',
    Component: SidebarEntry,
    usage: {
      Component: SidebarUsage,
      code: sidebarUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'stack',
    name: 'Stack',
    group: 'layout',
    Component: StackEntry,
    usage: { Component: StackUsage, code: stackUsageCode, language: 'tsx' },
  },
  {
    id: 'portal',
    name: 'Portal',
    group: 'utilities',
    Component: PortalEntry,
    usage: {
      Component: PortalUsage,
      code: portalUsageCode,
      language: 'tsx',
    },
  },
  {
    id: 'theme-toggle',
    name: 'ThemeToggle',
    group: 'utilities',
    importFrom: '@/features/theme/theme-toggle',
    Component: ThemeToggleEntry,
    usage: {
      Component: ThemeToggleUsage,
      code: themeToggleUsageCode,
      language: 'tsx',
    },
  },
]

const COMPONENTS_IMPORT = '@/components'

// Entries that document more than one export.
const IMPORT_NAMES: Partial<Record<ShowcaseEntryId, string>> = {
  card: 'Card, CardBody, CardFooter, CardHeader',
  toast: 'useToast',
  'date-picker': 'DatePicker, DateRangePicker, DateTimePicker',
  form: 'Form, FormField, FormSubmit',
  slider: 'RangeSlider, Slider',
}

export function getEntryPath(id: string): string {
  return `${DESIGN_SYSTEM_PATH}/${id}`
}

export function findEntry(id: string | undefined): ShowcaseEntry | undefined {
  return SHOWCASE_ENTRIES.find((entry) => entry.id === id)
}

export function getEntriesInGroup(group: ShowcaseGroup): ShowcaseEntry[] {
  return SHOWCASE_ENTRIES.filter((entry) => entry.group === group)
}

export function getImportSnippet(entry: ShowcaseEntry): string | undefined {
  if (entry.group === 'foundations') {
    return undefined
  }

  const names = IMPORT_NAMES[entry.id] ?? entry.name

  return `import { ${names} } from '${entry.importFrom ?? COMPONENTS_IMPORT}'`
}
