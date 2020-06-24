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
  const [menusWithSubmissions, setMenusWithSubmissions] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [currSelectedMenuIndex, setCurrSelectedMenuIndex] = useState(0)
  const { getHijriDate } = useContext(DateContext)

  const getMenusWithSubmissions = async () => {
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

  const getFMBCodes = async () => {
    let fmbCodes = {}
    for (let submission of submissions) {
      const familyDetails = await firebase
        .firestore()
        .collection("families")
        .doc(submission.familyid)
        .get()
      const fmbCode = familyDetails.data().fmb.code
      fmbCodes[submission.familyid] = fmbCode
    }
    return fmbCodes
  }

  const getJSONSheetValues = fmbCodes => {
    let rows = []
    const menuItemsForCurrentlySelectedMonth =
      menusWithSubmissions[currSelectedMenuIndex].items
    let menuItemIndex = 0
    for (let menuItem of menuItemsForCurrentlySelectedMonth) {
      if (!menuItem.nothaali) {
        for (let submission of submissions) {
          rows.push({
            "Menu Item": menuItem.name,
            Date: menuItem.date,
            "FMB Code": fmbCodes[submission.familyid],
            Size: submission.selections[menuItem.id],
          })
        }
      }
      menuItemIndex = menuItemIndex + 1
    }
    return rows
  }
  const exportDataToExcel = async () => {
    const fmbCodes = await getFMBCodes()
    const jsonSheetValues = getJSONSheetValues(fmbCodes)

    const newWB = xlsx.utils.book_new()
    const newWS = xlsx.utils.json_to_sheet(jsonSheetValues)
    xlsx.utils.book_append_sheet(newWB, newWS, "Test data")
    xlsx.writeFile(newWB, "Testing.xlsx")
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
        {menusWithSubmissions.length > 0 ? (
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
                <Collapse onChange={e => console.log(e)}>
                  {submissions.map((submission, index) => {
                    return (
                      <Panel
                        header={`${submission.submittedBy.lastname} Family`}
                        key={index}
                      >
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
                    )
                  })}
                </Collapse>
                <Button
                  style={{ width: "100%", marginTop: "1.3rem" }}
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
