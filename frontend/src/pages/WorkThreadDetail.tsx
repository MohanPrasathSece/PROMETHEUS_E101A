import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { WorkItemRow } from '@/components/WorkItemRow';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  Users,
  Calendar,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { ThreadService, WorkItemService } from '@/services/api';
import { WorkThread, WorkItem } from '@/lib/types';

export default function WorkThreadDetail() {
  const { threadId } = useParams<{ threadId: string }>();
  const navigate = useNavigate();

  const { data: thread, isLoading: threadLoading } = useQuery({
    queryKey: ['thread', threadId],
    queryFn: () => threadId ? ThreadService.get(threadId) : Promise.reject('No ID'),
    enabled: !!threadId
  });

  const { data: threadItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['threadItems', threadId],
    queryFn: () => threadId ? WorkItemService.getThreadItems(threadId) : Promise.resolve([]),
    enabled: !!threadId
  });

  if (threadLoading) {
    return (
      <div className="min-h-screen bg-background text-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
        <p className="mt-4 text-muted-foreground">Loading thread...</p>
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-background">
        <Header isAuthenticated />
        <main className="pt-24 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-display-sm mb-4">Thread not found</h1>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated />

      <main className="pt-20 pb-12 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Back button */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </motion.div>

          {/* Thread header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getPriorityVariant(thread.priority)}>
                    {thread.priority} priority
                  </Badge>
                  {thread.tags?.map((tag: string) => (
                    <Badge key={tag} variant="source">{tag}</Badge>
                  ))}
                </div>
                <h1 className="text-display-sm text-foreground">{thread.title}</h1>
                {thread.description && (
                  <p className="text-lg text-muted-foreground mt-2">{thread.description}</p>
                )}
              </div>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="w-5 h-5" />
              </Button>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              {thread.deadline && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>Due {formatDistanceToNow(new Date(thread.deadline), { addSuffix: true })}</span>
                </div>
              )}
              {thread.relatedPeople && thread.relatedPeople.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{thread.relatedPeople.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>Last activity {formatDistanceToNow(new Date(thread.lastActivity), { addSuffix: true })}</span>
              </div>
            </div>
          </motion.div>

          {/* Progress */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm text-muted-foreground">{thread.progress}% complete</span>
                </div>
                <Progress value={thread.progress} className="h-2" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Related items */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-headline flex items-center justify-between">
                  <span>Related Items</span>
                  <Badge variant="outline">{threadItems.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {itemsLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-muted-foreground" /></div>
                  ) : threadItems.length > 0 ? (
                    threadItems.map((item: WorkItem) => (
                      <WorkItemRow key={item.id} item={item} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No items in this thread yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-center gap-3"
          >
            <Button variant="default">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as complete
            </Button>
            <Button variant="outline">
              Add related item
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
