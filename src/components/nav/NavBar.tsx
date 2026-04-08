import { useRouter } from "next/router";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/useIsMobile";
import { DesktopNav } from "./DesktopNav";
import { MobileNav } from "./MobileNav";

export function NavBar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleLogout = () => {
    logout();
    void router.replace("/");
  };

  if (!user) return null;

  if (isMobile) {
    return <MobileNav role={user.role} onLogout={handleLogout} />;
  }

  return <DesktopNav role={user.role} onLogout={handleLogout} />;
}
