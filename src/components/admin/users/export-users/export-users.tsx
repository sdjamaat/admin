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
import { db } from "../../../../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import styled from "styled-components"
import CustomMessage from "../../../../components/custom-message"
import moment from "moment"
import * as xlsx from "xlsx"

const ExportUsers = () => {
  const [columns, setColumns] = useState<string[]>([])
  const [users, setUsers] = useState<any[]>([])
  function onChange(checkedValues: any) {
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
    const allData: any[] = []
    for (let user of users) {
      let userData: any = {}
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
      let tempUsers: any[] = []
      const data = await getDocs(collection(db, "users"))

      data.forEach((user: any) => {
        tempUsers.push(user.data())
      })
      setUsers(tempUsers)
    }

    const currentTime = moment().format("dddd, MMMM Do YYYY, h:mm:ss a")

    const jsonValues = generateSheetRows()
    jsonValues[0]["Export Timestamp"] = currentTime

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
