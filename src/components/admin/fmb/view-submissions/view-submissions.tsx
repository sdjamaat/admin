import React, { useEffect, useState, useContext } from "react"
import {
  Card,
  Select,
  Alert,
  Divider,
  Collapse,
  Button,
  Popconfirm,
  message,
} from "antd"
import styled from "styled-components"
import { db } from "../../../../lib/firebase"
import { doc, getDoc, getDocs, collection, updateDoc, deleteDoc, arrayRemove } from "firebase/firestore"
import { DateContext } from "../../../../provider/date-context"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
import { cloneDeep } from "lodash"
import moment from "moment"
import * as xlsx from "xlsx"

const { Option } = Select
const { Panel } = Collapse

const ViewSubmissions = () => {
  const [menusWithSubmissions, setMenusWithSubmissions] = useState<any>(null)
  const [submissions, setSubmissions] = useState<any[]>([])
  const [currSelectedMenuIndex, setCurrSelectedMenuIndex] = useState(0)
  const [
    allFamiliesEnrolledInFMBMap,
    setAllFamiliesEnrolledInFMBMap,
  ] = useState<any>({})
  const [familiesWithoutSubmissions, setFamiliesWithoutSubmissions] = useState<any[]>(
    []
  )
  const { getHijriDate } = useContext(DateContext)

  const getAllFamiliesEnrolledInFMB = async () => {
    try {
      let allEnrolledFamilies: any = {}
      const families = await getDocs(collection(db, "families"))
      families.forEach((family: any) => {
        const data = family.data()
        if (data.fmb.enrolled) {
          allEnrolledFamilies[data.familyid] = data
        }
      })
      setAllFamiliesEnrolledInFMBMap(allEnrolledFamilies)
    } catch (err) {
      console.log(err)
    }
  }

  const getMenusWithSubmissions = async () => {
    try {
      let filteredMenus: any[] = []
      const hijriYear = getHijriDate().year
      const menus = await getDocs(
        collection(db, "fmb", hijriYear.toString(), "menus")
      )

      // for each menu, check if it has any submissions. If it does, put it in the drop down
      // no querying for submissions yet, only if the user clicks on it
      menus.forEach((docSnap: any) => {
        const shortMonthName = docSnap.id
        const data = docSnap.data()
        if (data.submissions.length > 0) {
          filteredMenus.push({
            shortMonthName: shortMonthName,
            longMonthName: shortMonthToLongMonth(shortMonthName),
            items: data.items,
            displayYear: data.displayYear,
            isPrevMoharram: false,
          })
        }
      })

      const moharramPast = await getDoc(
        doc(db, "fmb", (hijriYear - 1).toString(), "menus", "moharram")
      )

      const moharramPastData = moharramPast.data()

      if (moharramPastData && moharramPastData.submissions.length > 0) {
        filteredMenus.push({
          shortMonthName: "moharram",
          longMonthName: shortMonthToLongMonth("moharram"),
          items: moharramPastData.items,
          displayYear: moharramPastData.displayYear,
          isPrevMoharram: true,
        })
      }

      setMenusWithSubmissions(filteredMenus)
    } catch (err) {
      console.log(err)
    }
  }

  // gets submissions for a month when user changes it on the dropdown
  // param 'index' is the index of the menu in 'menusWithSubmissions'
  const handleChangeMenu = async (index: any) => {
    let submissionsArr: any[] = []

    const shortMonthName = menusWithSubmissions[index].shortMonthName
    const isPrevMoharram = menusWithSubmissions[index].isPrevMoharram
    const hijriYear = getHijriDate().year
    let allFamiliesEnrolledInFMBMapCopy = cloneDeep(allFamiliesEnrolledInFMBMap)
    const submissionsSnap = await getDocs(
      collection(
        db,
        "fmb",
        isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString(),
        "menus",
        shortMonthName,
        "submissions"
      )
    )
    submissionsSnap.forEach((docSnap: any) => {
      const data = docSnap.data()
      submissionsArr.push({ ...data, familyid: docSnap.id })
      delete allFamiliesEnrolledInFMBMapCopy[docSnap.id]
    })
    setCurrSelectedMenuIndex(index)
    setSubmissions(submissionsArr)
    console.log(Object.values(allFamiliesEnrolledInFMBMapCopy))
    setFamiliesWithoutSubmissions(
      Object.values(allFamiliesEnrolledInFMBMapCopy)
    )
  }

  const sortSelectionsByThaaliSize = (a: any, b: any) => {
    const item1Size = a.Size
    const item2Size = b.Size

    let comparison = 0
    if (
      item1Size === "None" &&
      (item2Size === "Full" || item2Size === "Half" || item2Size === "Quarter")
    ) {
      comparison = 1
    } else if (
      item2Size === "None" &&
      (item1Size === "Full" || item1Size === "Half" || item1Size === "Quarter")
    ) {
      comparison = -1
    } else if (
      (item1Size === "Full" && item2Size === "Half") ||
      item2Size === "Quarter"
    ) {
      comparison = 1
    } else if (item1Size === "Half" && item2Size === "Quarter") {
      comparison = 1
    } else if (item1Size === "Half" && item2Size === "Full") {
      comparison = -1
    } else if (
      (item1Size === "Quarter" && item2Size === "Full") ||
      item2Size === "Half"
    ) {
      comparison = -1
    }
    return comparison
  }

  const getJSONSheetValues = () => {
    let menuItemSizesToFMBCodes: any[] = []
    let menuItemToTotalsRows: any[] = []
    const menuItemsForCurrentlySelectedMonth =
      menusWithSubmissions[currSelectedMenuIndex].items
    let menuItemIndex = 0
    for (let menuItem of menuItemsForCurrentlySelectedMonth) {
      let menuItemSheet: any = {
        item: menuItem.name,
        date: menuItem.date,
        name: `(${menuItem.date})`,
        rows: [],
      }
      if (!menuItem.nothaali) {
        let counts: any = {
          Item: menuItem.name,
          Date: menuItem.date,
          Quarter: 0,
          Half: 0,
          Full: 0,
        }
        for (let submission of submissions) {
          let size = submission.selections[menuItem.id]
          if (size === "No Thaali") size = "None"
          if (size !== "None") {
            counts[size] = counts[size] + 1
          }

          menuItemSheet.rows.push({
            Family: submission.familyDisplayName,
            Code: submission.code,
            Size: size,
            Mohalla: submission.code.split("-")[0],
          })
        }
        menuItemSheet.rows.sort(sortSelectionsByThaaliSize)
        menuItemSizesToFMBCodes.push(menuItemSheet)
        menuItemToTotalsRows.push(counts)
      }
      menuItemIndex = menuItemIndex + 1
    }
    return {
      menuItemSheets: menuItemSizesToFMBCodes,
      totals: menuItemToTotalsRows,
    }
  }

  const exportDataToExcel = async () => {
    const displayMonthName =
      menusWithSubmissions[currSelectedMenuIndex].longMonthName
    const currentTime = moment().format("dddd, MMM Do YYYY, h:mm:ss a")

    const { menuItemSheets, totals } = getJSONSheetValues()
    totals[0]["Export Timestamp"] = currentTime

    const fitToColumn = (data: any) => {
      const columnWidths: any[] = []
      for (const property in data[0]) {
        columnWidths.push({
          wch: Math.max(
            property ? property.toString().length : 0,
            ...data.map((obj: any) =>
              obj[property] ? obj[property].toString().length : 0
            )
          ),
        })
      }
      return columnWidths
    }

    const newWB = xlsx.utils.book_new()

    let totalsWorkSheet = xlsx.utils.json_to_sheet(totals)
    totalsWorkSheet["!cols"] = fitToColumn(totals)
    xlsx.utils.book_append_sheet(newWB, totalsWorkSheet, "Totals")

    // append sheet with all items in aggregate
    let flatSheetRows: any[] = []
    for (let menuItemSheet of menuItemSheets) {
      for (let row of menuItemSheet.rows) {
        row = {
          Date: menuItemSheet.date,
          Item: menuItemSheet.item,
          ...row,
        }
        flatSheetRows.push(row)
      }
    }
    let flatSheet = xlsx.utils.json_to_sheet(flatSheetRows)
    flatSheet["!cols"] = fitToColumn(flatSheetRows)
    xlsx.utils.book_append_sheet(newWB, flatSheet, "All Items")

    // for (let menuItemSheet of menuItemSheets) {
    //   const firstRow = menuItemSheet.rows[0]
    //   menuItemSheet.rows[0] = {
    //     Item: menuItemSheet.item,
    //     Date: menuItemSheet.date,
    //     ...firstRow,
    //   }
    //   let sheet = xlsx.utils.json_to_sheet(menuItemSheet.rows)
    //   sheet["!cols"] = fitToColumn(menuItemSheet.rows)
    //   xlsx.utils.book_append_sheet(newWB, sheet, menuItemSheet.name)
    // }

    xlsx.writeFile(
      newWB,
      `${displayMonthName}_${moment().format("dddd MMMM Do YYYY h:mm:ss")}.xlsx`
    )
  }

  const handleDeleteSubmission = async (submission: any, submissionIndex: any) => {
    const shortMonthName =
      menusWithSubmissions[currSelectedMenuIndex].shortMonthName
    const isPrevMoharram =
      menusWithSubmissions[currSelectedMenuIndex].isPrevMoharram
    const hijriYear = getHijriDate().year

    try {
      // delete submissions doc
      await deleteDoc(
        doc(
          db,
          "fmb",
          isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString(),
          "menus",
          shortMonthName,
          "submissions",
          submission.familyid
        )
      )

      // delete family id from the submissions array
      await updateDoc(
        doc(
          db,
          "fmb",
          isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString(),
          "menus",
          shortMonthName
        ),
        {
          submissions: arrayRemove(
            submission.familyDisplayName
          ),
        }
      )

      // delete the entry in current state object
      let submissionsCopy = cloneDeep(submissions)
      submissionsCopy.splice(submissionIndex, 1)
      setSubmissions(submissionsCopy)

      message.success("Successfully deleted submission")
    } catch (err) {
      message.error("Error deleting the submission")
    }
  }

  useEffect(() => {
    getMenusWithSubmissions()
    getAllFamiliesEnrolledInFMB()
  }, [])

  return (
    <ViewSubmissionsWrapper>
      <Card
        title="View Menu Submissions"
        headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
      >
        {menusWithSubmissions === null ? (
          <div>Loading...</div>
        ) : menusWithSubmissions.length > 0 ? (
          <>
            <div style={{ paddingBottom: ".5rem" }}>Choose Month:</div>
            <Select style={{ width: "100%" }} onChange={handleChangeMenu}>
              {menusWithSubmissions.map((menu: any, index: any) => {
                return (
                  <Option key={index} value={index}>
                    {menu.longMonthName} {menu.displayYear}
                  </Option>
                )
              })}
            </Select>
            {familiesWithoutSubmissions.length > 0 && (
              <>
                <Divider style={{ paddingTop: ".5rem" }} orientation="left">
                  No Submissions:
                </Divider>
                {familiesWithoutSubmissions.map((family: any, index: any) => {
                  return <div key={index}>{family.displayname}</div>
                })}
              </>
            )}
            {submissions.length > 0 && (
              <>
                <Divider style={{ paddingTop: ".5rem" }} orientation="left">
                  Successful Submissions
                </Divider>

                {submissions.map((submission: any, index: any) => {
                  return (
                    <Collapse style={{ marginBottom: ".5rem" }} key={index}>
                      <Panel key={index} header={submission.familyDisplayName}>
                        <p style={{ textAlign: "center" }}>
                          <strong>Submitted by:</strong>{" "}
                          {submission.submittedBy.firstname}{" "}
                          {submission.submittedBy.lastname}
                          <Popconfirm
                            title="Are you sure you want to delete this submission?"
                            onConfirm={() =>
                              handleDeleteSubmission(submission, index)
                            }
                            okType="danger"
                            showCancel={false}
                            okText="Yes"
                          >
                            <Button
                              danger
                              style={{ marginLeft: "10px" }}
                            >
                              Delete Submission
                            </Button>
                          </Popconfirm>
                        </p>

                        {menusWithSubmissions[currSelectedMenuIndex].items.map(
                          (item: any, index: any) => {
                            if (!item.nothaali) {
                              return (
                                <div
                                  key={index}
                                  style={{
                                    paddingLeft: ".5rem",
                                    paddingTop: ".5rem",
                                  }}
                                >
                                  <div
                                    style={{
                                      borderLeft: "1px solid gray",
                                      paddingLeft: "1rem",
                                    }}
                                  >
                                    <div
                                      style={{
                                        fontSize: "1.2rem",
                                        paddingBottom: ".7rem",
                                      }}
                                    >
                                      {item.name}
                                    </div>
                                    <p
                                      style={{
                                        marginBottom: ".2rem",
                                        marginTop: "-.5rem",
                                        color: "gray",
                                      }}
                                    >
                                      {moment(item.date, "MM-DD-YYYY").format(
                                        "dddd, MMM Do YYYY"
                                      )}
                                    </p>
                                    <p
                                      style={{
                                        color: "gray",
                                        paddingBottom: ".2rem",
                                      }}
                                    >
                                      Size:{" "}
                                      {submission.selections.hasOwnProperty(
                                        item.id
                                      )
                                        ? submission.selections[item.id]
                                        : "Not Found"}
                                    </p>
                                  </div>
                                </div>
                              )
                            } else {
                              return null
                            }
                          }
                        )}
                      </Panel>
                    </Collapse>
                  )
                })}

                <Button
                  style={{ width: "100%", marginTop: ".3rem" }}
                  onClick={exportDataToExcel}
                >
                  Export Submission Data
                </Button>
              </>
            )}
          </>
        ) : (
          <Alert
            type="warning"
            message={"There are no menus with submissions"}
          />
        )}
      </Card>
    </ViewSubmissionsWrapper>
  )
}

const ViewSubmissionsWrapper = styled.div`
  max-width: 1000px;
  margin: auto;

  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }

  .ant-divider-horizontal.ant-divider-with-text-left::before {
    width: 0%;
  }

  .ant-divider-horizontal.ant-divider-with-text-left::after {
    width: 100%;
  }

  .ant-divider-inner-text {
    padding-left: 0;
  }
`

export default ViewSubmissions
