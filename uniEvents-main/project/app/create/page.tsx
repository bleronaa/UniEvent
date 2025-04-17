"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();

  if (!user) {
    router.push("/login");
    return <div className="text-center py-10">Redirecting to login...</div>;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
  
    const formData = new FormData(event.currentTarget);
  
    // Shto datën dhe organizerin në formData
    if (date) formData.append("date", date.toISOString());
    formData.append("organizer", user!.id);
  
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`, // mos vendos Content-Type
        },
        body: formData,
      });
  
      if (!res.ok) throw new Error("Failed to create event");
  
      toast.success("Event created successfully");
      router.push("/");
    } catch (error) {
      toast.error("Failed to create event");
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <>
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Krijo një event të ri</CardTitle>
          <CardDescription>Plotësoni detajet për eventin tuaj të ri</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label htmlFor="category">Kategoria</Label>
            <select
              id="category"
              name="category"
              required
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="Inxh.Kompjuterike">Inxh.Kompjuterike</option>
              <option value="Inxh.Mekanike">Inxh.Mekanike</option>
            </select>
          </div>

        

            <div className="space-y-2">
              <Label htmlFor="title">Titulli i eventit</Label>
              <Input
                id="title"
                name="title"
                placeholder="Shkruani titullin e eventit"
                required
              />
            </div>

            
            
            <div className="space-y-2">
              <Label htmlFor="description">Përshkrimi</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Përshkruani eventin tuaj"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Zgjedhni datën"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Lokacioni</Label>
              <Input
                id="location"
                name="location"
                placeholder="Lokacioni i eventit"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Kapaciteti</Label>
              <Input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                placeholder="Numri maksimal i pjesëmarrësve"
              />
            </div>

            <div className="space-y-2">
            <Label htmlFor="image">Ngarko një foto (opsionale)</Label>
            <Input id="image" name="image" type="file" accept="image/*" />
          </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Duke u krijuar..." : "Krijo eventin"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    <Footer/>
    </>
  );
}
