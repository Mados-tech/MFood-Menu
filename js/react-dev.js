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

function ListCategory({ CategorieName, active }) {
  return (
    <div className={`smallCategory ${active ? "active" : ""}`}>
      <i className="fa-solid fa-bacon"></i>
      <p>{CategorieName}</p>
    </div>
  );
}

function RecipeDisplayer() {
  return (
    <div className="RecipeDisplayer">
      {Array.from({ length: 29 }, () => {
        return (
          <div className="single_recipe_container">
            <img
              src="https://i.guim.co.uk/img/media/e3ea5d04e32182134a133c6a8f1eb3328e2c8246/0_0_4367_3716/master/4367.jpg?width=465&quality=85&dpr=1&s=none"
              alt="recipeID"
              width={80}
              height={80}
            />

            <div className="details">
              <h3>Hamburger</h3>
              <p>$00.1</p>
            </div>
          </div>
        );
      })}
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

function OrderMenu() {
  return (
    <div className="order_container">
      <h1>
        Order <span>Menu</span>
      </h1>
    </div>
  );
}

function MenuDisplayer() {
  const Categories = [
    "pizza",
    "salad",
    "meat",
    "fish",
    "hamburger",
    "shawarma",
    "dessert",
    "pompkins",
    "rice",
    "verge",
    "mortel",
  ];

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
        {Categories.map((e, _) => {
          return (
            <ListCategory CategorieName={e} key={e} active={_ === 1 && true} />
          );
        })}
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

        <RecipeDisplayer></RecipeDisplayer>
      </div>
    </div>
  );
}

function App() {
  return (
    <div className="Application">
      <SideBar />
      <MenuDisplayer />
      <OrderMenu></OrderMenu>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
