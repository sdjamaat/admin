import React, { useEffect, useState, useContext } from "react"
import { Card, Select, Alert, Divider, Collapse, Button } from "antd"
import styled from "styled-components"
import firebase from "gatsby-plugin-firebase"
import { DateContext } from "../../../../provider/date-context"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
const moment = require("moment")
const xlsx = require("xlsx")

const { Option } = Select
const { Panel } = Collapse

const ViewSubmissions = () => {
  const [menusWithSubmissions, setMenusWithSubmissions] = useState(null)
  const [submissions, setSubmissions] = useState([])
  const [currSelectedMenuIndex, setCurrSelectedMenuIndex] = useState(0)
  const { getHijriDate } = useContext(DateContext)

  const getMenusWithSubmissions = async () => {
    try {
      let filteredMenus = []
      const menus = await firebase
        .firestore()
        .collection("fmb")
        .doc(getHijriDate().databaseYear.toString())
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
          })
        }
      })

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
    const submissions = await firebase
      .firestore()
      .collection("fmb")
      .doc(getHijriDate().databaseYear.toString())
      .collection("menus")
      .doc(shortMonthName)
      .collection("submissions")
      .get()
    submissions.forEach(doc => {
      const data = doc.data()
      submissionsArr.push({ ...data, familyid: doc.id })
    })
    setCurrSelectedMenuIndex(index)
    setSubmissions(submissionsArr)
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
        name: `${menuItem.name} (${menuItem.date})`,
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
          if (size === "Barakati") size = "Quarter"
          if (size === "No Thaali") size = "None"
          if (size !== "None") {
            counts[size] = counts[size] + 1
          }
          menuItemSheet.rows.push({
            Family: submission.familyDisplayName,
            Code: submission.code,
            Size: size,
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
    const currentTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a")

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

    // const getMergedRowIndicies = async () => {
    //   let mergeArr = []
    //   let currRow = 1
    //   for (let item of menusWithSubmissions[currSelectedMenuIndex].items) {
    //     if (!item.nothaali) {
    //       let rowStart = currRow
    //       let rowEnd = currRow + submissions.length - 1

    //       // for item name
    //       mergeArr.push({ s: { r: rowStart, c: 0 }, e: { r: rowEnd, c: 0 } })

    //       // for item date
    //       mergeArr.push({ s: { r: rowStart, c: 1 }, e: { r: rowEnd, c: 1 } })

    //       currRow = rowEnd + 1
    //     }
    //   }
    //   return mergeArr
    // }

    //const merged = await getMergedRowIndicies()
    const newWB = xlsx.utils.book_new()

    let totalsWorkSheet = xlsx.utils.json_to_sheet(totals)
    totalsWorkSheet["!cols"] = fitToColumn(totals)
    xlsx.utils.book_append_sheet(newWB, totalsWorkSheet, "Totals")

    for (let menuItemSheet of menuItemSheets) {
      const firstRow = menuItemSheet.rows[0]
      menuItemSheet.rows[0] = {
        Item: menuItemSheet.item,
        Date: menuItemSheet.date,
        ...firstRow,
      }
      let sheet = xlsx.utils.json_to_sheet(menuItemSheet.rows)
      sheet["!cols"] = fitToColumn(menuItemSheet.rows)
      xlsx.utils.book_append_sheet(newWB, sheet, menuItemSheet.name)
    }

    xlsx.writeFile(
      newWB,
      `${displayMonthName}_${moment().format("dddd MMMM Do YYYY h:mm:ss")}.xlsx`
    )
  }

  useEffect(() => {
    getMenusWithSubmissions()
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
                    {menu.longMonthName}
                  </Option>
                )
              })}
            </Select>
            {submissions.length > 0 && (
              <>
                <Divider style={{ paddingTop: ".5rem" }} orientation="left">
                  Submissions
                </Divider>

                {submissions.map((submission, index) => {
                  return (
                    <Collapse style={{ marginBottom: ".5rem" }} key={index}>
                      <Panel header={submission.familyDisplayName}>
                        <p style={{ textAlign: "center" }}>
                          <strong>Submitted by:</strong>{" "}
                          {submission.submittedBy.firstname}{" "}
                          {submission.submittedBy.lastname}
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
                                        "dddd, MMMM Do YYYY"
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
