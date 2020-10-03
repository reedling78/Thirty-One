import * as type from './../types';

const initialState = {
    user: null,
    loading: false,
    error: null,
  }
  
  export default function users(state = initialState, action) {
    switch (action.type) {
      case type.GET_USER_REQUESTED:
        return {
          ...state,
          loading: true,
        }
      case type.GET_USER_SUCCESS:
        return {
          ...state,
          loading: false,
          users: action.users
        }
      case type.GET_USER_FAILED:
        return {
          ...state,
          loading: false,
          error: action.message,
        }
        case type.CREATE_USER_REQUESTED:
          return {
            ...state,
            loading: true,
          }
        case type.CREATE_USER_SUCCESS:
          return {
            ...state,
            loading: false,
            user: action.user.user
          }
        case type.CREATE_USER_FAILED:
          return {
            ...state,
            loading: false,
            error: action.message,
          }
          case type.LOGIN_USER_REQUESTED:
          return {
            ...state,
            loading: true,
          }
        case type.LOGIN_USER_SUCCESS:
          return {
            ...state,
            loading: false,
            user: action.user.user
          }
        case type.LOGIN_USER_FAILED:
          return {
            ...state,
            loading: false,
            error: action.message,
          }
      default:
        return state
    }
  }