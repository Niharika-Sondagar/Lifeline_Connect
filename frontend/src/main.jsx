import { StrictMode } from "react"; // react feature that helps identify potential problems in an application, it activates additional checks and warnings for its descendants
import { createRoot } from "react-dom/client"; //"Take control of this HTML element and render my React application inside it
import "./index.css"; // global css
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext"; // to provide authentication context to the entire application, allowing components to access authentication state and methods without prop drilling

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
