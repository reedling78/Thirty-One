import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import { HashRouter as Router, Route, NavLink } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";

import { listenUser } from "./store/actions/user";

import styled, { createGlobalStyle } from "styled-components";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Drawer from "./components/Drawer";

import Gameboard from "./views/Gameboard";
import Dashboard from "./views/Dashboard";
import Register from "./views/Register";
import Login from "./views/Login";
import CreateGame from "./views/CreateGame";

import store from "./store";
import { Fragment } from "react";

function App() {
  return <Provider store={store}>
    <AppFrame />
  </Provider>;
}

const AppFrame = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(listenUser());
  }, []);

  return (
    <Fragment>
      <GlobalStyle />
      <Header />
      <MainContent>
        <Router>
          <Route exact path={"/"} component={Dashboard} />
          <Route exact path={"/gameboard"} component={Gameboard} />
          <Route exact path={"/register"} component={Register} />
          <Route exact path={"/login"} component={Login} />
          <Route exact path={"/create"} component={CreateGame} />
          <Drawer />
        </Router>
      </MainContent>
      <Footer />
    </Fragment>
  );
};

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
      background-color: green;
      font-family: 'Open Sans', sans-serif;
  }

  #app {
      display: flex;
      flex-direction: column;
      height: 100vh;
  }
`;

const MainContent = styled.main`
  height: 100%;
`;

ReactDOM.render(<App />, document.getElementById("app"));
