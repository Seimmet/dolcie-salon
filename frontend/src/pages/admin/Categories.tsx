import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Search, ChevronLeft, ChevronRight, Tags } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  // Pagination & Search states
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
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

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
    } catch (error) {
      toast.error("Failed to load categories");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const onSubmit = async (data: CategoryFormValues) => {
    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, data.name);
        toast.success("Category updated successfully");
      } else {
        await categoryService.createCategory(data.name);
        toast.success("Category created successfully");
      }
      setIsDialogOpen(false);
      fetchCategories();
    } catch (error) {
      toast.error("Failed to save category");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        await categoryService.deleteCategory(id);
        toast.success("Category deleted successfully");
        fetchCategories();
      } catch (error) {
        toast.error("Failed to delete category");
        console.error(error);
      }
    }
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    form.reset({
      name: "",
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
    });
    setIsDialogOpen(true);
  };

  // Filter and Paginate
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(debouncedSearch.toLowerCase())
  );
  
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const paginatedCategories = filteredCategories.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

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
            Variations
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage variations (e.g., Small, Medium, Large) that can be applied to styles.
          </p>
        </div>
        <Button 
          onClick={openCreateDialog} 
          className="bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Variation
        </Button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search variations..."
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
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline text-purple-600" /> Loading...
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="h-24 text-center">
                    {debouncedSearch ? "No variations found matching your search." : "No variations found. Add one to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCategories.map((category, index) => (
                  <motion.tr
                    key={category.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group hover:bg-muted/30 transition-colors border-b last:border-0"
                  >
                    <TableCell className="font-medium flex items-center gap-2">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Tags className="h-4 w-4 text-purple-600" />
                      </div>
                      {category.name}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(category)}
                        className="hover:bg-purple-50 hover:text-purple-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id)}
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
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
        <div className="flex items-center justify-end space-x-2 py-4">
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col w-[95vw]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {editingCategory ? "Edit Variation" : "Add New Variation"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the details of the variation."
                : "Create a new variation."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Small" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      editingCategory ? "Update Variation" : "Create Variation"
                    )}
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

export default Categories;
