import { ItemSettings, ContainerSizes, KindOfItem } from "./types"

export const defaultItemSettings: ItemSettings = {
  settings: {
    Full: {
      containers: [{ ounces: ContainerSizes.ThirtyTwoOunce }],
      count: 1,
    },
    Half: {
      containers: [{ ounces: ContainerSizes.SixteenOunce }],
      count: 1,
    },
    Quarter: {
      containers: [{ ounces: ContainerSizes.TwelveOunce }],
      count: 1,
    },
  },
  type: KindOfItem.Container,
}
