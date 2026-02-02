import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight, User, Mail, Phone, MapPin, Calendar, Users } from "lucide-react";
import { userService, User as UserType } from "@/services/userService";
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
import { format } from "date-fns";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const customerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

const Customers = () => {
  const [customers, setCustomers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<UserType | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<UserType | null>(null);
  
  // Pagination & Search states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
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

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await userService.getCustomers({
        page,
        limit: 10,
        search: debouncedSearch,
      });
      setCustomers(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Failed to fetch customers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [page, debouncedSearch]);

  const onSubmit = async (data: CustomerFormValues) => {
    try {
      if (editingCustomer) {
        // Remove password if empty during edit
        const updateData: any = { ...data };
        if (!updateData.password) delete updateData.password;
        
        await userService.updateCustomer(editingCustomer.id, updateData);
        toast.success("Customer updated successfully");
      } else {
        if (!data.password) {
            form.setError("password", { message: "Password is required for new customers" });
            return;
        }
        await userService.createCustomer(data);
        toast.success("Customer created successfully");
      }
      setIsDialogOpen(false);
      fetchCustomers();
      resetForm();
    } catch (error: any) {
      toast.error(error.message || "Failed to save customer");
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await userService.deleteCustomer(customerToDelete.id);
      toast.success("Customer deleted successfully");
      fetchCustomers();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete customer");
    } finally {
      setCustomerToDelete(null);
    }
  };

  const resetForm = () => {
    setEditingCustomer(null);
    form.reset({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
    });
  };

  const handleEdit = (customer: UserType) => {
    setEditingCustomer(customer);
    form.reset({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || "",
      address: customer.address || "",
      password: "",
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
          <h2 className="text-3xl font-bold tracking-tight font-serif text-foreground">Customer Management</h2>
          <p className="text-muted-foreground">View and manage your customer base, update details, and track engagement.</p>
        </div>
        <Button 
            onClick={() => {
                resetForm();
                setIsDialogOpen(true);
            }} 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Customer
        </Button>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
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
                  <TableHead>Contact Info</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Bookings</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" /> 
                        <span className="text-muted-foreground">Loading customers...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                        <Users className="h-8 w-8 mb-2 opacity-50" />
                        <p>{debouncedSearch ? "No customers found matching your search." : "No customers found. Add one to get started."}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  <AnimatePresence>
                    {customers.map((customer, index) => (
                      <motion.tr
                        key={customer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                              {customer.fullName.substring(0, 2).toUpperCase()}
                            </div>
                            {customer.fullName}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm space-y-1">
                              <div className="flex items-center text-muted-foreground text-xs">
                                <Mail className="h-3 w-3 mr-1" /> {customer.email}
                              </div>
                              {customer.phone && (
                                <div className="flex items-center text-muted-foreground text-xs">
                                  <Phone className="h-3 w-3 mr-1" /> {customer.phone}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground text-sm">
                          {customer.address ? (
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" /> {customer.address}
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background">
                            {customer._count?.bookings || 0} bookings
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(customer.createdAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(customer)}
                              className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setCustomerToDelete(customer)}
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col w-[95vw] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 bg-gradient-to-r from-muted/50 to-background border-b">
            <DialogTitle className="text-2xl font-serif">{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
            <DialogDescription>
              {editingCustomer 
                ? "Update customer contact details and information." 
                : "Create a new customer account manually."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="John Doe" className="pl-9" {...field} />
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
                          <Input placeholder="john@example.com" className="pl-9" {...field} />
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
                          <Input placeholder="(555) 123-4567" className="pl-9" {...field} />
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
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="123 Main St, City, State" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={editingCustomer ? "Leave blank to keep current" : "Create password"} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} className="bg-primary hover:bg-primary/90">
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!customerToDelete} onOpenChange={(open) => !open && setCustomerToDelete(null)}>
        <AlertDialogContent className="max-h-[90vh] w-[95vw] sm:max-w-lg flex flex-col p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif text-2xl">Delete Customer?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete the customer account
              {customerToDelete && <span className="font-semibold text-foreground"> for {customerToDelete.fullName}</span>} and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
                Delete Customer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Customers;
