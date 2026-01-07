import axios from 'axios';
import { WorkItemModel } from '../models/WorkItem';
import { WorkThreadModel } from '../models/WorkThread';
import { UserModel } from '../models/User';

export class IntegrationService {

    /**
     * Sync data from Google Calendar and Tasks
     */
    static async syncGoogle(userId: string, accessToken: string) {
        try {
            // 1. Fetch Calendar Events (Next 7 days)
            const now = new Date();
            const nextWeek = new Date(now);
            nextWeek.setDate(now.getDate() + 7);

            const calendarRes = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    timeMin: now.toISOString(),
                    timeMax: nextWeek.toISOString(),
                    singleEvents: true,
                    orderBy: 'startTime'
                }
            });

            // 2. Fetch Tasks (Default List)
            const tasksRes = await axios.get('https://www.googleapis.com/tasks/v1/lists/@default/tasks', {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: {
                    showCompleted: false,
                    showHidden: false
                }
            });

            // 3. Find or Create "External Imports" Thread
            let importThread = await WorkThreadModel.findOne({ userId, title: 'External Imports' });
            if (!importThread) {
                importThread = new WorkThreadModel({
                    userId,
                    title: 'External Imports',
                    description: 'Items imported from Google Calendar, Tasks, and Notion',
                    priority: 'medium',
                    progress: 0,
                    deadline: nextWeek,
                    tags: ['Imported', 'External']
                });
                await importThread.save();
            }

            let newItemsCount = 0;

            // 4. Process Events
            const events = calendarRes.data.items || [];
            for (const event of events) {
                const existing = await WorkItemModel.findOne({
                    userId,
                    'metadata.externalId': event.id
                });

                if (!existing && event.summary) {
                    await WorkItemModel.create({
                        userId,
                        threadId: importThread.id,
                        type: 'calendar',
                        title: event.summary,
                        preview: event.description || 'Imported from Google Calendar',
                        source: 'Google Calendar',
                        timestamp: event.start.dateTime || event.start.date,
                        metadata: {
                            externalId: event.id,
                            link: event.htmlLink,
                            startTime: event.start.dateTime || event.start.date,
                            endTime: event.end.dateTime || event.end.date,
                            status: event.status
                        }
                    });
                    newItemsCount++;
                }
            }

            // 5. Process Tasks
            const tasks = tasksRes.data.items || [];
            for (const task of tasks) {
                const existing = await WorkItemModel.findOne({
                    userId,
                    'metadata.externalId': task.id
                });

                if (!existing && task.title) {
                    await WorkItemModel.create({
                        userId,
                        threadId: importThread.id,
                        type: 'task',
                        title: task.title,
                        preview: task.notes || 'Imported from Google Tasks',
                        source: 'Google Tasks',
                        timestamp: task.updated ? new Date(task.updated) : new Date(),
                        metadata: {
                            externalId: task.id,
                            dueDate: task.due,
                            status: task.status
                        }
                    });
                    newItemsCount++;
                }
            }

            // 6. Update User Status
            await UserModel.findByIdAndUpdate(userId, {
                'integrations.google.connected': true,
                'integrations.google.lastSync': new Date()
            });

            return { success: true, count: newItemsCount };

        } catch (error: any) {
            console.error('Google Sync Error:', error.response?.data || error.message);
            throw new Error(error.response?.data?.error?.message || 'Failed to sync with Google');
        }
    }

    /**
     * Sync data from Notion
     */
    static async syncNotion(userId: string, apiKey: string) {
        try {
            // Find or Create "External Imports" Thread (Reuse)
            let importThread = await WorkThreadModel.findOne({ userId, title: 'External Imports' });
            if (!importThread) {
                importThread = await WorkThreadModel.create({
                    userId,
                    title: 'External Imports',
                    description: 'Items imported from Google Calendar, Tasks, and Notion',
                    priority: 'medium',
                    tags: ['Imported', 'External']
                });
            }

            // 1. Search Notion for Database Pages
            const response = await axios.post('https://api.notion.com/v1/search', {
                filter: {
                    value: 'page',
                    property: 'object'
                },
                sort: {
                    direction: 'descending',
                    timestamp: 'last_edited_time'
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Notion-Version': '2022-06-28',
                    'Content-Type': 'application/json'
                }
            });

            const pages = response.data.results || [];
            let newItemsCount = 0;

            for (const page of pages) {
                // Determine Title (Notion properties are complex)
                const titleProp = Object.values(page.properties).find((p: any) => p.type === 'title') as any;
                const title = titleProp?.title?.[0]?.plain_text;

                if (title) {
                    const existing = await WorkItemModel.findOne({
                        userId,
                        'metadata.externalId': page.id
                    });

                    if (!existing) {
                        await WorkItemModel.create({
                            userId,
                            threadId: importThread.id,
                            type: 'document',
                            title: title,
                            preview: `Imported from Notion (${page.object})`,
                            source: 'Notion',
                            metadata: {
                                externalId: page.id,
                                link: page.url
                            }
                        });
                        newItemsCount++;
                    }
                }
            }

            // Update User
            await UserModel.findByIdAndUpdate(userId, {
                'integrations.notion.connected': true,
                'integrations.notion.apiKey': apiKey,
                'integrations.notion.lastSync': new Date()
            });

            return { success: true, count: newItemsCount };

        } catch (error: any) {
            console.error('Notion Sync Error:', error.response?.data || error.message);
            throw new Error('Failed to sync with Notion. Check your API Key.');
        }
    }
}
