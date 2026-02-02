import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Loader2, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { authService } from "@/services/authService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import weaveImage from "@/assets/gallery-weave.jpg";

const registerSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  role: z.enum(["admin", "stylist", "customer"]).default("customer"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      password: "",
      confirmPassword: "",
      role: "customer",
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await authService.register({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        password: data.password,
        role: data.role,
      });
      toast.success("Registration successful! Please login.");
      // Redirect based on role? Usually just to login or dashboard. 
      // Original code redirected to /thesalonadmin which seems specific.
      // I will redirect to login for safety.
      navigate("/login");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Something went wrong during registration";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
              Create Your Account
            </h1>
            <p className="text-muted-foreground">
              Join Hair By DOLCIE and start your hair journey
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              
              {/* Role Selection Tabs */}
              <div className="mb-6">
                <Tabs 
                  defaultValue="customer" 
                  onValueChange={(val) => form.setValue("role", val as "admin" | "stylist" | "customer")}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                    <TabsTrigger value="customer">Customer</TabsTrigger>
                    <TabsTrigger value="stylist">Stylist</TabsTrigger>
                    <TabsTrigger value="admin">Admin</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} className="h-12 border-input focus:border-gold" />
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
                      <Input type="email" placeholder="you@example.com" {...field} className="h-12 border-input focus:border-gold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 123-4567" {...field} className="h-12 border-input focus:border-gold" />
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
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main St" {...field} className="h-12 border-input focus:border-gold" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          {...field}
                          className="h-12 pr-12 border-input focus:border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          {...field}
                          className="h-12 pr-12 border-input focus:border-gold"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                variant="gold" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-8 text-center text-muted-foreground">
            Already have an account?{" "}
            <Link
              to="/thesalonadmin"
              className="text-gold hover:text-gold/80 font-medium transition-colors"
            >
              Login
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={weaveImage}
          alt="Beautiful Hair Styling"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-secondary/60" />
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="text-center">
            <h2 className="text-4xl font-serif font-bold text-secondary-foreground mb-4">
              Join Our Family
            </h2>
            <p className="text-secondary-foreground/80 max-w-md">
              Create an account to book appointments, track your visits, and receive exclusive offers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
