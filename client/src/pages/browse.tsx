import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageSquare, Calendar, User, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { type Prompt, DOMAINS, TASKS } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

function PromptCard({ prompt }: { prompt: Prompt }) {
  const commentCountQuery = useQuery<number>({
    queryKey: [`/api/prompts/${prompt.id}/comments/count`],
  });

  return (
    <Link href={`/prompt/${prompt.id}`}>
      <Card className="hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-prompt-${prompt.id}`}>
        <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
          <h3 className="font-semibold text-base line-clamp-2 flex-1">
            {prompt.title}
          </h3>
          <Badge variant="secondary" className="shrink-0">
            {prompt.domain}
          </Badge>
        </CardHeader>
        <CardContent className="flex-1">
          <pre className="font-mono text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap bg-muted/50 p-3 rounded-md">
            {prompt.prompt}
          </pre>
        </CardContent>
        <CardFooter className="pt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomains, setSelectedDomains] = useState<string[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const queryParams = new URLSearchParams();
  if (searchQuery) queryParams.set("search", searchQuery);
  if (selectedDomains.length > 0) queryParams.set("domains", selectedDomains.join(","));
  if (selectedTasks.length > 0) queryParams.set("tasks", selectedTasks.join(","));
  
  const queryString = queryParams.toString();
  const apiUrl = queryString ? `/api/prompts?${queryString}` : "/api/prompts";

  const { data: prompts, isLoading } = useQuery<Prompt[]>({
    queryKey: [apiUrl],
  });

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
  };

  const hasActiveFilters = selectedDomains.length > 0 || selectedTasks.length > 0 || searchQuery;

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Prompts</h1>
          <p className="text-muted-foreground">
            Discover and explore prompts shared by your organization
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64 shrink-0">
            <div className="sticky top-4 space-y-4">
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

              <Button
                variant="outline"
                className="w-full lg:hidden justify-between"
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedDomains.length + selectedTasks.length}
                    </Badge>
                  )}
                </span>
                {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>

              <div className={`space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
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
            </div>
          </aside>

          <main className="flex-1">
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

            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <PromptCardSkeleton key={i} />
                ))}
              </div>
            ) : prompts && prompts.length > 0 ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
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
          </main>
        </div>
      </div>
    </div>
  );
}
