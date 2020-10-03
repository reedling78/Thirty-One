import { call, put, takeEvery } from "redux-saga/effects";
import app from "@firebase/app";
import "@firebase/auth";
import * as type from "./../types";

function getApi() {
  return app.auth().currentUser;
}

async function sendCreateUser({ email, password }) {
  await app.auth().createUserWithEmailAndPassword(email, password);
  return app.auth().signInWithEmailAndPassword(email, password);
}

function startListenUser() {
  return app.auth().onAuthStateChanged(function (user) {
    if (user) {
      // User is signed in.
      var displayName = user.displayName;
      var email = user.email;
      var emailVerified = user.emailVerified;
      var photoURL = user.photoURL;
      var isAnonymous = user.isAnonymous;
      var uid = user.uid;
      var providerData = user.providerData;
      console.log("email", email);
      // ...
    }
  });
}

async function sendLoginUser({ email, password }) {
  return app.auth().signInWithEmailAndPassword(email, password);
}

function* listenUser(action) {
  try {
    const user = yield call(startListenUser);
    yield put({ type: type.LISTEN_USER_SUCCESS });
  } catch (e) {
    yield put({ type: type.LISTEN_USER_FAILED, message: e.message });
  }
}

function* fetchUser(action) {
  try {
    const user = yield call(getApi);
    yield put({ type: type.GET_USER_SUCCESS, user: user });
  } catch (e) {
    yield put({ type: type.GET_USER_FAILED, message: e.message });
  }
}

function* createUser(action) {
  try {
    const user = yield call(sendCreateUser, action.payload);
    yield put({ type: type.CREATE_USER_SUCCESS, user: user });
  } catch (e) {
    yield put({ type: type.CREATE_USER_FAILED, message: e.message });
  }
}

function* loginUser(action) {
  try {
    const user = yield call(sendLoginUser, action.payload);
    yield put({ type: type.LOGIN_USER_SUCCESS, user: user });
  } catch (e) {
    yield put({ type: type.LOGIN_USER_FAILED, message: e.message });
  }
}

function* userSaga() {
  yield takeEvery("GET_USER_REQUESTED", fetchUser);
  yield takeEvery("CREATE_USER_REQUESTED", createUser);
  yield takeEvery("LISTEN_USER_REQUESTED", listenUser);
  yield takeEvery("LOGIN_USER_REQUESTED", loginUser);
}

export default userSaga;
