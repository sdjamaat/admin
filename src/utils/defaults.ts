import { ItemSettings, ContainerSizes, KindOfItem } from "./types"

export const defaultItemSettings: ItemSettings = {
  settings: {
    Grand: {
      containers: [
        { ounces: ContainerSizes.ThirtyTwoOunce },
        { ounces: ContainerSizes.SixteenOunce },
      ],
      count: 12,
    },
    Full: {
      containers: [{ ounces: ContainerSizes.ThirtyTwoOunce }],
      count: 8,
    },
    Half: {
      containers: [{ ounces: ContainerSizes.SixteenOunce }],
      count: 4,
    },
    Quarter: {
      containers: [{ ounces: ContainerSizes.EightOunce }],
      count: 4,
    },
  },
  type: KindOfItem.Container,
  hasMultipleLabelsForCountType: true,
}
