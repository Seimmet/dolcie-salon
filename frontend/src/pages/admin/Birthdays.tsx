import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Mail, MessageSquare, Calendar, Loader2, Gift } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

import { birthdayService, User } from '@/services/birthdayService';

export default function Birthdays() {
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [sendingMap, setSendingMap] = useState<Record<string, boolean>>({}); // key: userId-type

    useEffect(() => {
        loadBirthdays();
    }, []);

    const loadBirthdays = async () => {
        try {
            setLoading(true);
            const data = await birthdayService.getUpcomingBirthdays();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to load upcoming birthdays",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSendGreeting = async (userId: string, type: 'email' | 'sms') => {
        const key = `${userId}-${type}`;
        setSendingMap(prev => ({ ...prev, [key]: true }));
        try {
            await birthdayService.sendGreeting(userId, type);
            toast({
                title: "Success",
                description: `${type === 'email' ? 'Email' : 'SMS'} greeting sent successfully!`
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to send greeting",
                variant: "destructive"
            });
        } finally {
            setSendingMap(prev => ({ ...prev, [key]: false }));
        }
    };

    const getMonthName = (month: number) => {
        return new Date(0, month - 1).toLocaleString('default', { month: 'long' });
    };

    const isToday = (day: number, month: number) => {
        const today = new Date();
        return today.getDate() === day && (today.getMonth() + 1) === month;
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
        >
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight font-serif">Birthdays</h1>
                    <p className="text-muted-foreground">Upcoming customer birthdays for this month and next.</p>
                </div>
                <Button variant="outline" onClick={loadBirthdays} disabled={loading} className="border-border hover:bg-muted/50">
                    <Calendar className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Gift className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="font-serif">Upcoming Birthdays</CardTitle>
                            <CardDescription>
                                Send automated birthday greetings to your customers.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg border border-dashed border-border">
                            <Gift className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>No upcoming birthdays found.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40">
                                    <TableRow className="hover:bg-transparent border-border">
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Birthday</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user, index) => (
                                        <motion.tr 
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="border-border hover:bg-muted/50 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="font-medium font-serif">{user.fullName}</div>
                                                <div className="text-xs text-muted-foreground">{user.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">{getMonthName(user.birthMonth!)} {user.birthDay}</span>
                                                    {isToday(user.birthDay!, user.birthMonth!) && (
                                                        <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse shadow-sm">Today!</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm font-mono text-muted-foreground">
                                                    {user.phone || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleSendGreeting(user.id, 'email')}
                                                        disabled={sendingMap[`${user.id}-email`]}
                                                        className="h-8 border-border hover:text-primary hover:border-primary/50 transition-colors"
                                                    >
                                                        {sendingMap[`${user.id}-email`] ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <Mail className="h-3.5 w-3.5 mr-1.5" />
                                                        )}
                                                        Email
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        size="sm"
                                                        onClick={() => handleSendGreeting(user.id, 'sms')}
                                                        disabled={!user.phone || sendingMap[`${user.id}-sms`]}
                                                        className="h-8 border-border hover:text-primary hover:border-primary/50 transition-colors"
                                                    >
                                                        {sendingMap[`${user.id}-sms`] ? (
                                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                            <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                                                        )}
                                                        SMS
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
