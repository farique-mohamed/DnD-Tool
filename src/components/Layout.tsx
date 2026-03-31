import { NavBar } from "@/components/NavBar";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTheme } from "@/hooks/useTheme";
import { darkPalette, lightPalette } from "@/components/ui/theme";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        background: palette.bgGradient,
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      <NavBar />
      <main
        style={{
          flex: 1,
          padding: isMobile ? "68px 16px 16px" : "40px",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
