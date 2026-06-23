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

// The current and next Moharram both live under the "moharram" Firestore doc id
// (they only differ by display year / storage year), so the Select needs
// distinct option values to tell them apart. onFinish translates these back to
// the real { hijrimonth: "moharram", year } pair the rest of the flow expects.
const MOHARRAM_CURRENT = "moharram_current"
const MOHARRAM_NEXT = "moharram_next"

const HijriMonthForm = ({
  monthsFinished,
  currentMoharramFinished,
  nextMoharramFinished,
  setStep,
  values,
  setValues,
}: any) => {
  const [hijriMonthForm] = Form.useForm()

  const { getHijriDate } = useContext(DateContext)
  const currentHijriMonth = getHijriDate().month
  const currentHijriYear = getHijriDate().year

  // moment-hijri's iMonth() is zero-indexed, so Moharram is month 0.
  const isCurrentlyMoharram = currentHijriMonth === 0
  const nextMoharramYear = currentHijriYear + 1

  // Build the ordered option list:
  //   1. This year's Moharram at the top (only while we're in Moharram and it
  //      hasn't been configured yet)
  //   2. The remaining months of the current Hijri year, in order
  //   3. Next year's Moharram at the bottom (if not configured yet)
  const buildOptions = () => {
    const options: { value: string; label: string }[] = []

    if (isCurrentlyMoharram && !currentMoharramFinished) {
      options.push({
        value: MOHARRAM_CURRENT,
        label: `${shortMonthToLongMonth("moharram")} (${currentHijriYear})`,
      })
    }

    shortMonthNames.forEach((shortMonth: any, index: any) => {
      if (shortMonth === "moharram") {
        return
      }
      if (
        index + 1 >= currentHijriMonth &&
        !monthsFinished.includes(shortMonth)
      ) {
        options.push({
          value: shortMonth,
          label: shortMonthToLongMonth(shortMonth),
        })
      }
    })

    if (!nextMoharramFinished) {
      options.push({
        value: MOHARRAM_NEXT,
        label: `${shortMonthToLongMonth("moharram")} (${nextMoharramYear})`,
      })
    }

    return options
  }

  // Map the previously selected value (stored as { hijrimonth, year }) back to
  // the Select's option value so navigating back to this step re-selects it.
  const getInitialSelectValue = () => {
    if (values?.hijrimonth === "moharram") {
      return values.year === currentHijriYear ? MOHARRAM_CURRENT : MOHARRAM_NEXT
    }
    return values?.hijrimonth
  }

  const onFinish = (formValues: any) => {
    const selected = formValues.hijrimonth
    if (selected === MOHARRAM_CURRENT) {
      setValues({ hijrimonth: "moharram", year: currentHijriYear })
    } else if (selected === MOHARRAM_NEXT) {
      setValues({ hijrimonth: "moharram", year: nextMoharramYear })
    } else {
      setValues({ hijrimonth: selected, year: currentHijriYear })
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
        initialValues={{ ...values, hijrimonth: getInitialSelectValue() }}
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
            {buildOptions().map(option => (
              <Option value={option.value} key={option.value}>
                {option.label}
              </Option>
            ))}
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
