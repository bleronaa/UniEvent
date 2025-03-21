"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";

export default function RegisterPage() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setAuth(data.token, data.user);
      toast.success("Registered successfully");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Image */}
      <div className="hidden md:block relative bg-gradient-to-br from-primary/10 to-primary/5">
        <div className="absolute inset-0 bg-cover bg-center" style={{ 
          backgroundImage: 'url("https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop")',
          backgroundBlendMode: 'overlay',
          opacity: 0.9
        }} />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/30 flex flex-col items-center justify-center text-white p-8">
          <h2 className="text-3xl font-bold mb-4">Bashkohuni me ne</h2>
          <p className="text-lg text-center max-w-md">
          Krijo një llogari për të zbuluar dhe marrë pjesë në ngjarje emocionuese të kampusit, për t'u lidhur me bashkëmoshatarët dhe për të qëndruar të përditësuar me aktivitetet e universitetit.
          </p>
        </div>
      </div>

      {/* Right side - Registration Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-2">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Krijo llogari</CardTitle>
            <CardDescription className="text-center">
            Futni të dhënat tuaja për të krijuar një llogari të re
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Emri</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Shkruani emrin tuaj"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Shkruani email-in tuaj"
                  className="h-11"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Fjalëkalimi</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Zgjedhni një fjalëkalim"
                  className="h-11"
                  required
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Duke u krijuar..." : "Krijo llogari"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Keni një llogari?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Kyqu
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}