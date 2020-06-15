import React from "react"
import styled from "styled-components"
import { Form, Button, InputNumber, Tag, Select, DatePicker } from "antd"
import { onFinishFailed } from "../../functions/forms"
const { Option } = Select

const PersonalDetails = ({
  layout,
  setStep,
  skipFamilyDetails,
  values,
  setValues,
}) => {
  const [form] = Form.useForm()
  const onFinish = values => {
    setValues({ ...values })
    if (skipFamilyDetails) {
      setStep("choose-family")
    } else {
      setStep("family-details")
    }
  }

  return (
    <PersonalDetailsWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{ fontSize: "1.1rem", padding: ".3rem" }}
        >
          Personal Details
        </Tag>
      </div>

      <Form
        {...layout}
        form={form}
        initialValues={values}
        onFinish={onFinish}
        onFinishFailed={() => onFinishFailed(form)}
        layout="vertical"
      >
        <Form.Item label="Title" name="title" rules={[{ required: false }]}>
          <Select>
            <Option value="None">None</Option>
            <Option value="Mulla">Mulla</Option>
            <Option value="Sheikh">Sheikh</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="Other titles"
          name="othertitles"
          rules={[{ required: false }]}
        >
          <Select mode="multiple">
            <Option value="NKD">NKD</Option>
            <Option value="MKD">MKD</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="YOB:"
          name="yob"
          rules={[{ required: true, message: "Please input your YOB" }]}
        >
          <DatePicker
            style={{ width: "100%", padding: ".2rem" }}
            picker="year"
          />
        </Form.Item>

        <Form.Item
          label="Phone #"
          name="phone"
          rules={[{ required: true, message: "Please input your username" }]}
        >
          <InputNumber style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item>
          <Button
            onClick={() => setStep("account-details")}
            className="float-left next-btn"
          >
            Back
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            className="float-right next-btn"
          >
            Next
          </Button>
        </Form.Item>
      </Form>
    </PersonalDetailsWrapper>
  )
}

const PersonalDetailsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }
`

export default PersonalDetails
