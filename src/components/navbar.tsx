import React, { useContext, useState } from "react"
import { Link } from "react-router-dom"
import { Nav, Navbar, NavDropdown, Collapse } from "react-bootstrap"
import styled from "styled-components"
import { AuthContext } from "../provider/auth-context"
import logoImg from "../images/logo_small_black.png"

const Navigation = () => {
  const { isLoggedIn, signOut, currUser } = useContext(AuthContext)
  const [navExpanded, setNavExpanded] = useState(false)
  const [navDropDownExpanded, setNavDropDownExpanded] = useState(false)

  return (
    <NavbarWrapper>
      <Navbar
        onToggle={(value) => setNavExpanded(value)}
        expanded={navExpanded}
        sticky="top"
        bg="light"
        expand="lg"
      >
        <Navbar.Brand as={Link} to="/">
          <img src={logoImg} alt="Small logo" className="logo" width={92} />
        </Navbar.Brand>
        <Navbar.Toggle />
        <Navbar.Collapse>
          <Nav className="ms-auto">
            <Nav.Link
              className="navlink"
              eventKey="1"
              href="https://sandiegojamaat.net"
              target="_blank"
            >
              Main Site
            </Nav.Link>

            {!isLoggedIn && (
              <Nav.Link className="navlink" eventKey="3" as={Link} to="/">
                Login
              </Nav.Link>
            )}

            {isLoggedIn && currUser !== null && (
              <NavDropdown
                title={currUser.name}
                align="end"
                id="basic-nav-dropdown"
                className="navlink"
                onClick={() => setNavDropDownExpanded(true)}
                aria-controls="collapse-dropdown-menu"
                aria-expanded={navDropDownExpanded}
              >
                <Collapse in={navDropDownExpanded}>
                  <div id="collapse-dropdown-menu">
                    <NavDropdown.Item
                      className="dropdown navlink"
                      style={{ color: "gray" }}
                      as={Link}
                      to="/auth/admin"
                      onClick={() => setNavExpanded(false)}
                    >
                      Admin Panel
                    </NavDropdown.Item>
                    <NavDropdown.Divider />
                    <NavDropdown.Item
                      className="dropdown navlink"
                      style={{ color: "gray" }}
                      onClick={() => {
                        setNavExpanded(false)
                        signOut()
                      }}
                    >
                      Sign Out
                    </NavDropdown.Item>
                  </div>
                </Collapse>
              </NavDropdown>
            )}
          </Nav>
        </Navbar.Collapse>
      </Navbar>
    </NavbarWrapper>
  )
}

const NavbarWrapper = styled.div`
  .dropdown:active {
    background-color: transparent;
  }
  .logo {
    margin-bottom: -0.6rem;
  }
  .navlink {
    font-size: 1.3rem;
  }
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 2px 20px 0 rgba(0, 0, 0, 0.19);
  .navbar {
    padding-left: 1rem;
    padding-right: 1rem;
    align-items: center;
  }
  .navbar-brand {
    display: flex;
    align-items: center;
  }
`

export default Navigation
