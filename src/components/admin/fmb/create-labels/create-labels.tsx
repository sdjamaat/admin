import React from "react"
import {
  Card,
  Upload,
  Popover,
  Button,
  Select,
  Divider,
  Input,
  Alert,
  InputNumber,
  Checkbox,
  Switch,
  Form,
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
  SplitItem,
  KindOfItem,
  ItemSettings,
  ContainerType,
} from "../../../../utils/types"
import { firstBy } from "thenby"
import useDebounce from "../../../../custom-hooks/useDebounce"
import moment from "moment"
import ItemSettingsModal from "./item-settings"
import { defaultItemSettings } from "../../../../utils/defaults"

const { Option } = Select

type SelectionType = {
  Week: string
  Distribution: string
  "Distribution Day": string
  Date: string
  Hijri: number
  Code: string
  Size: string
  Family: string
  Item: string
  Mohalla: string
  HalfEquiv: number
  Chef: string
  ItemComplex: string
  "Original Size": string
}

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
  const [toggleBlackAndWhite, setToggleBlackAndWhite] = React.useState<boolean>(
    false
  )
  const debouncedPDFDataValue = useDebounce(pdfData, 1000)
  const [isSettingsModalVisible, setIsSettingsModalVisible] = React.useState(
    false
  )

  const [
    currentItemForSettingsModal,
    setCurrentItemForSettingsModal,
  ] = React.useState<UniqueItem | null>(null)
  const [
    currentItemIndexForSettingsModal,
    setCurrentItemIndexForSettingsModal,
  ] = React.useState<number>(0)
  const [
    currentSplitItemIndexForSettingsModal,
    setCurrentSplitItemIndexForSettingsModal,
  ] = React.useState<number>(0)

  const handleOpenSettings = (
    item: UniqueItem,
    itemIndex: number,
    splitItemIndex: number
  ) => {
    setCurrentItemForSettingsModal(item)
    setCurrentItemIndexForSettingsModal(itemIndex)
    setCurrentSplitItemIndexForSettingsModal(splitItemIndex)
    setIsSettingsModalVisible(true)
  }

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
              itemSettings: { ...defaultItemSettings },
            },
          ],
        }
        uniqueItems.push(itemWithAddedFields)
        reviewedItems.push(item.Item)
      }
    }
    // sort unique items by itemMetadata date
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
        name: `Split Item ${splitArray.length}`,
        sizeAppliedTo: ThaaliTypes.None,
        itemSettings: { ...defaultItemSettings },
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
    ContainerOrCountText: "",
    CountainerOuncesNumber: "0oz",
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
  const sortPDFLabels = pdfData => {
    // Function to sort the pdf labels by date (original calendar date not distribution date)
    const sortByDate = (
      a: SingleImportedThaaliSelection,
      b: SingleImportedThaaliSelection
    ) => {
      return moment(a["Date"]).diff(moment(b["Date"]))
    }

    // Helper function to extract numerical value from the string like '32oz'
    const getOuncesNumber = (ouncesString: string) => {
      return Number(ouncesString.replace(/[^0-9.]/g, ""))
    }

    // Sort by date, then by item name, then by size (F,H,Q,N), then by CountainerOuncesNumber in descending order, then by code
    pdfData.sort(
      firstBy(sortByDate)
        .thenBy("Item")

        .thenBy(
          (
            a: SingleImportedThaaliSelection,
            b: SingleImportedThaaliSelection
          ) =>
            getOuncesNumber(b.CountainerOuncesNumber) -
            getOuncesNumber(a.CountainerOuncesNumber)
        ) // Sorting in descending order
        .thenBy("Size")
        .thenBy("Code")
    )

    return pdfData
  }

  const pushPdfEntry = (
    pdfData: SingleImportedThaaliSelection[],
    distributionDataItem: SingleImportedThaaliSelection,
    splitItem: SplitItem,
    label: string,
    ouncesNum?: string
  ) => {
    pdfData.push({
      ...distributionDataItem,
      Item: splitItem.name,
      ContainerOrCountText: label,
      CountainerOuncesNumber: ouncesNum || "0oz",
    })
  }

  const addEntriesForSize = (
    pdfData: SingleImportedThaaliSelection[],
    distributionDataItem: SingleImportedThaaliSelection,
    splitItem: SplitItem,
    size: ThaaliTypes | string
  ) => {
    const settings = splitItem.itemSettings
    const sizeChar = size.charAt(0).toUpperCase()
    const hasMultipleLabelsForCount =
      splitItem.itemSettings.hasMultipleLabelsForCountType

    if (settings.type === KindOfItem.Container) {
      const isSingleContainer = settings.settings[size].containers.length === 1
      settings.settings[size].containers.forEach(
        (container: ContainerType, index: number) => {
          const containerLabel = isSingleContainer
            ? `${container.ounces} ${sizeChar}`
            : `${container.ounces} ${index + 1}/${
                settings.settings[size].containers.length
              } ${sizeChar}`
          pushPdfEntry(
            pdfData,
            distributionDataItem,
            splitItem,
            containerLabel,
            container.ounces
          )
        }
      )
    } else if (settings.type === KindOfItem.Count) {
      const count = hasMultipleLabelsForCount
        ? settings.settings[size].count
        : 1
      for (let i = 0; i < count; i++) {
        const countNum = settings.settings[size].count
        const countLabel = hasMultipleLabelsForCount
          ? `${i + 1}/${count} Ct. ${sizeChar}`
          : `${countNum} Ct. ${sizeChar}`
        pushPdfEntry(pdfData, distributionDataItem, splitItem, countLabel)
      }
    }
  }

  const buildPDFData = () => {
    let pdfData: SingleImportedThaaliSelection[] = []

    if (!shouldOnlyPrintSalawaatThaalis) {
      uniqueItems.forEach(item => {
        item.splitArray.forEach(splitItem => {
          currDistributionDateData.forEach(distributionDataItem => {
            if (distributionDataItem.Item === item.itemMetadata.Item) {
              const sizeFilter =
                splitItem.sizeAppliedTo === "None"
                  ? null
                  : splitItem.sizeAppliedTo
              if (sizeFilter) {
                if (sizeFilter === distributionDataItem.Size) {
                  addEntriesForSize(
                    pdfData,
                    distributionDataItem,
                    splitItem,
                    distributionDataItem.Size
                  )
                }
              } else {
                addEntriesForSize(
                  pdfData,
                  distributionDataItem,
                  splitItem,
                  distributionDataItem.Size
                )
              }
            }
          })
        })
      })
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

  const updateItemSettings = (
    itemIndex: number,
    splitItemIndex: number,
    newSettings: ItemSettings
  ): void => {
    setUniqueItems(prevUniqueItems => {
      const updatedUniqueItems = [...prevUniqueItems]
      const updatedSplitItem = {
        ...updatedUniqueItems[itemIndex].splitArray[splitItemIndex],
        itemSettings: newSettings,
      }
      updatedUniqueItems[itemIndex].splitArray[
        splitItemIndex
      ] = updatedSplitItem
      return updatedUniqueItems
    })
  }

  const handleItemTypeChangeForSettings = (
    itemIndex: number,
    splitItemIndex: number,
    newType: KindOfItem
  ) => {
    setUniqueItems(prevItems => {
      const updatedItems = [...prevItems]
      updatedItems[itemIndex].splitArray[splitItemIndex].itemSettings = {
        ...defaultItemSettings,
        type: newType,
      }
      return updatedItems
    })
  }

  const selectBefore = (itemIndex: number, splitItemIndex: number) => (
    <Select
      value={
        uniqueItems[itemIndex].splitArray[splitItemIndex].itemSettings.type
      }
      onChange={value =>
        handleItemTypeChangeForSettings(itemIndex, splitItemIndex, value)
      }
    >
      <Option value={KindOfItem.Container}>Container</Option>
      <Option value={KindOfItem.Count}>Count</Option>
    </Select>
  )

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

  // when we delete the last salawaat thaali, we should uncheck the checkbox
  React.useEffect(() => {
    if (salawaatThaalis.length === 0 && shouldOnlyPrintSalawaatThaalis) {
      setShouldOnlyPrintSalawaatThaalis(false)
    }
  }, [salawaatThaalis])

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
                                addonBefore={selectBefore(index, splitIndex)}
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
                                    <Option value="Grand">Grand ONLY</Option>
                                    <Option value="Full">Full ONLY</Option>
                                    <Option value="Half">Half ONLY</Option>
                                    <Option value="Quarter">
                                      Quarter ONLY
                                    </Option>
                                  </Select>
                                  <Button
                                    onClick={() =>
                                      handleOpenSettings(
                                        item,
                                        index,
                                        splitIndex
                                      )
                                    }
                                  >
                                    Settings
                                  </Button>
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
                      <Button
                        onClick={() => handleOpenSettings(item, index, 0)}
                      >
                        Settings
                      </Button>
                    </div>
                    <Divider />
                  </div>
                )
              })}

            {isSettingsModalVisible && (
              <ItemSettingsModal
                visible={isSettingsModalVisible}
                uniqueItem={currentItemForSettingsModal}
                itemIndex={currentItemIndexForSettingsModal}
                splitItemIndex={currentSplitItemIndexForSettingsModal}
                onClose={() => setIsSettingsModalVisible(false)}
                onSave={updateItemSettings}
              />
            )}

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
              <>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "space-between",
                    marginBottom: "-2rem",
                    paddingBottom: 0,
                  }}
                >
                  <InputNumber
                    addonBefore="# Starting Blanks"
                    min={0}
                    max={30}
                    defaultValue={0}
                    value={numStartingBlanks}
                    onChange={value => setNumStartingBlanks(value)}
                  />

                  <Form.Item label="Black & White Labels">
                    <Switch
                      checked={toggleBlackAndWhite}
                      onChange={() =>
                        setToggleBlackAndWhite(!toggleBlackAndWhite)
                      }
                    />
                  </Form.Item>
                </div>
                <Divider />
              </>
            )}

            {currDistributionDateData && distributionDate && (
              <LabelPDF
                data={debouncedPDFDataValue}
                isBlackAndWhite={toggleBlackAndWhite}
              />
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
