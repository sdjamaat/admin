import React, { createContext, useState, useEffect } from "react"
import { monthIndexToName } from "../functions/calendar"
const moment = require("moment-timezone")
moment().tz("America/Los_Angeles").format()
const momentHijri = require("moment-hijri")

const defaultState = {
  momentHijri: null,
  getHijriDate: () => {},
}

export const DateContext = createContext(defaultState)

export const DateProvider = ({ children }) => {
  const getHijriDate = () => {
    const newDate = momentHijri().add(1, "days")
    let databaseYear = newDate.iYear()
    if (newDate.iMonth() === 0) {
      databaseYear = newDate.iYear() - 1
    }
    const longMonthName = monthIndexToName(newDate.iMonth()).long
    const shortMonthName = monthIndexToName(newDate.iMonth()).short

    return {
      day: newDate.iDate(),
      month: newDate.iMonth(),
      year: newDate.iYear(),
      databaseYear: databaseYear,
      shortMonthName: shortMonthName,
      longMonthName: longMonthName,
    }
  }

  return (
    <DateContext.Provider
      value={{
        momentHijri,
        getHijriDate,
      }}
    >
      {children}
    </DateContext.Provider>
  )
}
