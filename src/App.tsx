import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "@/app/store";
import AppRoutes from "./router/AppRoutes";

const App = () => {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes/>
      </BrowserRouter>
    </Provider>
  );
};

export default App;
