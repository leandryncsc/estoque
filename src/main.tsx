import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL;

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
	if (typeof input === "string" && input.startsWith("/api")) {
		const targetUrl = API_URL ? `${API_URL}${input}` : input;
		return originalFetch(targetUrl, init);
	}
	return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
);
