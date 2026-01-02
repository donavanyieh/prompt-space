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

const ACTIVE_TEAM_KEY = "prompt-party-active-team-id";

export function TeamProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [activeTeamId, setActiveTeamId] = useState<string | null>(() => {
    return localStorage.getItem(ACTIVE_TEAM_KEY);
  });

  const { data: teams = [], isLoading } = useQuery<Team[]>({
    queryKey: ["/api/teams/my"],
    enabled: isAuthenticated,
  });

  const activeTeam = teams.find((t) => t.id === activeTeamId) || teams[0] || null;

  useEffect(() => {
    if (teams.length > 0 && !activeTeamId) {
      setActiveTeamId(teams[0].id);
      localStorage.setItem(ACTIVE_TEAM_KEY, teams[0].id);
    }
  }, [teams, activeTeamId]);

  useEffect(() => {
    if (activeTeamId && teams.length > 0 && !teams.find((t) => t.id === activeTeamId)) {
      setActiveTeamId(teams[0].id);
      localStorage.setItem(ACTIVE_TEAM_KEY, teams[0].id);
    }
  }, [teams, activeTeamId]);

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

export function useTeam() {
  const context = useContext(TeamContext);
  if (context === undefined) {
    throw new Error("useTeam must be used within a TeamProvider");
  }
  return context;
}
