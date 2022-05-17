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
import firebase from "gatsby-plugin-firebase"
import { DateContext } from "../../../../provider/date-context"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
import { cloneDeep } from "lodash"
const moment = require("moment")
const xlsx = require("xlsx")

const { Option } = Select
const { Panel } = Collapse

const ViewSubmissions = () => {
  const [menusWithSubmissions, setMenusWithSubmissions] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [currSelectedMenuIndex, setCurrSelectedMenuIndex] = useState(0)
  const [
    allFamiliesEnrolledInFMBMap,
    setAllFamiliesEnrolledInFMBMap,
  ] = useState({})
  const [familiesWithoutSubmissions, setFamiliesWithoutSubmissions] = useState(
    []
  )
  const { getHijriDate } = useContext(DateContext)

  const getAllFamiliesEnrolledInFMB = async () => {
    try {
      let allEnrolledFamilies = {}
      const families = await firebase.firestore().collection("families").get()
      families.forEach(family => {
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
      let filteredMenus = []
      const hijriYear = getHijriDate().year
      const menus = await firebase
        .firestore()
        .collection("fmb")
        .doc(hijriYear.toString())
        .collection("menus")
        .get()

      // for each menu, check if it has any submissions. If it does, put it in the drop down
      // no querying for submissions yet, only if the user clicks on it
      menus.forEach(doc => {
        const shortMonthName = doc.id
        const data = doc.data()
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

      const moharramPast = await firebase
        .firestore()
        .collection("fmb")
        .doc((hijriYear - 1).toString())
        .collection("menus")
        .doc("moharram")
        .get()

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
  const handleChangeMenu = async index => {
    let submissionsArr = []

    const shortMonthName = menusWithSubmissions[index].shortMonthName
    const isPrevMoharram = menusWithSubmissions[index].isPrevMoharram
    const hijriYear = getHijriDate().year
    let allFamiliesEnrolledInFMBMapCopy = cloneDeep(allFamiliesEnrolledInFMBMap)
    const submissions = await firebase
      .firestore()
      .collection("fmb")
      .doc(isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString())
      .collection("menus")
      .doc(shortMonthName)
      .collection("submissions")
      .get()
    submissions.forEach(doc => {
      const data = doc.data()
      submissionsArr.push({ ...data, familyid: doc.id })
      delete allFamiliesEnrolledInFMBMapCopy[doc.id]
    })
    setCurrSelectedMenuIndex(index)
    setSubmissions(submissionsArr)
    console.log(Object.values(allFamiliesEnrolledInFMBMapCopy))
    setFamiliesWithoutSubmissions(
      Object.values(allFamiliesEnrolledInFMBMapCopy)
    )
  }

  const sortSelectionsByThaaliSize = (a, b) => {
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
    let menuItemSizesToFMBCodes = []
    let menuItemToTotalsRows = []
    const menuItemsForCurrentlySelectedMonth =
      menusWithSubmissions[currSelectedMenuIndex].items
    let menuItemIndex = 0
    for (let menuItem of menuItemsForCurrentlySelectedMonth) {
      let menuItemSheet = {
        item: menuItem.name,
        date: menuItem.date,
        name: `(${menuItem.date})`,
        rows: [],
      }
      if (!menuItem.nothaali) {
        let counts = {
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

    const fitToColumn = data => {
      const columnWidths = []
      for (const property in data[0]) {
        columnWidths.push({
          wch: Math.max(
            property ? property.toString().length : 0,
            ...data.map(obj =>
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
    let flatSheetRows = []
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

  const handleDeleteSubmission = async (submission, submissionIndex) => {
    const shortMonthName =
      menusWithSubmissions[currSelectedMenuIndex].shortMonthName
    const isPrevMoharram =
      menusWithSubmissions[currSelectedMenuIndex].isPrevMoharram
    const hijriYear = getHijriDate().year

    try {
      // delete submissions doc
      await firebase
        .firestore()
        .collection("fmb")
        .doc(isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString())
        .collection("menus")
        .doc(shortMonthName)
        .collection("submissions")
        .doc(submission.familyid)
        .delete()

      // delete family id from the submissions array
      await firebase
        .firestore()
        .collection("fmb")
        .doc(isPrevMoharram ? (hijriYear - 1).toString() : hijriYear.toString())
        .collection("menus")
        .doc(shortMonthName)
        .update({
          submissions: firebase.firestore.FieldValue.arrayRemove(
            submission.familyDisplayName
          ),
        })

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
              {menusWithSubmissions.map((menu, index) => {
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
                {familiesWithoutSubmissions.map((family, index) => {
                  return <div key={index}>{family.displayname}</div>
                })}
              </>
            )}
            {submissions.length > 0 && (
              <>
                <Divider style={{ paddingTop: ".5rem" }} orientation="left">
                  Successful Submissions
                </Divider>

                {submissions.map((submission, index) => {
                  return (
                    <Collapse style={{ marginBottom: ".5rem" }} key={index}>
                      <Panel header={submission.familyDisplayName}>
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
                              type="danger"
                              style={{ marginLeft: "10px" }}
                            >
                              Delete Submission
                            </Button>
                          </Popconfirm>
                        </p>

                        {menusWithSubmissions[currSelectedMenuIndex].items.map(
                          (item, index) => {
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
