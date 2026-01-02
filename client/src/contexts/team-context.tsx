/**
 * Team Context Provider
 * 
 * Provides global team state management including:
 * - List of user's teams
 * - Active team selection (persisted to localStorage)
 * - Team switching functionality
 * 
 * All team-scoped operations (prompts, comments, votes) use the active team.
 */

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import type { Team } from "@shared/schema";

interface TeamContextType {
  teams: Team[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team) => void;
  isLoading: boolean;
  hasTeams: boolean;
}

const TeamContext = createContext<TeamContextType | undefined>(undefined);

// localStorage key for persisting active team selection
const ACTIVE_TEAM_KEY = "prompt-party-active-team-id";

export function TeamProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  // Initialize from localStorage
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_TEAM_KEY);
  });

  // Fetch user's teams
  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams/my"],
    enabled: isAuthenticated,
  });

  // Resolve active team from ID, fallback to first team
  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0] || null;

  // Auto-select first team if none selected
  useEffect(() => {
    if (teams.length > 0 && !activeTeamId) {
      setActiveTeamId(teams[0].id);
      localStorage.setItem(ACTIVE_TEAM_KEY, teams[0].id);
    }
  }, [teams, activeTeamId]);

  // Reset to first team if stored team no longer exists
  useEffect(() => {
    if (activeTeamId && teams.length > 0 && !teams.find((t) => t.id === activeTeamId)) {
      setActiveTeamId(teams[0].id);
      localStorage.setItem(ACTIVE_TEAM_KEY, teams[0].id);
    }
  }, [teams, activeTeamId]);

  // Switch active team and persist to localStorage
  const setActiveTeam = (team: Team) => {
    setActiveTeamId(team.id);
    localStorage.setItem(ACTIVE_TEAM_KEY, team.id);
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        activeTeam,
        setActiveTeam,
        isLoading,
        hasTeams: teams.length > 0,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

/**
 * Hook to access team context.
 * Must be used within a TeamProvider.
 */
export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
