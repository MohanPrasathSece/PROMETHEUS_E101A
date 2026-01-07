import { WorkItem } from '@/lib/types';
import { cn } from '@/lib/utils';
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  Calendar, 
  CheckSquare 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface WorkItemRowProps {
  item: WorkItem;
  onClick?: () => void;
}

export function WorkItemRow({ item, onClick }: WorkItemRowProps) {
  const getItemIcon = (type: WorkItem['type']) => {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'message':
        return <MessageSquare className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'task':
        return <CheckSquare className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div 
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-accent/50",
        !item.isRead && "bg-primary/5"
      )}
      onClick={onClick}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground">
        {getItemIcon(item.type)}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className={cn(
            "text-sm truncate",
            !item.isRead && "font-medium"
          )}>
            {item.title}
          </h4>
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatDistanceToNow(item.timestamp, { addSuffix: true })}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{item.source}</p>
        {item.preview && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {item.preview}
          </p>
        )}
      </div>

      {!item.isRead && (
        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
      )}
    </div>
  );
}
