import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import * as serviceWorker from "./serviceWorker";
import "./i18n";
import { Provider } from "react-redux";
import store from "./store";
import "ag-grid-community/styles/ag-grid.css"; // Core grid CSS
import "ag-grid-community/styles/ag-theme-alpine.css"; // Example theme CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./assets/scss/theme.scss";
import QueryProvider from "./QueryProvider";
import { ToastContainer } from "react-toastify";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.Fragment>
    <Provider store={store}>
      <QueryProvider>
        <App />
      </QueryProvider>
    </Provider>
    <ToastContainer />
  </React.Fragment>
);

serviceWorker.unregister();
