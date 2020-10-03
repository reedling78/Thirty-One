import { put, all } from "redux-saga/effects";
import userSaga from "./user";

export function* toggleDrawer() {
  yield put({ type: "TOGGLE_DRAWER" });
}

export default function* rootSaga() {
  yield all([, toggleDrawer, userSaga()]);
}
