export interface SingleImportedThaaliSelection {
  Week: string
  Distribution: string
  "Distribution Day": string
  Date: Date
  Hijri: number
  Code: string
  Size: ThaaliTypes
  Family: string
  Item: string
  Mohalla: string
  HalfEquiv: number
  Chef: string
  ItemComplex: string
  ContainerOrCountText: string
  CountainerOuncesNumber: string
  "Original Size": string
}

export enum ThaaliTypes {
  Grand = "Grand",
  Full = "Full",
  Half = "Half",
  Quarter = "Quarter",
  None = "None",
  Period = ".",
  Empty = "",
}

export interface UniqueItem {
  itemMetadata: SingleImportedThaaliSelection
  splitArray: SplitItem[]
}

export interface SalawaatThaali {
  key: string
  name: string
}

// Define the Container sizes
export enum ContainerSizes {
  ThirtyTwoOunce = "32oz",
  TwentyFourOunce = "24oz",
  SixteenOunce = "16oz",
  TwelveOunce = "12oz",
  EightOunce = "8oz",
}

export type ContainerType = {
  ounces: ContainerSizes
}
export enum KindOfItem {
  Container = "container",
  Count = "count",
}

// Define the ItemSettings type for a specific size category
export type SingleSizeItemSetting = {
  containers: ContainerType[]
  count: number | null // count will be null if container type is selected
}

// Define a new interface for Item settings that includes the type of the item
export interface ItemSettings {
  type: KindOfItem
  settings: {
    Grand: SingleSizeItemSetting
    Full: SingleSizeItemSetting
    Half: SingleSizeItemSetting
    Quarter: SingleSizeItemSetting
  }
  hasMultipleLabelsForCountType: boolean
}

// Update the SplitItem interface to use ItemSettingsWithType
export interface SplitItem {
  key: string
  name: string
  sizeAppliedTo: ThaaliTypes
  itemSettings: ItemSettings
}
