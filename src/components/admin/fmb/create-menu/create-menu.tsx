import React, { useState, useEffect, useContext } from "react"
import { DateContext } from "../../../../provider/date-context"
import styled from "styled-components"
import { Card, Spin } from "antd"
import { db } from "../../../../lib/firebase"
import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp, arrayUnion } from "firebase/firestore"
import HijriMonthForm from "./hijri-month-form"
import MenuItemsForm from "./menu-items-form"
import ReviewMenu from "./review-menu"
import CustomMessage from "../../../custom-message"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
import { cloneDeep } from "lodash"

const CreateMenu = ({ setPage, refetchMenus }: any) => {
  const { getHijriDate } = useContext(DateContext)
  const [step, setstep] = useState("hijrimonth")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [monthsFinished, setMonthsFinished] = useState<any[]>([])
  const [hijriMonthFormValues, setHijriMonthFormValues] = useState<any>({})
  const [menuItemsFormValues, setMenuItemsFormValues] = useState<any>({})
  const [disabledMenuItems, setDisabledMenuItemNames] = useState<any[]>([])

  const getMonthsFinished = async () => {
    let finishedArr: any[] = []
    try {
      const queryForFmbHijriDocRef = doc(db, "fmb", getHijriDate().year.toString())

      const yearCollection = await getDoc(queryForFmbHijriDocRef)
      if (yearCollection.exists()) {
        finishedArr = yearCollection.data().finished
      } else {
        await setDoc(queryForFmbHijriDocRef, {
          finished: [],
          activeMenu: null,
          lastActiveMenu: null,
        })
        // Reference the subcollection (no-op, just establishing path)
        collection(queryForFmbHijriDocRef, "menus")
      }
    } catch (error) {
      console.log("Error getting documents", error)
    }
    setMonthsFinished(finishedArr)
  }

  useEffect(() => {
    getMonthsFinished()
  }, [])

  const sortMenuItemsByDate = (a: any, b: any) => {
    const item1Date = a.date
    const item2Date = b.date

    let comparison = 0
    if (item1Date.isAfter(item2Date)) {
      comparison = 1
    } else if (item1Date.isBefore(item2Date)) {
      comparison = -1
    }
    return comparison
  }

  const generateUniqueIDForItem = () => {
    return Array(15)
      .fill(0)
      .map(x => Math.random().toString(36).charAt(2))
      .join("")
  }

  const getProcessedMenuItemsArray = () => {
    let newMenuItemsArr = cloneDeep(menuItemsFormValues.items)
    newMenuItemsArr.sort(sortMenuItemsByDate)
    for (let item of newMenuItemsArr) {
      item.date = item.date.format("MM-DD-YYYY")
      item.nothaali = item.nothaali || false
      item.reasonNoThaali = item.reasonNoThaali || null
      item.id = generateUniqueIDForItem()
    }
    return newMenuItemsArr
  }

  const submitMenu = async () => {
    setIsSubmitting(true)

    try {
      const queryForFmbHijriDocRef = doc(db, "fmb", getHijriDate().year.toString())

      await updateDoc(queryForFmbHijriDocRef, {
        finished: arrayUnion(
          hijriMonthFormValues.hijrimonth
        ),
      })

      await setDoc(
        doc(db, "fmb", getHijriDate().year.toString(), "menus", hijriMonthFormValues.hijrimonth),
        {
          items: getProcessedMenuItemsArray(),
          status: "queued",
          timestamp: serverTimestamp(),
          displayMonthName: shortMonthToLongMonth(
            hijriMonthFormValues.hijrimonth
          ),
          displayYear: hijriMonthFormValues.year,
          submissions: [],
        }
      )
      CustomMessage("success", "Successfully created new menu")
      setIsSubmitting(false)
      refetchMenus(true)
      setPage("fmb-manage-menus")
    } catch (error) {
      console.log(error)
      CustomMessage("error", "Could not submit menu")
      setIsSubmitting(false)
    }
  }

  const getStep = (step: any) => {
    switch (step) {
      case "hijrimonth":
        return (
          <HijriMonthForm
            monthsFinished={monthsFinished}
            setStep={setstep}
            values={hijriMonthFormValues}
            setValues={setHijriMonthFormValues}
          />
        )
      case "menuitems":
        return (
          <MenuItemsForm
            setStep={setstep}
            values={menuItemsFormValues}
            setValues={setMenuItemsFormValues}
            disabledValues={disabledMenuItems}
            setDisabledValues={setDisabledMenuItemNames}
          />
        )
      case "reviewmenu":
        return (
          <ReviewMenu
            setStep={setstep}
            hijrimonthForm={hijriMonthFormValues}
            menuitemsForm={menuItemsFormValues}
            submitMenu={submitMenu}
          />
        )
      default:
        return (
          <HijriMonthForm
            monthsFinished={monthsFinished}
            setStep={setstep}
            values={hijriMonthFormValues}
            setValues={setHijriMonthFormValues}
          />
        )
    }
  }

  return (
    <CreateMenuWrapper>
      <Card
        title="Create New Menu"
        headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
        bodyStyle={{ paddingBottom: "0" }}
      >
        <Spin spinning={isSubmitting}>{getStep(step)}</Spin>
      </Card>
    </CreateMenuWrapper>
  )
}

const CreateMenuWrapper = styled.div`
  max-width: 1000px;
  margin: auto;
  .next-btn {
    height: 2.5rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default CreateMenu
