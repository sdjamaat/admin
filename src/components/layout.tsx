import React from "react"
import Navigation from "./navbar"
import Footer from "./footer"
import styled from "styled-components"

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <LayoutWrapper>
      <Navigation />
      <main>{children}</main>
      <Footer />
    </LayoutWrapper>
  )
}

const LayoutWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  .moula-img {
    border-top-right-radius: 8px;
    border-top-left-radius: 8px;
    max-width: 1600px;
    margin: auto;
  }
  main {
    padding: 1rem;
  }
`
export default Layout
