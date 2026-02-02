
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { galleryService, GalleryItem } from "@/services/galleryService";
import { motion, AnimatePresence } from "framer-motion";

export default function GallerySettings() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [order, setOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const data = await galleryService.getAllItems();
      if (Array.isArray(data)) {
        setItems(data);
      } else {
        console.error('Gallery items data is not an array:', data);
        setItems([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load gallery items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setOrder("0");
    setImageFile(null);
    setEditingItem(null);
  };

  const handleOpenDialog = (item?: GalleryItem) => {
    if (item) {
      setEditingItem(item);
      setTitle(item.title);
      setCategory(item.category);
      setOrder(item.order.toString());
      setImageFile(null); // Reset file input
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("category", category);
      formData.append("order", order);
      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingItem) {
        await galleryService.updateItem(editingItem.id, formData);
        toast.success("Item updated successfully");
      } else {
        if (!imageFile) {
          toast.error("Image is required for new items");
          setIsSubmitting(false);
          return;
        }
        await galleryService.createItem(formData);
        toast.success("Item created successfully");
      }

      setIsDialogOpen(false);
      fetchItems();
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await galleryService.deleteItem(id);
      toast.success("Item deleted successfully");
      fetchItems();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete item");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-border shadow-card hover:shadow-lg transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-serif text-2xl">Gallery Management</CardTitle>
            <CardDescription>
              Manage the images displayed in the "Our Portfolio" section.
            </CardDescription>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-gradient-gold hover:opacity-90 text-white shadow-md transition-all">
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-b border-border">
                  <TableHead className="w-[100px]">Image</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      No items found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="relative w-12 h-12 rounded-md overflow-hidden shadow-sm border border-border">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell className="font-medium font-serif">{item.title}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                          {item.category}
                        </span>
                      </TableCell>
                      <TableCell>{item.order}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(item)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col w-[95vw]">
              <DialogHeader>
                <DialogTitle className="font-serif text-xl">{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto px-1">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Knotless Braids"
                    required
                    className="border-input focus:border-primary"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Braids"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order">Display Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="image">Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                      required={!editingItem}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                      {imageFile ? (
                        <span className="text-sm font-medium text-primary">{imageFile.name}</span>
                      ) : (
                        <>
                           <Plus className="w-8 h-8 text-muted-foreground mb-2 mx-auto" />
                           <span className="text-sm text-muted-foreground">Click to upload image</span>
                        </>
                      )}
                    </div>
                  </div>
                  {editingItem && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Leave empty to keep existing image.
                    </p>
                  )}
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-gradient-gold hover:opacity-90 text-white shadow-md" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Save Item
                  </Button>
                </DialogFooter>
              </form>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  );
}
