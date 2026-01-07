import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Clock,
  Layers,
  Mail,
  MessageSquare,
  FileText,
  Calendar,
  CheckSquare,
  ChevronRight,
  Loader2
} from 'lucide-react';

import { Header } from '@/components/Header';
import { WorkThreadCard } from '@/components/WorkThreadCard';
import { PriorityRecommendationCard } from '@/components/PriorityRecommendationCard';
import { InsightCard } from '@/components/InsightCard';
import { CognitiveLoadMeter } from '@/components/CognitiveLoadMeter';
import { WorkItemRow } from '@/components/WorkItemRow';
import { CreateThreadDialog } from '@/components/CreateThreadDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/contexts/AuthContext';
import { ThreadService, IntelligenceService, WorkItemService } from '@/services/api';
import { WorkThread, WorkItem, WorkInsight, PriorityRecommendation, CognitiveLoadState } from '@/lib/types';
import { mockCognitiveLoad } from '@/lib/mock-data'; // Fallback for now

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');

  const userId = currentUser?.id;

  // Fetch Data
  const { data: threads = [], isLoading: threadsLoading } = useQuery({
    queryKey: ['threads', userId],
    queryFn: () => userId ? ThreadService.getUserThreads(userId) : Promise.resolve([]),
    enabled: !!userId
  });

  const { data: recommendations = [], isLoading: recsLoading } = useQuery({
    queryKey: ['recommendations', userId],
    queryFn: () => userId ? IntelligenceService.getRecommendations(userId) : Promise.resolve([]),
    enabled: !!userId
  });

  const { data: insights = [], isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', userId],
    queryFn: () => userId ? IntelligenceService.getInsights(userId) : Promise.resolve([]),
    enabled: !!userId
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', userId],
    queryFn: () => userId ? WorkItemService.getUserItems(userId) : Promise.resolve([]),
    enabled: !!userId
  });

  const { data: cognitiveLoad } = useQuery({
    queryKey: ['cognitiveLoad', userId],
    queryFn: () => userId ? IntelligenceService.getCognitiveLoad(userId) : Promise.resolve(null),
    enabled: !!userId
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const highPriorityCount = threads.filter((t: WorkThread) => t.priority === 'high').length;
  const criticalInsightsCount = insights.filter((i: WorkInsight) => i.severity === 'critical').length;

  const filterWorkItems = (type: string) => {
    if (type === 'all') return items;
    return items.filter((item: WorkItem) => item.type === type);
  };

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated />

      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          {/* Welcome header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-display-sm text-foreground mb-1">
                  {greeting()}, {currentUser.name?.split(' ')[0] || 'User'}
                </h1>
                <p className="text-muted-foreground">
                  You have <span className="text-foreground font-medium">{highPriorityCount} priority items</span> that need your attention today.
                </p>
              </div>

              {criticalInsightsCount > 0 && (
                <Badge variant="high" className="self-start md:self-auto">
                  <Clock className="w-3 h-3 mr-1" />
                  {criticalInsightsCount} urgent {criticalInsightsCount === 1 ? 'alert' : 'alerts'}
                </Badge>
              )}
            </div>
          </motion.div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Priority Recommendations */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    <h2 className="text-headline">Recommended Focus</h2>
                  </div>
                  <Button variant="ghost" size="sm">
                    View all
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {recsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : recommendations.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {recommendations
                      .map(rec => ({ ...rec, thread: threads.find(t => t.id === rec.threadId) }))
                      .filter(rec => rec.thread)
                      .slice(0, 2)
                      .map((rec, index: number) => (
                        <PriorityRecommendationCard
                          key={rec.threadId}
                          recommendation={rec as PriorityRecommendation & { thread: WorkThread }}
                          rank={index}
                          onSelect={() => navigate(`/thread/${rec.threadId}`)}
                        />
                      ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    No active recommendations. Good job!
                  </Card>
                )}
              </section>

              {/* Work Threads */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-muted-foreground" />
                    <h2 className="text-headline">Work Threads</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{threads.length} active</Badge>
                    <CreateThreadDialog />
                  </div>
                </div>

                {threadsLoading ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                ) : threads.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {threads.slice(0, 4).map((thread: WorkThread) => (
                      <WorkThreadCard
                        key={thread.id}
                        thread={thread}
                        onClick={() => navigate(`/thread/${thread.id}`)}
                        isHighlighted={thread.priority === 'high'}
                      />
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-4">
                      <p>No active threads found. Start by creating one!</p>
                      <CreateThreadDialog />
                    </div>
                  </Card>
                )}
              </section>

              {/* Recent Activity */}
              <section>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-headline">Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="mb-4">
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="email" className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Email</span>
                        </TabsTrigger>
                        <TabsTrigger value="message" className="flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Messages</span>
                        </TabsTrigger>
                        <TabsTrigger value="document" className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Docs</span>
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Calendar</span>
                        </TabsTrigger>
                        <TabsTrigger value="task" className="flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Tasks</span>
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value={activeTab} className="mt-0">
                        {itemsLoading ? (
                          <div className="flex justify-center p-8"><Loader2 className="animate-spin text-muted-foreground" /></div>
                        ) : (
                          <div className="space-y-1">
                            {filterWorkItems(activeTab).slice(0, 5).map((item: WorkItem) => (
                              <WorkItemRow key={item.id} item={item} />
                            ))}
                            {filterWorkItems(activeTab).length === 0 && (
                              <p className="text-center py-4 text-muted-foreground">No recent activity</p>
                            )}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cognitive Load */}
              <Card>
                <CardContent className="pt-6">
                  {/* Using mock fallback or retrieved data */}
                  <CognitiveLoadMeter load={cognitiveLoad || {
                    level: 'low',
                    score: 25,
                    factors: { activeThreads: 0, switchingFrequency: 0, workDuration: 0, pendingDeadlines: 0 }
                  }} />
                </CardContent>
              </Card>

              {/* Insights */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-headline">Insights</h2>
                  <Button variant="ghost" size="sm" onClick={() => navigate('/insights')}>
                    See all
                  </Button>
                </div>

                <div className="space-y-3">
                  {insightsLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : insights.length > 0 ? (
                    insights.map((insight: WorkInsight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                      />
                    ))
                  ) : (
                    <p className="text-center text-muted-foreground text-sm">No new insights.</p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
