import React, { useState, useEffect, useContext } from "react"
import {
  Tabs,
  Card,
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Checkbox,
  Button,
} from "antd"
import firebase from "gatsby-plugin-firebase"
import styled from "styled-components"
import { useStaticQuery } from "gatsby"
import CustomMessage from "../../../../components/custom-message"
import moment from "moment"
const xlsx = require("xlsx")
const { TabPane } = Tabs

const ExportUsers = () => {
  const [columns, setColumns] = useState([])
  const [users, setUsers] = useState([])
  function onChange(checkedValues) {
    setColumns(checkedValues)
  }
  const options = [
    { label: "Firstname", value: "firstname" },
    { label: "Lastname", value: "lastname" },
    { label: "Email", value: "email" },
    { label: "Family Head", value: "familyhead" },
    { label: "Family ID", value: "familyid" },
    { label: "ITS", value: "its" },
    { label: "Other titles", value: "othertitles" },
    { label: "Phone", value: "phone" },
    { label: "Title", value: "title" },
    { label: "UID", value: "uid" },
    { label: "YOB", value: "yob" },
  ]

  const generateSheetRows = () => {
    const allData = []
    for (let user of users) {
      let userData = {}
      for (let column of columns) {
        if (column === "othertitles") {
          let titleString = ""
          for (let title of user["othertitles"]) {
            titleString += `${title},`
          }
          userData[column] = titleString
        } else {
          userData[column] = user[column]
        }
      }
      allData.push(userData)
    }
    return allData
  }

  const exportData = async () => {
    if (columns.length === 0) {
      CustomMessage("error", "No columns selected")
    } else if (users.length === 0) {
      let tempUsers = []
      const data = await firebase.firestore().collection("users").get()

      data.forEach(user => {
        tempUsers.push(user.data())
      })
      setUsers(tempUsers)
    }

    const currentTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a")

    const jsonValues = generateSheetRows()
    jsonValues[0]["Export Timestamp"] = currentTime

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

    let excelSheet = xlsx.utils.json_to_sheet(jsonValues)
    excelSheet["!cols"] = fitToColumn(jsonValues)
    xlsx.utils.book_append_sheet(newWB, excelSheet, "Raw Data")

    xlsx.writeFile(
      newWB,
      `UserData_${moment().format("dddd MMMM Do YYYY h:mm:ss")}.xlsx`
    )
  }
  return (
    <ExportUsersWrapper>
      <Card
        title="Export User Data"
        headStyle={{
          fontSize: "1.5rem",
          textAlign: "center",
        }}
        bodyStyle={{ paddingTop: "1rem" }}
      >
        <h5>Select columns:</h5>
        <Checkbox.Group options={options} onChange={onChange} />

        <Button
          style={{ width: "100%", marginTop: "1rem" }}
          onClick={() => exportData()}
        >
          Export data
        </Button>
      </Card>
    </ExportUsersWrapper>
  )
}

const ExportUsersWrapper = styled.div`
  max-width: 1000px;
  margin: auto;
  .ant-tabs-tab {
    outline: none;
  }
`

export default ExportUsers
