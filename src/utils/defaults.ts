import { ItemSettings, ContainerSizes, KindOfItem } from "./types"

export const defaultItemSettings: ItemSettings = {
  settings: {
    Full: {
      containers: [{ ounces: ContainerSizes.ThirtyTwoOunce }],
      count: 4,
    },
    Half: {
      containers: [{ ounces: ContainerSizes.SixteenOunce }],
      count: 2,
    },
    Quarter: {
      containers: [{ ounces: ContainerSizes.EightOunce }],
      count: 1,
    },
  },
  type: KindOfItem.Container,
  hasMultipleLabelsForCountType: true,
}
