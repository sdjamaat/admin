import React from "react"
import styled from "styled-components"
import { Form, Button, Card, Tag } from "antd"

const ReviewDetails = ({ accountDetails, setStep, submitForm }) => {
  return (
    <ReviewDetailsWrapper>
      <div style={{ textAlign: "center" }}>
        <Tag
          className="float-center"
          color="geekblue"
          style={{ fontSize: "1.1rem", padding: ".3rem" }}
        >
          Review Submission
        </Tag>
      </div>

      <Card
        title="Account Details"
        style={{ marginTop: "1rem" }}
        headStyle={{ textAlign: "center" }}
        bodyStyle={{ paddingLeft: "0rem", paddingBottom: ".5rem" }}
      >
        <ul>
          <li>Head of family: {accountDetails.familyhead ? "Yes" : "No"}</li>
          <li>ITS #: {accountDetails.its}</li>
          <li>First name: {accountDetails.firstname}</li>
          <li>Last name: {accountDetails.lastname}</li>
          <li>Email: {accountDetails.email}</li>
        </ul>
      </Card>

      <Form.Item>
        <Button
          onClick={() => setStep("account-details")}
          className="float-left next-btn"
        >
          Back
        </Button>
        <Button
          type="primary"
          onClick={submitForm}
          className="float-right next-btn"
        >
          Submit
        </Button>
      </Form.Item>
    </ReviewDetailsWrapper>
  )
}

const ReviewDetailsWrapper = styled.div`
  .next-btn {
    padding-top: 0.2rem;
    padding-bottom: 2.2rem;
    font-size: 1.2rem;
    margin-top: 1rem;
  }

  .members-contact {
    max-width: 500px;
    margin: auto;
  }
`

export default ReviewDetails
