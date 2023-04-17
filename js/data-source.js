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

const BASE_URL = window.location.protocol === "http:" ? "http://localhost:8000" : "https://backend.mfood.madosgroup.com";

const headers = {
  "Content-Type": "application/json",
  "x-data-source": "dummy_db",
};


const INIT_STATE = {
  Menu: {},
  OrderCreated: false,
  Order: {
    Client: "Unknown Client",
    MenuId: null,
    CurrencyId: null,
    Product: [],
    Metadata: {},
  },
};

const ACTION_REDUX = {
  INIT_DATA: "INIT_DATA",
  MENU_AVAILABLE: "MENU_AVAILABLE",
  ADD_PRODUCT_TO_ORDER: "ADD_PRODUCT_TO_ORDER",
  UPDATE_PRODUCT_TO_ORDER: "UPDATE_PRODUCT_TO_ORDER",
  DELETE_PRODUCT_TO_ORDER: "DELETE_PRODUCT_TO_ORDER",
  ORDER_CREATED: "ORDER_CREATED",
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

    case ACTION_REDUX.MENU_AVAILABLE:
      delete Metadata.m;
      // delete Metadata.b;
      headers['x-data-source'] = payload.Business.Uuid;
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
          let ProductId = state.Order.Product.find(
            (_) => _.ProductId === payload.id
          ).id;
          UPDATE_PRODUCT_ORDER(state.Order._id, ProductId, payload.data);
        }, REQUEST_DELAY);
      }

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

// ============================================================================================================================

const GET_MENU = async (uuid) => fetch(`${BASE_URL}/api/auth/menu/detail-view/${uuid}?BusinessId=${Metadata.b || 1}`).then(async (res) => {
  const payload = await res.json();
  STORE.dispatch({ type: ACTION_REDUX.MENU_AVAILABLE, payload });
  return payload;
}).catch(console.error);

const CREATE_ORDER = async (payload) => fetch(`${BASE_URL}/api/bill`, { method: "POST", body: JSON.stringify(payload), headers }).then(async (res) => await res.json()).catch(console.error);

const ADD_PRODUCT_TO_ORDER = async (order_id, payloads) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, { method: "POST", body: JSON.stringify(payloads), headers }).then(async (res) => res.json());

const UPDATE_PRODUCT_ORDER = async (order_id, product_id, payload) => fetch(`${BASE_URL}/api/bill/${order_id}/product/${product_id}`, { method: "PATCH", body: JSON.stringify(payload), headers }).then(async (res) => res.json());

const DELETE_PRODUCT_ORDER = async (order_id, products) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, { method: "DELETE", body: JSON.stringify(products), headers }).then(async (res) => res.json());

GET_MENU(Metadata.m || "9f7e9234-f2a6-4daa-802c-403f7e8750f1").then(console.log);