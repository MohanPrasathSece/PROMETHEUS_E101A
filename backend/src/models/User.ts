import mongoose, { Schema, Document } from 'mongoose';
import { User as UserType, UserPreferences } from '../types';

export interface IUser extends Document, Omit<UserType, 'id'> { }

const UserPreferencesSchema = new Schema<UserPreferences>({
    workHoursStart: { type: Number, default: 9 },
    workHoursEnd: { type: Number, default: 17 },
    focusTimeGoal: { type: Number, default: 240 },
    notificationsEnabled: { type: Boolean, default: true },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'auto' }
}, { _id: false });

const UserSchema: Schema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    avatar: { type: String },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date, default: Date.now },
    preferences: { type: UserPreferencesSchema, default: () => ({}) }
});

// Use a standard MongoDB ID for all users.
UserSchema.set('toJSON', {
    transform: (doc: any, ret: any) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

export const UserModel = mongoose.model<IUser>('User', UserSchema);
