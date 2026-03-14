export const shortMonthToLongMonth = (shortMonth: string): string => {
  switch (shortMonth) {
    case "moharram": return "Moharram al-Haraam"
    case "safar": return "Safar al-Muzaffar"
    case "rabi1": return "Rabi al-Awwal"
    case "rabi2": return "Rabi al-Aakhar"
    case "jumada1": return "Jumada al-Ula"
    case "jumada2": return "Jumada al-Ukhra"
    case "rajab": return "Rajab al-Asab"
    case "shabaan": return "Shabaan al-Karim"
    case "ramadaan": return "Ramadaan al-Moazzam"
    case "shawwal": return "Shawwal al-Mukarram"
    case "zilqadah": return "Zilqadah al-Haraam"
    case "zilhaj": return "Zilhaj al-Haraam"
    default: return ""
  }
}

export const shortMonthNames = [
  "safar", "rabi1", "rabi2", "jumada1", "jumada2",
  "rajab", "shabaan", "ramadaan", "shawwal", "zilqadah", "zilhaj", "moharram",
]

export const shortMonthToIndex = (shortMonth: string): number | null => {
  switch (shortMonth) {
    case "moharram": return 0
    case "safar": return 1
    case "rabi1": return 2
    case "rabi2": return 3
    case "jumada1": return 4
    case "jumada2": return 5
    case "rajab": return 6
    case "shabaan": return 7
    case "ramadaan": return 8
    case "shawwal": return 9
    case "zilqadah": return 10
    case "zilhaj": return 11
    default: return null
  }
}

export const getNextMonthIndex = (currIndex: number): number => {
  return (currIndex + 1) % 12
}

export const monthIndexToName = (index: number): { short: string; long: string } => {
  switch (index) {
    case 0: return { short: "moharram", long: "Moharram al-Haraam" }
    case 1: return { short: "safar", long: "Safar al-Muzaffar" }
    case 2: return { short: "rabi1", long: "Rabi al-Awwal" }
    case 3: return { short: "rabi2", long: "Rabi al-Aakhar" }
    case 4: return { short: "jumada1", long: "Jumada al-Ula" }
    case 5: return { short: "jumada2", long: "Jumada al-Ukhra" }
    case 6: return { short: "rajab", long: "Rajab al-Asab" }
    case 7: return { short: "shabaan", long: "Shabaan al-Karim" }
    case 8: return { short: "ramadaan", long: "Ramadaan al-Moazzam" }
    case 9: return { short: "shawwal", long: "Shawwal al-Mukarram" }
    case 10: return { short: "zilqadah", long: "Zilqadah al-Haraam" }
    case 11: return { short: "zilhaj", long: "Zilhaj al-Haraam" }
    default: return { short: "", long: "" }
  }
}
