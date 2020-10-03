import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";

import { ButtonWrapper, Button } from "./../components/Form";
import SubHeader from "./../components/SubHeader";

const Dashboard = ({ className, children }) => {
  return (
    <div className={className}>
      <GameList>
        <SubHeader>Waiting for players</SubHeader>
        <List>
          <li>
            <GameLink to={`/gameboard`}>Virtual Garage</GameLink>
          </li>
          <li>
            <GameLink to={`/gameboard`}>Keylime Reunion</GameLink>
          </li>
        </List>
      </GameList>

      <ButtonWrapper>
        <AddButton to={"/create"}>Start a game</AddButton>
      </ButtonWrapper>

    </div>
  );
};

const DashboardStyled = styled(Dashboard)``;

const GameList = styled.section`
  margin: 40px 10px;
`;

const List = styled.ul`
  margin: 0;
  padding: 0;
`;

const GameLink = styled(NavLink)`
  display: block;
  width: 100%;
  padding: 15px 10px;
  margin: auto;
  background-color: #fff;
  color: #000;
`;

const AddButton = styled(NavLink)`
  background-color: #1e421e;
  padding: 10px 10px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 5px;
  width: 100%;
  color: #fff;
`;

export default DashboardStyled;
