//function used recurrently in hijri calendar components

module.exports = {
  shortMonthToLongMonth: shortMonth => {
    switch (shortMonth) {
      case "moharram":
        return "Moharram al-Haraam"
      case "safar":
        return "Safar al-Muzaffar"
      case "rabi1":
        return "Rabi al-Awwal"
      case "rabi2":
        return "Rabi al-Aakhar"
      case "jumada1":
        return "Jumada al-Ula"
      case "jumada2":
        return "Jumada al-Ukhra"
      case "rajab":
        return "Rajab al-Asab"
      case "shabaan":
        return "Shabaan al-Karim"
      case "ramadaan":
        return "Ramadaan al-Moazzam"
      case "shawwal":
        return "Shawwal al-Mukarram"
      case "zilqadah":
        return "Zilqadah al-Haraam"
      case "zilhaj":
        return "Zilhaj al-Haraam"
      default:
        return ""
    }
  },
  shortMonthNames: [
    "safar",
    "rabi1",
    "rabi2",
    "jumada1",
    "jumada2",
    "rajab",
    "shabaan",
    "ramadaan",
    "shawwal",
    "zilqadah",
    "zilhaj",
    "moharram",
  ],
}
