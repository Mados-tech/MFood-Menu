"use strict";

function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
Array.prototype.only = function (fun) {
  let List_ = [];
  let List = [];
  for (let item of this) {
    let item_ = fun(item);
    if (!List_.includes(item_)) {
      List_.push(item_);
      List.push(item);
    }
    ;
  }
  ;
  return List;
};

// const BASE_URL = window.location.protocol === "http:" ? "http://localhost:8000" : "https://backend.mfood.madosgroup.com";
const BASE_URL = "https://backend.mfood.madosgroup.com";
const headers = {
  "Content-Type": "application/json",
  "x-data-source": "dummy_db"
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
    Metadata: {}
  }
};
const ACTION_REDUX = {
  INIT_DATA: "INIT_DATA",
  MENU_AVAILABLE: "MENU_AVAILABLE",
  ADD_PRODUCT_TO_ORDER: "ADD_PRODUCT_TO_ORDER",
  UPDATE_PRODUCT_TO_ORDER: "UPDATE_PRODUCT_TO_ORDER",
  DELETE_PRODUCT_TO_ORDER: "DELETE_PRODUCT_TO_ORDER",
  ORDER_CREATED: "ORDER_CREATED",
  FCM_DEVICE_TOKEN_CREATED: "FCM_DEVICE_TOKEN_CREATED"
};
const PROCESS_STORE = {
  ADD_PRODUCT_TO_ORDER_REQUEST: null,
  UPDATE_PRODUCT_TO_ORDER_REQUEST: null
};
const REQUEST_DELAY = 2000;
const urlSearchParams = new URLSearchParams(window.location.search);
const Metadata = Object.fromEntries(urlSearchParams.entries());
const STORE = Redux.createStore((state = INIT_STATE, {
  type,
  payload
}) => {
  var _payload$Business;
  switch (type) {
    case ACTION_REDUX.INIT_DATA:
      return payload;
    case ACTION_REDUX.FCM_DEVICE_TOKEN_CREATED:
      return {
        ...state,
        Order: {
          ...state.Order,
          FcmClientToken: payload
        }
      };
    case ACTION_REDUX.MENU_AVAILABLE:
      headers['x-data-source'] = payload === null || payload === void 0 ? void 0 : (_payload$Business = payload.Business) === null || _payload$Business === void 0 ? void 0 : _payload$Business.Uuid;
      delete Metadata.m;
      // delete Metadata.b;
      return {
        ...state,
        Menu: payload,
        Order: {
          ...state.Order,
          CurrencyId: payload.Currency.id,
          MenuId: payload.id,
          Metadata
        }
      };
    case ACTION_REDUX.ADD_PRODUCT_TO_ORDER:
      // AVOID TO ADD AN ITEM TWISE TO THE LIST
      if (state.Order.Product.find(_ => _.ProductId === payload.ProductId)) return state;
      return {
        ...state,
        Order: {
          ...state.Order,
          Product: [payload, ...state.Order.Product]
        }
      };
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
      }
      ;

      // LOCAL UPDATE
      // UPDATE THE LIST
      const Product = state.Order.Product.map(_ => {
        if (_.ProductId === payload.id) _ = {
          ..._,
          ...payload.data
        };
        return _;
      });
      return {
        ...state,
        Order: {
          ...state.Order,
          Product
        }
      };
    case ACTION_REDUX.DELETE_PRODUCT_TO_ORDER:
      // REMOTE UPDATE IF ORDER CREATED
      if (state.OrderCreated) DELETE_PRODUCT_ORDER(state.Order._id, state.Order.Product.filter(_ => _.ProductId === payload).map(_ => _.id));
      // LOCAL UPDATE
      return {
        ...state,
        Order: {
          ...state.Order,
          Product: state.Order.Product.filter(_ => _.ProductId !== payload)
        }
      };
    case ACTION_REDUX.ORDER_CREATED:
      return {
        ...state,
        Order: payload,
        OrderCreated: true
      };
    default:
      return state;
  }
});

// =========================================================[ API ]===================================================================

const GET_MENU = async uuid => fetch(`${BASE_URL}/api/auth/menu/detail-view/${uuid}?BusinessId=${Metadata.b || 2}`).then(async res => {
  const payload = await res.json();
  STORE.dispatch({
    type: ACTION_REDUX.MENU_AVAILABLE,
    payload
  });
  return payload;
}).catch(console.error);
const CREATE_ORDER = async payload => fetch(`${BASE_URL}/api/bill`, {
  method: "POST",
  body: JSON.stringify(payload),
  headers
}).then(async res => await res.json()).catch(console.error);
const ADD_PRODUCT_TO_ORDER = async (order_id, payloads) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, {
  method: "POST",
  body: JSON.stringify(payloads),
  headers
}).then(async res => res.json());
const UPDATE_PRODUCT_ORDER = async (order_id, product_id, payload) => fetch(`${BASE_URL}/api/bill/${order_id}/product/${product_id}`, {
  method: "PATCH",
  body: JSON.stringify(payload),
  headers
}).then(async res => res.json());
const DELETE_PRODUCT_ORDER = async (order_id, products) => fetch(`${BASE_URL}/api/bill/${order_id}/product`, {
  method: "DELETE",
  body: JSON.stringify(products),
  headers
}).then(async res => res.json());

// =========================================================[ FIREBASE NOTIFICATION ]===================================================================

const FIREBASE_KEY = "BN4m8YGrBzsg7anm8vEzPLQ7Gc7HagB4X2WMKSFGzzfApe39ADvXZ99rSkUnmSWSoWQ-NR60WI4pJ1DwuvLXKk8";
function FIREBASE_INIT({
  initializeApp,
  getMessaging,
  getToken,
  onMessage
}) {
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
  navigator.serviceWorker.register('firebase-messaging-sw.js').then(() => getToken(messaging, {
    vapidKey: FIREBASE_KEY
  }).then(token => {
    STORE.dispatch({
      type: ACTION_REDUX.FCM_DEVICE_TOKEN_CREATED,
      payload: token
    });
    new BroadcastChannel('sw-messages').onmessage = ({
      data: {
        data,
        notification
      }
    }) => DATA_ORDER_CHANGE({
      data,
      notification
    });
    onMessage(messaging, ({
      data,
      notification
    }) => DATA_ORDER_CHANGE({
      data,
      notification
    }));
  }));
}
;
function DATA_ORDER_CHANGE(payload) {
  console.log("DATA_ORDER_CHANGE FUNCTION RECEIVED DATA : ", payload);
  console.log("DATA_ORDER_CHANGE FUNCTION RECEIVED DATA : ", JSON.parse(payload.data.payload));
}
;
const DefaultRecipeImage = "https://i.guim.co.uk/img/media/e3ea5d04e32182134a133c6a8f1eb3328e2c8246/0_0_4367_3716/master/4367.jpg?width=465&quality=85&dpr=1&s=none";
function ListMenu({
  iconName,
  link,
  listname,
  active
}) {
  return /*#__PURE__*/React.createElement("li", null, /*#__PURE__*/React.createElement("a", {
    href: link,
    className: active && "active"
  }, /*#__PURE__*/React.createElement("i", {
    className: iconName
  }), listname));
}
function ListCategory({
  CategorieName,
  id,
  onSelect,
  active
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: `smallCategory ${active ? "active" : ""}`,
    onClick: e => {
      e.stopPropagation();
      onSelect(id);
    }
  }, /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-bacon"
  }), /*#__PURE__*/React.createElement("p", null, CategorieName));
}
function Recipe({
  id,
  Name,
  Price,
  Currency,
  CurrencyId,
  Description,
  Url
}) {
  const [{
    OrderCreated,
    Order
  }, setOrder] = React.useState(STORE.getState());
  STORE.subscribe(() => setOrder(_ => STORE.getState()));
  const onClick = function (e) {
    var _Order$Product;
    e.stopPropagation();
    const isOrdered = !!(Order !== null && Order !== void 0 && (_Order$Product = Order.Product) !== null && _Order$Product !== void 0 && _Order$Product.find(_ => _.ProductId === id));
    const payload = {
      ProductId: id,
      Price,
      Quantity: 1.0,
      CurrencyId
    };
    if (OrderCreated && !isOrdered) return ADD_PRODUCT_TO_ORDER(Order._id, [payload]).then(data => STORE.dispatch({
      type: ACTION_REDUX.ORDER_CREATED,
      payload: data
    }));
    STORE.dispatch({
      type: ACTION_REDUX.ADD_PRODUCT_TO_ORDER,
      payload
    });
  };
  console.log("Product : ", Name, " ", id, " OrderCreated : ", OrderCreated);
  return /*#__PURE__*/React.createElement("div", {
    className: "single_recipe_container",
    onClick: onClick
  }, /*#__PURE__*/React.createElement("img", {
    src: Url || DefaultRecipeImage,
    alt: "recipeID",
    width: 80,
    height: 80
  }), /*#__PURE__*/React.createElement("div", {
    className: "details"
  }, /*#__PURE__*/React.createElement("h3", null, Name, " product of the year my niggar."), /*#__PURE__*/React.createElement("p", null, Currency, " ", Price)));
}
function SideBar() {
  const [business, setBusiness] = React.useState({});
  STORE.subscribe(() => {
    var _STORE$getState$Menu;
    return setBusiness(((_STORE$getState$Menu = STORE.getState().Menu) === null || _STORE$getState$Menu === void 0 ? void 0 : _STORE$getState$Menu.Business) || {});
  });
  return /*#__PURE__*/React.createElement("div", {
    className: "sideBar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "logo"
  }, /*#__PURE__*/React.createElement("img", {
    src: business.Logo || "../assets/logoApp.png",
    alt: "MFood",
    width: 40,
    height: 40
  })), /*#__PURE__*/React.createElement("ul", {
    className: "Menu_categories"
  }, /*#__PURE__*/React.createElement(ListMenu, {
    iconName: "fa-solid fa-utensils",
    link: "#",
    active: true,
    listname: "Food"
  }), /*#__PURE__*/React.createElement(ListMenu, {
    iconName: "fa-solid fa-champagne-glasses",
    link: "#",
    listname: "Drink"
  })), /*#__PURE__*/React.createElement("i", {
    className: "fas fa-bars"
  }));
}
function OrderProduct({
  ProductId,
  Name,
  Price,
  Quantity,
  Currency,
  Url
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "single_order_container"
  }, /*#__PURE__*/React.createElement("img", {
    src: Url || DefaultRecipeImage,
    alt: "img_thumbnail",
    width: 40,
    height: 40
  }), /*#__PURE__*/React.createElement("div", {
    className: "description"
  }, /*#__PURE__*/React.createElement("h5", null, Name), /*#__PURE__*/React.createElement("p", null, Currency, " ", Price)), /*#__PURE__*/React.createElement("div", {
    className: "quantity_changer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "number",
    placeholder: "x1",
    min: 0.0,
    onChange: ({
      target
    }) => STORE.dispatch({
      type: ACTION_REDUX.UPDATE_PRODUCT_TO_ORDER,
      payload: {
        id: ProductId,
        data: {
          Quantity: Number(target.value)
        }
      }
    })
  }), /*#__PURE__*/React.createElement("p", null, Quantity * Price, " ", Currency), /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-trash-can",
    onClick: e => {
      e.stopPropagation();
      STORE.dispatch({
        type: ACTION_REDUX.DELETE_PRODUCT_TO_ORDER,
        payload: ProductId
      });
    }
  })));
}
function OrderMenu() {
  var _state$Product, _state$Product2;
  const [state, setState] = React.useState({});
  STORE.subscribe(() => {
    var _Menu$Categories, _Menu$Currency;
    const {
      Order,
      Menu,
      OrderCreated
    } = STORE.getState();
    const Products = (_Menu$Categories = Menu.Categories) === null || _Menu$Categories === void 0 ? void 0 : _Menu$Categories.reduce((_, __) => [..._, ...__.Product], []);
    const StateOrder = Order.Product.map(_ => {
      let {
        Name,
        Currency,
        Url
      } = Products.find(item => item.id === _.ProductId);
      return {
        ..._,
        Name,
        Currency,
        Url
      };
    });
    setState({
      OrderCreated,
      Product: StateOrder,
      Currency: (_Menu$Currency = Menu.Currency) === null || _Menu$Currency === void 0 ? void 0 : _Menu$Currency.Symbol
    });
  });
  const Total = (_state$Product = state.Product) === null || _state$Product === void 0 ? void 0 : _state$Product.reduce((_, __) => _ + __.Price * __.Quantity, 0);
  return /*#__PURE__*/React.createElement("div", {
    className: "order_container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "order_container_children"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "order_container_children_header_title"
  }, "Order ", /*#__PURE__*/React.createElement("span", null, "Menu")), /*#__PURE__*/React.createElement("div", {
    className: "wrapper"
  }, (_state$Product2 = state.Product) === null || _state$Product2 === void 0 ? void 0 : _state$Product2.map(_ => /*#__PURE__*/React.createElement(OrderProduct, _extends({
    key: _.ProductId
  }, _)))), /*#__PURE__*/React.createElement("div", {
    className: "Price_displayer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "price"
  }, /*#__PURE__*/React.createElement("p", null, "Sub Tot"), /*#__PURE__*/React.createElement("p", null, state.Currency, " ", Total)), /*#__PURE__*/React.createElement("div", {
    className: "price"
  }, /*#__PURE__*/React.createElement("p", null, "Tot Gen"), /*#__PURE__*/React.createElement("p", null, state.Currency, " ", Total)), /*#__PURE__*/React.createElement("button", {
    disabled: state.OrderCreated,
    onClick: e => {
      e.stopPropagation();
      const order = {
        ...STORE.getState().Order,
        Client: prompt("Hi client, can you give us your name ? It is mandatory !")
      };
      CREATE_ORDER(order).then(payload => STORE.dispatch({
        type: ACTION_REDUX.ORDER_CREATED,
        payload
      })).catch(console.error);
    }
  }, "Order"))));
}
function MenuDisplayer() {
  var _state$Menu, _state$Menu2, _ListCategoryFilter$f;
  const [state, setState] = React.useState({
    SelectedCategoryId: null,
    FilterKey: null
  });
  const SelectCategory = id => setState(_ => ({
    ..._,
    SelectedCategoryId: id
  }));
  STORE.subscribe(() => {
    let {
      Menu,
      Order
    } = STORE.getState();
    setState(_ => ({
      ..._,
      Menu,
      Order
    }));
  });
  var ListCategoryFilter = state.FilterKey ? (_state$Menu = state.Menu) === null || _state$Menu === void 0 ? void 0 : _state$Menu.Categories.filter(_ => _.Name.toLowerCase().includes(state.FilterKey.toLowerCase())) : (_state$Menu2 = state.Menu) === null || _state$Menu2 === void 0 ? void 0 : _state$Menu2.Categories;
  return /*#__PURE__*/React.createElement("div", {
    className: "Menu_container"
  }, /*#__PURE__*/React.createElement("div", {
    className: "menu_header"
  }, /*#__PURE__*/React.createElement("h1", null, "Menu ", /*#__PURE__*/React.createElement("span", null, "Category")), /*#__PURE__*/React.createElement("div", {
    className: "search_input"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    name: "Search",
    placeholder: "Search a recipe",
    onChange: ({
      target: {
        value
      }
    }) => setState(_ => ({
      ..._,
      FilterKey: value
    }))
  }), /*#__PURE__*/React.createElement("i", {
    className: "fa-solid fa-magnifying-glass"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "menu_category_container"
  }, ListCategoryFilter === null || ListCategoryFilter === void 0 ? void 0 : ListCategoryFilter.map(_ => /*#__PURE__*/React.createElement(ListCategory, {
    CategorieName: _.Name,
    key: _.id,
    id: _.id,
    onSelect: SelectCategory,
    active: _.id === state.SelectedCategoryId
  }))), /*#__PURE__*/React.createElement("div", {
    className: "order_title_container"
  }, /*#__PURE__*/React.createElement("h1", null, "Choose ", /*#__PURE__*/React.createElement("span", null, "Order")), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("p", null, "Sort by"), /*#__PURE__*/React.createElement("select", null, /*#__PURE__*/React.createElement("option", {
    value: "nothing",
    key: ""
  }, "Relevant")))), /*#__PURE__*/React.createElement("div", {
    className: "RecipeDisplayer"
  }, ListCategoryFilter === null || ListCategoryFilter === void 0 ? void 0 : (_ListCategoryFilter$f = ListCategoryFilter.find(_ => _.id === state.SelectedCategoryId)) === null || _ListCategoryFilter$f === void 0 ? void 0 : _ListCategoryFilter$f.Product.map(_ => /*#__PURE__*/React.createElement(Recipe, _extends({
    key: _.id
  }, _)))));
}
function App() {
  return /*#__PURE__*/React.createElement("div", {
    className: "Application"
  }, /*#__PURE__*/React.createElement(SideBar, null), /*#__PURE__*/React.createElement(MenuDisplayer, null), /*#__PURE__*/React.createElement(OrderMenu, null));
}
ReactDOM.createRoot(document.getElementById("root")).render( /*#__PURE__*/React.createElement(App, null));