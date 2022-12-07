import React from "react"
import {
  Card,
  Upload,
  Popover,
  Button,
  Select,
  Divider,
  Input,
  Typography,
  Alert,
  InputNumber,
} from "antd"
import { DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons"
import styled from "styled-components"
import * as XLSX from "xlsx"
import CustomMessage from "../../../custom-message"
import LabelPDF from "./pdf-generator"
import {
  SingleImportedThaaliSelection,
  UniqueItem,
  ThaaliTypes,
} from "../../../../utils/types"
import useDebounce from "../../../../custom-hooks/useDebounce"
import moment from "moment"

const { Option } = Select
const { Text } = Typography

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

type DistributionDayMapType = {
  [key: string]: SingleImportedThaaliSelection[]
}

const CreateLabels = () => {
  const [allSelections, setAllSelections] = React.useState<
    SingleImportedThaaliSelection[]
  >([])
  const [distributionDateMap, setDistributionDateMap] = React.useState<
    DistributionDayMapType
  >({})
  const [uniqueItems, setUniqueItems] = React.useState<UniqueItem[]>([])
  const [distributionDate, setDistributionDate] = React.useState("")
  const [
    currDistributionDateData,
    setCurrDistributionDateData,
  ] = React.useState<SingleImportedThaaliSelection[]>([])
  const [pdfData, setPdfData] = React.useState<SingleImportedThaaliSelection[]>(
    []
  )
  const [uniqueCodes, setUniqueCodes] = React.useState<Set<string>>(new Set())
  const [fileName, setFileName] = React.useState("")
  const [numStartingBlanks, setNumStartingBlanks] = React.useState<
    number | null
  >(0)
  const debouncedPDFDataValue = useDebounce(pdfData, 1000)

  const onDropdownSelectChange = (value: string) => {
    const newSelectionData =
      // @ts-ignore
      value === "All" ? allSelections : distributionDateMap[value]
    setDistributionDate(value)
    setCurrDistributionDateData(newSelectionData)
    setUniqueItemsFromCurrDistributionDateData(newSelectionData)
  }

  const onImportExcel = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = event => {
      try {
        // @ts-ignore
        const { result } = event.target

        // Extract the file name from the file object
        setFileName(file.name)

        // get workbook object
        const workbook = XLSX.read(result, { type: "binary", cellDates: true })

        for (const Sheet in workbook.Sheets) {
          //XLSX.utils.sheet_to_row_object_array(workbook.Sheets["chicken"])
          if (workbook.Sheets.hasOwnProperty(Sheet)) {
            // @ts-ignore
            let data = XLSX.utils.sheet_to_row_object_array(
              workbook.Sheets[Sheet]
            )
            let allSelections: SingleImportedThaaliSelection[] = []
            let distributionDateMap: DistributionDayMapType = {}

            data.forEach((x: SingleImportedThaaliSelection) => {
              if (x.Size !== "None") {
                // first make array of items
                allSelections.push(x)

                // then make map of distribution dates
                // {date: [selections]}
                if (x["Distribution"]) {
                  let date = moment(x["Distribution"])
                    .format("ddd-MMM-Do")
                    .toString()

                  // doing this just to we save the date in the right format (string)
                  x["Distribution"] = date
                  if (distributionDateMap[date]) {
                    distributionDateMap[date].push(x)
                  } else {
                    distributionDateMap[date] = [x]
                  }
                }
              }
            })

            if (allSelections.length === 0) {
              throw new Error("No data found in excel file")
            }
            setAllSelections(allSelections)
            setDistributionDateMap(distributionDateMap)

            // break because we only care about the first sheet
            CustomMessage("success", "Successfully parsed Excel file")
            break
          }
        }
      } catch (e) {
        // @ts-ignore
        file.status = "error"
        CustomMessage("error", "Error: Could not parse menu")
      }
    }
    fileReader.readAsBinaryString(file)
  }

  const setUniqueItemsFromCurrDistributionDateData = (
    newSelectionData: SingleImportedThaaliSelection[]
  ) => {
    let reviewedItems: string[] = []
    let uniqueItems: UniqueItem[] = []
    for (let item of newSelectionData) {
      // get first entry for unique item
      if (reviewedItems.includes(item.Item)) {
        continue
      } else {
        const itemWithAddedFields: UniqueItem = {
          itemMetadata: item,
          isSplit: false,
          splitArray: [
            {
              name: item.Item,
              sizeAppliedTo: ThaaliTypes.None,
              key: Math.random().toString(36),
            },
          ],
        }
        uniqueItems.push(itemWithAddedFields)
        reviewedItems.push(item.Item)
      }
    }
    setUniqueItems(uniqueItems)
  }

  const handleSplit = (index: number) => {
    const newUniqueItems = [...uniqueItems]
    const splitArray = newUniqueItems[index].splitArray
    newUniqueItems[index].splitArray = [
      ...splitArray,
      {
        key: Math.random().toString(36),
        name: "",
        sizeAppliedTo: ThaaliTypes.None,
      },
    ]
    setUniqueItems(newUniqueItems)
  }

  const handleChangeSplitItem = (
    itemIndex: number,
    splitIndex: number,
    newValue: string
  ) => {
    const newUniqueItems = [...uniqueItems]
    newUniqueItems[itemIndex].splitArray[splitIndex].name = newValue
    setUniqueItems(newUniqueItems)
  }

  const handleDeleteSplitItem = (itemIndex: number, splitIndex: number) => {
    const newUniqueItems = [...uniqueItems]
    const splitArray = newUniqueItems[itemIndex].splitArray
    splitArray.splice(splitIndex, 1)
    newUniqueItems[itemIndex].splitArray = splitArray
    setUniqueItems(newUniqueItems)
  }

  const handleChangeThaaliSize = (
    index: number,
    splitIndex: number,
    value: any
  ) => {
    const newUniqueItems = [...uniqueItems]
    newUniqueItems[index].splitArray[splitIndex].sizeAppliedTo = value
    setUniqueItems(newUniqueItems)
  }

  const emptyThaaliSelection: SingleImportedThaaliSelection = {
    Item: "",
    Size: ThaaliTypes.Empty,
    Distribution: "",
    Family: "",
    Code: "",
    Week: "",
    "Distribution Day": "",
    Date: "",
    Hijri: 0,
    Mohalla: "",
    HalfEquiv: 0,
    Chef: "",
    ItemComplex: "",
    "Original Size": "",
  }

  const buildPDFData = () => {
    let pdfData: SingleImportedThaaliSelection[] = []

    // start by checking for number of starting blanks
    // if there are any blanks then we need to add them to the pdf data
    if (numStartingBlanks && numStartingBlanks > 0) {
      for (let i = 0; i < numStartingBlanks; i++) {
        pdfData.push({
          ...emptyThaaliSelection,
        })
      }
    }
    // go through each unique item which is a combination of split items,
    // for each split item determine if we need to filter it by size or not
    // find matching entries by item name and then fill in the entry
    for (let item of uniqueItems) {
      for (let splitItem of item.splitArray) {
        // variable to hold the size filter for the split item
        const sizeFilterForCurrItems =
          splitItem.sizeAppliedTo === "None" ? null : splitItem.sizeAppliedTo

        for (let distributionDataItem of currDistributionDateData) {
          // check if item name matches
          if (distributionDataItem.Item === item.itemMetadata.Item) {
            // if there's a size filter then only push if the size matches
            if (sizeFilterForCurrItems !== null) {
              if (distributionDataItem.Size === sizeFilterForCurrItems) {
                pdfData.push({
                  ...distributionDataItem,
                  Item: splitItem.name,
                })
              }
            } else {
              pdfData.push({
                ...distributionDataItem,
                Item: splitItem.name,
              })
            }
          } else {
            continue
          }
        }
      }
    }
    setPdfData(pdfData)
  }

  React.useEffect(() => {
    setCurrDistributionDateData([])
    setDistributionDate("")
    setUniqueItems([])
    setUniqueCodes(new Set())
  }, [allSelections, distributionDateMap])

  React.useEffect(() => {
    buildPDFData()
  }, [uniqueItems, numStartingBlanks])

  return (
    <CreateLabelsWrapper>
      <Card
        title="Create Labels"
        headStyle={{ fontSize: "1.5rem", textAlign: "center" }}
      >
        <Upload
          name="file"
          // @ts-ignore
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
            <Button type="dashed">Import Label Data from Excel Sheet</Button>
            {fileName && (
              <span style={{ paddingLeft: "5px" }}>
                {" "}
                <CheckCircleOutlined
                  style={{ color: "green", paddingRight: "5px" }}
                />
                {fileName}
              </span>
            )}
          </Popover>
        </Upload>

        {Object.keys(distributionDateMap).length !== 0 && (
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
                    {date}
                  </Option>
                )
              })}
              <Option value={"All"} key={"All"}>
                All Distribution Dates
              </Option>
            </Select>
            <Divider />
            {uniqueItems.length > 0 && (
              <Alert
                message="You can change the item names, split items into multiple items, and choose what thaali sizes to apply split items towards below"
                type="info"
                style={{ marginBottom: "1rem" }}
              />
            )}
            {uniqueItems.length > 0 &&
              uniqueItems.map((item, index) => {
                return (
                  <div key={item.itemMetadata.Item}>
                    <div style={{ padding: "5px" }}>
                      Original: {item.itemMetadata.Item}
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          flexGrow: "1",
                          gap: "10px",
                        }}
                      >
                        {item.splitArray.map((splitItem, splitIndex) => {
                          return (
                            <Input.Group
                              compact
                              key={splitItem.key}
                              style={{ display: "flex" }}
                            >
                              <Input
                                value={splitItem.name}
                                onChange={e =>
                                  handleChangeSplitItem(
                                    index,
                                    splitIndex,
                                    e.target.value
                                  )
                                }
                              />
                              {splitIndex !== 0 && (
                                <>
                                  <Select
                                    defaultValue={"All Thaalis"}
                                    style={{ width: 120 }}
                                    onChange={value =>
                                      handleChangeThaaliSize(
                                        index,
                                        splitIndex,
                                        value
                                      )
                                    }
                                  >
                                    <Option value="None">All Thaalis</Option>
                                    <Option value="Full">Full ONLY</Option>
                                    <Option value="Half">Half ONLY</Option>
                                    <Option value="Quarter">
                                      Quarter ONLY
                                    </Option>
                                  </Select>
                                  <Button
                                    danger
                                    onClick={() =>
                                      handleDeleteSplitItem(index, splitIndex)
                                    }
                                  >
                                    <DeleteOutlined />
                                  </Button>
                                </>
                              )}
                            </Input.Group>
                          )
                        })}
                      </div>

                      <Button onClick={() => handleSplit(index)}>
                        Add Subitem
                      </Button>
                    </div>
                    <Divider />
                  </div>
                )
              })}
            {uniqueItems.length > 0 && (
              <div>
                <InputNumber
                  addonBefore="# Starting Blanks"
                  min={0}
                  max={30}
                  defaultValue={0}
                  value={numStartingBlanks}
                  onChange={value => setNumStartingBlanks(value)}
                />
                <Divider />
              </div>
            )}

            {currDistributionDateData && distributionDate && (
              <LabelPDF data={debouncedPDFDataValue} />
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
