Array.prototype.only = function (fun) {
  let List_ = [];
  let List = [];
  for (let item of this) {
    let item_ = fun(item)
    if (!List_.includes(item_)) {
      List_.push(item_);
      List.push(item);
    };
  };
  return List;
};

// const BASE_URL = window.location.protocol === "http:" ? "http://localhost:8000" : "https://backend.mfood.madosgroup.com";
const BASE_URL = "https://backend.mfood.madosgroup.com";

const headers = {
  "Content-Type": "application/json",
  "x-data-source": "dummy_db",
};

const INIT_STATE = {
  Menu: {},
  OrderCreated: false,
  Order: {
    FcmClientToken: null,
    Client: "Unknown Client",
    MenuId: null,
    CurrencyId: null,
    Product: [],
    Metadata: {},
  },
  ShowOrderList: !(this.window.innerWidth < 1110),
  SmallScreen: this.window.innerWidth < 1110
};

const ACTION_REDUX = {
  INIT_DATA: "INIT_DATA",
  MENU_AVAILABLE: "MENU_AVAILABLE",
  ADD_PRODUCT_TO_ORDER: "ADD_PRODUCT_TO_ORDER",
  UPDATE_PRODUCT_TO_ORDER: "UPDATE_PRODUCT_TO_ORDER",
  DELETE_PRODUCT_TO_ORDER: "DELETE_PRODUCT_TO_ORDER",
  ORDER_CREATED: "ORDER_CREATED",
  FCM_DEVICE_TOKEN_CREATED: "FCM_DEVICE_TOKEN_CREATED",
  TOGGLE_ORDER_MENU_DISPLAY: "TOGGLE_ORDER_MENU_DISPLAY",
  SCREEN_RESIZING: "SCREEN_RESIZING"
};

const PROCESS_STORE = {
  ADD_PRODUCT_TO_ORDER_REQUEST: null,
  UPDATE_PRODUCT_TO_ORDER_REQUEST: null,
};

const REQUEST_DELAY = 2000;

const urlSearchParams = new URLSearchParams(window.location.search);
const Metadata = Object.fromEntries(urlSearchParams.entries());

const STORE = Redux.createStore((state = INIT_STATE, { type, payload }) => {
  switch (type) {
    case ACTION_REDUX.INIT_DATA:
      return payload;

    case ACTION_REDUX.SCREEN_RESIZING:
      return { ...state, ShowOrderList: !(this.window.innerWidth < 1110), SmallScreen: payload };
    
    case ACTION_REDUX.TOGGLE_ORDER_MENU_DISPLAY:
      return { ...state, ShowOrderList: !state.ShowOrderList };

    case ACTION_REDUX.FCM_DEVICE_TOKEN_CREATED:
      return { ...state, Order: { ...state.Order, FcmClientToken: payload } };

    case ACTION_REDUX.MENU_AVAILABLE:
      headers['x-data-source'] = payload?.Business?.Uuid;
      delete Metadata.m;
      // delete Metadata.b;
      return { ...state, Menu: payload, Order: { ...state.Order, CurrencyId: payload.Currency.id, MenuId: payload.id, Metadata } };

    case ACTION_REDUX.ADD_PRODUCT_TO_ORDER:
      // AVOID TO ADD AN ITEM TWISE TO THE LIST
      if (state.Order.Product.find((_) => _.ProductId === payload.ProductId)) return state;
      return { ...state, Order: { ...state.Order, Product: [payload, ...state.Order.Product] } };

    case ACTION_REDUX.UPDATE_PRODUCT_TO_ORDER:
      // REMOTE UPDATE IF ORDER CREATED
      if (state.OrderCreated) {
        if (PROCESS_STORE.UPDATE_PRODUCT_TO_ORDER_REQUEST) {
          clearTimeout(PROCESS_STORE.UPDATE_PRODUCT_TO_ORDER_REQUEST);
          PROCESS_STORE.UPDATE_PRODUCT_TO_ORDER_REQUEST = null;
        }
        PROCESS_STORE.UPDATE_PRODUCT_TO_ORDER_REQUEST = setTimeout(() => {
          let ProductId = state.Order.Product.find(_ => _.ProductId === payload.id).id;
          UPDATE_PRODUCT_ORDER(state.Order._id, ProductId, payload.data);
        }, REQUEST_DELAY);
      };

      // LOCAL UPDATE
      // UPDATE THE LIST
      const Product = state.Order.Product.map((_) => {
        if (_.ProductId === payload.id) _ = { ..._, ...payload.data };
        return _;
      });
      return { ...state, Order: { ...state.Order, Product } };

    case ACTION_REDUX.DELETE_PRODUCT_TO_ORDER:
      // REMOTE UPDATE IF ORDER CREATED
      if (state.OrderCreated) DELETE_PRODUCT_ORDER(state.Order._id, state.Order.Product.filter((_) => _.ProductId === payload).map((_) => _.id));
      // LOCAL UPDATE
      return { ...state, Order: { ...state.Order, Product: state.Order.Product.filter((_) => _.ProductId !== payload) } };

    case ACTION_REDUX.ORDER_CREATED:
      return { ...state, Order: payload, OrderCreated: true };

    default:
      return state;
  }
});

window.addEventListener("resize", () => STORE.dispatch({ type: ACTION_REDUX.SCREEN_RESIZING, payload: this.window.innerWidth < 1110 }));

const TOGGLE_MENU_PRODUCT_DISPLAY = () => STORE.dispatch({ type: ACTION_REDUX.TOGGLE_ORDER_MENU_DISPLAY, payload: null });

// =========================================================[ API ]===================================================================

const GET_MENU = async (uuid) => fetch(`${BASE_URL}/api/auth/menu/detail-view/${uuid}?BusinessId=${Metadata.b || 2}`).then(async (res) => {
  const payload = await res.json();
  STORE.dispatch({ type: ACTION_REDUX.MENU_AVAILABLE, payload });
  return payload;
}).catch(console.error);

const CREATE_ORDER = async (payload) => fetch(`${BASE_URL}/api/bill`, { method: "POST", body: JSON.stringify(payload), headers }).then(async (res) => await res.json()).catch(console.error);

const ADD_PRODUCT_TO_ORDER = async (order_id, payloads) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, { method: "POST", body: JSON.stringify(payloads), headers }).then(async (res) => res.json());

const UPDATE_PRODUCT_ORDER = async (order_id, product_id, payload) => fetch(`${BASE_URL}/api/bill/${order_id}/product/${product_id}`, { method: "PATCH", body: JSON.stringify(payload), headers }).then(async (res) => res.json());

const DELETE_PRODUCT_ORDER = async (order_id, products) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, { method: "DELETE", body: JSON.stringify(products), headers }).then(async (res) => res.json());

// =========================================================[ FIREBASE NOTIFICATION ]===================================================================

const FIREBASE_KEY = "BN4m8YGrBzsg7anm8vEzPLQ7Gc7HagB4X2WMKSFGzzfApe39ADvXZ99rSkUnmSWSoWQ-NR60WI4pJ1DwuvLXKk8";
function FIREBASE_INIT({ initializeApp, getMessaging, getToken, onMessage }) {
  // Your web app's Firebase configuration
  const app = initializeApp({
    apiKey: "AIzaSyBxkabccm8TDL6ku0nrrUQHtbv5w2upm3s",
    authDomain: "beststore-b8257.firebaseapp.com",
    projectId: "beststore-b8257",
    storageBucket: "beststore-b8257.appspot.com",
    messagingSenderId: "175988176537",
    appId: "1:175988176537:web:1840fd9820391d59bbaa08"
  });

  const messaging = getMessaging(app);

  GET_MENU(Metadata.m || "9f7e9234-f2a6-4daa-802c-403f7e8750f1").then(console.log);

  if (!('serviceWorker' in navigator)) return alert("This browser will nt support background notification, tell this page open.");

  navigator.serviceWorker.register('./js/firebase-messaging-sw.js').then(() => getToken(messaging, { vapidKey: FIREBASE_KEY }).then(token => {
    STORE.dispatch({ type: ACTION_REDUX.FCM_DEVICE_TOKEN_CREATED, payload: token });
    new BroadcastChannel('sw-messages').onmessage = ({ data: { data, notification } }) => DATA_ORDER_CHANGE({ data, notification });
    onMessage(messaging, ({ data, notification }) => DATA_ORDER_CHANGE({ data, notification }));
  }));
};


function DATA_ORDER_CHANGE(payload) {
  console.log("DATA_ORDER_CHANGE FUNCTION RECEIVED DATA : ", payload);
};