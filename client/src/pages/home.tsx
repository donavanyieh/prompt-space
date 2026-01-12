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
  X, Zap, ChevronDown, HelpCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared/schema";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  
  // Fetch user's teams to determine appropriate CTA
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams/my"],
    enabled: isAuthenticated,
  });

  const hasTeam = teams && teams.length > 0;

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
            collaborative prompt library that your team can leverage.
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

      {/* KEY FEATURES SECTION - NEW */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
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
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: RefreshCw, title: "Version Control", desc: "Never lose a prompt iteration. Track changes, restore previous versions, and see who edited what." },
              { icon: MessageSquare, title: "Team Discussions", desc: "Collaborate in context. Comment directly on prompts, discuss improvements, and share insights." },
              { icon: ThumbsUp, title: "Quality Curation", desc: "Surface the best prompts. Upvote/downvote system helps teams identify what works best." },
              { icon: Search, title: "Powerful Search", desc: "Find prompts instantly. Filter by domain (Engineering, Marketing, etc.) and task type." },
              { icon: Tag, title: "Smart Organization", desc: "Keep everything organized. Automatic categorization by domain and task makes browsing intuitive." },
              { icon: Lock, title: "Secure & Private", desc: "Team-only access. Google OAuth authentication, team-based permissions, your data stays private." }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="card-lift accent-glow border-card-border h-full hover:scale-[1.02] transition-transform">
                  <CardContent className="pt-6 pb-6">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-lg font-extrabold mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* BENEFITS/COMPARISON SECTION - NEW */}
      <section className="py-12 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Transform How Your Team Works
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Stop wasting time searching for prompts. Start building institutional knowledge.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* WITHOUT Column */}
            <Card className="border-destructive/20 bg-destructive/5">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center gap-2 mb-6">
                  <X className="w-6 h-6 text-destructive" />
                  <h3 className="text-xl font-bold text-destructive">Without Prompt Space</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Prompts scattered across 5+ different tools</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">No version history when someone edits a prompt</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Can't find the prompt you need when you need it</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">No collaboration or feedback mechanism</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Best practices lost when people leave the team</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <X className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">Everyone reinvents the wheel independently</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* WITH Column */}
            <Card className="border-primary/20 bg-primary/5 accent-glow">
              <CardContent className="pt-8 pb-8">
                <div className="flex items-center gap-2 mb-6">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary">With Prompt Space</h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Centralized library in one searchable place</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Complete version control with restore capability</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Instant search by domain, task, or keyword</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Team discussions on every prompt</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Upvoting surfaces the best prompts automatically</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">Reuse what works, iterate together as a team</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION - Improved */}
      <section className="py-12 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 tracking-tight">
              Get Started in 3 Simple Steps
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              From setup to collaboration in minutes
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
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
              <div className="hidden md:block absolute top-8 left-full w-12 h-0.5 bg-gradient-to-r from-primary to-transparent" />
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
              <div className="hidden md:block absolute top-8 left-full w-12 h-0.5 bg-gradient-to-r from-primary to-transparent" />
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-6">
                3
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
