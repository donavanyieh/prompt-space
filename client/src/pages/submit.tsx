import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { apiRequest, queryClient } from "@/lib/queryClient";
import { DOMAINS, TASKS, insertPromptSchema } from "@shared/schema";
import { Send, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const formSchema = insertPromptSchema.extend({
  prompt: z.string().min(10, "Prompt must be at least 10 characters"),
  authorName: z.string().min(2, "Name must be at least 2 characters"),
  domain: z.string().min(1, "Please select a domain"),
  task: z.string().min(1, "Please select a task"),
});

type FormValues = z.infer<typeof formSchema>;

export default function Submit() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
      domain: "",
      task: "",
      notes: "",
      authorName: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const response = await apiRequest("POST", "/api/prompts", data);
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/prompts"] });
      toast({
        title: "Prompt submitted!",
        description: "Your prompt has been shared with the team.",
      });
      navigate(`/prompt/${data.id}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit prompt",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  const watchedPrompt = form.watch("prompt");

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Submit a Prompt</h1>
          <p className="text-muted-foreground">
            Share your prompt with the organization to help others work more efficiently
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Prompt Details</CardTitle>
                <CardDescription>
                  Enter your prompt and categorize it for easy discovery
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Prompt</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreview(!showPreview)}
                          data-testid="button-toggle-preview"
                        >
                          {showPreview ? (
                            <>
                              <EyeOff className="w-4 h-4 mr-1" />
                              Edit
                            </>
                          ) : (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              Preview
                            </>
                          )}
                        </Button>
                      </div>
                      <FormControl>
                        {showPreview ? (
                          <pre className="font-mono text-sm p-4 bg-muted rounded-md whitespace-pre-wrap min-h-[200px]">
                            {watchedPrompt || "No content to preview"}
                          </pre>
                        ) : (
                          <Textarea
                            placeholder="Enter your prompt here..."
                            className="min-h-[200px] font-mono text-sm"
                            {...field}
                            data-testid="input-prompt"
                          />
                        )}
                      </FormControl>
                      <FormDescription>
                        Write a clear, reusable prompt that others can use
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="domain"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Domain</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-domain">
                              <SelectValue placeholder="Select a domain" />
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
                        <FormDescription>
                          Which team or department uses this prompt?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="task"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-task">
                              <SelectValue placeholder="Select a task type" />
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
                        <FormDescription>
                          What type of task does this prompt accomplish?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional context or tips for using this prompt..."
                          className="min-h-[100px]"
                          {...field}
                          value={field.value || ""}
                          data-testid="input-notes"
                        />
                      </FormControl>
                      <FormDescription>
                        Include usage tips, examples, or context
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="authorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter your name"
                          {...field}
                          data-testid="input-author-name"
                        />
                      </FormControl>
                      <FormDescription>
                        How should we credit this prompt?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/browse")}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                data-testid="button-submit-prompt"
              >
                {mutation.isPending ? (
                  "Submitting..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Prompt
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
