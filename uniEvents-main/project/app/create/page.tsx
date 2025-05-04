"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/footer";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<string | null>(null);

  // Kontroll i hershëm për autentikim
  if (!user) {
    router.push("/login");
    return null; // Kthen null për të shmangur renderimin e panevojshëm
  }

  // Funksion për të trajtuar ndryshimin e kohës dhe validimin
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (timeRegex.test(value) || value === "") {
      setTime(value);
    } else {
      setTime(null);
      toast.error("Ju lutem vendosni një kohë të vlefshme (HH:mm)");
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    // Kombino datën dhe kohën në një datë të vetme
    if (date && time) {
      const [hours, minutes] = time.split(":").map(Number);
      const fullDate = new Date(date);
      fullDate.setHours(hours);
      fullDate.setMinutes(minutes);
      formData.append("date", fullDate.toISOString());
    } else {
      toast.error("Ju lutem zgjidhni datën dhe kohën për eventin");
      setLoading(false);
      return;
    }

    if (user && user.id) {
      formData.append("organizer", user.id);
    } else {
      toast.error("Përdoruesi nuk është i vlefshëm");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-id": user.id,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Dështoi krijimi i eventit");
      }

      toast.success("Eventi u krijua me sukses dhe përdoruesit u njoftuan!");
      router.push("/");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Dështoi krijimi i eventit"
      );
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
            <CardDescription>
              Plotësoni detajet për eventin tuaj të ri
            </CardDescription>
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
                <Label htmlFor="time">Koha</Label>
                <Input
                  id="time"
                  type="time"
                  value={time || ""}
                  onChange={handleTimeChange}
                  placeholder="HH:mm"
                  required
                  className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />
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
      <Footer />
    </>
  );
}