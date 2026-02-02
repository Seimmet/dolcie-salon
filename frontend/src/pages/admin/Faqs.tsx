import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  MoveUp, 
  MoveDown,
  Loader2,
  HelpCircle,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { faqService, Faq } from '@/services/faqService';
import { settingsService } from '@/services/settingsService';
import { motion, AnimatePresence } from "framer-motion";

export default function Faqs() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<Faq | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Form states
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [showFaqSection, setShowFaqSection] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // Fetch Settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const data = await settingsService.getSettings();
        setShowFaqSection(data.showFaqSection ?? true);
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setIsSettingsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // Fetch FAQs
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ['faqs'],
    queryFn: faqService.getAllFaqs,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: faqService.createFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setIsCreateOpen(false);
      resetForm();
      toast.success("FAQ created successfully");
    },
    onError: () => toast.error("Failed to create FAQ"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; faq: Partial<Faq> }) => 
      faqService.updateFaq(data.id, data.faq),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setEditingFaq(null);
      resetForm();
      toast.success("FAQ updated successfully");
    },
    onError: () => toast.error("Failed to update FAQ"),
  });

  const deleteMutation = useMutation({
    mutationFn: faqService.deleteFaq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
      setDeletingId(null);
      toast.success("FAQ deleted successfully");
    },
    onError: () => toast.error("Failed to delete FAQ"),
  });

  const settingsMutation = useMutation({
    mutationFn: settingsService.updateSettings,
    onSuccess: (data) => {
      setShowFaqSection(data.showFaqSection ?? true);
      toast.success("Settings updated successfully");
    },
    onError: () => toast.error("Failed to update settings"),
  });

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setIsActive(true);
  };

  const handleEdit = (faq: Faq) => {
    setEditingFaq(faq);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setIsActive(faq.isActive);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFaq) {
      updateMutation.mutate({
        id: editingFaq.id,
        faq: { question, answer, isActive }
      });
    } else {
      createMutation.mutate({ question, answer, isActive });
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === faqs.length - 1) return;

    const newFaqs = [...faqs];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap
    [newFaqs[index], newFaqs[targetIndex]] = [newFaqs[targetIndex], newFaqs[index]];
    
    // Optimistic update could happen here, but we'll just call API
    const orderedIds = newFaqs.map(f => f.id);
    try {
      await faqService.reorderFaqs(orderedIds);
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    } catch (error) {
      toast.error("Failed to reorder FAQs");
    }
  };

  const handleToggleSection = (checked: boolean) => {
    settingsMutation.mutate({ showFaqSection: checked });
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
          <h1 className="text-3xl font-bold tracking-tight font-serif">FAQ Management</h1>
          <p className="text-muted-foreground">Manage frequently asked questions and answers.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add FAQ
        </Button>
      </div>

      <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-serif">Global Settings</CardTitle>
              <CardDescription>Control the visibility of the FAQ section on the home page.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 p-4 bg-muted/20 rounded-lg border border-border">
            <Switch 
              id="show-faq" 
              checked={showFaqSection}
              onCheckedChange={handleToggleSection}
              disabled={isSettingsLoading || settingsMutation.isPending}
            />
            <div className="flex-1">
              <Label htmlFor="show-faq" className="font-medium">Show FAQ Section</Label>
              <p className="text-sm text-muted-foreground">
                When enabled, the FAQ section will be visible to all visitors on the landing page.
              </p>
            </div>
            {settingsMutation.isPending && <Loader2 className="h-4 w-4 animate-spin ml-2 text-primary" />}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
            <HelpCircle className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-muted-foreground font-medium">No FAQs found.</p>
            <p className="text-sm text-muted-foreground">Create your first question to get started.</p>
          </div>
        ) : (
          <AnimatePresence mode='popLayout'>
            {faqs.map((faq, index) => (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-border shadow-sm hover:shadow-md transition-all duration-200 group">
                  <div className="p-4 flex items-start gap-4">
                    <div className="flex flex-col gap-1 mt-1 opacity-50 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-primary/10 hover:text-primary" 
                        disabled={index === 0}
                        onClick={() => handleMove(index, 'up')}
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 hover:bg-primary/10 hover:text-primary"
                        disabled={index === faqs.length - 1}
                        onClick={() => handleMove(index, 'down')}
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-primary/10 rounded-md text-primary">
                          <HelpCircle className="h-3.5 w-3.5" />
                        </div>
                        <h3 className="font-semibold font-serif text-lg">{faq.question}</h3>
                        {!faq.isActive ? (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full border border-yellow-200">
                            <EyeOff className="h-3 w-3" /> Hidden
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-medium bg-green-100 text-green-800 px-2 py-0.5 rounded-full border border-green-200 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Eye className="h-3 w-3" /> Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line pl-8 border-l-2 border-border/50 ml-2.5">
                        {faq.answer}
                      </p>
                    </div>

                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="outline" size="icon" onClick={() => handleEdit(faq)} className="h-8 w-8 border-border hover:border-primary/50 hover:text-primary">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => setDeletingId(faq.id)} className="h-8 w-8 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingFaq} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingFaq(null);
        }
      }}>
        <DialogContent className="sm:max-w-[500px] border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editingFaq ? 'Edit FAQ' : 'Create New FAQ'}</DialogTitle>
            <DialogDescription>
              Add a question and answer for your customers.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input 
                id="question" 
                value={question} 
                onChange={(e) => setQuestion(e.target.value)} 
                placeholder="e.g., What are your opening hours?"
                required
                className="font-medium"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea 
                id="answer" 
                value={answer} 
                onChange={(e) => setAnswer(e.target.value)} 
                placeholder="Enter the answer here..."
                className="min-h-[120px] resize-none"
                required
              />
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border">
              <div className="space-y-0.5">
                <Label htmlFor="active" className="text-base">Active Status</Label>
                <p className="text-xs text-muted-foreground">Visible to customers on the website</p>
              </div>
              <Switch 
                id="active" 
                checked={isActive} 
                onCheckedChange={setIsActive} 
              />
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => {
                setIsCreateOpen(false);
                setEditingFaq(null);
              }}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingFaq ? 'Save Changes' : 'Create FAQ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent className="border-border shadow-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this FAQ.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingId && deleteMutation.mutate(deletingId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
