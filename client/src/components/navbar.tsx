/**
 * Navigation Bar Component
 * 
 * Main navigation header with branding, navigation links, team switcher,
 * user menu, and responsive mobile menu. Adapts based on auth state.
 */

import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Globe, Menu, X, LogIn, LogOut, Users, Building2, Check, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/contexts/team-context";

// Navigation items available to everyone (public)
const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Contact", href: "/contact" },
];

// Navigation items only for authenticated users
const authenticatedNavItems = [
  { label: "Browse Prompts", href: "/browse" },
  { label: "Submit Prompt", href: "/submit" },
  { label: "My Prompts", href: "/my-prompts" },
  { label: "Manage Teams", href: "/team" },
];

/**
 * Team switcher dropdown for users with multiple teams.
 * Shows "Join Team" button if user has no teams.
 */
function TeamSwitcher() {
  const { teams, activeTeam, setActiveTeam, hasTeams } = useTeam();

  if (!hasTeams) {
    return (
      <Link href="/team">
        <Button variant="outline" size="sm" data-testid="button-setup-team-nav">
          <Users className="w-4 h-4 mr-2" />
          Join Team
        </Button>
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2" data-testid="button-team-switcher">
          <Building2 className="w-4 h-4" />
          <span className="max-w-24 truncate">{activeTeam?.name || "Select Team"}</span>
          <ChevronDown className="w-3 h-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Switch Team</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {teams.map((team) => (
          <DropdownMenuItem
            key={team.id}
            onClick={() => setActiveTeam(team)}
            className="gap-2"
            data-testid={`menu-item-team-${team.id}`}
          >
            <Check className={`w-4 h-4 ${activeTeam?.id === team.id ? "opacity-100" : "opacity-0"}`} />
            <span className="truncate">{team.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Navbar() {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    setTimeout(() => {
      logout();
    }, 1500);
  };

  // Generate user initials for avatar fallback
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Combine navigation items based on authentication state
  const navItems = isAuthenticated 
    ? [...publicNavItems, ...authenticatedNavItems]
    : publicNavItems;

  return (
    <>
      {isSigningOut && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm" data-testid="overlay-signing-out">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-lg font-medium" data-testid="text-signing-out">Signing out...</p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 border-b border-border/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-14 items-center justify-between gap-4">
          {/* Left Section: Logo + Team Switcher */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <div className="flex items-center gap-2 font-semibold" data-testid="link-home-logo">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-md shadow-primary/25">
                  <Globe className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="hidden sm:inline tracking-tight">PromptSpace</span>
              </div>
            </Link>

            {isAuthenticated && (
              <div className="hidden md:block">
                <TeamSwitcher />
              </div>
            )}
          </div>

          {/* Center Section: Navigation Links (Desktop - Authenticated Only) */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    size="sm"
                    data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          )}

          {/* Right Section: Public Nav (if unauthenticated) + Theme Toggle + User Menu + Mobile Menu Toggle */}
          <div className="flex items-center gap-2">
            {/* Public navigation for unauthenticated users - aligned right */}
            {!isAuthenticated && (
              <nav className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={location === item.href ? "secondary" : "ghost"}
                      size="sm"
                      data-testid={`link-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </nav>
            )}
            
            <ThemeToggle />
            
            {isLoading ? null : isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.profileImageUrl || undefined} />
                      <AvatarFallback>{getInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">
                      {user?.firstName && user?.lastName 
                        ? `${user.firstName} ${user.lastName}` 
                        : user?.email}
                    </div>
                    {user?.email && user?.firstName && (
                      <div className="text-muted-foreground text-xs">{user.email}</div>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/team">
                      <Users className="w-4 h-4 mr-2" />
                      Manage Teams
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} data-testid="button-logout">
                    <LogOut className="w-4 h-4 mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" asChild data-testid="button-login">
                <a href="/api/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log in
                </a>
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-1">
              {isAuthenticated && (
                <div className="px-2 py-2">
                  <TeamSwitcher />
                </div>
              )}
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={location === item.href ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setMobileMenuOpen(false)}
                    data-testid={`link-mobile-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
      </header>
    </>
  );
}
