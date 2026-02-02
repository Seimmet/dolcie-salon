import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search, DollarSign, X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { styleService, Style, StylePricing } from "@/services/styleService";
import { categoryService, Category } from "@/services/categoryService";
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
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

const styleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  image: z.any().optional(),
});

const pricingSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Price must be a positive number",
  }),
  durationMinutes: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Duration must be a positive number",
  }),
});

type StyleFormValues = z.infer<typeof styleSchema>;
type PricingFormValues = z.infer<typeof pricingSchema>;

const Styles = () => {
  const [styles, setStyles] = useState<Style[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStyleSubmitting, setIsStyleSubmitting] = useState(false);
  const [isPricingSubmitting, setIsPricingSubmitting] = useState(false);
  
  // Search & Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Style Dialog State
  const [isStyleDialogOpen, setIsStyleDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<Style | null>(null);

  // Pricing Dialog State
  const [isPricingDialogOpen, setIsPricingDialogOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | null>(null);

  const styleForm = useForm<StyleFormValues>({
    resolver: zodResolver(styleSchema),
    defaultValues: {
      name: "",
    },
  });

  const pricingForm = useForm<PricingFormValues>({
    resolver: zodResolver(pricingSchema),
    defaultValues: {
      categoryId: "",
      price: "",
      durationMinutes: "60",
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

  // Initial load of categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await categoryService.getAllCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchStyles = async () => {
    setIsLoading(true);
    try {
      const response = await styleService.getAllStyles({
        page,
        limit: 10,
        search: debouncedSearch,
      });
      setStyles(response.data);
      setTotalPages(response.meta.totalPages);
    } catch (error) {
      toast.error("Failed to load styles");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStyles();
  }, [page, debouncedSearch]);

  const onStyleSubmit = async (data: StyleFormValues) => {
    setIsStyleSubmitting(true);
    try {
      if (editingStyle) {
        await styleService.updateStyle(editingStyle.id, data);
        toast.success("Style updated successfully");
      } else {
        await styleService.createStyle(data);
        toast.success("Style created successfully");
      }
      setIsStyleDialogOpen(false);
      fetchStyles();
    } catch (error) {
      toast.error("Failed to save style");
      console.error(error);
    } finally {
      setIsStyleSubmitting(false);
    }
  };

  const onDeleteStyle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this style?")) return;
    try {
      await styleService.deleteStyle(id);
      toast.success("Style deleted successfully");
      fetchStyles();
    } catch (error) {
      toast.error("Failed to delete style");
    }
  };

  const onPricingSubmit = async (data: PricingFormValues) => {
    if (!selectedStyle) return;
    setIsPricingSubmitting(true);
    try {
      await styleService.updateStylePricing(selectedStyle.id, {
        categoryId: data.categoryId,
        price: Number(data.price),
        durationMinutes: Number(data.durationMinutes),
      });
      toast.success("Pricing updated successfully");
      pricingForm.reset({
        categoryId: "",
        price: "",
        durationMinutes: "60",
      });
      
      // Refresh styles to get updated pricing data
      const response = await styleService.getAllStyles({
        page,
        limit: 10,
        search: debouncedSearch,
      });
      setStyles(response.data);
      
      // Update selected style in dialog
      const updatedSelectedStyle = response.data.find(s => s.id === selectedStyle.id);
      if (updatedSelectedStyle) {
        setSelectedStyle(updatedSelectedStyle);
      }
      
    } catch (error) {
      toast.error("Failed to update pricing");
      console.error(error);
    } finally {
      setIsPricingSubmitting(false);
    }
  };

  const onDeletePricing = async (categoryId: string) => {
    if (!selectedStyle) return;
    try {
      await styleService.deleteStylePricing(selectedStyle.id, categoryId);
      toast.success("Pricing removed successfully");
      
      // Refresh
      const response = await styleService.getAllStyles({
        page,
        limit: 10,
        search: debouncedSearch,
      });
      setStyles(response.data);
      
      const updatedSelectedStyle = response.data.find(s => s.id === selectedStyle.id);
      if (updatedSelectedStyle) {
        setSelectedStyle(updatedSelectedStyle);
      }
    } catch (error) {
      toast.error("Failed to remove pricing");
    }
  };

  const openPricingDialog = (style: Style) => {
    setSelectedStyle(style);
    setIsPricingDialogOpen(true);
    pricingForm.reset({
      categoryId: "",
      price: "",
      durationMinutes: "60",
    });
  };

  const openEditStyleDialog = (style: Style) => {
    setEditingStyle(style);
    styleForm.reset({ name: style.name });
    setIsStyleDialogOpen(true);
  };

  const openCreateStyleDialog = () => {
    setEditingStyle(null);
    styleForm.reset({ name: "" });
    setIsStyleDialogOpen(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Styles Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage hair styles and their pricing variations.
          </p>
        </div>
        <Button 
          onClick={openCreateStyleDialog}
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Style
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search styles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 border-purple-100 focus:border-purple-300 focus:ring-purple-200"
          />
        </div>
      </div>

      <div className="rounded-md border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-purple-50/50 hover:bg-purple-50/50">
              <TableHead>Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Variations Configured</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-purple-600" />
                  </TableCell>
                </TableRow>
              ) : styles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    {debouncedSearch ? "No styles found matching your search." : "No styles found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                styles.map((style, index) => (
                  <motion.tr
                    key={style.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                  >
                    <TableCell>
                      {style.imageUrl ? (
                        <img 
                          src={style.imageUrl} 
                          alt={style.name} 
                          className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm" 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center ring-2 ring-white shadow-sm">
                          <ImageIcon className="h-5 w-5 text-purple-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-base">{style.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700 hover:bg-purple-200">
                        {style.pricing?.length || 0} variations
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPricingDialog(style)}
                        className="hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        Pricing
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditStyleDialog(style)}
                        className="hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => onDeleteStyle(style.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create/Edit Style Dialog */}
      <Dialog open={isStyleDialogOpen} onOpenChange={setIsStyleDialogOpen}>
        <DialogContent className="max-h-[90vh] flex flex-col w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {editingStyle ? "Edit Style" : "Create Style"}
            </DialogTitle>
            <DialogDescription>
              Manage your salon styles (e.g., Knotless Braids).
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <Form {...styleForm}>
              <form onSubmit={styleForm.handleSubmit(onStyleSubmit)} className="space-y-4">
                <FormField
                  control={styleForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Knotless Braids" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={styleForm.control}
                  name="image"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Style Image (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          {...fieldProps}
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            onChange(event.target.files && event.target.files[0]);
                          }}
                          value=""
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isStyleSubmitting}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isStyleSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Style"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pricing Management Dialog */}
      <Dialog open={isPricingDialogOpen} onOpenChange={setIsPricingDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Manage Pricing: <span className="text-purple-600">{selectedStyle?.name}</span></DialogTitle>
            <DialogDescription>
              Set prices for different variations (categories) of this style.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-1">
            <div className="space-y-6">
              {/* Add New Pricing Form */}
              <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-4 text-purple-700 flex items-center gap-2">
                  <Plus className="h-4 w-4" /> Add/Update Pricing
                </h4>
                <Form {...pricingForm}>
                  <form onSubmit={pricingForm.handleSubmit(onPricingSubmit)} className="flex flex-col sm:flex-row items-end gap-4">
                    <FormField
                      control={pricingForm.control}
                      name="categoryId"
                      render={({ field }) => (
                        <FormItem className="flex-1 w-full">
                          <FormLabel>Variation (Category)</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white">
                                <SelectValue placeholder="Select variation" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {categories.map((category) => (
                                <SelectItem key={category.id} value={category.id}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-4 w-full sm:w-auto">
                      <FormField
                        control={pricingForm.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel>Price ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={pricingForm.control}
                        name="durationMinutes"
                        render={({ field }) => (
                          <FormItem className="w-24">
                            <FormLabel>Mins</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} className="bg-white" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isPricingSubmitting}
                      className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
                    >
                      {isPricingSubmitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Save"
                      )}
                    </Button>
                  </form>
                </Form>
              </div>

              {/* Existing Pricing List */}
              <div>
                <h4 className="text-sm font-medium mb-2">Current Pricing</h4>
                <div className="border rounded-md shadow-sm overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Variation</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStyle?.pricing && selectedStyle.pricing.length > 0 ? (
                        selectedStyle.pricing.map((pricing) => (
                          <TableRow key={pricing.id}>
                            <TableCell className="font-medium">{pricing.category.name}</TableCell>
                            <TableCell>${pricing.price}</TableCell>
                            <TableCell>{pricing.durationMinutes} min</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-red-600 hover:bg-red-50"
                                onClick={() => onDeletePricing(pricing.categoryId)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            No pricing configured yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Styles;
