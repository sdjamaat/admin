import React, { useState, useEffect } from "react"
import { Modal, Checkbox } from "antd"
import { cloneDeep } from "lodash"

const Checklist = ({
  setShowChecklist,
  checklistItems,
  setChecklistItems,
  setIsChecklistComplete,
  onOkayHandler,
}) => {
  const [okayDisabled, setOkayDisabled] = useState(true)

  const okayButtonStateHandler = items => {
    let numTrue = 0
    items.forEach(item => {
      if (item.checked) {
        numTrue += 1
      }
    })

    if (numTrue === items.length) {
      setOkayDisabled(false)
      setIsChecklistComplete(true)
    } else {
      setOkayDisabled(true)
    }
  }

  useEffect(() => {
    okayButtonStateHandler(checklistItems)
  }, [])

  const setChecklistItem = (e, index) => {
    let copyChecklistItems = cloneDeep(checklistItems)
    let item = copyChecklistItems[index]
    item.checked = e.target.checked
    copyChecklistItems[index] = item

    setChecklistItems(copyChecklistItems)
    okayButtonStateHandler(copyChecklistItems)
  }
  return (
    <Modal
      title="Review Checklist"
      visible={true}
      okButtonProps={{ disabled: okayDisabled }}
      onOk={onOkayHandler}
      onCancel={() => {
        setShowChecklist(false)
      }}
      cancelText="Go Back"
      okText="Next"
    >
      {checklistItems.map((item, index) => {
        return (
          <Checkbox
            key={index}
            onChange={e => setChecklistItem(e, index)}
            style={{ width: "100%", marginLeft: "0" }}
            defaultChecked={item.checked}
          >
            {item.name}
          </Checkbox>
        )
      })}
    </Modal>
  )
}

export default Checklist
