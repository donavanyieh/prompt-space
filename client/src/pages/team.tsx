import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Users, Plus, Key, Copy, Check, Crown, Building2 } from "lucide-react";
import type { Team } from "@shared/schema";

const createTeamSchema = z.object({
  name: z.string().min(2, "Team name must be at least 2 characters"),
});

const joinTeamSchema = z.object({
  joinCode: z.string().length(8, "Join code must be 8 characters"),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;
type JoinTeamValues = z.infer<typeof joinTeamSchema>;

function TeamCard({ team, userId, onCopyCode }: { team: Team; userId: string; onCopyCode: (code: string) => void }) {
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
        {isLeader ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 flex-1">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <code className="px-3 py-1.5 bg-muted rounded-md font-mono text-sm tracking-widest">
                {team.joinCode}
              </code>
            </div>
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
          <p className="text-sm text-muted-foreground">
            Click to make this your active team
          </p>
        )}
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

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
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

  const createForm = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: "" },
  });

  const joinForm = useForm<JoinTeamValues>({
    resolver: zodResolver(joinTeamSchema),
    defaultValues: { joinCode: "" },
  });

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

  const copyToClipboard = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: "Join code copied to clipboard.",
    });
  };

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
        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Teams</h1>
            <p className="text-muted-foreground">
              Manage your teams and collaborate with others
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
