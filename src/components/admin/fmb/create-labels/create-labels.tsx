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
  Checkbox,
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
  SalawaatThaali,
} from "../../../../utils/types"
import { firstBy } from "thenby"
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
  const [salawaatThaalis, setSalawaatThaalis] = React.useState<
    SalawaatThaali[]
  >([])
  const [
    shouldOnlyPrintSalawaatThaalis,
    setShouldOnlyPrintSalawaatThaalis,
  ] = React.useState<boolean>(false)
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
    setUniqueItemsAndCodesFromCurrDistributionDateData(newSelectionData)
  }

  const onImportExcel = (file: Blob) => {
    const fileReader = new FileReader()
    fileReader.onload = event => {
      try {
        // @ts-ignore
        const { result } = event.target

        // Extract the file name from the file object
        // @ts-ignore
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

  const setUniqueItemsAndCodesFromCurrDistributionDateData = (
    newSelectionData: SingleImportedThaaliSelection[]
  ) => {
    // array holds all items that we've aleady seen
    let reviewedItems: string[] = []

    // set that holds all unique codes
    let uniqueCodes: Set<string> = new Set()

    // array holds all unique items (basically a set)
    let uniqueItems: UniqueItem[] = []
    for (let item of newSelectionData) {
      // get first entry for unique item

      // add code to set
      uniqueCodes.add(`${item.Code}:${item.Family}`)

      if (reviewedItems.includes(item.Item)) {
        continue
      } else {
        // this unique item is formatted this way so that it can be used in the UI
        const itemWithAddedFields: UniqueItem = {
          itemMetadata: item,
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
    // sort unique items by itemmetadata date
    uniqueItems.sort((a, b) => {
      return moment(a.itemMetadata["Date"]).diff(moment(b.itemMetadata["Date"]))
    })
    setUniqueItems(uniqueItems)
    setUniqueCodes(uniqueCodes)
    setSalawaatThaalis([])
  }

  // called when the user clicks on the "Add Subitem" button
  // takes the item and adds a new entry into the splitArray
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

  // called when name is changed for any given item
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

  const handleChangeSalawaatThaali = (index: number, value: any) => {
    const newSalawaatThaalis = [...salawaatThaalis]
    newSalawaatThaalis[index].name = value
    setSalawaatThaalis(newSalawaatThaalis)
  }

  const handleAddSalawaatThaali = () => {
    const newSalawaatThaalis = [...salawaatThaalis]
    newSalawaatThaalis.push({
      key: Math.random().toString(36),
      name: "Sample Thaali",
    })
    setSalawaatThaalis(newSalawaatThaalis)
  }

  const handleDeleteSalawaatThaali = (index: number) => {
    const newSalawaatThaalis = [...salawaatThaalis]
    newSalawaatThaalis.splice(index, 1)
    setSalawaatThaalis(newSalawaatThaalis)
  }

  const emptyThaaliSelection: SingleImportedThaaliSelection = {
    Item: "",
    Size: ThaaliTypes.Empty,
    Distribution: "",
    Family: "",
    Code: "",
    Week: "",
    "Distribution Day": "",
    Date: new Date(),
    Hijri: 0,
    Mohalla: "",
    HalfEquiv: 0,
    Chef: "",
    ItemComplex: "",
    "Original Size": "",
  }

  const addBlankThaaliSelection = (
    pdfData: SingleImportedThaaliSelection[]
  ): SingleImportedThaaliSelection[] => {
    if (numStartingBlanks && numStartingBlanks > 0) {
      for (let i = 0; i < numStartingBlanks; i++) {
        pdfData.unshift({
          ...emptyThaaliSelection,
        })
      }
    }
    return pdfData
  }

  const sortPDFLabels = (pdfData: SingleImportedThaaliSelection[]) => {
    // function to sort the pdf labels by date (original calendar date not distribution date)
    const sortByDate = (
      a: SingleImportedThaaliSelection,
      b: SingleImportedThaaliSelection
    ) => {
      return moment(a["Date"]).diff(moment(b["Date"]))
    }

    // sort by date, then by item name, then by size (F,H,Q,N), then by code
    pdfData.sort(
      firstBy(sortByDate).thenBy("Item").thenBy("Size").thenBy("Code")
    )
    return pdfData
  }

  const shuffle = array => {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = array[i]
      array[i] = array[j]
      array[j] = temp
    }

    return array
  }

  const buildPDFData = () => {
    let pdfData: SingleImportedThaaliSelection[] = []

    // go through each unique item which is a combination of split items,
    // for each split item determine if we need to filter it by size or not
    // find matching entries by item name and then fill in the entry
    if (!shouldOnlyPrintSalawaatThaalis) {
      for (let item of uniqueItems) {
        for (let splitItem of item.splitArray) {
          // variable to hold the size filter for the split item
          const sizeFilterForCurrItems =
            splitItem.sizeAppliedTo === "None" ? null : splitItem.sizeAppliedTo

          for (let distributionDataItem of currDistributionDateData) {
            // check if item name matches
            if (distributionDataItem.Item === item.itemMetadata.Item) {
              // if there's a size filter then only push if the size matches
              // if we're supposed to apply this to only FULL thaalis then only push if the size is FULL
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
    }

    // add in the salawaat thaalis
    for (let code of uniqueCodes) {
      const splitCode = code.split(":")
      const familyCode = splitCode[0]
      const familyName = splitCode[1]
      for (let salawaatThaali of salawaatThaalis) {
        pdfData.push({
          ...emptyThaaliSelection,
          Item: salawaatThaali.name,
          Size: ThaaliTypes.Period,
          Family: familyName,
          Code: familyCode,
          Distribution: distributionDate,
        })
      }
    }

    // sort the pdf data
    pdfData = sortPDFLabels(pdfData)

    // add in the blank labels here (otherwise will get affected by sorting function)
    pdfData = addBlankThaaliSelection(pdfData)

    // set to state
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
  }, [
    uniqueItems,
    numStartingBlanks,
    salawaatThaalis,
    shouldOnlyPrintSalawaatThaalis,
  ])

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
              'Include sheet with the headers (case-sensitive): "Item", "Distribution", "Date", "Size", "Family", "Code"'
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
                message="Change the item names, split items into multiple items, add salawaat thaalis, and add blank labels below"
                type="info"
                style={{ marginBottom: "1rem" }}
              />
            )}
            {uniqueItems.length > 0 &&
              uniqueItems.map((item, index) => {
                return (
                  <div key={item.itemMetadata.Item} style={{}}>
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
                              {/* Only display the dropdown for the 2nd-Nth subitems */}
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
              <>
                <Button onClick={handleAddSalawaatThaali}>
                  Add Other/Salawaat Thaali
                </Button>
                {salawaatThaalis.length > 0 &&
                  salawaatThaalis.map((item, index) => {
                    return (
                      <Input.Group
                        compact
                        key={item.key}
                        style={{ display: "flex", paddingTop: "10px" }}
                      >
                        <Input
                          value={item.name}
                          onChange={e =>
                            handleChangeSalawaatThaali(index, e.target.value)
                          }
                        />
                        <Button
                          danger
                          onClick={() => handleDeleteSalawaatThaali(index)}
                        >
                          <DeleteOutlined />
                        </Button>
                      </Input.Group>
                    )
                  })}
                {salawaatThaalis.length > 0 && (
                  <Checkbox
                    style={{ paddingTop: "10px" }}
                    checked={shouldOnlyPrintSalawaatThaalis}
                    onChange={e =>
                      setShouldOnlyPrintSalawaatThaalis(e.target.checked)
                    }
                  >
                    Only Print Salawaat Thaalis
                  </Checkbox>
                )}
                <Divider />
              </>
            )}

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
