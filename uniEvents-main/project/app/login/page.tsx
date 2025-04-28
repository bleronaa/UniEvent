"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null); // Shto gjendjen për gabimin

  // Lexo redirect URL-në pas hidratimit
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    console.log("searchParams:", searchParams.toString());
    console.log("redirect param:", redirect);
    if (redirect && redirect.startsWith("/events/")) {
      setRedirectUrl(redirect);
    }
  }, [searchParams]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null); // Pastro gabimin e mëparshëm

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Kontrollo për gabim specifik të kredencialeve
        if (data.error === "Kredenciale të pavlefshme") {
          setError("Keni gabim në email ose fjalëkalim");
        } else {
          setError(data.error || "Kyqja dështoi");
        }
        return;
      }

      setAuth(data.token, data.user);
      toast.success("Kyqja u krye me sukses");

      console.log("redirectUrl on submit:", redirectUrl);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else {
        router.push("/");
      }
    } catch (error) {
      setError("Kyqja dështoi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] grid grid-cols-1 md:grid-cols-2">
      {/* Left side - Image */}
      <div className="hidden md:block relative bg-gradient-to-br from-primary/10 to-primary/5">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop")',
            backgroundBlendMode: "overlay",
            opacity: 0.9,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/50 to-primary/30 flex flex-col items-center justify-center text-white p-8">
          <h2 className="text-3xl font-bold mb-4">Mirë se vini përsëri!</h2>
          <p className="text-lg text-center max-w-md">
            Bashkohuni me komunitetin tonë dhe qëndroni të lidhur me të gjitha ngjarjet emocionuese që ndodhin në kampus.
          </p>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-2">
              <LogIn className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl text-center">Kyqu</CardTitle>
            <CardDescription className="text-center">
              Futni kredencialet tuaja për të hyrë në llogarinë tuaj
              {redirectUrl && (
                <p className="text-sm text-muted-foreground mt-2">
                  Duke u kyqur për të regjistruar një event
                </p>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-6">
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
                  placeholder="Shkruani fjalëkalimin tuaj"
                  className="h-11"
                  required
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? "Duke u kyqur..." : "Kyqu"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Nuk jeni regjistruar?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Regjistrohuni
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}