import React, { CSSProperties, useState } from "react"
import {
  Modal,
  Tabs,
  Form,
  Select,
  Button,
  InputNumber,
  Input,
  Col,
  Row,
} from "antd"
import { DeleteOutlined } from "@ant-design/icons"
import {
  ContainerSizes,
  ThaaliTypes,
  UniqueItem,
  KindOfItem,
  ItemSettings,
} from "../../../../utils/types"
import { defaultItemSettings } from "../../../../utils/defaults"

const { TabPane } = Tabs
const { Option } = Select

interface ItemSettingsModalProps {
  visible: boolean
  uniqueItem: UniqueItem | null
  itemIndex: number
  splitItemIndex: number
  onClose: () => void
  onSave: (
    itemIndex: number,
    splitItemIndex: number,
    newSettings: ItemSettings
  ) => void
}

const modalBodyStyle: CSSProperties = {
  minHeight: "500px",
  overflowY: "auto" as const, // Typed as a literal type
}

const ItemSettingsModal: React.FC<ItemSettingsModalProps> = ({
  visible,
  uniqueItem,
  itemIndex,
  splitItemIndex,
  onClose,
  onSave,
}) => {
  const initialName = uniqueItem
    ? uniqueItem.splitArray[splitItemIndex].name
    : ""

  // Initialize the local state with the existing settings from the uniqueItem prop
  const [itemSettings, setItemSettings] = useState<ItemSettings>(
    uniqueItem
      ? uniqueItem.splitArray[splitItemIndex].itemSettings
      : { ...defaultItemSettings }
  )

  // Track the original settings to compare against
  const [originalSettings, setOriginalSettings] = useState<ItemSettings>(
    uniqueItem
      ? uniqueItem.splitArray[splitItemIndex].itemSettings
      : defaultItemSettings
  )
  const handleItemTypeChange = (value: KindOfItem) => {
    setItemSettings(prev => ({
      ...defaultItemSettings,
      type: value,
    }))
  }

  const handleAddContainer = (size: "Full" | "Half" | "Quarter") => {
    const newContainerSize =
      size === "Full"
        ? ContainerSizes.ThirtyTwoOunce
        : size === "Half"
        ? ContainerSizes.SixteenOunce
        : ContainerSizes.TwelveOunce

    if (itemSettings.type === KindOfItem.Container) {
      setItemSettings(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [size]: {
            ...prev.settings[size],
            containers: [
              ...prev.settings[size].containers,
              { ounces: newContainerSize },
            ],
          },
        },
      }))
    }
  }

  const handleRemoveContainer = (
    size: "Full" | "Half" | "Quarter",
    index: number
  ) => {
    if (itemSettings.type === KindOfItem.Container) {
      setItemSettings(prev => {
        const updatedContainers = prev.settings[size].containers.filter(
          (_, i) => i !== index
        )
        return {
          ...prev,
          settings: {
            ...prev.settings,
            [size]: {
              ...prev.settings[size],
              containers: updatedContainers,
            },
          },
        }
      })
    }
  }

  const handleContainerOuncesChange = (
    size: "Full" | "Half" | "Quarter",
    index: number,
    value: ContainerSizes
  ) => {
    if (itemSettings.type === KindOfItem.Container) {
      setItemSettings(prev => {
        const updatedContainers = [...prev.settings[size].containers]
        updatedContainers[index] = { ounces: value }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            [size]: {
              ...prev.settings[size],
              containers: updatedContainers,
            },
          },
        }
      })
    }
  }

  const handleCountChange = (
    size: "Full" | "Half" | "Quarter",
    value: number | null
  ) => {
    if (itemSettings.type === KindOfItem.Count) {
      setItemSettings(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [size]: {
            ...prev.settings[size],
            count: value,
          },
        },
      }))
    }
  }

  const handleSave = () => {
    if (uniqueItem !== null) {
      onSave(itemIndex, splitItemIndex, itemSettings)
    }
    onClose()
  }

  const haveSettingsChanged = (): boolean => {
    return JSON.stringify(originalSettings) !== JSON.stringify(itemSettings)
  }

  const getTabsArrBasedOnSizeApplied = (): ("Full" | "Half" | "Quarter")[] => {
    const sizeApplied = uniqueItem
      ? uniqueItem.splitArray[splitItemIndex].sizeAppliedTo
      : ThaaliTypes.None
    if (sizeApplied === ThaaliTypes.None) {
      return ["Full", "Half", "Quarter"]
    } else if (sizeApplied === ThaaliTypes.Full) {
      return ["Full"]
    } else if (sizeApplied === ThaaliTypes.Half) {
      return ["Half"]
    } else if (sizeApplied === ThaaliTypes.Quarter) {
      return ["Quarter"]
    } else {
      return []
    }
  }

  const tabsArr = getTabsArrBasedOnSizeApplied()

  React.useEffect(() => {
    const settings = uniqueItem
      ? uniqueItem.splitArray[splitItemIndex].itemSettings
      : {
          type: KindOfItem.Container,
          settings: defaultItemSettings.settings,
        }
    setOriginalSettings(settings)
    setItemSettings(settings)
  }, [uniqueItem, splitItemIndex])

  return (
    <Modal
      title={`Item Settings - ${initialName}`}
      open={visible}
      onOk={handleSave}
      okText="Save"
      okButtonProps={{ disabled: !haveSettingsChanged() }}
      onCancel={onClose}
      width={720}
      style={modalBodyStyle}
    >
      <Row style={{ marginBottom: 16 }}>
        {" "}
        <Col span={20}>
          <Tabs>
            {([...tabsArr] as const).map(size => (
              <TabPane tab={size} key={size}>
                <Form layout="vertical">
                  {itemSettings.type === KindOfItem.Container && (
                    <>
                      <Form.Item>
                        <Button onClick={() => handleAddContainer(size)}>
                          Add Container
                        </Button>
                      </Form.Item>
                      {itemSettings.settings[size].containers.map(
                        (container, index) => (
                          <Form.Item
                            label={`Container (${index + 1} of ${
                              itemSettings.settings[size].containers.length
                            }) ${initialName}`}
                            key={index}
                          >
                            <Input.Group compact>
                              <Select
                                defaultValue={container.ounces}
                                style={{ width: "calc(100% - 40px)" }}
                                onChange={value =>
                                  handleContainerOuncesChange(
                                    size,
                                    index,
                                    value as ContainerSizes
                                  )
                                }
                              >
                                <Option value={ContainerSizes.ThirtyTwoOunce}>
                                  32oz
                                </Option>
                                <Option value={ContainerSizes.SixteenOunce}>
                                  16oz
                                </Option>
                                <Option value={ContainerSizes.TwelveOunce}>
                                  12oz
                                </Option>
                              </Select>
                              {index > 0 && (
                                <Button
                                  type="dashed"
                                  icon={<DeleteOutlined />}
                                  onClick={() =>
                                    handleRemoveContainer(size, index)
                                  }
                                />
                              )}
                            </Input.Group>
                          </Form.Item>
                        )
                      )}
                    </>
                  )}
                  {itemSettings.type === KindOfItem.Count && (
                    <Form.Item label="Count">
                      <InputNumber
                        min={1}
                        style={{ width: "100%" }}
                        value={itemSettings.settings[size].count}
                        onChange={value => handleCountChange(size, value)}
                      />
                    </Form.Item>
                  )}
                </Form>
              </TabPane>
            ))}
          </Tabs>
        </Col>
        <Col span={4} style={{ textAlign: "center" }}>
          <Select
            value={itemSettings.type}
            style={{ width: "100%" }}
            onChange={value => handleItemTypeChange(value as KindOfItem)}
          >
            <Option value={KindOfItem.Container}>Container</Option>
            <Option value={KindOfItem.Count}>Count</Option>
          </Select>
        </Col>
      </Row>
    </Modal>
  )
}

export default ItemSettingsModal
