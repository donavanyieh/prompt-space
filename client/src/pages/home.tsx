/**
 * Home Page
 * 
 * Landing page that displays the value proposition and guides users
 * to log in, set up a team, or start browsing prompts based on their state.
 */

import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <Badge variant="secondary" className="mb-6">
            <Sparkles className="w-3 h-3 mr-1" />
            Enterprise Prompt Management
          </Badge>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
            Centralize Your Team's
            <span className="text-primary block mt-2">AI Prompts</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Stop reinventing the wheel. Share, discover, and collaborate on prompts 
            across your organization. Build a knowledge base that scales with your team.
          </p>
          
          {/* Dynamic CTA based on auth and team state */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoading ? null : isAuthenticated ? (
              hasTeam ? (
                <>
                  <Link href="/submit">
                    <Button size="lg" data-testid="button-submit-prompt-hero">
                      Submit a Prompt
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/browse">
                    <Button size="lg" variant="outline" data-testid="button-browse-library-hero">
                      Browse Library
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/team">
                  <Button size="lg" data-testid="button-setup-team-hero">
                    <Users className="w-4 h-4 mr-2" />
                    Set Up Your Team
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              )
            ) : (
              <Button size="lg" asChild data-testid="button-login-hero">
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-semibold mb-4">
              How Prompt Party Works
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A simple workflow to capture and share institutional knowledge
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Create or Join a Team</h3>
                <p className="text-muted-foreground text-sm">
                  Set up your team and share a join code with colleagues to collaborate.
                </p>
              </CardContent>
            </Card>

            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Code2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Submit Prompts</h3>
                <p className="text-muted-foreground text-sm">
                  Share your best prompts with domain and task categorization for easy discovery.
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover-elevate">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Search & Filter</h3>
                <p className="text-muted-foreground text-sm">
                  Find the perfect prompt by searching across domains and task types.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-6">
            <Share2 className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">KNOWLEDGE SHARING</span>
          </div>
          
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Ready to streamline your prompt library?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Join teams who have consolidated their AI knowledge into a single, searchable repository.
          </p>
          
          {isLoading ? null : isAuthenticated ? (
            hasTeam ? (
              <Link href="/browse">
                <Button size="lg" data-testid="button-get-started">
                  Browse Prompts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href="/team">
                <Button size="lg" data-testid="button-get-started">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            )
          ) : (
            <Button size="lg" asChild data-testid="button-get-started">
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
