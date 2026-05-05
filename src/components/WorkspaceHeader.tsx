import { Link, useNavigate, useLocation } from "react-router-dom";
import { CloudLightning, LogOut, User as UserIcon, LayoutDashboard, FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import OrgSwitcher from "@/components/OrgSwitcher";
import { cn } from "@/lib/utils";

const navLink = (to: string, active: boolean) =>
  cn(
    "px-3 py-1.5 rounded-md text-sm font-medium transition",
    active ? "bg-accent/15 text-accent" : "text-muted-foreground hover:text-foreground hover:bg-muted",
  );

const WorkspaceHeader = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const userDisplayName = (user?.user_metadata as any)?.full_name || (user?.user_metadata as any)?.name || user?.email?.split("@")[0];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <CloudLightning className="w-6 h-6 text-accent" />
            <span className="font-display font-bold text-foreground text-lg hidden sm:inline">Cuvoto</span>
          </Link>
          <div className="hidden sm:block"><OrgSwitcher /></div>
          <nav className="hidden md:flex items-center gap-1 ml-2">
            <Link to="/tenders" className={navLink("/tenders", pathname.startsWith("/tenders"))}>
              <span className="inline-flex items-center gap-1.5"><LayoutDashboard className="w-4 h-4" /> Workspace</span>
            </Link>
            <Link to="/" className={navLink("/", pathname === "/")}>
              <span className="inline-flex items-center gap-1.5"><FileText className="w-4 h-4" /> Analyzer</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-primary text-accent-foreground flex items-center justify-center text-xs font-semibold uppercase hover:opacity-90 transition"
                aria-label="Account menu"
              >
                {(user?.email?.[0] || "U").toUpperCase()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate">{userDisplayName || "User"}</span>
                  <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer"><Home className="w-4 h-4 mr-2" /> Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/profile" className="cursor-pointer"><UserIcon className="w-4 h-4 mr-2" /> Profile & Company</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/members" className="cursor-pointer"><UserIcon className="w-4 h-4 mr-2" /> Members & roles</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={async () => { await signOut(); navigate("/login", { replace: true }); }}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <LogOut className="w-4 h-4 mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default WorkspaceHeader;
