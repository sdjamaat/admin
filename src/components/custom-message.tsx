import React from "react"
import { message, Alert } from "antd"

message.config({
  top: 100,
})

const CustomMessage = (type: string, text: string, time: number = 3) => {
  if (type === "error") {
    message.error({
      content: <Alert message={`Error: ${text}`} type="error" showIcon={false} banner={true} />,
      icon: <div></div>,
      duration: time,
    })
  } else if (type === "success") {
    message.success({
      content: <Alert message={text} type="success" showIcon={false} banner={true} />,
      icon: <div></div>,
      duration: time,
    })
  } else if (type === "info") {
    message.info({
      content: <Alert message={text} type="info" showIcon={false} banner={true} />,
      icon: <div></div>,
      duration: time,
    })
  } else if (type === "warning") {
    message.warning({
      content: <Alert message={text} type="warning" showIcon={false} banner={true} />,
      icon: <div></div>,
      duration: time,
    })
  }
}

export default CustomMessage
