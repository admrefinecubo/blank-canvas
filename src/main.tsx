import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Set theme from localStorage or default to light
const savedTheme = localStorage.getItem("cubo-theme") || "light";
document.documentElement.classList.toggle("dark", savedTheme === "dark");

createRoot(document.getElementById("root")!).render(<App />);
