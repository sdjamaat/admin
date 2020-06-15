import React from "react"
import styled from "styled-components"
import { Form, Button, Tag, Card } from "antd"
import { shortMonthToLongMonth } from "../../../../functions/calendar"

const ReviewMenu = ({ setStep, hijrimonthForm, menuitemsForm, submitMenu }) => {
  return (
    <ReviewMenuWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{
            fontSize: "1.1rem",
            padding: ".3rem",
            marginBottom: "1.5rem",
          }}
        >
          Review Menu
        </Tag>
      </div>

      <Card
        title={`${shortMonthToLongMonth(hijrimonthForm.hijrimonth)} (${
          hijrimonthForm.year
        })`}
        headStyle={{ textAlign: "center", overflow: "visible" }}
        bodyStyle={{ paddingBottom: ".5rem" }}
      >
        {menuitemsForm.items.map((item, index) => {
          return (
            <div key={index}>
              Item #{index + 1}
              <ul style={{ paddingLeft: "1.6rem" }}>
                <li>
                  {item.name === "None" ? "No Thaali" : `Name: ${item.name}`}
                </li>
                <li>Date: {item.date.format("MM-DD-YYYY")}</li>
              </ul>
            </div>
          )
        })}
      </Card>

      <Form.Item>
        <Button
          onClick={() => setStep("menuitems")}
          className="float-left next-btn"
        >
          Back
        </Button>
        <Button
          type="primary"
          onClick={submitMenu}
          className="float-right next-btn"
        >
          Submit
        </Button>
      </Form.Item>
    </ReviewMenuWrapper>
  )
}

const ReviewMenuWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  div > .ant-space {
    width: 100%;
  }
`

export default ReviewMenu
