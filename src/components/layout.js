import React from "react"
import Navigation from "./navbar"
import Footer from "./footer"
import styled from "styled-components"
import { graphql, useStaticQuery } from "gatsby"

const Layout = ({ children }) => {
  const images = useStaticQuery(graphql`
    query {
      logo: file(relativePath: { eq: "logo_small_black.png" }) {
        childImageSharp {
          fixed(width: 92) {
            ...GatsbyImageSharpFixed
          }
        }
      }
    }
  `)
  return (
    <LayoutWrapper>
      <Navigation logo={images.logo.childImageSharp.fixed} />

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
