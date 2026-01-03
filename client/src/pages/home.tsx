/**
 * Home Page
 * 
 * Landing page that displays the value proposition and guides users
 * to log in, set up a team, or start browsing prompts based on their state.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Share2, Sparkles, ArrowRight, Code2, LogIn, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Team } from "@shared/schema";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  
  // Fetch user's teams to determine appropriate CTA
  const { data: teams } = useQuery<Team[]>({
    queryKey: ["/api/teams/my"],
    enabled: isAuthenticated,
  });

  const hasTeam = teams && teams.length > 0;

  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <section className="relative py-24 px-4 overflow-hidden gradient-hero">
        {/* Decorative blurred blobs with floating animation */}
        <div className="blob blob-primary blob-float-1 w-96 h-96 -top-20 -left-20" />
        <div className="blob blob-accent blob-float-2 w-80 h-80 top-40 -right-16" />
        <div className="blob blob-primary blob-float-3 w-64 h-64 bottom-10 left-1/4" />
        
        <div className="relative max-w-5xl mx-auto text-center z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white">
            Centralize Your Team's
            <span className="block mt-2 bg-gradient-to-r from-cyan-300 to-blue-200 bg-clip-text text-transparent">
              AI Prompts
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-10">
            Stop reinventing the wheel. Share, discover, and collaborate on prompts 
            across your organization. Build a knowledge base that scales with your team.
          </p>
          
          {/* Dynamic CTA based on auth and team state */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoading ? null : isAuthenticated ? (
              hasTeam ? (
                <>
                  <Link href="/submit">
                    <Button size="lg" className="glow-button" data-testid="button-submit-prompt-hero">
                      Submit a Prompt
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/browse">
                    <Button size="lg" variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm" data-testid="button-browse-library-hero">
                      Browse Library
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/team">
                  <Button size="lg" className="glow-button" data-testid="button-setup-team-hero">
                    <Users className="w-4 h-4 mr-2" />
                    Set Up Your Team
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )
            ) : (
              <Button size="lg" className="glow-button" asChild data-testid="button-login-hero">
                <a href="/api/login">
                  <LogIn className="w-4 h-4 mr-2" />
                  Log In to Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
              How Prompt Party Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A simple workflow to capture and share institutional knowledge
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="card-lift accent-glow">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Create or Join a Team</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Set up your team and share a join code with colleagues to collaborate.
                </p>
              </CardContent>
            </Card>

            <Card className="card-lift accent-glow">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <Code2 className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Submit Prompts</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Share your best prompts with domain and task categorization for easy discovery.
                </p>
              </CardContent>
            </Card>
            
            <Card className="card-lift accent-glow">
              <CardContent className="pt-8 pb-8">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-5">
                  <Search className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Search & Filter</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Find the perfect prompt by searching across domains and task types.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-muted/30">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Share2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Knowledge Sharing</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4 tracking-tight">
            Ready to streamline your prompt library?
          </h2>
          <p className="text-muted-foreground mb-10 max-w-lg mx-auto">
            Join teams who have consolidated their AI knowledge into a single, searchable repository.
          </p>
          
          {isLoading ? null : isAuthenticated ? (
            hasTeam ? (
              <Link href="/browse">
                <Button size="lg" className="glow-button" data-testid="button-get-started">
                  Browse Prompts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/team">
                <Button size="lg" className="glow-button" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )
          ) : (
            <Button size="lg" className="glow-button" asChild data-testid="button-get-started">
              <a href="/api/login">
                Get Started
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
