import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TeamProvider } from "@/contexts/team-context";
import { Navbar } from "@/components/navbar";
import Home from "@/pages/home";
import Browse from "@/pages/browse";
import Submit from "@/pages/submit";
import PromptDetail from "@/pages/prompt-detail";
import TeamPage from "@/pages/team";
import MyPrompts from "@/pages/my-prompts";
import Contact from "@/pages/contact";
import PromptCrafter from "@/pages/prompt-crafter";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/browse" component={Browse} />
      <Route path="/submit" component={Submit} />
      <Route path="/prompt/:id" component={PromptDetail} />
      <Route path="/team" component={TeamPage} />
      <Route path="/my-prompts" component={MyPrompts} />
      <Route path="/contact" component={Contact} />
      <Route path="/prompt-crafter" component={PromptCrafter} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <TeamProvider>
          <div className="min-h-screen bg-background">
            <Navbar />
            <Router />
          </div>
          <Toaster />
        </TeamProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
