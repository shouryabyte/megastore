import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { authErrorMessage } from "@/lib/authErrors";

const LoginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});
const VendorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  storeName: z.string().min(2, "Store name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

export function AuthPage() {
  const nav = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const login = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema), defaultValues: { email: "", password: "" } });
  const reg = useForm<z.infer<typeof RegisterSchema>>({ resolver: zodResolver(RegisterSchema), defaultValues: { name: "", email: "", password: "" } });
  const vend = useForm<z.infer<typeof VendorSchema>>({ resolver: zodResolver(VendorSchema), defaultValues: { name: "", storeName: "", email: "", password: "" } });

  return (
    <div className="container py-10">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader className="space-y-1">
            <div className="text-2xl font-bold tracking-tight">Welcome</div>
            <div className="text-sm text-muted-foreground">Sign in or create an account. Vendors require admin approval before listing products.</div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger className="flex-1" value="login">
                  Sign in
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="register">
                  Create account
                </TabsTrigger>
                <TabsTrigger className="flex-1" value="vendor">
                  Vendor
                </TabsTrigger>
              </TabsList>

              {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

              <TabsContent value="login">
                <form
                  className="mt-5 space-y-3"
                  onSubmit={login.handleSubmit(async (values) => {
                    setError(null);
                    try {
                      const res = await api.post("/auth/login", values);
                      setSession(res.data.user, res.data.accessToken);
                      nav(roleHome(res.data.user.role));
                    } catch (e: any) {
                      setError(authErrorMessage(e, "Sign in failed"));
                    }
                  })}
                >
                  <div className="space-y-1">
                    <Input placeholder="Email" autoComplete="email" {...login.register("email")} />
                    <FieldError msg={login.formState.errors.email?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Password" type="password" autoComplete="current-password" {...login.register("password")} />
                    <FieldError msg={login.formState.errors.password?.message} />
                  </div>
                  <Button className="w-full" type="submit">
                    Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  className="mt-5 space-y-3"
                  onSubmit={reg.handleSubmit(async (values) => {
                    setError(null);
                    try {
                      const res = await api.post("/auth/register", values);
                      setSession(res.data.user, res.data.accessToken);
                      nav(roleHome(res.data.user.role));
                    } catch (e: any) {
                      setError(authErrorMessage(e, "Registration failed"));
                    }
                  })}
                >
                  <div className="space-y-1">
                    <Input placeholder="Full name" autoComplete="name" {...reg.register("name")} />
                    <FieldError msg={reg.formState.errors.name?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Email" autoComplete="email" {...reg.register("email")} />
                    <FieldError msg={reg.formState.errors.email?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Password" type="password" autoComplete="new-password" {...reg.register("password")} />
                    <FieldError msg={reg.formState.errors.password?.message} />
                  </div>
                  <Button className="w-full" type="submit">
                    Create account
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="vendor">
                <form
                  className="mt-5 space-y-3"
                  onSubmit={vend.handleSubmit(async (values) => {
                    setError(null);
                    try {
                      const res = await api.post("/auth/register-vendor", values);
                      setSession(res.data.user, res.data.accessToken);
                      nav(roleHome(res.data.user.role));
                    } catch (e: any) {
                      setError(authErrorMessage(e, "Vendor registration failed"));
                    }
                  })}
                >
                  <div className="space-y-1">
                    <Input placeholder="Owner name" autoComplete="name" {...vend.register("name")} />
                    <FieldError msg={vend.formState.errors.name?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Store name" autoComplete="organization" {...vend.register("storeName")} />
                    <FieldError msg={vend.formState.errors.storeName?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Email" autoComplete="email" {...vend.register("email")} />
                    <FieldError msg={vend.formState.errors.email?.message} />
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Password" type="password" autoComplete="new-password" {...vend.register("password")} />
                    <FieldError msg={vend.formState.errors.password?.message} />
                  </div>
                  <Button className="w-full" type="submit">
                    Register vendor
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    After registration, an admin must approve your vendor account. You can still access the vendor center to complete profile details.
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function roleHome(role: string) {
  if (role === "Admin") return "/dashboard/admin";
  if (role === "Vendor") return "/dashboard/vendor/products";
  return "/products";
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <div className="text-xs font-medium text-red-200">{msg}</div>;
}
