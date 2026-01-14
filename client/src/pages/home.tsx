/**
 * Home Page - Revamped Landing Page
 * 
 * Comprehensive landing page showcasing Prompt Space's value proposition,
 * features, benefits, and social proof to drive user conversions.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Search, Share2, Sparkles, ArrowRight, Code2, LogIn, Users,
  RefreshCw, MessageSquare, ThumbsUp, Lock, Tag, CheckCircle2,
  X, Zap, ChevronDown, HelpCircle, Wand2
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared/schema";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isScrollLocked, setIsScrollLocked] = useState(false);
  const comparisonSectionRef = useRef<HTMLDivElement>(null);
  const comparisonCardRef = useRef<HTMLDivElement>(null);
  
  // Fetch user's teams to determine appropriate CTA
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams/my"],
    enabled: isAuthenticated,
  });

  const hasTeam = teams && teams.length > 0;

  // Force scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll-lock behavior for comparison slider
  useEffect(() => {
    const SCROLL_AMOUNT_FOR_FULL_REVEAL = 800; // Total scroll delta needed to go 0→100% (lower = more sensitive)
    let isLocking = false;
    
    const checkCardPosition = () => {
      if (!comparisonCardRef.current) return { isCentered: false, progress: 0 };
      
      const cardRect = comparisonCardRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const cardCenter = cardRect.top + cardRect.height / 2;
      const viewportCenter = windowHeight / 2;
      
      // Card is centered when its center is near viewport center (within 150px)
      const isCentered = Math.abs(cardCenter - viewportCenter) < 150;
      
      // Calculate how close we are to being centered (for smoother detection)
      const distanceFromCenter = Math.abs(cardCenter - viewportCenter);
      const centerProgress = Math.max(0, 1 - distanceFromCenter / 300);
      
      return { isCentered, progress: centerProgress };
    };
    
    const handleWheel = (e: WheelEvent) => {
      const { isCentered } = checkCardPosition();
      
      // Prevent scrolling if card is centered and animation in progress
      if (isCentered && (scrollProgress > 0 || e.deltaY > 0) && (scrollProgress < 1 || e.deltaY < 0)) {
        e.preventDefault();
        e.stopPropagation();
        isLocking = true;
        setIsScrollLocked(true);
        
        // Allow bidirectional scrolling (both forward and backward)
        const progressIncrement = e.deltaY / SCROLL_AMOUNT_FOR_FULL_REVEAL;
        
        setScrollProgress(prev => {
          const newProgress = Math.min(Math.max(prev + progressIncrement, 0), 1);
          return newProgress;
        });
      } else if (isCentered && scrollProgress >= 1 && e.deltaY > 0) {
        // Allow continuing scroll down once animation is complete
        isLocking = false;
        setIsScrollLocked(false);
      } else if (!isCentered && scrollProgress === 0) {
        // Reset lock if user hasn't started and scrolls away
        isLocking = false;
        setIsScrollLocked(false);
      }
    };
    
    const handleScroll = () => {
      // Reset lock state when scrolling away from section
      if (!isLocking) {
        const { isCentered } = checkCardPosition();
        if (!isCentered && scrollProgress < 1) {
          setIsScrollLocked(false);
        }
      }
    };
    
    // Add event listeners
    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrollProgress]);

  // FAQ data
  const faqs = [
    {
      question: "Is my data secure?",
      answer: "Yes. We use Google OAuth authentication and team-based access control. Your prompts are never shared outside your team, and all data is encrypted in transit and at rest."
    },
    {
      question: "How many team members can I have?",
      answer: "Unlimited! Add as many team members as you need. There are no restrictions on team size."
    },
    {
      question: "Can I import existing prompts?",
      answer: "Yes, simply copy-paste your existing prompts when creating new entries. You can also add notes and categorize them properly."
    },
    {
      question: "What happens if someone leaves the team?",
      answer: "Team leaders can remove members from the team settings. Their contributed prompts remain (credited to them) for the team's continued use."
    },
    {
      question: "Do you support different AI models?",
      answer: "Yes! You can specify which AI model works best for each prompt (GPT-4, Claude, Gemini, etc.) in the prompt's notes field."
    }
  ];

  return (
    <div className="min-h-screen">
      {/* HERO SECTION - Enhanced */}
      <section className="relative py-24 px-4 overflow-hidden gradient-hero">
        {/* Decorative blurred blobs with enhanced animation */}
        <motion.div 
          className="blob blob-primary w-96 h-96 -top-20 -left-20"
          animate={{ 
            x: [0, 60, -30, 60, 0],
            y: [0, -50, -80, -20, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
            opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
            rotate: [0, 90, 180, 270, 360],
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
            rotate: [0, -90, -180, -270, -360],
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="blob blob-primary w-64 h-64 bottom-10 left-1/4"
          animate={{ 
            x: [0, 50, -40, 30, 0],
            y: [0, 40, 60, -30, 0],
            scale: [1, 1.2, 0.85, 1.1, 1],
            opacity: [0.35, 0.55, 0.4, 0.5, 0.35],
            rotate: [0, 120, 240, 300, 360],
          }}
          transition={{ 
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Additional blobs for more dynamic feel */}
        <motion.div 
          className="blob blob-accent w-72 h-72 top-1/2 right-1/4"
          animate={{ 
            x: [0, -60, 50, -40, 0],
            y: [0, -50, 40, -60, 0],
            scale: [1, 0.9, 1.1, 0.95, 1],
            opacity: [0.25, 0.45, 0.3, 0.5, 0.25],
            rotate: [0, -60, -120, -180, -360],
          }}
          transition={{ 
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div 
          className="blob blob-primary w-56 h-56 bottom-1/4 right-1/3"
          animate={{ 
            x: [0, 45, -35, 55, 0],
            y: [0, -45, 55, -35, 0],
            scale: [1, 1.15, 0.9, 1.05, 1],
            opacity: [0.3, 0.5, 0.35, 0.55, 0.3],
            rotate: [0, 180, 90, 270, 360],
          }}
          transition={{ 
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <motion.div 
          className="relative max-w-5xl mx-auto text-center z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.h1 
            className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5 text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Stop Losing Your Team's
            <span className="block mt-3 bg-gradient-to-r from-cyan-300 via-blue-200 to-purple-300 bg-clip-text text-transparent">
              Best AI Prompts
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Scattered across Slack, Notion, Google Docs, and Excel? Build a searchable, 
            collaborative prompt library with AI-powered optimization that your team can leverage.
          </motion.p>
          
          {/* Dynamic CTA based on auth and team state */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {isLoading ? null : isAuthenticated ? (
              hasTeam ? (
                <>
                  <Link href="/submit">
                    <Button className="glow-button" data-testid="button-submit-prompt-hero">
                      Submit a Prompt
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/browse">
                    <Button variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm hover:bg-white/20" data-testid="button-browse-library-hero">
                      Browse Library
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/team">
                  <Button className="glow-button" data-testid="button-setup-team-hero">
                    <Users className="w-4 h-4 mr-2" />
                    Set Up Your Team
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )
            ) : (
              <Button className="glow-button" asChild data-testid="button-login-hero">
                <a href="/api/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </motion.div>
        </motion.div>
      </section>

      {/* KEY FEATURES SECTION - 3 Rows x 2 Columns */}
      <section className="py-16 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">Powerful Features</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Everything Your Team Needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for collaboration, designed for productivity
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Secure & Private - Plum */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="feature-card-plum rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-lock"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Secure & Private</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Team-only access with enterprise-grade security. Google OAuth authentication and team-based permissions.
                </p>
              </div>
            </motion.div>

            {/* Feature 2: AI Prompt Crafter - Cyan */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="feature-card-cyan rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-sparkle">
                    <div className="sparkle-dot"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">AI Prompt Crafter</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Build optimized prompts from scratch or improve existing ones with AI-powered suggestions.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Version Control - Blue */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="feature-card-blue rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-circles">
                    <div className="circle-1"></div>
                    <div className="circle-2"></div>
                    <div className="circle-3"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Version Control</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Never lose a prompt iteration. Track changes, restore previous versions, and see who edited what.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Quality Curation - Coral */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="feature-card-coral rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-hexagon">
                    <div className="hex-bottom"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Quality Curation</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Surface the best prompts. Upvote/downvote system helps teams identify what works best.
                </p>
              </div>
            </motion.div>

            {/* Feature 5: Smart Search & Organization - Purple */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="feature-card-purple rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-concentric">
                    <div className="inner-circle"></div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Smart Search & Organization</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Find prompts instantly with powerful search. Automatic categorization keeps everything organized.
                </p>
              </div>
            </motion.div>

            {/* Feature 6: Team Discussions - Lime */}
            <motion.div
              className="grid grid-cols-[200px_1fr] gap-6 items-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="feature-card-lime rounded-xl h-[160px] shadow-lg">
                <div className="shape-container h-full">
                  <div className="shape-diamond"></div>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight">Team Discussions</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Collaborate in context. Comment directly on prompts, discuss improvements, and share insights.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* TRANSFORM SECTION - Scroll-Triggered Before/After Comparison */}
      <section 
        ref={comparisonSectionRef}
        className="relative py-32 px-4 bg-muted/30 overflow-hidden"
        style={{ minHeight: '150vh' }}
      >
        <div className="sticky top-20 max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Transform How Your Team Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
              See the difference: from chaos to clarity
            </p>
            <p className="text-sm text-muted-foreground">
              ↓ Scroll down to see the transformation ↓
            </p>
          </div>

          {/* Comparison Container */}
          <div className="relative w-full max-w-4xl mx-auto">
            <div ref={comparisonCardRef} className="relative h-[400px] rounded-2xl overflow-hidden shadow-2xl">
              
              {/* BEFORE Side - Always visible background */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                  {/* Scattered Tools Icons - Chaotic Layout */}
                  <div className="relative w-full h-full">
                    {/* Title */}
                    <div className="absolute top-4 left-6">
                      <div className="flex items-center gap-2 mb-2">
                        <X className="w-6 h-6 text-red-400" />
                        <h3 className="text-2xl font-bold text-white">Before</h3>
                      </div>
                      <p className="text-red-200 text-sm">Scattered & Disorganized</p>
                    </div>

                    {/* Scattered icons representing different tools */}
                    <div className="absolute top-28 left-12 transform rotate-12 opacity-70">
                      <div className="bg-purple-600/30 backdrop-blur-sm border border-purple-400/30 rounded-lg p-4">
                        <MessageSquare className="w-8 h-8 text-purple-300" />
                        <p className="text-xs text-purple-200 mt-1">Slack</p>
                      </div>
                    </div>

                    <div className="absolute top-32 right-20 transform -rotate-6 opacity-60">
                      <div className="bg-blue-600/30 backdrop-blur-sm border border-blue-400/30 rounded-lg p-4">
                        <svg className="w-8 h-8 text-blue-300" fill="currentColor" viewBox="0 0 24 24"><path d="M4.5 3h15A1.5 1.5 0 0121 4.5v15a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 19.5v-15A1.5 1.5 0 014.5 3z"/></svg>
                        <p className="text-xs text-blue-200 mt-1">Notion</p>
                      </div>
                    </div>

                    <div className="absolute top-64 left-24 transform rotate-3 opacity-65">
                      <div className="bg-green-600/30 backdrop-blur-sm border border-green-400/30 rounded-lg p-4">
                        <svg className="w-8 h-8 text-green-300" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/></svg>
                        <p className="text-xs text-green-200 mt-1">Docs</p>
                      </div>
                    </div>

                    <div className="absolute bottom-32 right-16 transform -rotate-12 opacity-70">
                      <div className="bg-orange-600/30 backdrop-blur-sm border border-orange-400/30 rounded-lg p-4">
                        <svg className="w-8 h-8 text-orange-300" fill="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
                        <p className="text-xs text-orange-200 mt-1">Excel</p>
                      </div>
                    </div>

                    <div className="absolute bottom-28 left-32 transform rotate-6 opacity-60">
                      <div className="bg-red-600/30 backdrop-blur-sm border border-red-400/30 rounded-lg p-4">
                        <svg className="w-8 h-8 text-red-300" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/></svg>
                        <p className="text-xs text-red-200 mt-1">Email</p>
                      </div>
                    </div>

                    {/* Chaos indicators */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                      <X className="w-16 h-16 text-red-400/40 mx-auto mb-2" />
                      <p className="text-red-200/60 text-lg font-semibold">Lost in chaos</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AFTER Side - Revealed by scroll */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-cyan-600"
                style={{ 
                  clipPath: `inset(0 ${100 - scrollProgress * 100}% 0 0)`,
                }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-12">
                  <div className="relative w-full h-full">
                    {/* Title */}
                    <div className="absolute top-4 left-6">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-6 h-6 text-cyan-200" />
                        <h3 className="text-2xl font-bold text-white">After</h3>
                      </div>
                      <p className="text-cyan-100 text-sm">Organized & Searchable</p>
                    </div>

                    {/* Organized Interface Mockup */}
                    <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-[90%]">
                      {/* Search Bar */}
                      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 mb-4 flex items-center gap-3">
                        <Search className="w-5 h-5 text-primary" />
                        <div className="flex-1 text-sm text-muted-foreground">Search prompts...</div>
                        <div className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">⌘K</div>
                      </div>

                      {/* Prompt Cards Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Code2 className="w-4 h-4 text-primary" />
                            <div className="text-xs font-semibold text-foreground">Code Review</div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">Review this code for...</div>
                          <div className="flex items-center gap-2 mt-2">
                            <ThumbsUp className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">12 votes</span>
                          </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            <div className="text-xs font-semibold text-foreground">Content Gen</div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">Generate engaging...</div>
                          <div className="flex items-center gap-2 mt-2">
                            <ThumbsUp className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">8 votes</span>
                          </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-primary" />
                            <div className="text-xs font-semibold text-foreground">Team Meeting</div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">Summarize meeting...</div>
                          <div className="flex items-center gap-2 mt-2">
                            <ThumbsUp className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">15 votes</span>
                          </div>
                        </div>

                        <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-primary" />
                            <div className="text-xs font-semibold text-foreground">Data Analysis</div>
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-2">Analyze dataset...</div>
                          <div className="flex items-center gap-2 mt-2">
                            <ThumbsUp className="w-3 h-3 text-primary" />
                            <span className="text-xs text-muted-foreground">6 votes</span>
                          </div>
                        </div>
                      </div>

                      {/* Team indicator */}
                      <div className="mt-4 flex items-center justify-center gap-2 text-white/90">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">Shared with your team</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Slider Handle/Divider */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-cyan-300 via-white to-cyan-300 shadow-lg pointer-events-none"
                style={{ 
                  left: `${scrollProgress * 100}%`,
                  boxShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(34, 211, 238, 0.4)'
                }}
              >
                {/* Handle Circle */}
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <div className="flex items-center gap-0.5">
                    <ChevronDown className="w-4 h-4 text-primary transform -rotate-90" />
                    <ChevronDown className="w-4 h-4 text-primary transform rotate-90" />
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-3 bg-background/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg">
                <span className="text-sm font-medium text-muted-foreground">Transformation Progress</span>
                <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-cyan-500 transition-all duration-300 ease-out"
                    style={{ width: `${scrollProgress * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary">{Math.round(scrollProgress * 100)}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION - Improved */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Get Started in 4 Simple Steps
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From setup to collaboration in minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                1
              </div>
              <Card className="card-lift accent-glow">
                <CardContent className="pt-8 pb-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 mx-auto">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Create or Join a Team</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Share a simple join code with teammates. No complex setup required.
                  </p>
                </CardContent>
              </Card>
              {/* Arrow connector for desktop */}
              <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            {/* Step 2 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                2
              </div>
              <Card className="card-lift accent-glow">
                <CardContent className="pt-8 pb-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 mx-auto">
                    <Code2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Submit & Organize Prompts</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Add prompts with automatic categorization. Track versions as you iterate.
                  </p>
                </CardContent>
              </Card>
              {/* Arrow connector for desktop */}
              <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>
            
            {/* Step 3 */}
            <div className="text-center relative">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                3
              </div>
              <Card className="card-lift accent-glow">
                <CardContent className="pt-8 pb-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 mx-auto">
                    <Wand2 className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Create or Optimize Prompt</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Use AI Prompt Crafter to build optimized prompts from scratch or improve existing ones.
                  </p>
                </CardContent>
              </Card>
              {/* Arrow connector for desktop */}
              <div className="hidden lg:block absolute top-8 left-full w-8 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>

            {/* Step 4 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                4
              </div>
              <Card className="card-lift accent-glow">
                <CardContent className="pt-8 pb-8">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5 mx-auto">
                    <Search className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">Discover & Collaborate</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Search the library, upvote the best, discuss improvements together.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION - Enhanced */}
      <section className="relative py-16 px-4 overflow-hidden bg-background">
        <div className="blob blob-primary w-96 h-96 top-0 right-0 opacity-20" />
        <div className="blob blob-accent w-80 h-80 bottom-0 left-0 opacity-20" />
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Ready to Get Started?</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 tracking-tight">
            Transform How Your Team Uses AI
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Centralized your AI knowledge into a single, searchable repository.
          </p>
          
          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span>Setup in 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span>Unlimited team members</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Free to use</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isLoading ? null : isAuthenticated ? (
              hasTeam ? (
                <>
                  <Link href="/browse">
                    <Button className="glow-button" data-testid="button-get-started">
                      Browse Prompts
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/submit">
                    <Button variant="outline" data-testid="button-submit-cta">
                      Submit a Prompt
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/team">
                  <Button className="glow-button" data-testid="button-get-started">
                    Get Started
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )
            ) : (
              <Button className="glow-button" asChild data-testid="button-get-started">
                <a href="/api/login">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>

          {/* Google OAuth Badge */}
          <p className="mt-8 text-sm text-muted-foreground">
            🔒 Secured with Google OAuth Authentication
          </p>
        </div>
      </section>

      {/* FAQ SECTION - NEW */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-4">
              <HelpCircle className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about Prompt Space
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="border-card-border overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full text-left p-6 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-lg font-semibold">{faq.question}</h3>
                    <ChevronDown 
                      className={`w-5 h-5 text-muted-foreground transition-transform flex-shrink-0 ${
                        expandedFaq === index ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-6 pt-2">
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
