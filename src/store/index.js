import "regenerator-runtime/runtime";
import { createStore, applyMiddleware, compose } from "redux";
import createSagaMiddleware from "redux-saga";

import rootReducer from "./reducers";
import rootSagas from "./sagas/";

import app from '@firebase/app';
import '@firebase/auth';

app.initializeApp({
  apiKey: "AIzaSyBHazm-dcu71AByJMTgkgayapfPXjxGMKI",
  authDomain: "thirty-one-9b21f.firebaseapp.com",
  databaseURL: "https://thirty-one-9b21f.firebaseio.com",
  projectId: "thirty-one-9b21f",
  storageBucket: "thirty-one-9b21f.appspot.com",
  messagingSenderId: "577104859748",
  appId: "1:577104859748:web:3743aa6266de3101d64571",
  measurementId: "G-M7TNZMTPJF"
});

const sagaMiddleware = createSagaMiddleware();
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(sagaMiddleware))
);

sagaMiddleware.run(rootSagas);

export default store;
