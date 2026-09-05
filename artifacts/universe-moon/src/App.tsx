import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { useAuthStore } from "@/hooks/use-auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/Layout/Layout";
import Auth from "@/pages/Auth";
import Home from "@/pages/Home";
import Members from "@/pages/Members";
import Gallery from "@/pages/Gallery";
import Chat from "@/pages/Chat";
import Ngl from "@/pages/NGL";
import Leaderboard from "@/pages/Leaderboard";
import NotFound from "@/pages/not-found";

import Memories from "@/pages/Memories";
import Links from "@/pages/Links";
import Music from "@/pages/Music";
import Vault from "@/pages/Vault";
import ExMembers from "@/pages/ExMembers";
import OpMem from "@/pages/OpMem";
import Mep from "@/pages/Mep";
import Battle from "@/pages/Battle";
import Games from "@/pages/Games";
import ImposterGame from "@/pages/ImposterGame";
import WerewolfGame from "@/pages/WerewolfGame";
import LudoGame from "@/pages/LudoGame";
import DraculaGame from "@/pages/DraculaGame";
import About from "@/pages/About";
import Voting from "@/pages/Voting";
import Drakor from "@/pages/Drakor";
import Admin from "@/pages/Admin";

// New community pages
import Profile from "@/pages/Profile";
import Birthday from "@/pages/Birthday";
import Rules from "@/pages/Rules";
import Activity from "@/pages/Activity";
import Shoutout from "@/pages/Shoutout";
import Moodboard from "@/pages/Moodboard";
import Capsule from "@/pages/Capsule";
import QA from "@/pages/QA";
import Playlist from "@/pages/Playlist";
import Meme from "@/pages/Meme";
import Quote from "@/pages/Quote";
import Fanfic from "@/pages/Fanfic";
import Stickers from "@/pages/Stickers";
import HallOfFame from "@/pages/HallOfFame";
import Stats from "@/pages/Stats";
import Milestones from "@/pages/Milestones";
import Diary from "@/pages/Diary";
import Apipi from "@/pages/Apipi";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      
      {/* Protected Layout Routes */}
      <Route path="/">
        <Layout><Home /></Layout>
      </Route>
      <Route path="/members">
        <Layout><Members /></Layout>
      </Route>
      <Route path="/ex-members">
        <Layout><ExMembers /></Layout>
      </Route>
      <Route path="/gallery">
        <Layout><Gallery /></Layout>
      </Route>
      <Route path="/chat">
        <Layout><Chat /></Layout>
      </Route>
      <Route path="/ngl">
        <Layout><Ngl /></Layout>
      </Route>
      <Route path="/leaderboard">
        <Layout><Leaderboard /></Layout>
      </Route>
      
      <Route path="/memories">
        <Layout><Memories /></Layout>
      </Route>
      <Route path="/links">
        <Layout><Links /></Layout>
      </Route>
      <Route path="/music">
        <Layout><Music /></Layout>
      </Route>
      <Route path="/vault">
        <Layout><Vault /></Layout>
      </Route>
      <Route path="/opmem">
        <Layout><OpMem /></Layout>
      </Route>
      <Route path="/mep">
        <Layout><Mep /></Layout>
      </Route>
      
      <Route path="/games">
        <Layout><Games /></Layout>
      </Route>
      <Route path="/games/imposter">
        <Layout><ImposterGame /></Layout>
      </Route>
      <Route path="/games/werewolf">
        <Layout><WerewolfGame /></Layout>
      </Route>
      <Route path="/games/ludo">
        <Layout><LudoGame /></Layout>
      </Route>
      <Route path="/games/dracula">
        <Layout><DraculaGame /></Layout>
      </Route>
      
      <Route path="/voting">
        <Layout><Voting /></Layout>
      </Route>
      <Route path="/drakor">
        <Layout><Drakor /></Layout>
      </Route>
      <Route path="/about">
        <Layout><About /></Layout>
      </Route>
      <Route path="/admin">
        <Layout><Admin /></Layout>
      </Route>

      {/* Community pages */}
      <Route path="/profile">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/profile/:username">
        <Layout><Profile /></Layout>
      </Route>
      <Route path="/birthday">
        <Layout><Birthday /></Layout>
      </Route>
      <Route path="/rules">
        <Layout><Rules /></Layout>
      </Route>
      <Route path="/activity">
        <Layout><Activity /></Layout>
      </Route>
      <Route path="/shoutout">
        <Layout><Shoutout /></Layout>
      </Route>
      <Route path="/moodboard">
        <Layout><Moodboard /></Layout>
      </Route>
      <Route path="/capsule">
        <Layout><Capsule /></Layout>
      </Route>
      <Route path="/qa">
        <Layout><QA /></Layout>
      </Route>
      <Route path="/playlist">
        <Layout><Playlist /></Layout>
      </Route>
      <Route path="/meme">
        <Layout><Meme /></Layout>
      </Route>
      <Route path="/quote">
        <Layout><Quote /></Layout>
      </Route>
      <Route path="/fanfic">
        <Layout><Fanfic /></Layout>
      </Route>
      <Route path="/stickers">
        <Layout><Stickers /></Layout>
      </Route>
      <Route path="/hall-of-fame">
        <Layout><HallOfFame /></Layout>
      </Route>
      <Route path="/stats">
        <Layout><Stats /></Layout>
      </Route>
      <Route path="/milestones">
        <Layout><Milestones /></Layout>
      </Route>
      <Route path="/diary">
        <Layout><Diary /></Layout>
      </Route>
      <Route path="/apipi">
        <Layout><Apipi /></Layout>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function SeedData() {
  useEffect(() => {
    fetch('/api/members')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length === 0) {
          const starterMembers = [
            { name: 'iyuyun', nickname: 'Founder', role: 'admin', isActive: true, bio: 'Creator of the Universe', joinDate: '2025-11-30' },
            { name: 'Alice', nickname: 'Al', role: 'member', isActive: true, bio: 'Stargazer', joinDate: '2025-11-28' },
            { name: 'Bob', nickname: 'Bobby', role: 'member', isActive: true, bio: 'Moonwalker', joinDate: '2025-11-28' },
            { name: 'Charlie', nickname: 'Chuck', role: 'member', isActive: true, bio: 'Comet Chaser', joinDate: '2025-11-29' },
            { name: 'Dave', nickname: 'D', role: 'member', isActive: false, bio: 'Lost in space', kickReason: 'Inactive', kickDate: '2025-12-01' }
          ];
          starterMembers.forEach(member => {
            fetch('/api/members', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(member)
            }).catch(console.error);
          });
        }
      })
      .catch(console.error);
  }, []);

  return null;
}

function AppInit() {
  const initAuth = useAuthStore((s) => s.initAuth);
  const { user } = useAuthStore();
  
  useEffect(() => { initAuth(); }, []);

  // Update lastSeen on load
  useEffect(() => {
    if (user?.username) {
      fetch('/api/users/seen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user.username }),
      }).catch(() => {});
    }
  }, [user?.username]);

  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AppInit />
          <SeedData />
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
