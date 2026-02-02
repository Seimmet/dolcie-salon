import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useOutletContext } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Camera, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authService, User } from "@/services/authService";
import { userService } from "@/services/userService";
import { motion } from "framer-motion";

const profileSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface DashboardContext {
  setUser: (user: User) => void;
}

const Profile = () => {
  const { setUser: setGlobalUser } = useOutletContext<DashboardContext>();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      birthDay: "",
      birthMonth: "",
      password: "",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userData = await authService.getMe();
        
        setUser(userData);
        setGlobalUser(userData);
        
        form.reset({
          fullName: userData.fullName ?? "",
          email: userData.email ?? "",
          phone: userData.phone ?? "",
          address: userData.address ?? "",
          birthDay: userData.birthDay ? userData.birthDay.toString() : "",
          birthMonth: userData.birthMonth ? userData.birthMonth.toString() : "",
          password: "",
        });
        
        if (userData.profileImage) {
          setPreviewImage(userData.profileImage);
        }
      } catch (error) {
        toast.error("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.address) formData.append("address", data.address);
      if (data.birthDay) formData.append("birthDay", data.birthDay);
      if (data.birthMonth) formData.append("birthMonth", data.birthMonth);
      if (data.password) formData.append("password", data.password);
      if (selectedFile) formData.append("profileImage", selectedFile);

      const updatedUser = await userService.updateProfile(formData);
      
      setUser(updatedUser);
      setGlobalUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      toast.success("Profile updated successfully");
      form.setValue("password", "");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Profile Photo Section */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-gold flex items-center justify-center overflow-hidden border-2 border-white shadow-lg">
                {previewImage ? (
                  <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10 text-secondary" />
                )}
              </div>
              <label 
                htmlFor="profile-image-upload"
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-espresso-light transition-colors cursor-pointer shadow-md"
              >
                <Camera className="w-4 h-4" />
                <input 
                  id="profile-image-upload" 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageChange}
                />
              </label>
            </div>
            <div>
              <h3 className="text-xl font-serif font-semibold text-foreground">
                {user?.fullName}
              </h3>
              <p className="text-sm text-muted-foreground">
                {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form Section */}
        <div className="bg-card rounded-xl border border-border shadow-card p-6">
          <h3 className="text-lg font-serif font-semibold text-foreground mb-6">
            Personal Information
          </h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} className="h-12 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="john@example.com" {...field} className="h-12 bg-background" />
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
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 000-0000" {...field} className="h-12 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St, City, Country" {...field} className="h-12 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="birthMonth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Month</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-background">
                            <SelectValue placeholder="Select month" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                            <SelectItem key={month} value={month.toString()}>
                              {new Date(0, month - 1).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="birthDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Birth Day</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-12 bg-background">
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <SelectItem key={day} value={day.toString()}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t border-border">
                <h3 className="mb-4 text-lg font-serif font-medium">Security</h3>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Leave blank to keep current password" {...field} className="h-12 bg-background" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-gold hover:bg-gold-dark text-secondary font-semibold h-12 px-8"
                >
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};

export default Profile;
