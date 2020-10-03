import React from "react";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import { toggleDrawer } from "./../store/actions/ui";

const Header = ({ className, children }) => {
  const dispatch = useDispatch();
  return (
    <header className={className}>
      <AppTitle>Thirty One</AppTitle>
      <Button onClick={() => dispatch(toggleDrawer())}>
        <BarsStyled
          aria-hidden="true"
          focusable="false"
          data-prefix="fas"
          data-icon="bars"
          className="svg-inline--fa fa-bars fa-w-14"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
        >
          <path
            fill="currentColor"
            d="M16 132h416c8.837 0 16-7.163 16-16V76c0-8.837-7.163-16-16-16H16C7.163 60 0 67.163 0 76v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16zm0 160h416c8.837 0 16-7.163 16-16v-40c0-8.837-7.163-16-16-16H16c-8.837 0-16 7.163-16 16v40c0 8.837 7.163 16 16 16z"
          ></path>
        </BarsStyled>
      </Button>
    </header>
  );
};

const HeaderStyled = styled(Header)`
  flex: 1;
  background-color: #1e421e;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const AppTitle = styled.h1`
  font-size: 24px;
  font-weight: 600;
  font-family: "Open Sans", sans-serif;
  color: #fff;
  margin: 10px;
`;

const Button = styled.button`
  background-color: #142c14;
  border: none;
  height: 100%;
  width: 50px;
  position: relative;
  top: 0;
  right: 0;
  bottom: 0;
`;

const BarsStyled = styled.svg`
  fill: #fff;
  color: #fff;
  top: 0px;
  position: relative;
  height: 30px;
`;

export default HeaderStyled;
