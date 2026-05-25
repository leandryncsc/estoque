import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ThemeProvider } from "@/components/ui/theme-provider";
import "./index.css";

const API_URL = import.meta.env.VITE_API_URL || "";

const originalFetch = window.fetch.bind(window);
window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
	if (typeof input === "string" && input.startsWith("/api")) {
		// Se API_URL já contém /api no final, não adicione novamente
		let targetUrl = input;
		if (API_URL) {
			// Remove /api do início da URL se ele já estiver em API_URL
			const apiPath = input.startsWith("/api/") ? input.substring(4) : input;
			targetUrl = `${API_URL}${apiPath}`;
		}
		return originalFetch(targetUrl, init);
	}
	return originalFetch(input, init);
};

createRoot(document.getElementById("root")!).render(
	<ThemeProvider>
		<App />
	</ThemeProvider>
);
