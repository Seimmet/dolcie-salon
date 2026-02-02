import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight, User, Mail, Phone, MapPin, Award, Scissors } from "lucide-react";
import { stylistService, Stylist } from "@/services/stylistService";
import { styleService, Style } from "@/services/styleService";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const stylistSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
  skillLevel: z.string().min(1, "Skill level is required"),
  surcharge: z.coerce.number().min(0, "Surcharge must be positive").default(0),
  styleSurcharges: z.record(z.string(), z.coerce.number()).default({}),
  isActive: z.boolean().default(true),
  styleIds: z.array(z.string()).default([]),
});

type StylistFormValues = z.infer<typeof stylistSchema>;

const Stylists = () => {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [availableStyles, setAvailableStyles] = useState<Style[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStylist, setEditingStylist] = useState<Stylist | null>(null);
  
  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const form = useForm<StylistFormValues>({
    resolver: zodResolver(stylistSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      skillLevel: "Intermediate",
      surcharge: 0,
      isActive: true,
      styleIds: [],
      styleSurcharges: {},
    },
  });

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchStylists = async () => {
    setIsLoading(true);
    try {
      const response = await stylistService.getAllStylists({
        page,
        limit: 10,
        search: debouncedSearch,
      });
      setStylists(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Failed to fetch stylists");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStylists();
    fetchStyles();
  }, [page, debouncedSearch]);

  const fetchStyles = async () => {
      try {
          const res = await styleService.getAllStyles({ limit: 100 });
          setAvailableStyles(res.data);
      } catch (error) {
          console.error("Failed to load styles", error);
      }
  };

  const onSubmit = async (data: StylistFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingStylist) {
        // Remove password if empty during edit
        const updateData = { ...data };
        if (!updateData.password) delete updateData.password;
        
        await stylistService.updateStylist(editingStylist.id, updateData);
        toast.success("Stylist updated successfully");
      } else {
        if (!data.password) {
            form.setError("password", { message: "Password is required for new stylists" });
            setIsSubmitting(false);
            return;
        }
        await stylistService.createStylist(data);
        toast.success("Stylist created successfully");
      }
      setIsDialogOpen(false);
      fetchStylists();
      form.reset();
      setEditingStylist(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to save stylist");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this stylist? This action cannot be undone.")) {
      try {
        await stylistService.deleteStylist(id);
        toast.success("Stylist deleted successfully");
        fetchStylists();
      } catch (error) {
        toast.error("Failed to delete stylist");
      }
    }
  };

  const handleEdit = (stylist: Stylist) => {
    setEditingStylist(stylist);
    form.reset({
      fullName: stylist.fullName,
      email: stylist.email,
      phone: stylist.phone || "",
      address: stylist.address || "",
      password: "",
      skillLevel: stylist.skillLevel,
      surcharge: Number(stylist.surcharge) || 0,
      styleSurcharges: stylist.styleSurcharges || {},
      isActive: stylist.isActive,
      styleIds: stylist.styles?.map(s => s.id) || [],
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingStylist(null);
    form.reset({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      skillLevel: "Intermediate",
      surcharge: 0,
      isActive: true,
      styleIds: [],
      styleSurcharges: {},
    });
    setIsDialogOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground">Stylists Management</h2>
          <p className="text-muted-foreground">Manage your team of stylists, their profiles, and capabilities.</p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Stylist
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search stylists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 bg-background/50"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-t border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Skill Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> 
                        <span className="text-muted-foreground">Loading stylists...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : stylists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <User className="h-8 w-8 mb-2 opacity-50" />
                        <p>{debouncedSearch ? "No stylists found matching your search." : "No stylists found. Add one to get started."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {stylists.map((stylist, index) => (
                      <motion.tr
                        key={stylist.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {stylist.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            {stylist.fullName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm space-y-1">
                            <div className="flex items-center text-muted-foreground text-xs">
                              <Mail className="h-3 w-3 mr-1" /> {stylist.email}
                            </div>
                            {stylist.phone && (
                              <div className="flex items-center text-muted-foreground text-xs">
                                <Phone className="h-3 w-3 mr-1" /> {stylist.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background">
                            {stylist.skillLevel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {stylist.isActive ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-none shadow-none">Active</Badge>
                          ) : (
                            <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-200 border-none shadow-none">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(stylist)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(stylist.id)}
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <div className="text-sm font-medium text-muted-foreground">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Stylist Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-muted/50 to-background border-b">
            <DialogTitle className="text-2xl font-serif">
              {editingStylist ? "Edit Stylist" : "Add New Stylist"}
            </DialogTitle>
            <DialogDescription>
              {editingStylist
                ? "Update the stylist's profile details and capabilities."
                : "Create a new stylist account. Credentials will be used for login."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-5">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Jane Doe" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input type="email" placeholder="jane@example.com" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input placeholder="1234567890" className="pl-9" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address (Optional)</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="123 Salon St" className="pl-9" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="skillLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Skill Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="pl-9 relative">
                                <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Junior">Junior</SelectItem>
                              <SelectItem value="Intermediate">Intermediate</SelectItem>
                              <SelectItem value="Senior">Senior</SelectItem>
                              <SelectItem value="Master">Master</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     
                     <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{editingStylist ? "New Password (Optional)" : "Password"}</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder={editingStylist ? "Leave blank to keep current" : "******"} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {form.watch("fullName")?.toLowerCase().includes("victoria") && (
                      <FormField
                        control={form.control}
                        name="surcharge"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Surcharge ($)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <DialogDescription>Extra fee applied to bookings for this stylist (Victoria only).</DialogDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {editingStylist && (
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Active Status</FormLabel>
                            <DialogDescription>
                              Stylist can accept bookings and login
                            </DialogDescription>
                          </div>
                          <FormControl>
                            <div className="flex items-center space-x-2">
                               <Button
                                 type="button"
                                 variant={field.value ? "default" : "outline"}
                                 size="sm"
                                 onClick={() => field.onChange(true)}
                                 className={field.value ? "bg-green-600 hover:bg-green-700" : ""}
                               >
                                 Active
                               </Button>
                               <Button
                                 type="button"
                                 variant={!field.value ? "destructive" : "outline"}
                                 size="sm"
                                 onClick={() => field.onChange(false)}
                                 className={!field.value ? "bg-red-600 hover:bg-red-700" : ""}
                               >
                                 Inactive
                               </Button>
                            </div>
                          </FormControl>
                        </FormItem>
                      )}
                  />
                  )}

                  <FormField
                    control={form.control}
                    name="styleIds"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel className="text-base flex items-center gap-2">
                            <Scissors className="h-4 w-4" /> Capable Styles
                          </FormLabel>
                          <DialogDescription>
                            Select the styles this stylist can perform.
                          </DialogDescription>
                        </div>
                        <div className="grid grid-cols-2 gap-2 border p-4 rounded-md h-40 overflow-y-auto bg-muted/10">
                          {availableStyles.map((style) => (
                            <FormField
                              key={style.id}
                              control={form.control}
                              name="styleIds"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={style.id}
                                    className="flex flex-row items-start space-x-3 space-y-0 p-2 hover:bg-muted/30 rounded transition-colors"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(style.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...(field.value || []), style.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== style.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="font-normal cursor-pointer text-sm w-full">
                                      {style.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("fullName")?.toLowerCase().includes("victoria") && form.watch("styleIds")?.length > 0 && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="mb-2">
                        <FormLabel className="text-base">Style-Specific Surcharges</FormLabel>
                        <DialogDescription>
                           Set specific surcharge amounts for each style (overrides global surcharge).
                        </DialogDescription>
                      </div>
                      <div className="grid grid-cols-2 gap-4 max-h-40 overflow-y-auto pr-2">
                        {form.watch("styleIds").map(styleId => {
                          const style = availableStyles.find(s => s.id === styleId);
                          if (!style) return null;
                          return (
                            <FormField
                              key={`surcharge-${styleId}`}
                              control={form.control}
                              name={`styleSurcharges.${styleId}`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs truncate block" title={style.name}>{style.name}</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      min="0" 
                                      step="0.01" 
                                      placeholder="0.00" 
                                      {...field} 
                                      onChange={e => field.onChange(parseFloat(e.target.value))}
                                      className="h-8 text-sm"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter className="pt-4 border-t">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {editingStylist ? "Update Stylist" : "Create Stylist"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Stylists;
