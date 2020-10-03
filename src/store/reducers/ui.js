import * as type from './../types';

const INITIAL_STATE = {
  drawerOpened: false,
};

export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case type.TOGGLE_DRAWER: {
      return {
        ...state,
        drawerOpened: !state.drawerOpened,
      };
    }
    default: {
      return { ...INITIAL_STATE };
    }
  }
}
