const SIZE_HIERARCHY: Record<string, number> = {
  Grand: 4,
  Full: 3,
  Half: 2,
  Quarter: 1,
}

export const ALL_SIZES = ["Grand", "Full", "Half", "Quarter"] as const

export const getEffectiveMaxSize = (
  familyMaxSize: string,
  itemMaxSize?: string | null
): string => {
  if (!itemMaxSize) return familyMaxSize
  const familyRank = SIZE_HIERARCHY[familyMaxSize] ?? 4
  const itemRank = SIZE_HIERARCHY[itemMaxSize] ?? 4
  return familyRank <= itemRank ? familyMaxSize : itemMaxSize
}

export const getAllowedSizes = (effectiveMaxSize: string): string[] => {
  const maxRank = SIZE_HIERARCHY[effectiveMaxSize] ?? 4
  return ALL_SIZES.filter((size) => SIZE_HIERARCHY[size] <= maxRank)
}
