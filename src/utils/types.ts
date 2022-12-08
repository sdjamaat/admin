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
  "Original Size": string
}

export enum ThaaliTypes {
  Full = "Full",
  Half = "Half",
  Quarter = "Quarter",
  None = "None",
  Period = ".",
  Empty = "",
}

export interface SplitItem {
  key: string
  name: string
  sizeAppliedTo: ThaaliTypes
}

export interface UniqueItem {
  itemMetadata: SingleImportedThaaliSelection
  splitArray: SplitItem[]
}

export interface SalawaatThaali {
  key: string
  name: string
}
