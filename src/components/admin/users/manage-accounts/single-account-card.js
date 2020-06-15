import React from "react"
import { Card, Collapse } from "antd"
import { Row, Col, Button } from "react-bootstrap"
import styled from "styled-components"
const { Panel } = Collapse

const SingleAccountCard = ({ user }) => {
  return (
    <SingleAccountCardWrapper>
      <Card
        style={{ marginBottom: "1rem" }}
        bodyStyle={{
          paddingTop: ".5rem",
          paddingTop: "1rem",
          paddingBottom: "1rem",
        }}
      >
        <h5>
          {user.firstname} {user.lastname}
        </h5>
        <p>{user.email}</p>
        <Collapse style={{ padding: "-10px" }}>
          <Panel header="Details" key="1">
            <ul style={{ paddingLeft: "1.6rem", marginBottom: ".5rem" }}>
              <li>Head of Family: {user.familyhead ? "Yes" : "No"}</li>
              <li>ITS: {user.its}</li>
              <li>Phone: {user.phone}</li>
              <li>YOB: {user.yob}</li>
            </ul>
          </Panel>
        </Collapse>
        <Row style={{ marginTop: ".7rem" }}>
          <Col xs={6} className="btn-col">
            <Button
              variant="outline-danger"
              onClick={() => console.log("clicked delete")}
            >
              Delete
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-warning"
              onClick={() => console.log("clicked queue")}
            >
              Edit
            </Button>
          </Col>
        </Row>
      </Card>
    </SingleAccountCardWrapper>
  )
}

const SingleAccountCardWrapper = styled.div`
  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
  .ant-card {
    h5 {
      margin-bottom: 5px;
    }
    p {
      margin-bottom: 10px;
    }
  }

  .btn {
    font-size: 1.1rem;
    width: 100%;

    padding-bottom: 0.2rem;
    padding-top: 0.2rem;
  }

  .btn-outline-success:hover {
    background-color: inherit !important;
    color: #28a745 !important;
  }

  .btn-outline-warning:hover {
    background-color: inherit !important;
    color: #ffc107 !important;
  }

  .btn-outline-secondary:hover {
    background-color: inherit !important;
    color: #6c757d !important;
  }

  .btn-outline-danger:hover {
    background-color: inherit !important;
    color: #dc3545 !important;
  }
`

export default SingleAccountCard
