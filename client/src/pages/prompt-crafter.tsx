/**
 * Prompt Crafter Page
 * 
 * A tool for crafting and optimizing prompts using AI.
 * Users can either build from scratch using guided fields or paste an existing prompt.
 * Uses OpenAI API to generate optimized prompts with detailed change explanations.
 */

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Wand2, Copy, Check, Sparkles, ListChecks, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

// Form validation schema for building from scratch
const buildFormSchema = z.object({
  task: z.string().min(10, "Please describe your task (at least 10 characters)"),
  purpose: z.string().min(5, "Please explain why you need this"),
  outputFormat: z.string().min(5, "Please describe the desired output format"),
  styleTone: z.string().min(3, "Please specify styles and tones"),
});

// Form validation for pasting existing prompt
const pasteFormSchema = z.object({
  existingPrompt: z.string().min(20, "Prompt must be at least 20 characters"),
});

type BuildFormValues = z.infer<typeof buildFormSchema>;
type PasteFormValues = z.infer<typeof pasteFormSchema>;

interface OptimizationResult {
  optimizedPrompt: string;
  changesMade: Array<{
    type: "added" | "improved" | "structured" | "clarified" | "removed";
    description: string;
  }>;
  originalPrompt?: string;
}

export default function PromptCrafter() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"build" | "paste">("build");
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [copied, setCopied] = useState(false);

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
        description: "You need to be logged in to use Prompt Crafter.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [authLoading, isAuthenticated, toast]);

  // Form for building from scratch
  const buildForm = useForm<BuildFormValues>({
    resolver: zodResolver(buildFormSchema),
    defaultValues: {
      task: "",
      purpose: "",
      outputFormat: "",
      styleTone: "",
    },
  });

  // Form for pasting existing prompt
  const pasteForm = useForm<PasteFormValues>({
    resolver: zodResolver(pasteFormSchema),
    defaultValues: {
      existingPrompt: "",
    },
  });

  // Mutation for optimizing prompts
  const optimizeMutation = useMutation({
    mutationFn: async (data: { mode: "build" | "paste"; formData: BuildFormValues | PasteFormValues }) => {
      const response = await fetch("/api/prompt-crafter/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: data.mode, ...data.formData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to optimize prompt");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      toast({
        title: "Prompt Optimized!",
        description: "Your optimized prompt is ready.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Optimization Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onBuildSubmit = (data: BuildFormValues) => {
    setResult(null);
    optimizeMutation.mutate({ mode: "build", formData: data });
  };

  const onPasteSubmit = (data: PasteFormValues) => {
    setResult(null);
    optimizeMutation.mutate({ mode: "paste", formData: data });
  };

  const copyToClipboard = () => {
    if (result?.optimizedPrompt) {
      navigator.clipboard.writeText(result.optimizedPrompt);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Optimized prompt copied to clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getChangeIcon = (type: string) => {
    switch (type) {
      case "added":
        return "➕";
      case "improved":
        return "✨";
      case "structured":
        return "📐";
      case "clarified":
        return "💡";
      case "removed":
        return "➖";
      default:
        return "✓";
    }
  };

  const getChangeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case "added":
        return "default";
      case "improved":
        return "secondary";
      case "removed":
        return "destructive";
      default:
        return "outline";
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Return null if not authenticated (redirect will happen via useEffect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-16 px-4 overflow-hidden gradient-hero">
        {/* Decorative blurred blobs */}
        <motion.div 
          className="blob blob-primary w-96 h-96 -top-20 -left-20"
          animate={{ 
            x: [0, 60, -30, 60, 0],
            y: [0, -50, -80, -20, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
            opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
          }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="blob blob-accent w-80 h-80 top-40 -right-16"
          animate={{ 
            x: [0, -70, 40, -50, 0],
            y: [0, 60, -40, 70, 0],
            scale: [1, 0.9, 1.15, 0.95, 1],
            opacity: [0.3, 0.5, 0.4, 0.6, 0.3],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        <motion.div 
          className="relative max-w-4xl mx-auto text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Wand2 className="w-6 h-6 text-cyan-300" />
            <span className="text-sm font-semibold uppercase tracking-wider text-white/90">AI-Powered</span>
          </motion.div>

          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Prompt Crafter
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Transform your ideas into powerful AI prompts. Build from scratch with guided fields or optimize existing prompts with AI-powered suggestions.
          </motion.p>
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Input */}
          <div>
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Craft Your Prompt
                </CardTitle>
                <CardDescription>
                  Choose your approach: build from scratch or optimize an existing prompt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "build" | "paste")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="build">Build from Scratch</TabsTrigger>
                    <TabsTrigger value="paste">Optimize Existing</TabsTrigger>
                  </TabsList>

                  {/* Build from Scratch Tab */}
                  <TabsContent value="build">
                    <Form {...buildForm}>
                      <form onSubmit={buildForm.handleSubmit(onBuildSubmit)} className="space-y-6">
                        <FormField
                          control={buildForm.control}
                          name="task"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Describe Your Task</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., Write a product description, Analyze customer feedback, Generate code..."
                                  className="min-h-[80px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                What do you want the AI to do?
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={buildForm.control}
                          name="purpose"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Why Do You Need This?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., To improve conversion rates, To save time on repetitive tasks..."
                                  className="min-h-[60px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Explain the context and purpose
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={buildForm.control}
                          name="outputFormat"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>How Does Your Output Look?</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="e.g., A bulleted list, JSON format, Step-by-step instructions..."
                                  className="min-h-[60px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Describe the desired output format
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={buildForm.control}
                          name="styleTone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Styles & Tones</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="e.g., Professional, casual, technical, creative..."
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Specify the desired writing style and tone
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={optimizeMutation.isPending}
                          size="lg"
                        >
                          {optimizeMutation.isPending ? (
                            <>
                              <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                              Crafting Your Prompt...
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              Generate Optimized Prompt
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>

                  {/* Paste Existing Tab */}
                  <TabsContent value="paste">
                    <Form {...pasteForm}>
                      <form onSubmit={pasteForm.handleSubmit(onPasteSubmit)} className="space-y-6">
                        <FormField
                          control={pasteForm.control}
                          name="existingPrompt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Paste Your Existing Prompt</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Paste your prompt here and we'll optimize it for better results..."
                                  className="min-h-[280px] font-mono text-sm resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                We'll analyze and improve your prompt structure, clarity, and effectiveness
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button
                          type="submit"
                          className="w-full"
                          disabled={optimizeMutation.isPending}
                          size="lg"
                        >
                          {optimizeMutation.isPending ? (
                            <>
                              <Wand2 className="w-4 h-4 mr-2 animate-spin" />
                              Optimizing Your Prompt...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Optimize Prompt
                            </>
                          )}
                        </Button>
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Results */}
          <div>
            {result ? (
              <div className="space-y-6">
                {/* Optimized Prompt */}
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        Optimized Prompt
                      </CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="gap-2"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </Button>
                    </div>
                    <CardDescription>
                      Your AI-enhanced prompt is ready to use
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-muted rounded-lg">
                      <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
                        {result.optimizedPrompt}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Changes Made */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ListChecks className="w-5 h-5 text-primary" />
                      Changes Made
                    </CardTitle>
                    <CardDescription>
                      Here's what was improved in your prompt
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.changesMade.map((change, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <span className="text-xl mt-0.5">{getChangeIcon(change.type)}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant={getChangeBadgeVariant(change.type)} className="text-xs">
                                {change.type}
                              </Badge>
                            </div>
                            <p className="text-sm leading-relaxed">
                              {change.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-2 border-dashed h-full">
                <CardContent className="flex flex-col items-center justify-center h-full min-h-[400px] text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <ArrowRight className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Your Results Will Appear Here</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    Responses may take up to 20 seconds to be generated
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        </div>
      </section>
    </div>
  );
}
