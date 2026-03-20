import { NavBar } from "@/components/NavBar";
import { DiceRoller } from "@/components/DiceRoller";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div
      style={{
        display: "flex",
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
          padding: "40px",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {children}
      </main>
      <DiceRoller />
    </div>
  );
}
