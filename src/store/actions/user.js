import * as type from "./../types";

export function getUser() {
  return {
    type: type.GET_USER_REQUESTED,
  };
}

export function createUser(user) {
  return {
    type: type.CREATE_USER_REQUESTED,
    payload: user,
  };
}

export function listenUser() {
  return {
    type: type.LISTEN_USER_REQUESTED,
  };
}

export function loginUser(user) {
  return {
    type: type.LOGIN_USER_REQUESTED,
    payload: user,
  };
}
