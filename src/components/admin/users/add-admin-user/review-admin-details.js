import React from "react"
import styled from "styled-components"
import { Form, Button, Card, Tag, Alert } from "antd"

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
      >
        <ul style={{ paddingLeft: "1.5rem", paddingBottom: ".5rem" }}>
          <li>Email: {accountDetails.email}</li>
          <li>Password: {accountDetails.password}</li>
        </ul>
        <Alert
          message="Note: This account won't be able to view content on the admin panel until proper permissions are set. Account permissions can be changed in the 'Manage Accounts' tab after creation."
          type="warning"
        />
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
