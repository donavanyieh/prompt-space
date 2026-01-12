/**
 * Browse Page
 * 
 * Displays a searchable, filterable grid of prompts for the active team.
 * Users can filter by domain and task, search by text, and vote on prompts.
 */

import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, MessageSquare, Calendar, User, Filter, X, Users, ThumbsUp, ThumbsDown, ArrowUpDown, PanelLeftClose, PanelLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Prompt, DOMAINS, TASKS } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useTeam } from "@/contexts/team-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface VoteData {
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

/**
 * Individual prompt card component with voting functionality.
 */
function PromptCard({ prompt }: { prompt: Prompt }) {
  const commentCountQuery = useQuery<number>({
    queryKey: ["/api/prompts", prompt.id, "comments", "count"],
  });

  const votesQuery = useQuery<VoteData>({
    queryKey: ["/api/prompts", prompt.id, "votes"],
  });

  const voteMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await apiRequest("POST", `/api/prompts/${prompt.id}/votes`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", prompt.id, "votes"] });
    },
  });

  const handleVote = (e: React.MouseEvent, value: number) => {
    e.preventDefault();
    e.stopPropagation();
    voteMutation.mutate(value);
  };

  const voteScore = (votesQuery.data?.upvotes ?? 0) - (votesQuery.data?.downvotes ?? 0);

  return (
    <Link href={`/prompt/${prompt.id}`}>
      <Card className="card-lift accent-glow cursor-pointer h-full flex flex-col" data-testid={`card-prompt-${prompt.id}`}>
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-2 flex-1">
            {prompt.title}
          </h3>
          <div className="flex gap-1 shrink-0">
            {prompt.currentVersion > 1 && (
              <Badge variant="outline" className="text-xs">
                v{prompt.currentVersion}
              </Badge>
            )}
            <Badge variant="secondary">
              {prompt.domain}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <pre className="font-mono text-sm text-muted-foreground max-h-32 overflow-y-auto whitespace-pre-wrap bg-muted/30 p-3 rounded-md border border-border/50">
            {prompt.prompt}
          </pre>
        </CardContent>
        <CardFooter className="pt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          {/* Voting controls */}
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={`h-6 w-6 ${votesQuery.data?.userVote === 1 ? "text-green-600 dark:text-green-400" : ""}`}
              onClick={(e) => handleVote(e, 1)}
              disabled={voteMutation.isPending}
              data-testid={`button-upvote-${prompt.id}`}
            >
              <ThumbsUp className="w-3 h-3" />
            </Button>
            <span className="min-w-[1.5rem] text-center font-medium" data-testid={`text-vote-score-${prompt.id}`}>
              {voteScore}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className={`h-6 w-6 ${votesQuery.data?.userVote === -1 ? "text-red-600 dark:text-red-400" : ""}`}
              onClick={(e) => handleVote(e, -1)}
              disabled={voteMutation.isPending}
              data-testid={`button-downvote-${prompt.id}`}
            >
              <ThumbsDown className="w-3 h-3" />
            </Button>
          </div>
          <Badge variant="outline" className="text-xs">
            {prompt.task}
          </Badge>
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {commentCountQuery.data ?? 0}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
          </span>
          <span className="flex items-center gap-1">
            <User className="w-3 h-3" />
            {prompt.authorName}
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}

/**
 * Loading skeleton for prompt cards.
 */
function PromptCardSkeleton() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-16" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-20 w-full" />
      </CardContent>
      <CardFooter className="pt-2 flex items-center gap-3">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-24" />
      </CardFooter>
    </Card>
  );
}

export default function Browse() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { activeTeam, hasTeams, isLoading: teamsLoading } = useTeam();
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [sortBy, setSortBy] = useState<"newest" | "comments" | "votes">("newest");

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
        description: "You need to be logged in to browse prompts.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  // Build query parameters for API request
  const queryParams = new URLSearchParams();
  if (activeTeam) queryParams.set("teamId", activeTeam.id);
  if (searchQuery) queryParams.set("search", searchQuery);
  if (selectedDomains.length > 0) queryParams.set("domains", selectedDomains.join(","));
  if (selectedTasks.length > 0) queryParams.set("tasks", selectedTasks.join(","));
  if (sortBy !== "newest") queryParams.set("sort", sortBy);
  
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/prompts?${queryString}` : "/api/prompts";

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts", activeTeam?.id, searchQuery, selectedDomains.join(","), selectedTasks.join(","), sortBy],
    queryFn: async () => {
      if (!activeTeam) return [];
      const response = await fetch(apiUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch prompts");
      return response.json();
    },
    enabled: isAuthenticated && !!activeTeam,
  });

  // Query for total prompts count (unfiltered)
  const { data: totalPrompts } = useQuery<Prompt[]>({
    queryKey: ["/api/prompts", activeTeam?.id, "total"],
    queryFn: async () => {
      if (!activeTeam) return [];
      const response = await fetch(`/api/prompts?teamId=${activeTeam.id}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch total prompts");
      return response.json();
    },
    enabled: isAuthenticated && !!activeTeam,
  });

  // Filter toggle handlers
  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) =>
      prev.includes(domain)
        ? prev.filter((d) => d !== domain)
        : [...prev, domain]
    );
  };

  const toggleTask = (task: string) => {
    setSelectedTasks((prev) =>
      prev.includes(task)
        ? prev.filter((t) => t !== task)
        : [...prev, task]
    );
  };

  const clearFilters = () => {
    setSelectedDomains([]);
    setSelectedTasks([]);
    setSearchQuery("");
    setSortBy("newest");
  };

  const hasActiveFilters = selectedDomains.length > 0 || selectedTasks.length > 0 || searchQuery || sortBy !== "newest";

  // Loading state
  if (authLoading || teamsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Prompt user to join a team if they haven't
  if (!hasTeams) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <Card className="p-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Join a Team First</h2>
            <p className="text-muted-foreground mb-6">
              You need to be part of a team to browse prompts. Create or join a team to get started.
            </p>
            <Link href="/team">
              <Button data-testid="button-setup-team">
                Set Up Your Team
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Collapsible Filters Sidebar with Glass Effect */}
      <aside 
        className={`shrink-0 border-r border-border/50 glass transition-all duration-300 ${
          sidebarExpanded ? "w-64" : "w-14"
        }`}
      >
        <div className="sticky top-0 h-screen flex flex-col">
          {/* Sidebar Header with Toggle */}
          <div className={`p-3 border-b border-border/50 flex items-center ${sidebarExpanded ? "justify-between" : "justify-center"}`}>
            {sidebarExpanded && (
              <span className="font-semibold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" />
                Filters
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarExpanded(!sidebarExpanded)}
              data-testid="button-toggle-sidebar"
            >
              {sidebarExpanded ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Collapsed State - Show active filter count if any */}
          {!sidebarExpanded && hasActiveFilters && (
            <div className="flex flex-col items-center gap-2 p-2">
              <Badge variant="secondary" className="text-xs px-1.5">
                {selectedDomains.length + selectedTasks.length}
              </Badge>
            </div>
          )}

          {/* Expanded State - Full filters */}
          {sidebarExpanded && (
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search prompts..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>

                {/* Sort Dropdown */}
                <div>
                  <Label className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    Sort By
                  </Label>
                  <Select value={sortBy} onValueChange={(value: "newest" | "comments" | "votes") => setSortBy(value)}>
                    <SelectTrigger className="w-full" data-testid="select-sort">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest" data-testid="sort-newest">Newest First</SelectItem>
                      <SelectItem value="comments" data-testid="sort-comments">Most Comments</SelectItem>
                      <SelectItem value="votes" data-testid="sort-votes">Highest Score</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Clear filters
                  </Button>
                )}

                {/* Domain Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Domain</h3>
                  <div className="space-y-2">
                    {DOMAINS.map((domain) => (
                      <div key={domain} className="flex items-center gap-2">
                        <Checkbox
                          id={`domain-${domain}`}
                          checked={selectedDomains.includes(domain)}
                          onCheckedChange={() => toggleDomain(domain)}
                          data-testid={`checkbox-domain-${domain}`}
                        />
                        <Label
                          htmlFor={`domain-${domain}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {domain}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Task Filter */}
                <div>
                  <h3 className="font-semibold text-sm mb-3">Task</h3>
                  <div className="space-y-2">
                    {TASKS.map((task) => (
                      <div key={task} className="flex items-center gap-2">
                        <Checkbox
                          id={`task-${task}`}
                          checked={selectedTasks.includes(task)}
                          onCheckedChange={() => toggleTask(task)}
                          data-testid={`checkbox-task-${task}`}
                        />
                        <Label
                          htmlFor={`task-${task}`}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {task}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold mb-3 tracking-tight">Browse Prompts</h1>
            <p className="text-muted-foreground">
              Discover and explore prompts shared by {activeTeam?.name || "your team"}
            </p>
            {!isLoading && prompts && totalPrompts && (
              <p className="text-sm text-muted-foreground mt-2" data-testid="text-prompt-count">
                Displaying {prompts.length} prompt{prompts.length !== 1 ? "s" : ""} out of {totalPrompts.length}
              </p>
            )}
          </div>

          {/* Active Filter Tags */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  Search: {searchQuery}
                  <button onClick={() => setSearchQuery("")} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}
              {selectedDomains.map((domain) => (
                <Badge key={domain} variant="secondary" className="gap-1">
                  {domain}
                  <button onClick={() => toggleDomain(domain)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              {selectedTasks.map((task) => (
                <Badge key={task} variant="secondary" className="gap-1">
                  {task}
                  <button onClick={() => toggleTask(task)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Content States */}
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[...Array(3)].map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          ) : prompts && prompts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {prompts.map((prompt) => (
                <PromptCard key={prompt.id} prompt={prompt} />
              ))}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto">
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
                <p className="text-muted-foreground mb-6">
                  {hasActiveFilters
                    ? "Try adjusting your filters or search query"
                    : "Be the first to share a prompt with your team"}
                </p>
                <Link href="/submit">
                  <Button data-testid="button-submit-first-prompt">Submit a Prompt</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
