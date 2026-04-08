import { Switch } from "./switch";
import { useTheme } from "./theme-provider";
import { Sun, Moon } from "lucide-react";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-2">
      <Sun className="w-4 h-4 text-yellow-500" />
      <Switch
        checked={theme === "dark"}
        onCheckedChange={checked => setTheme(checked ? "dark" : "light")}
        aria-label="Alternar tema"
      />
      <Moon className="w-4 h-4 text-blue-700" />
    </div>
  );
}
