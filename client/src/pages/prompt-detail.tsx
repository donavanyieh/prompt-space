/**
 * Prompt Detail Page
 * 
 * Displays a single prompt with full content, voting controls,
 * metadata, and a comment section for team discussion.
 */

import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { type Prompt, type Comment } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { 
  ArrowLeft, 
  Copy, 
  Check, 
  Calendar, 
  User, 
  Tag, 
  Briefcase,
  MessageSquare,
  Send,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Bot
} from "lucide-react";

interface VoteData {
  upvotes: number;
  downvotes: number;
  userVote: number | null;
}

const commentFormSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

/**
 * Individual comment display component.
 */
function CommentItem({ comment }: { comment: Comment }) {
  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex gap-3 py-4">
      <Avatar className="w-8 h-8">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

/**
 * Comment section with form and list of comments.
 */
function CommentSection({ promptId }: { promptId: string }) {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const { data: comments, isLoading } = useQuery<Comment[]>({
    queryKey: ["/api/prompts", promptId, "comments"],
    enabled: isAuthenticated,
  });

  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const response = await apiRequest("POST", `/api/prompts/${promptId}/comments`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId, "comments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId, "comments", "count"] });
      form.reset();
      toast({
        title: "Comment added",
        description: "Your comment has been posted.",
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
        description: error.message || "Failed to add comment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CommentFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <MessageSquare className="w-4 h-4" />
        Comments ({comments?.length || 0})
      </h3>

      {/* Comment Form */}
      {isAuthenticated && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <div className="flex gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {user?.firstName?.[0] || user?.email?.[0] || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Add a comment..."
                          className="min-h-[80px]"
                          {...field}
                          data-testid="input-comment-content"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={mutation.isPending}
                  data-testid="button-submit-comment"
                >
                  {mutation.isPending ? "Posting..." : (
                    <>
                      <Send className="w-3 h-3 mr-1" />
                      Post Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      )}

      <Separator />

      {/* Comments List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="divide-y">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </div>
  );
}

export default function PromptDetail() {
  const [, params] = useRoute("/prompt/:id");
  const promptId = params?.id;
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to view prompts.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  // Fetch prompt data
  const { data: prompt, isLoading } = useQuery<Prompt>({
    queryKey: ["/api/prompts", promptId],
    enabled: !!promptId && isAuthenticated,
  });

  // Fetch vote data
  const votesQuery = useQuery<VoteData>({
    queryKey: ["/api/prompts", promptId, "votes"],
    enabled: !!promptId && isAuthenticated,
  });

  const voteMutation = useMutation({
    mutationFn: async (value: number) => {
      const response = await apiRequest("POST", `/api/prompts/${promptId}/votes`, { value });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId, "votes"] });
    },
  });

  const handleVote = (value: number) => {
    voteMutation.mutate(value);
  };

  const voteScore = (votesQuery.data?.upvotes ?? 0) - (votesQuery.data?.downvotes ?? 0);

  const copyToClipboard = async () => {
    if (prompt) {
      await navigator.clipboard.writeText(prompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Loading states
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!prompt) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Prompt not found</h1>
          <p className="text-muted-foreground mb-6">
            The prompt you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/browse">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Browse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Back Navigation */}
        <Link href="/browse">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="button-back-to-browse">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Button>
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Prompt Card */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{prompt.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{prompt.domain}</Badge>
                    <Badge variant="outline">{prompt.task}</Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                  data-testid="button-copy-prompt"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre className="font-mono text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md" data-testid="text-prompt-content">
                  {prompt.prompt}
                </pre>
              </CardContent>
            </Card>

            {/* Notes Card (if present) */}
            {prompt.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                    {prompt.notes}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Comments Section */}
            <Card>
              <CardContent className="pt-6">
                <CommentSection promptId={prompt.id} />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-6">
            {/* Voting Card */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-4">
                  <Button
                    size="icon"
                    variant={votesQuery.data?.userVote === 1 ? "default" : "outline"}
                    onClick={() => handleVote(1)}
                    disabled={voteMutation.isPending}
                    data-testid="button-upvote-detail"
                  >
                    <ThumbsUp className="w-5 h-5" />
                  </Button>
                  <span className="text-2xl font-bold min-w-[3rem] text-center" data-testid="text-vote-score-detail">
                    {voteScore}
                  </span>
                  <Button
                    size="icon"
                    variant={votesQuery.data?.userVote === -1 ? "default" : "outline"}
                    onClick={() => handleVote(-1)}
                    disabled={voteMutation.isPending}
                    data-testid="button-downvote-detail"
                  >
                    <ThumbsDown className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {votesQuery.data?.upvotes ?? 0} upvotes, {votesQuery.data?.downvotes ?? 0} downvotes
                </p>
              </CardContent>
            </Card>

            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Author</p>
                    <p className="text-sm font-medium">{prompt.authorName}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Domain</p>
                    <p className="text-sm font-medium">{prompt.domain}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Tag className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Task</p>
                    <p className="text-sm font-medium">{prompt.task}</p>
                  </div>
                </div>

                {prompt.modelUsed && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Model Used</p>
                      <p className="text-sm font-medium">{prompt.modelUsed}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Use Prompt CTA */}
            <Button className="w-full" onClick={copyToClipboard} data-testid="button-use-prompt">
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied to Clipboard
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Use This Prompt
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
