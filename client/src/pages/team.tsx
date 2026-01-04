/**
 * Team Management Page
 * 
 * Allows users to view their teams, create new teams, join existing teams,
 * switch between teams, and share join codes with teammates.
 */

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/contexts/team-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { Users, Plus, Key, Copy, Check, Crown, Building2, LogOut, UserMinus, Loader2, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared/schema";

interface TeamMemberWithUser {
  id: string;
  teamId: string;
  userId: string;
  joinedAt: string;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  } | null;
}

// Form validation schemas
const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
});

const joinTeamSchema = z.object({
  joinCode: z.string().length(8, "Join code must be 8 characters"),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;
type JoinTeamValues = z.infer<typeof joinTeamSchema>;

/**
 * Team members section - visible to all team members, but only leaders can remove members.
 */
function TeamMembersSection({ 
  team,
  userId 
}: { 
  team: Team;
  userId: string;
}) {
  const { toast } = useToast();
  const isLeader = team.leaderId === userId;
  
  const membersQuery = useQuery<TeamMemberWithUser[]>({
    queryKey: ["/api/teams", team.id, "members"],
    queryFn: async () => {
      const response = await fetch(`/api/teams/${team.id}/members`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch members");
      return response.json();
    },
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${team.id}/members/${targetUserId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams", team.id, "members"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Member removed",
        description: "The member and all their data have been removed from this team.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to remove member",
        variant: "destructive",
      });
    },
  });
  
  const getDisplayName = (member: TeamMemberWithUser) => {
    if (member.user?.firstName && member.user?.lastName) {
      return `${member.user.firstName} ${member.user.lastName}`;
    }
    return member.user?.email || "Unknown User";
  };
  
  const getInitials = (member: TeamMemberWithUser) => {
    if (member.user?.firstName && member.user?.lastName) {
      return `${member.user.firstName[0]}${member.user.lastName[0]}`.toUpperCase();
    }
    if (member.user?.email) {
      return member.user.email[0].toUpperCase();
    }
    return "?";
  };
  
  const [isOpen, setIsOpen] = useState(false);
  const memberCount = membersQuery.data?.length || 0;
  
  return (
    <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full justify-between"
            data-testid={`button-toggle-members-${team.id}`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                Team Members ({memberCount})
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          {membersQuery.isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : membersQuery.data && membersQuery.data.length > 0 ? (
            <div className="max-h-72 mt-2 overflow-y-auto pr-1">
              <div className="space-y-2">
                {membersQuery.data.map((member) => {
                  const isSelf = member.userId === userId;
                  const isTeamLeader = member.userId === team.leaderId;
                  
                  return (
                    <div 
                      key={member.id} 
                      className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-muted/50"
                      data-testid={`member-row-${member.userId}`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.user?.profileImageUrl || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(member)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">
                              {getDisplayName(member)}
                            </span>
                            {isTeamLeader && (
                              <Badge variant="secondary" className="text-xs">
                                <Crown className="w-3 h-3 mr-1" />
                                Leader
                              </Badge>
                            )}
                            {isSelf && (
                              <Badge variant="outline" className="text-xs">You</Badge>
                            )}
                          </div>
                          {member.user?.email && (
                            <span className="text-xs text-muted-foreground">
                              {member.user.email}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {isLeader && !isTeamLeader && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive shrink-0"
                              disabled={removeMemberMutation.isPending}
                              data-testid={`button-remove-member-${member.userId}`}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove {getDisplayName(member)}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete all of their prompts, comments, and votes from this team. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => removeMemberMutation.mutate(member.userId)}
                                className="bg-destructive text-destructive-foreground"
                                data-testid={`button-confirm-remove-${member.userId}`}
                              >
                                Remove Member
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No members found
            </p>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/**
 * Individual team card showing team info and join code (for leaders).
 */
function TeamCard({ 
  team, 
  userId, 
  onCopyCode,
  onLeaveTeam,
  onDeleteTeam,
  isLeavePending,
  isDeletePending
}: { 
  team: Team; 
  userId: string; 
  onCopyCode: (code: string) => void;
  onLeaveTeam: (teamId: string) => void;
  onDeleteTeam: (teamId: string) => void;
  isLeavePending: boolean;
  isDeletePending: boolean;
}) {
  const isLeader = team.leaderId === userId;
  const [copied, setCopied] = useState(false);
  const { activeTeam, setActiveTeam } = useTeam();
  const isActive = activeTeam?.id === team.id;

  const handleCopy = async () => {
    await onCopyCode(team.joinCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      className={`hover-elevate cursor-pointer transition-colors ${isActive ? 'ring-2 ring-primary' : ''}`}
      onClick={() => setActiveTeam(team)}
      data-testid={`card-team-${team.id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            {team.name}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isActive && (
              <Badge variant="default" className="shrink-0">
                Active
              </Badge>
            )}
            {isLeader && (
              <Badge variant="secondary" className="shrink-0">
                <Crown className="w-3 h-3 mr-1" />
                Leader
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between gap-4" onClick={(e) => e.stopPropagation()}>
          {isLeader ? (
            <div className="flex items-center gap-2 flex-1">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-sm tracking-widest">
                {team.joinCode}
              </code>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                data-testid={`button-copy-code-${team.id}`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground flex-1">
              Click to make this your active team
            </p>
          )}
          
          {isLeader ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={isDeletePending}
                  data-testid={`button-delete-team-${team.id}`}
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {team.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete the team and all its data including prompts, comments, and votes. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteTeam(team.id)}
                    className="bg-destructive text-destructive-foreground"
                    data-testid={`button-confirm-delete-team-${team.id}`}
                  >
                    Delete Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={isLeavePending}
                  data-testid={`button-leave-team-${team.id}`}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Leave
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Leave {team.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    You will no longer have access to this team's prompts. You can rejoin later with a new invite code.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onLeaveTeam(team.id)}
                    className="bg-destructive text-destructive-foreground"
                    data-testid={`button-confirm-leave-${team.id}`}
                  >
                    Leave Team
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
        
        <TeamMembersSection team={team} userId={userId} />
      </CardContent>
    </Card>
  );
}

export default function TeamPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { teams, isLoading: teamsLoading } = useTeam();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      // Check if user just logged out intentionally - redirect silently to home
      const intentionalLogout = sessionStorage.getItem("intentional_logout");
      if (intentionalLogout) {
        sessionStorage.removeItem("intentional_logout");
        window.location.href = "/";
        return;
      }
      toast({
        title: "Please log in",
        description: "You need to be logged in to manage teams.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  // Form instances
  const createForm = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "" },
  });

  const joinForm = useForm<JoinTeamValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: { joinCode: "" },
  });

  // Create team mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateTeamValues) => {
      const response = await apiRequest("POST", "/api/teams", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      toast({
        title: "Team created!",
        description: "Share the join code with your teammates.",
      });
      createForm.reset();
      setCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create team",
        variant: "destructive",
      });
    },
  });

  // Join team mutation
  const joinMutation = useMutation({
    mutationFn: async (data: JoinTeamValues) => {
      const response = await apiRequest("POST", "/api/teams/join", data);
      return response.json();
    },
    onSuccess: (team) => {
      queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      toast({
        title: "Joined team!",
        description: `You're now a member of ${team.name}.`,
      });
      joinForm.reset();
      setJoinDialogOpen(false);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to join team",
        variant: "destructive",
      });
    },
  });

  // Leave team mutation
  const leaveMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}/leave`);
      return response.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      toast({
        title: "Left team",
        description: "You've successfully left the team.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to leave team",
        variant: "destructive",
      });
    },
  });

  // Delete team mutation (leader only)
  const deleteMutation = useMutation({
    mutationFn: async (teamId: string) => {
      const response = await apiRequest("DELETE", `/api/teams/${teamId}`);
      return response.json();
    },
    onSuccess: async () => {
      // Invalidate teams - the context will auto-switch to another team if the active one was deleted
      await queryClient.invalidateQueries({ queryKey: ["/api/teams/my"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Team deleted",
        description: "The team and all its data have been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        setTimeout(() => { window.location.href = "/api/login"; }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete team",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Join code copied to clipboard.",
    });
  };

  // Loading state
  if (authLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborate with others
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {/* Join Team Dialog */}
            <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" data-testid="button-open-join-dialog">
                  <Key className="w-4 h-4 mr-2" />
                  Join Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join an Existing Team</DialogTitle>
                  <DialogDescription>
                    Enter the 8-character join code shared by your team leader
                  </DialogDescription>
                </DialogHeader>
                <Form {...joinForm}>
                  <form onSubmit={joinForm.handleSubmit((data) => joinMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={joinForm.control}
                      name="joinCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Join Code</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ABCD1234"
                              className="font-mono text-center text-lg tracking-widest uppercase"
                              maxLength={8}
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                              data-testid="input-join-code"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={joinMutation.isPending}
                      data-testid="button-join-team"
                    >
                      {joinMutation.isPending ? "Joining..." : "Join Team"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Create Team Dialog */}
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-open-create-dialog">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Team</DialogTitle>
                  <DialogDescription>
                    Start a new team and invite others with a unique join code
                  </DialogDescription>
                </DialogHeader>
                <Form {...createForm}>
                  <form onSubmit={createForm.handleSubmit((data) => createMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Marketing Team"
                              {...field}
                              data-testid="input-team-name"
                            />
                          </FormControl>
                          <FormDescription>
                            Choose a name that represents your team or organization
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createMutation.isPending}
                      data-testid="button-create-team"
                    >
                      {createMutation.isPending ? "Creating..." : "Create Team"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Team List or Empty State */}
        {teams.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">No Teams Yet</h2>
              <p className="text-muted-foreground mb-6">
                Create a new team or join an existing one to start sharing prompts
              </p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Button variant="outline" onClick={() => setJoinDialogOpen(true)}>
                  <Key className="w-4 h-4 mr-2" />
                  Join with Code
                </Button>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Team
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <TeamCard 
                key={team.id}
                team={team} 
                userId={user.id}
                onCopyCode={copyToClipboard}
                onLeaveTeam={(teamId) => leaveMutation.mutate(teamId)}
                onDeleteTeam={(teamId) => deleteMutation.mutate(teamId)}
                isLeavePending={leaveMutation.isPending}
                isDeletePending={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
