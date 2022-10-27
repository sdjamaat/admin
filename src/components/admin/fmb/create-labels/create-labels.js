import { Card, Upload, Popover, Button, Select, Divider } from "antd"
import React from "react"
import styled from "styled-components"
import * as XLSX from "xlsx"
import CustomMessage from "../../../custom-message"
import LabelPDF from "./pdf-generator"

const { Option } = Select

// const SELECTIONTYPE = {
//   "Week": "2022-09-26T07:00:00.000Z",
//   "Distribution": "2022-09-26T07:00:00.000Z",
//   "Distribution Day": "2022-09-26T07:00:00.000Z",
//   "Date": "2022-09-26T07:00:00.000Z",
//   "Hijri": 1,
//   "Code": "SR-BC",
//   "Size": "Quarter",
//   "Family": "Channiwala Family (Burhan)",
//   "Item": "Achari Chicken",
//   "Mohalla": "SR",
//   "HalfEquiv": 0.5,
//   "Chef": "Humaira ben",
//   "ItemComplex": "Achari Chicken - Humaira ben",
//   "Original Size": "Quarter"
// }

const DateStringOptions = {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
}

const CreateLabels = () => {
  const [allSelections, setAllSelections] = React.useState([])
  const [distributionDateMap, setDistributionDateMap] = React.useState(null)
  const [distributionDate, setDistributionDate] = React.useState("")
  const [
    currDistributionDateData,
    setCurrDistributionDateData,
  ] = React.useState(null)

  const onDropdownSelectChange = value => {
    setDistributionDate(value)
    setCurrDistributionDateData(
      value === "All" ? allSelections : distributionDateMap[value]
    )
  }

  const onImportExcel = file => {
    const fileReader = new FileReader()
    fileReader.onload = event => {
      try {
        const { result } = event.target
        const workbook = XLSX.read(result, { type: "binary", cellDates: true })
        for (const Sheet in workbook.Sheets) {
          //XLSX.utils.sheet_to_row_object_array(workbook.Sheets["chicken"])
          if (workbook.Sheets.hasOwnProperty(Sheet)) {
            let data = XLSX.utils.sheet_to_row_object_array(
              workbook.Sheets[Sheet]
            )
            let allSelections = []
            let distributionDateMap = {}

            data.forEach(x => {
              //TODO: ADD TYPE FOR X see above
              //example: x["Size"] = "None"
              if (x.Size !== "None") {
                // first make array of items
                allSelections.push(x)

                // then make map of distribution dates
                if (x["Distribution"]) {
                  let date = new Date(x["Distribution"]).toLocaleDateString()
                  if (distributionDateMap[date]) {
                    distributionDateMap[date].push(x)
                  } else {
                    distributionDateMap[date] = [x]
                  }
                }
              }
            })

            setAllSelections(allSelections)
            setDistributionDateMap(distributionDateMap)

            // break because we only care about the first sheet
            CustomMessage("success", "Successfully parsed Excel file")
            break
          }
        }
      } catch (e) {
        file.status = "error"
        CustomMessage("error", "Error: Could not parse menu")
      }
    }
    fileReader.readAsBinaryString(file)
  }

  React.useEffect(() => {
    setCurrDistributionDateData(null)
    setDistributionDate("")
  }, [allSelections, distributionDateMap])

  return (
    <CreateLabelsWrapper>
      <Card
        title="Create Labels"
        headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
      >
        <Upload
          name="file"
          action={onImportExcel}
          accept=".xlsx, .xls"
          showUploadList={false}
        >
          <Popover
            placement="topRight"
            content={
              'Include sheet with the headers (case-sensitive): "Item", "Distribution", "Size", "Family", "Code" '
            }
          >
            <Button>Import Label Data from Excel Sheet</Button>
          </Popover>
        </Upload>

        {distributionDateMap && (
          <div>
            <Divider />
            <p>Choose Distribution Date</p>
            <Select
              style={{ width: "300px" }}
              placement={"bottomLeft"}
              onChange={onDropdownSelectChange}
              value={distributionDate}
            >
              {Object.keys(distributionDateMap).map(date => {
                return (
                  <Option value={date} key={date}>
                    {new Date(date).toLocaleDateString(
                      undefined,
                      DateStringOptions
                    )}
                  </Option>
                )
              })}
              <Option value={"All"} key={"All"}>
                All Distribution Dates
              </Option>
            </Select>
            {currDistributionDateData && (
              <LabelPDF data={currDistributionDateData} />
            )}
          </div>
        )}
      </Card>
    </CreateLabelsWrapper>
  )
}

const CreateLabelsWrapper = styled.div`
  max-width: 1000px;
  margin: auto;
  .ant-tabs-tab {
    outline: none;
  }
`

export default CreateLabels
