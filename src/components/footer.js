import React from "react"
import styled from "styled-components"
import { Navbar } from "react-bootstrap"

const Footer = () => {
  return (
    <FooterWrapper>
      <Navbar sticky="bottom" bg="light">
        &copy; {new Date().getFullYear()} Anjuman-e-Mohammedi San Diego
      </Navbar>
    </FooterWrapper>
  )
}

const FooterWrapper = styled.div`
  margin-top: auto;
  line-height: 2rem;
  .navbar {
    justify-content: center;
    font-size: 1rem;
  }
`

export default Footer
