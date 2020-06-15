import React from "react"
import { Card, Collapse, Tag } from "antd"
import { Row, Col, Button } from "react-bootstrap"
import styled from "styled-components"
import { shortMonthToLongMonth } from "../../../../functions/calendar"
const { Panel } = Collapse

const SingleMenu = ({ menu, tagColor, tagName, showConfirmationModal }) => {
  let buttons = null
  const getActionButtons = status => {
    if (status === "Active") {
      buttons = (
        <>
          <Col xs={12}>
            <Button
              variant="outline-danger"
              onClick={() =>
                showConfirmationModal("deactivate", menu.month, true)
              }
            >
              Deactivate & Archive
            </Button>
          </Col>
        </>
      )
    } else if (status === "Queued") {
      buttons = (
        <>
          <Col xs={6}>
            <Button
              variant="outline-secondary"
              onClick={() => showConfirmationModal("archive", menu.month)}
            >
              Archive
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-success"
              onClick={() => showConfirmationModal("activate", menu.month)}
            >
              Activate
            </Button>
          </Col>
        </>
      )
    } else {
      buttons = (
        <>
          <Col xs={6}>
            <Button
              variant="outline-danger"
              onClick={() =>
                showConfirmationModal("delete", menu.month, false, true)
              }
            >
              Delete
            </Button>
          </Col>
          <Col xs={6}>
            <Button
              variant="outline-warning"
              onClick={() => showConfirmationModal("queue", menu.month)}
            >
              Queue
            </Button>
          </Col>
        </>
      )
    }
    return buttons
  }
  return (
    <SingleMenuWrapper>
      <Card bodyStyle={{ padding: "1rem" }}>
        <div style={{ paddingBottom: "1rem" }}>
          <Row style={{ paddingBottom: 0 }}>
            <Col xs={9} md={11}>
              <div style={{ fontSize: "1.2rem" }}>
                {shortMonthToLongMonth(menu.month)}{" "}
              </div>
            </Col>
            <Col xs={3} md={1}>
              <Tag
                style={{ fontSize: ".9rem" }}
                className="float-right mt-1"
                color={tagColor}
              >
                {tagName}
              </Tag>
            </Col>
          </Row>
          <span style={{ color: "gray" }}>{menu.year}</span>
        </div>
        <Collapse style={{ padding: "-10px" }}>
          <Panel header="Items" key="1">
            {menu.items.map((item, index) => {
              return (
                <div key={index}>
                  <div>Item #{index + 1}</div>
                  <ul style={{ paddingLeft: "1.6rem", marginBottom: ".5rem" }}>
                    <li>
                      {item.nothaali ? "No Thaali" : `Name: ${item.name}`}
                    </li>
                    <li>Date: {item.date}</li>
                  </ul>
                </div>
              )
            })}
          </Panel>
        </Collapse>
        <Row style={{ marginTop: "1rem" }}>{getActionButtons(tagName)}</Row>
      </Card>
    </SingleMenuWrapper>
  )
}

const SingleMenuWrapper = styled.div`
  .ant-collapse > .ant-collapse-item > .ant-collapse-header {
    padding-top: 0.3rem;
    padding-bottom: 0.3rem;
  }
  padding-bottom: 1rem;

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

export default SingleMenu
