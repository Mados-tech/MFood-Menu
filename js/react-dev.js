const DefaultRecipeImage =
  "https://i.guim.co.uk/img/media/e3ea5d04e32182134a133c6a8f1eb3328e2c8246/0_0_4367_3716/master/4367.jpg?width=465&quality=85&dpr=1&s=none";

function ListMenu({ iconName, link, listname, active }) {
  return (
    <li>
      <a href={link} className={active && "active"}>
        <i className={iconName}></i>
        {listname}
      </a>
    </li>
  );
}

function ListCategory({ CategorieName, id, onSelect, active }) {
  return (
    <div
      className={`smallCategory ${active ? "active" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(id);
      }}
    >
      <i className="fa-solid fa-bacon"></i>
      <p>{CategorieName}</p>
    </div>
  );
}

function Recipe({ id, Name, Price, Currency, CurrencyId, Description, Url }) {
  return (
    <div
      className="single_recipe_container"
      onClick={(e) => {
        e.stopPropagation();
        STORE.dispatch({
          type: ACTION_REDUX.ADD_PRODUCT_TO_ORDER,
          payload: {
            id,
            Price,
            CurrencyId,
          },
        });
      }}
    >
      <img
        src={Url || DefaultRecipeImage}
        alt="recipeID"
        width={80}
        height={80}
      />

      <div className="details">
        <h3>{Name}</h3>
        <p>
          {Currency}
          {Price}
        </p>
      </div>
    </div>
  );
}

function SideBar() {
  return (
    <div className="sideBar">
      <div className="logo">
        <img src="../assets/logoApp.png" alt="MFood" width={40} height={40} />
      </div>
      <ul className="Menu_categories">
        <ListMenu
          iconName={"fa-solid fa-utensils"}
          link={"#"}
          active={true}
          listname={"Food"}
        />

        <ListMenu
          iconName={"fa-solid fa-champagne-glasses"}
          link={"#"}
          listname={"Drink"}
        />
      </ul>
    </div>
  );
}

function OrderProduct({ ProductId, Name, Price, Quantity, Currency, Url }) {
  return (
    <div className="single_order_container">
      <img
        src={Url || DefaultRecipeImage}
        alt="img_thumbnail"
        width={40}
        height={40}
      />
      <div className="description">
        <h5>{Name}</h5>
        <p>
          {Currency} {Price}
        </p>
      </div>
      <div className="quantity_changer">
        <input
          type="number"
          placeholder={"x1"}
          min={0.0}
          onChange={({ target }) => {
            STORE.dispatch({
              type: ACTION_REDUX.UPDATE_PRODUCT_TO_ORDER,
              payload: {
                id: ProductId,
                data: { Quantity: Number(target.value) },
              },
            });
          }}
        />
        <p>
          {Quantity * Price} {Currency}
        </p>
        <i
          className="fa-solid fa-trash-can"
          onClick={(e) => {
            e.stopPropagation();
            STORE.dispatch({
              type: ACTION_REDUX.DELETE_PRODUCT_TO_ORDER,
              payload: ProductId,
            });
          }}
        ></i>
      </div>
    </div>
  );
}

function OrderMenu() {
  const [state, setState] = React.useState({});

  STORE.subscribe(() => {
    const { Order, Menu, OrderCreated } = STORE.getState();
    const Products = Menu.Categories?.reduce(
      (_, __) => [..._, ...__.Product],
      []
    );
    const StateOrder = Order.Product.map((_) => {
      let { Name, Currency, Url } = Products.find(
        (item) => item.id === _.ProductId
      );
      return { ..._, Name, Currency, Url };
    });
    setState({
      OrderCreated,
      Product: StateOrder,
      Currency: Menu.Currency.Symbol,
    });
  });

  const Total = state.Product?.reduce((_, __) => _ + __.Price * __.Quantity, 0);
  return (
    <div className="order_container">
      <h1>
        Order <span>Menu</span>
      </h1>

      <div className="Orders_container">
        <div className="wrapper">
          {state.Product?.map((_) => (
            <OrderProduct key={_.ProductId} {..._} />
          ))}
        </div>
        <div className="Price_displayer">
          <div className="price">
            <p>Sub Tot</p>
            <p>
              {state.Currency} {Total}
            </p>
          </div>
          <div className="price">
            <p>Tot Gen</p>
            <p>
              {state.Currency} {Total}
            </p>
          </div>

          <button
            disabled={state.OrderCreated}
            onClick={(e) => {
              e.stopPropagation();
              CREATE_ORDER(STORE.getState().Order)
                .then((payload) => {
                  STORE.dispatch({ type: ACTION_REDUX.ORDER_CREATED, payload });
                  console.log(payload);
                })
                .catch(console.error);
            }}
          >
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuDisplayer() {
  const [state, setState] = React.useState({ SelectedCategoryId: null });
  const SelectCategory = (id) =>
    setState((_) => ({ ..._, SelectedCategoryId: id }));
  STORE.subscribe(() => {
    let { Menu, Order } = STORE.getState();
    setState((_) => ({ ..._, Menu, Order }));
  });

  console.log(state);

  return (
    <div className="Menu_container">
      <div className="menu_header">
        <h1>
          Menu <span>Category</span>
        </h1>
        <div className="search_input">
          <input type="text" name={"Search"} placeholder={"Search a recipe"} />
          <i className="fa-solid fa-magnifying-glass"></i>
        </div>
      </div>
      <div className="menu_category_container">
        {state.Menu?.Categories?.map((_) => (
          <ListCategory
            CategorieName={_.Name}
            key={_.id}
            id={_.id}
            onSelect={SelectCategory}
            active={_.id === state.SelectedCategoryId}
          />
        ))}
      </div>

      <div className="menu_order_container">
        <div className="order_title_container">
          <h1>
            Choose <span>Order</span>
          </h1>
          <span>
            <p>Sort by</p>
            <select>
              <option value="nothing" key="">
                Relevant
              </option>
            </select>
          </span>
        </div>
        <div className="RecipeDisplayer">
          {state.Menu?.Categories.find(
            (_) => _.id === state.SelectedCategoryId
          )?.Product.map((_) => (
            <Recipe key={_.id} {..._} />
          ))}
          {/* {Array.from({ length: 8 }, () => (
            <Recipe />
          ))} */}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="Application">
      <SideBar />
      <MenuDisplayer />
      <OrderMenu />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
