import mongoose, { Schema, Document } from 'mongoose';
import { WorkItem as WorkItemType } from '../types';

export interface IWorkItem extends Document, Omit<WorkItemType, 'id'> { }

const WorkItemSchema: Schema = new Schema({
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ['email', 'message', 'document', 'calendar', 'task'], required: true },
    title: { type: String, required: true },
    source: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    preview: { type: String },
    isRead: { type: Boolean, default: false },
    threadId: { type: String, index: true },
    metadata: { type: Map, of: Schema.Types.Mixed }
});

WorkItemSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const WorkItemModel = mongoose.model<IWorkItem>('WorkItem', WorkItemSchema);
