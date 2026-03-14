import React, { useState } from "react"
import { Card, Checkbox, Button } from "antd"
import { db } from "../../../../lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import styled from "styled-components"
import CustomMessage from "../../../../components/custom-message"
import moment from "moment"
import * as xlsx from "xlsx"

const ExportFamilies = () => {
  const [columns, setColumns] = useState<string[]>([])
  const [families, setFamilies] = useState<any[]>([])

  function onChange(checkedValues: any) {
    setColumns(checkedValues)
  }
  const options = [
    { label: "Display Name", value: "displayname" },
    { label: "Family ID", value: "familyid" },
    { label: "Registration Status", value: "registrationStatus" },
    { label: "Family Size", value: "size" },
    { label: "FMB Details", value: "fmb" },
    { label: "Address", value: "address" },
    { label: "Family Head", value: "head" },
  ]

  const generateSheetRows = (data: any) => {
    const allData: any[] = []
    for (let family of data) {
      let familyData: any = {}
      for (let column of columns) {
        if (["address", "head", "fmb", "members"].includes(column)) {
          for (let field in family[column]) {
            let dataBit = family[column][field]
            if (typeof dataBit === "boolean") {
              familyData[`${column}-${field}`] = dataBit ? "True" : "False"
            } else if (field === "code") {
              // if not enrolled, it's code is not populated so have to check otherwise will throw error
              if (dataBit) {
                let mohallah = dataBit.split("-")[0]
                familyData[`${column}-mohallah`] = mohallah
                familyData[`${column}-${field}`] = dataBit
              }
            } else {
              familyData[`${column}-${field}`] = dataBit
            }
          }
        } else {
          familyData[column] = family[column]
        }
      }
      allData.push(familyData)
    }
    return allData
  }

  const getFamilies = async () => {
    let tempFamilies: any[] = []
    if (columns.length === 0) {
      CustomMessage("error", "No columns selected")
    } else if (families.length === 0) {
      const data = await getDocs(collection(db, "families"))

      data.forEach((families: any) => {
        tempFamilies.push(families.data())
      })
    }
    setFamilies(tempFamilies)
    return tempFamilies
  }

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

  const exportData = async () => {
    const familyData = await getFamilies()

    const jsonValues = generateSheetRows(familyData)

    if (jsonValues.length === 0) {
      exportData()
    }

    const newWB = xlsx.utils.book_new()

    let excelSheet = xlsx.utils.json_to_sheet(jsonValues)
    excelSheet["!cols"] = fitToColumn(jsonValues)
    xlsx.utils.book_append_sheet(newWB, excelSheet, "Raw Data")

    xlsx.writeFile(
      newWB,
      `FamilyData_${moment().format("dddd MMMM Do YYYY h:mm:ss")}.xlsx`
    )
  }
  return (
    <ExportFamiliesWrapper>
      <Card
        title="Export Family Data"
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
    </ExportFamiliesWrapper>
  )
}

const ExportFamiliesWrapper = styled.div`
  max-width: 1000px;
  margin: auto;
  .ant-tabs-tab {
    outline: none;
  }
`

export default ExportFamilies
