import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, CheckSquare, FileText, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function IntegrationsPage() {
    const { currentUser } = useAuth();
    const [googleSyncing, setGoogleSyncing] = useState(false);
    const [notionSyncing, setNotionSyncing] = useState(false);
    const [notionKey, setNotionKey] = useState('');

    const loginToGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setGoogleSyncing(true);
            try {
                await axios.post(`${API_URL}/integrations/${currentUser?.id}/google/sync`, {
                    accessToken: tokenResponse.access_token
                });
                toast.success('Successfully synced Google Calendar & Tasks!');
            } catch (error) {
                console.error('Google Sync Error:', error);
                toast.error('Failed to sync google data.');
            } finally {
                setGoogleSyncing(false);
            }
        },
        scope: 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly',
        onError: () => toast.error('Google Login Failed')
    });

    const handleNotionSync = async () => {
        if (!notionKey.trim()) {
            toast.error('Please enter a Notion Integration Token');
            return;
        }
        setNotionSyncing(true);
        try {
            await axios.post(`${API_URL}/integrations/${currentUser?.id}/notion/sync`, {
                apiKey: notionKey
            });
            toast.success('Successfully synced Notion pages!');
            setNotionKey('');
        } catch (error) {
            console.error('Notion Sync Error:', error);
            toast.error('Failed to sync Notion data.');
        } finally {
            setNotionSyncing(false);
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-8 max-w-5xl">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
                <p className="text-muted-foreground">Connect your external tools to bring all your work into Monocle.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Google Integration */}
                <Card className="border-t-4 border-t-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <CardTitle>Google Workspace</CardTitle>
                                <CardDescription>Sync Calendar events and Tasks</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-secondary/50 p-4 rounded-lg space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Import meetings as work items</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                                <span>Import tasks from Google Tasks</span>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={() => loginToGoogle()}
                            disabled={googleSyncing}
                        >
                            {googleSyncing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : 'Connect & Sync'}
                        </Button>
                    </CardFooter>
                </Card>

                {/* Notion Integration */}
                <Card className="border-t-4 border-t-zinc-800 dark:border-t-zinc-400 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                                <FileText className="w-6 h-6 text-zinc-700 dark:text-zinc-300" />
                            </div>
                            <div>
                                <CardTitle>Notion</CardTitle>
                                <CardDescription>Import pages from your workspace</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Integration Token</label>
                            <Input
                                type="password"
                                placeholder="secret_..."
                                value={notionKey}
                                onChange={(e) => setNotionKey(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Paste your Internal Integration Secret from Notion Developers.
                            </p>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={handleNotionSync}
                            disabled={notionSyncing}
                        >
                            {notionSyncing ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Syncing...
                                </>
                            ) : 'Sync Notion Pages'}
                        </Button>
                    </CardFooter>
                </Card>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-200 dark:border-blue-800 flex gap-3 text-sm text-blue-800 dark:text-blue-300">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>
                    Synced items will appear in a new thread called <strong>"External Imports"</strong>.
                    You can then drag-and-drop them to other projects or convert them into tasks.
                </p>
            </div>
        </div>
    );
}
