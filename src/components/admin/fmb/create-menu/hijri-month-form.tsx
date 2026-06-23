import React, { useContext } from "react"
import styled from "styled-components"
import { Form, Button, Tag, Select } from "antd"
import { onFinishFailed } from "../../../../functions/forms"
import { DateContext } from "../../../../provider/date-context"
import {
  shortMonthToLongMonth,
  shortMonthNames,
} from "../../../../functions/calendar"
const { Option } = Select

const layout = {
  labelCol: { span: 24 },
  wrapperCol: { span: 24 },
}

const HijriMonthForm = ({ monthsFinished, setStep, values, setValues }: any) => {
  const [hijriMonthForm] = Form.useForm()

  const { getHijriDate } = useContext(DateContext)
  const currentHijriMonth = getHijriDate().month
  const currentHijriYear = getHijriDate().year

  // moment-hijri's iMonth() is zero-indexed, so Moharram is month 0. When we're
  // already in Moharram, the current Moharram belongs to the current Hijri year.
  // Otherwise Moharram is the first month of the upcoming year.
  const moharramDisplayYear =
    currentHijriMonth === 0 ? currentHijriYear : currentHijriYear + 1

  const onFinish = (values: any) => {
    if (values.hijrimonth === "moharram") {
      setValues({ hijrimonth: "moharram", year: moharramDisplayYear })
    } else {
      setValues({ hijrimonth: values.hijrimonth, year: currentHijriYear })
    }
    setStep("menuitems")
  }

  return (
    <HijriMonthWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{ fontSize: "1.1rem", padding: ".3rem", marginBottom: "1rem" }}
        >
          Choose Month
        </Tag>
      </div>

      <Form
        {...layout}
        initialValues={values}
        form={hijriMonthForm}
        onFinish={onFinish}
        onFinishFailed={() => onFinishFailed(hijriMonthForm)}
        layout="vertical"
      >
        <Form.Item
          label={`Hijri Month - Current Year is ${currentHijriYear}`}
          name="hijrimonth"
          rules={[{ required: true, message: "Please input hijri month" }]}
        >
          <Select>
            {shortMonthNames.map((shortMonth: any, index: any) => {
              if (
                shortMonth === "moharram" &&
                !monthsFinished.includes(shortMonthNames[index])
              ) {
                return (
                  <Option value={shortMonth} key={index}>
                    {`${shortMonthToLongMonth("moharram")} (${moharramDisplayYear})`}
                  </Option>
                )
              } else if (
                index + 1 >= currentHijriMonth &&
                !monthsFinished.includes(shortMonthNames[index])
              ) {
                return (
                  <Option value={shortMonth} key={index}>
                    {shortMonthToLongMonth(shortMonth)}
                  </Option>
                )
              } else {
                return null
              }
            })}
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            className="float-right next-btn"
          >
            Next
          </Button>
        </Form.Item>
      </Form>
    </HijriMonthWrapper>
  )
}

const HijriMonthWrapper = styled.div`
  .next-btn {
    height: 2.5rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default HijriMonthForm
