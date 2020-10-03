import React from "react";
import { NavLink } from "react-router-dom";
import { useDispatch } from "react-redux";
import styled, { css } from "styled-components";
import { useSelector } from "react-redux";

import { toggleDrawer } from "./../store/actions/ui";

import { ui } from "./../store/selectors";

const DrawerComponent = ({ className }) => {
  const { drawerOpened } = useSelector(ui);
  const dispatch = useDispatch();

  return (
    <Drawer className={className} isOpened={drawerOpened}>
      <NavList>
        <NavItem>
          <NavLink to={"/"} onClick={() => dispatch(toggleDrawer())}>
            Dashboard
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={"/gameboard"} onClick={() => dispatch(toggleDrawer())}>
            Gameboard
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={"/register"} onClick={() => dispatch(toggleDrawer())}>
            Register
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink to={"/login"} onClick={() => dispatch(toggleDrawer())}>
            Login
          </NavLink>
        </NavItem>
      </NavList>
    </Drawer>
  );
};

const Drawer = styled.nav`
  background-color: brown;
  position: absolute;
  top: 0;
  bottom: 0;
  width: 300px;
  transition: left 0.25s;

  ${(props) =>
    props.isOpened &&
    css`
      left: 0;
    `}

  ${(props) =>
    !props.isOpened &&
    css`
      left: -300px;
    `}
`;

const NavList = styled.ul`
  margin-top: 50px;
`;

const NavItem = styled.li`
  padding: 10px;
  a {
    color: #fff;
    font-weight: 600;
    font-family: "Open Sans", sans-serif;
    font-size: 20px;
    text-decoration: none;
  }
`;

export default DrawerComponent;
