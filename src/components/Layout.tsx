import { NavBar } from "@/components/NavBar";
import { useIsMobile } from "@/hooks/useIsMobile";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();

  return (
    <div
      style={{
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #0d0d1a 0%, #1a1a2e 50%, #16213e 100%)",
        fontFamily: "'Georgia', 'Times New Roman', serif",
      }}
    >
      <NavBar />
      <main
        style={{
          flex: 1,
          padding: isMobile ? "16px" : "40px",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
    </div>
  );
}
