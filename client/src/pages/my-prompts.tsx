/**
 * My Prompts Page
 * 
 * Displays all prompts submitted by the current user with the ability to delete them.
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar, Trash2, FileText, ThumbsUp, ThumbsDown, MessageSquare, Heart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { type Prompt } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";

interface VoteData {
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

function PromptCard({ 
  prompt, 
  onDelete,
  isDeleting
}: { 
  prompt: Prompt; 
  onDelete: (id: string, deleteType: "latest" | "all") => void;
  isDeleting: boolean;
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const commentCountQuery = useQuery<number>({
    queryKey: ["/api/prompts", prompt.id, "comments", "count"],
  });

  const votesQuery = useQuery<VoteData>({
    queryKey: ["/api/prompts", prompt.id, "votes"],
  });

  const voteScore = (votesQuery.data?.upvotes ?? 0) - (votesQuery.data?.downvotes ?? 0);

  return (
    <>
      <Card className="h-full flex flex-col" data-testid={`card-my-prompt-${prompt.id}`}>
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <Link href={`/prompt/${prompt.id}`} className="flex-1 min-w-0">
            <h3 className="font-semibold text-base line-clamp-2 hover:underline cursor-pointer">
              {prompt.title}
            </h3>
          </Link>
          <div className="flex gap-1 shrink-0">
            {prompt.currentVersion > 1 && (
              <Badge variant="outline" className="text-xs">
                v{prompt.currentVersion}
              </Badge>
            )}
            <Badge variant="secondary">
              {prompt.domain}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {prompt.task}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <pre className="font-mono text-sm text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
            {prompt.prompt}
          </pre>
        </CardContent>
        <CardFooter className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              <span className="font-medium" data-testid={`text-vote-score-${prompt.id}`}>{voteScore}</span>
              <ThumbsDown className="w-3 h-3" />
            </div>
            <span className="flex items-center gap-1" data-testid={`text-comment-count-${prompt.id}`}>
              <MessageSquare className="w-3 h-3" />
              {commentCountQuery.data ?? 0}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            data-testid={`button-delete-prompt-${prompt.id}`}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Delete
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
            <AlertDialogDescription>
              {prompt.currentVersion > 1 ? (
                <>
                  This prompt has {prompt.currentVersion} versions. Would you like to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><strong>Delete latest version only:</strong> Rollback to version {prompt.currentVersion - 1} (keeps comments and votes)</li>
                    <li><strong>Delete all versions:</strong> Permanently remove the entire prompt, all versions, comments, and votes</li>
                  </ul>
                </>
              ) : (
                <>
                  Are you sure you want to delete "{prompt.title}"? This will also remove all comments and votes. This action cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            {prompt.currentVersion > 1 ? (
              <>
                <AlertDialogAction
                  onClick={() => onDelete(prompt.id, "latest")}
                  disabled={isDeleting}
                  className="bg-orange-600 text-white hover:bg-orange-700 border-0"
                  data-testid="button-delete-latest"
                >
                  {isDeleting ? "Deleting..." : "Delete Latest Version"}
                </AlertDialogAction>
                <AlertDialogAction
                  onClick={() => onDelete(prompt.id, "all")}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 border-0"
                  data-testid="button-delete-all"
                >
                  {isDeleting ? "Deleting..." : "Delete All Versions"}
                </AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction
                onClick={() => onDelete(prompt.id, "all")}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                data-testid="button-confirm-delete"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function LikedPromptCard({ prompt }: { prompt: Prompt }) {
  const commentCountQuery = useQuery<number>({
    queryKey: ["/api/prompts", prompt.id, "comments", "count"],
  });

  const votesQuery = useQuery<VoteData>({
    queryKey: ["/api/prompts", prompt.id, "votes"],
  });

  const voteScore = (votesQuery.data?.upvotes ?? 0) - (votesQuery.data?.downvotes ?? 0);

  return (
    <Card className="h-full flex flex-col" data-testid={`card-liked-prompt-${prompt.id}`}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <Link href={`/prompt/${prompt.id}`} className="flex-1 min-w-0">
          <h3 className="font-semibold text-base line-clamp-2 hover:underline cursor-pointer">
            {prompt.title}
          </h3>
        </Link>
        <div className="flex gap-1 shrink-0">
          <Badge variant="secondary">
            {prompt.domain}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {prompt.task}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <pre className="font-mono text-sm text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
          {prompt.prompt}
        </pre>
      </CardContent>
      <CardFooter className="pt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <ThumbsUp className="w-3 h-3" />
          <span className="font-medium" data-testid={`text-vote-score-${prompt.id}`}>{voteScore}</span>
          <ThumbsDown className="w-3 h-3" />
        </div>
        <span className="flex items-center gap-1" data-testid={`text-comment-count-${prompt.id}`}>
          <MessageSquare className="w-3 h-3" />
          {commentCountQuery.data ?? 0}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
        </span>
      </CardFooter>
    </Card>
  );
}

export default function MyPrompts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeTeam, hasTeams, isLoading: teamsLoading } = useTeam();
  const [activeView, setActiveView] = useState<"mine" | "liked">("mine");

  // Handle intentional logout - redirect silently to home
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const intentionalLogout = sessionStorage.getItem("intentional_logout");
      if (intentionalLogout) {
        sessionStorage.removeItem("intentional_logout");
        window.location.href = "/";
      }
    }
  }, [authLoading, isAuthenticated]);

  // Auto-refresh data on page visit
  useEffect(() => {
    if (isAuthenticated && activeTeam) {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/mine", activeTeam.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/liked", activeTeam.id] });
    }
  }, [isAuthenticated, activeTeam]);

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts/mine", activeTeam?.id],
    queryFn: async () => {
      if (!activeTeam) return [];
      const response = await fetch(`/api/prompts/mine?teamId=${activeTeam.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch prompts");
      return response.json();
    },
    enabled: isAuthenticated && !!activeTeam,
  });

  const { data: likedPrompts, isLoading: likedLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts/liked", activeTeam?.id],
    queryFn: async () => {
      if (!activeTeam) return [];
      const response = await fetch(`/api/prompts/liked?teamId=${activeTeam.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch liked prompts");
      return response.json();
    },
    enabled: isAuthenticated && !!activeTeam,
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ promptId, deleteType }: { promptId: string; deleteType: "latest" | "all" }) => {
      const response = await apiRequest("DELETE", `/api/prompts/${promptId}?deleteType=${deleteType}`);
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts/mine", activeTeam?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", activeTeam?.id] });
      
      if (variables.deleteType === "latest") {
        toast({
          title: "Version deleted",
          description: "Latest version has been removed. Prompt rolled back to previous version.",
        });
      } else {
        toast({
          title: "Prompt deleted",
          description: "Your prompt has been permanently removed.",
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete prompt",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (promptId: string, deleteType: "latest" | "all") => {
    deleteMutation.mutate({ promptId, deleteType });
  };

  if (authLoading || teamsLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Skeleton className="h-10 w-48 mb-6" />
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view your prompts</h2>
        <p className="text-muted-foreground mb-6">
          Log in to see and manage the prompts you've submitted.
        </p>
        <Button asChild>
          <a href="/api/login" data-testid="link-login">Log In</a>
        </Button>
      </div>
    );
  }

  // Prompt user to join a team if they haven't
  if (!hasTeams) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Join a Team First</h2>
        <p className="text-muted-foreground mb-6">
          You need to be part of a team to view prompts. Create or join a team to get started.
        </p>
        <Button asChild>
          <Link href="/team" data-testid="link-setup-team">Set Up Your Team</Link>
        </Button>
      </div>
    );
  }

  const currentPrompts = activeView === "mine" ? prompts : likedPrompts;
  const currentLoading = activeView === "mine" ? isLoading : likedLoading;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FileText className="w-6 h-6" />
            <h1 className="text-2xl font-bold">My Prompts</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Viewing prompts for {activeTeam?.name}
          </p>
        </div>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as "mine" | "liked")}>
          <TabsList>
            <TabsTrigger 
              value="mine" 
              className="gap-2" 
              data-testid="tab-my-prompts"
            >
              <FileText className="w-4 h-4" />
              Submitted
              <Badge variant="secondary" className="ml-1">{prompts?.length || 0}</Badge>
            </TabsTrigger>
            <TabsTrigger 
              value="liked" 
              className="gap-2" 
              data-testid="tab-liked-prompts"
            >
              <Heart className="w-4 h-4" />
              Liked
              <Badge variant="secondary" className="ml-1">{likedPrompts?.length || 0}</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {currentLoading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-4 w-1/2" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : currentPrompts && currentPrompts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {activeView === "mine" ? (
            currentPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} onDelete={handleDelete} isDeleting={deleteMutation.isPending} />
            ))
          ) : (
            currentPrompts.map((prompt) => (
              <LikedPromptCard key={prompt.id} prompt={prompt} />
            ))
          )}
        </div>
      ) : (
        <Card className="py-16">
          <div className="text-center">
            {activeView === "mine" ? (
              <>
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prompts yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't submitted any prompts yet. Start sharing your AI prompts with your team!
                </p>
                <Button asChild>
                  <Link href="/submit" data-testid="link-submit-first">Submit Your First Prompt</Link>
                </Button>
              </>
            ) : (
              <>
                <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No liked prompts</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't upvoted any prompts yet. Browse prompts and give a thumbs up to the ones you find helpful!
                </p>
                <Button asChild>
                  <Link href="/browse" data-testid="link-browse">Browse Prompts</Link>
                </Button>
              </>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
