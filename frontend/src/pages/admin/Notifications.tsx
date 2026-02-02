import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Mail, MessageSquare, Edit, Check, X, Clock, History, FileText, Send, Save } from 'lucide-react';
import { 
  getTemplates, 
  updateTemplate, 
  getNotificationHistory, 
  getPendingApprovals, 
  approveNotification, 
  rejectNotification, 
  updatePendingNotification,
  NotificationTemplate, 
  Notification 
} from '@/services/notificationService';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from '@/lib/utils';

export default function Notifications() {
  const [activeTab, setActiveTab] = useState('pending');
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [history, setHistory] = useState<Notification[]>([]);
  const [pending, setPending] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();

  // Pending Edit State
  const [selectedPending, setSelectedPending] = useState<Notification | null>(null);
  const [isPendingEditDialogOpen, setIsPendingEditDialogOpen] = useState(false);
  const [pendingSubject, setPendingSubject] = useState('');
  const [pendingContent, setPendingContent] = useState('');

  // Template Form state
  const [editSubject, setEditSubject] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'history') {
        const data = await getNotificationHistory();
        setHistory(data);
      } else if (activeTab === 'pending') {
        const data = await getPendingApprovals();
        setPending(data);
      } else {
        const data = await getTemplates();
        setTemplates(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approveNotification(id);
      toast({ title: "Approved", description: "Notification has been queued for sending." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to approve notification", variant: "destructive" });
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectNotification(id);
      toast({ title: "Rejected", description: "Notification has been rejected." });
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to reject notification", variant: "destructive" });
    }
  };

  const handleEditPending = (notification: Notification) => {
    setSelectedPending(notification);
    setPendingSubject(notification.subject || '');
    setPendingContent(notification.content);
    setIsPendingEditDialogOpen(true);
  };

  const handleSavePending = async () => {
    if (!selectedPending) return;
    setSaving(true);
    try {
      await updatePendingNotification(selectedPending.id, {
        subject: pendingSubject,
        content: pendingContent
      });
      toast({ title: "Updated", description: "Notification updated successfully" });
      setIsPendingEditDialogOpen(false);
      fetchData();
    } catch (error) {
       toast({ title: "Error", description: "Failed to update notification", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (template: NotificationTemplate) => {
    setSelectedTemplate(template);
    setEditSubject(template.subject || '');
    setEditContent(template.content);
    setEditIsActive(template.isActive);
    setIsEditDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    setSaving(true);
    try {
      await updateTemplate(selectedTemplate.id, {
        subject: editSubject,
        content: editContent,
        isActive: editIsActive
      });
      
      toast({
        title: "Success",
        description: "Template updated successfully",
      });
      
      setIsEditDialogOpen(false);
      fetchData(); // Refresh list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SENT': return 'bg-green-500/10 text-green-700 border-green-200/50';
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-700 border-yellow-200/50';
      case 'FAILED': return 'bg-red-500/10 text-red-700 border-red-200/50';
      default: return 'bg-gray-500/10 text-gray-700 border-gray-200/50';
    }
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
          <h2 className="text-3xl font-bold tracking-tight font-serif">Notifications</h2>
          <p className="text-muted-foreground">Manage SMS and Email communications</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl border border-border">
          <TabsTrigger value="pending" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <Clock size={14} /> Pending Approvals
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <History size={14} /> History
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-lg gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <FileText size={14} /> Templates
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-4 mt-6">
          <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-serif">Pending Approvals</CardTitle>
              <CardDescription>Review and approve outgoing notifications</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pending.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No pending notifications</TableCell>
                        </TableRow>
                      ) : (
                        pending.map((item, index) => (
                          <motion.tr 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-border hover:bg-muted/50"
                          >
                            <TableCell className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit border-border bg-background">
                                {item.type === 'EMAIL' ? <Mail size={12} className="text-blue-500" /> : <MessageSquare size={12} className="text-green-500" />}
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{item.recipient}</TableCell>
                            <TableCell className="max-w-md">
                              <div className="font-semibold text-xs mb-1 font-serif">{item.subject}</div>
                              <div className="text-sm text-muted-foreground line-clamp-2">{item.content}</div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200" onClick={() => handleApprove(item.id)} title="Approve & Send">
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 border-border" onClick={() => handleEditPending(item)} title="Edit">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={() => handleReject(item.id)} title="Reject">
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-6">
          <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <CardTitle className="font-serif">Sent Notifications</CardTitle>
              <CardDescription>Recent emails and SMS messages sent to customers</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-border hover:bg-transparent">
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject/Preview</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No notifications found</TableCell>
                        </TableRow>
                      ) : (
                        history.map((item, index) => (
                          <motion.tr 
                            key={item.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-border hover:bg-muted/50"
                          >
                            <TableCell className="text-muted-foreground text-xs">{new Date(item.createdAt).toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit border-border bg-background">
                                {item.type === 'EMAIL' ? <Mail size={12} className="text-blue-500" /> : <MessageSquare size={12} className="text-green-500" />}
                                {item.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm">{item.recipient}</TableCell>
                            <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                              {item.subject || item.content}
                            </TableCell>
                            <TableCell>
                              <Badge className={cn("border-0 font-normal", getStatusColor(item.status))}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </motion.tr>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-8 mt-6">
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center p-8 border rounded-md bg-muted/20">
              No templates found
            </div>
          ) : (
            <AnimatePresence>
              {/* SMS Templates Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight font-serif">SMS Templates</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates
                    .filter(t => t.type === 'SMS')
                    .map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden border-border shadow-card hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
                          <CardHeader className="bg-muted/30 pb-4 border-b border-border">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2 font-serif">
                                  {template.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {template.isActive ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex items-center gap-1 w-fit">
                                      <Check size={10} /> Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit">
                                      <X size={10} /> Disabled
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(template)} className="opacity-0 group-hover:opacity-100 transition-opacity border-border hover:border-primary/50 hover:text-primary">
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 flex-1 flex flex-col">
                            <div className="flex-1">
                              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Message:</span>
                              <div className="mt-2 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-full" />
                                <p className="text-sm line-clamp-3 text-foreground pl-3 py-1">
                                  {template.content}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5 pt-4 border-t border-border">
                              {Array.isArray(template.variables) && template.variables.map((v: string) => (
                                <Badge key={v} variant="secondary" className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground font-mono">
                                  {`{${v}}`}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </motion.div>

              {/* Email Templates Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4 pt-4"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-border">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold tracking-tight font-serif">Email Templates</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {templates
                    .filter(t => t.type === 'EMAIL')
                    .map((template, index) => (
                      <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 + 0.2 }}
                      >
                        <Card className="overflow-hidden border-border shadow-card hover:shadow-lg transition-all duration-300 h-full flex flex-col group">
                          <CardHeader className="bg-muted/30 pb-4 border-b border-border">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg flex items-center gap-2 font-serif">
                                  {template.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </CardTitle>
                                <CardDescription className="mt-1">
                                  {template.isActive ? (
                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 flex items-center gap-1 w-fit">
                                      <Check size={10} /> Active
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit">
                                      <X size={10} /> Disabled
                                    </Badge>
                                  )}
                                </CardDescription>
                              </div>
                              <Button variant="outline" size="sm" onClick={() => handleEditClick(template)} className="opacity-0 group-hover:opacity-100 transition-opacity border-border hover:border-primary/50 hover:text-primary">
                                <Edit className="h-4 w-4 mr-1" /> Edit
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-4 flex-1 flex flex-col">
                            {template.subject && (
                              <div className="mb-3">
                                <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Subject:</span>
                                <p className="text-sm truncate font-medium mt-1">{template.subject}</p>
                              </div>
                            )}
                            <div className="flex-1">
                              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Content Preview:</span>
                              <div className="mt-2 relative">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20 rounded-full" />
                                <p className="text-sm line-clamp-3 text-foreground pl-3 py-1">
                                  {template.content}
                                </p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-1.5 pt-4 border-t border-border">
                              {Array.isArray(template.variables) && template.variables.map((v: string) => (
                                <Badge key={v} variant="secondary" className="text-[10px] bg-muted hover:bg-muted/80 text-muted-foreground font-mono">
                                  {`{${v}}`}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>

      {/* Pending Notification Edit Dialog */}
      <Dialog open={isPendingEditDialogOpen} onOpenChange={setIsPendingEditDialogOpen}>
        <DialogContent className="max-w-2xl border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Notification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedPending?.type === 'EMAIL' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={pendingSubject} onChange={(e) => setPendingSubject(e.target.value)} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea 
                value={pendingContent} 
                onChange={(e) => setPendingContent(e.target.value)} 
                className="min-h-[200px] font-mono text-sm resize-y"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPendingEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePending} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save & Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Edit Template: {selectedTemplate?.name.replace(/_/g, ' ').toLowerCase()}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2 p-3 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-0.5 flex-1">
                <Label className="text-base">Active Status</Label>
                <p className="text-xs text-muted-foreground">Enabled templates will be used for automated notifications</p>
              </div>
              <Switch 
                checked={editIsActive} 
                onCheckedChange={setEditIsActive} 
              />
            </div>

            {selectedTemplate?.type === 'EMAIL' && (
              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input 
                  value={editSubject} 
                  onChange={(e) => setEditSubject(e.target.value)} 
                  placeholder="Email subject..."
                />
              </div>
            )}
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Content Template</Label>
                <span className="text-xs text-muted-foreground">Supports {'{variables}'}</span>
              </div>
              <Textarea 
                value={editContent} 
                onChange={(e) => setEditContent(e.target.value)} 
                className="min-h-[200px] font-mono text-sm resize-y"
              />
            </div>

            {selectedTemplate?.variables && selectedTemplate.variables.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg border border-border">
                <span className="text-xs font-semibold text-muted-foreground block mb-2">AVAILABLE VARIABLES:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedTemplate.variables.map(v => (
                    <Badge key={v} variant="outline" className="bg-background text-xs font-mono cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => {
                        const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                        if (textarea) {
                            const start = textarea.selectionStart;
                            const end = textarea.selectionEnd;
                            const text = textarea.value;
                            const newText = text.substring(0, start) + `{${v}}` + text.substring(end);
                            setEditContent(newText);
                            // Set focus back to textarea
                            setTimeout(() => textarea.focus(), 0);
                        }
                    }}>
                      {`{${v}}`}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTemplate} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

function Save(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </svg>
    )
  }
