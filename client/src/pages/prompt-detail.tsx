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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";
import { type Prompt, type Comment, type PromptVersion, DOMAINS, TASKS } from "@shared/schema";
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
  Bot,
  Edit,
  History,
  AlertCircle,
  Clock
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

      <Separator />

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
    </div>
  );
}

const editPromptSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt content is required"),
  domain: z.string().min(1, "Domain is required"),
  task: z.string().min(1, "Task is required"),
  notes: z.string().optional(),
  modelUsed: z.string().optional(),
});

type EditPromptFormValues = z.infer<typeof editPromptSchema>;

export default function PromptDetail() {
  const [, params] = useRoute("/prompt/:id");
  const promptId = params?.id;
  const [copied, setCopied] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<number | null>(null);
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

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

  // Fetch version history
  const { data: versions } = useQuery<PromptVersion[]>({
    queryKey: ["/api/prompts", promptId, "versions"],
    enabled: !!promptId && isAuthenticated,
  });

  // Fetch specific version if selected
  const { data: versionData } = useQuery<PromptVersion>({
    queryKey: ["/api/prompts", promptId, "versions", selectedVersion],
    enabled: !!promptId && !!selectedVersion && selectedVersion !== prompt?.currentVersion,
  });

  // Determine which data to display (current prompt or historical version)
  const displayData = selectedVersion && selectedVersion !== prompt?.currentVersion && versionData 
    ? versionData 
    : prompt;

  const isViewingOldVersion = selectedVersion && selectedVersion !== prompt?.currentVersion;
  const isAuthor = user?.id === prompt?.authorId;

  // Edit form
  const editForm = useForm<EditPromptFormValues>({
    resolver: zodResolver(editPromptSchema),
    defaultValues: {
      title: "",
      prompt: "",
      domain: "",
      task: "",
      notes: "",
      modelUsed: "",
    },
  });

  // Reset form when prompt changes
  useEffect(() => {
    if (prompt && editDialogOpen) {
      editForm.reset({
        title: prompt.title,
        prompt: prompt.prompt,
        domain: prompt.domain,
        task: prompt.task,
        notes: prompt.notes || "",
        modelUsed: prompt.modelUsed || "",
      });
    }
  }, [prompt, editDialogOpen, editForm]);

  // Set initial selected version
  useEffect(() => {
    if (prompt && !selectedVersion) {
      setSelectedVersion(prompt.currentVersion);
    }
  }, [prompt, selectedVersion]);

  const editMutation = useMutation({
    mutationFn: async (data: EditPromptFormValues) => {
      const response = await apiRequest("PUT", `/api/prompts/${promptId}`, data);
      return response.json();
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId] });
      await queryClient.invalidateQueries({ queryKey: ["/api/prompts", promptId, "versions"] });
      
      // Switch to the newly created version
      if (data.currentVersion) {
        setSelectedVersion(data.currentVersion);
      }
      
      setEditDialogOpen(false);
      toast({
        title: "Prompt updated",
        description: "Your changes have been saved as a new version.",
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
        description: error.message || "Failed to update prompt",
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = (data: EditPromptFormValues) => {
    editMutation.mutate(data);
  };

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
    if (displayData) {
      await navigator.clipboard.writeText(displayData.prompt);
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
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-6" 
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = "/browse";
            }
          }}
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Version Warning Banner */}
            {isViewingOldVersion && (
              <Alert className="bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/10 dark:border-yellow-900/50 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <AlertDescription className="flex items-center justify-between">
                  <span>You're viewing version {selectedVersion} (not the latest version).</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedVersion(prompt?.currentVersion || null)}
                  >
                    View Current
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Version Selector & Edit Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 flex-1">
                {!isViewingOldVersion && (
                  <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">
                    Latest
                  </Badge>
                )}
                <Label className="text-sm font-medium">Version:</Label>
                <Select 
                  value={selectedVersion?.toString()} 
                  onValueChange={(val) => setSelectedVersion(parseInt(val))}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select version" />
                  </SelectTrigger>
                  <SelectContent>
                    {versions?.map((v) => (
                      <SelectItem key={v.version} value={v.version.toString()}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-medium shrink-0">v{v.version}</span>
                          <span className="text-xs text-muted-foreground truncate">
                            {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAuthor && !isViewingOldVersion && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditDialogOpen(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Make Revision
                </Button>
              )}
            </div>

            {/* Prompt Card */}
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{displayData?.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{displayData?.domain}</Badge>
                    <Badge variant="outline">{displayData?.task}</Badge>
                    {prompt && (
                      <Badge variant="outline" className="text-xs">v{selectedVersion || prompt.currentVersion}</Badge>
                    )}
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
              <CardContent className="space-y-4">
                <pre className="font-mono text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md" data-testid="text-prompt-content">
                  {displayData?.prompt}
                </pre>
                
                {displayData?.notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4" />
                        Notes
                      </h4>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap">
                        {displayData.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

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

            {/* Version History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {versions?.map((v, idx) => (
                      <div key={v.version} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${
                            v.version === prompt?.currentVersion ? 'bg-primary' : 'bg-muted'
                          }`} />
                          {idx < versions.length - 1 && (
                            <div className="w-0.5 flex-1 min-h-[60px] bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">Version {v.version}</span>
                              {v.version === prompt?.currentVersion && (
                                <Badge variant="default" className="text-xs">Current</Badge>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(v.createdAt), { addSuffix: true })}
                          </p>
                          <Button
                            variant={selectedVersion === v.version ? "default" : "outline"}
                            size="sm"
                            className="w-full"
                            onClick={() => setSelectedVersion(v.version)}
                          >
                            {selectedVersion === v.version ? "Viewing" : "View this version"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
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

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Prompt</DialogTitle>
              <DialogDescription>
                Make changes to your prompt. This will create a new version.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter prompt title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prompt Content</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter the prompt content"
                          className="min-h-[200px] font-mono"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select domain" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {DOMAINS.map((domain) => (
                              <SelectItem key={domain} value={domain}>
                                {domain}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="task"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select task" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TASKS.map((task) => (
                              <SelectItem key={task} value={task}>
                                {task}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editForm.control}
                  name="modelUsed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Used (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., GPT-4, Claude 3"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes or context"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditDialogOpen(false)}
                    disabled={editMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={editMutation.isPending}>
                    {editMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
