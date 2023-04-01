const INIT_STATE = {
  Menu: {},
  OrderCreated: false,
  Order: {
    Client: "Unknown Client",
    MenuId: null,
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
  UPDATE_PRODUCT_TO_ORDER_REQUEST: null,
};

const STORE = Redux.createStore((state = INIT_STATE, { type, payload }) => {
  switch (type) {
    case ACTION_REDUX.INIT_DATA:
      return payload;

    case ACTION_REDUX.MENU_AVAILABLE:
      const urlSearchParams = new URLSearchParams(window.location.search);
      const Metadata = Object.fromEntries(urlSearchParams.entries());
      delete Metadata.m;
      return {
        ...state,
        Menu: payload,
        Order: { ...state.Order, MenuId: payload.id, Metadata },
      };

    case ACTION_REDUX.ADD_PRODUCT_TO_ORDER:
      const { id, Price, CurrencyId } = payload;
      // NEW ADD A ITEM TWISE TO THE LIST
      if (state.Order.Product.find((_) => _.ProductId === id)) return state;
      return {
        ...state,
        Order: {
          ...state.Order,
          Product: [
            { ProductId: id, Quantity: 1.0, Price, CurrencyId },
            ...state.Order.Product,
          ],
        },
      };

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
        }, 4000);
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
      if (state.OrderCreated) {
        DELETE_PRODUCT_ORDER(
          state.Order._id,
          state.Order.Product.filter((_) => _.ProductId === payload).map(
            (_) => _.id
          )
        );
      }
      // LOCAL UPDATE
      return {
        ...state,
        Order: {
          ...state.Order,
          Product: state.Order.Product.filter((_) => _.ProductId !== payload),
        },
      };

    case ACTION_REDUX.ORDER_CREATED:
      return { ...state, Order: payload, OrderCreated: true };

    default:
      return state;
  }
});

// ============================================================================================================================

const BASE_URL = "http://44.204.44.197:8000";
const headers = {
  "Content-Type": "application/json",
  "x-data-source": "dummy_db",
};

const GET_MENU = async (uuid) =>
  fetch(`${BASE_URL}/api/auth/menu/detail-view/${uuid}`)
    .then(async (res) => {
      const data = await res.json();
      const Categories_ = {};
      var Categories = [];

      // FILTER DATA
      data.MenuProducts.forEach(
        ({
          Price,
          Product: { CategoryProduct, id, Name, Url, Description },
        }) => {
          Categories.push(CategoryProduct);
          let Product = {
            id,
            Name,
            Price,
            Url,
            Description,
            Currency: data.Currency.Symbol,
            CurrencyId: data.Currency.id,
          };
          if (CategoryProduct.id in Categories_)
            return Categories_[CategoryProduct.id].push(Product);
          Categories_[CategoryProduct.id] = [Product];
        }
      );

      // ORDER DATA
      Categories = Categories.map((_) => {
        _.Product = Categories_[_.id];
        return _;
      });
      delete data.MenuProducts;
      data.Categories = Categories;
      STORE.dispatch({ type: ACTION_REDUX.MENU_AVAILABLE, payload: data });
      return data;
    })
    .catch(console.error);

// GET_MENU("9d803bb8-21eb-4e30-a086-7b456fe6e4c2").then(console.log);
GET_MENU("899f1572-bd76-4044-b773-9d0448963a77").then(console.log);

const CREATE_ORDER = async (payload) =>
  fetch(`${BASE_URL}/api/bill`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers,
  })
    .then(async (res) => {
      return await res.json();
    })
    .catch(console.error);

const UPDATE_PRODUCT_ORDER = async (order_id, product_id, payload) =>
  fetch(`${BASE_URL}/api/bill/${order_id}/product/${product_id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
    headers,
  }).then(async (res) => res.json());

const DELETE_PRODUCT_ORDER = async (order_id, products) =>
  fetch(`${BASE_URL}/api/bill/${order_id}/product`, {
    method: "DELETE",
    body: JSON.stringify(products),
    headers,
  }).then(async (res) => res.json());
