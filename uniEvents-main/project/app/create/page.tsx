"use client";

import { useState, useEffect } from "react";
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
import { Footer } from "@/components/footer";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [datetime, setDatetime] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({
    title: "",
    category: "",
    location: "",
  });
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
  
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };
  

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const title = formData.get("title")?.toString().trim();
    const category = formData.get("category")?.toString().trim();
    const location = formData.get("location")?.toString().trim();

    const newErrors: { [key: string]: string } = {};
    if (!category) newErrors.category = "Ju lutem zgjidhni një kategori";
    if (!title) newErrors.title = "Ju lutem plotësoni titullin";
    if (!location) newErrors.location = "Ju lutem plotësoni lokacionin";

    if (!datetime) {
      newErrors.datetime = "Ju lutem zgjidhni datën dhe kohën për eventin";
    } else {
      const fullDate = new Date(datetime);
      if (isNaN(fullDate.getTime())) {
        newErrors.datetime = "Ju lutem vendosni një datë dhe kohë të vlefshme";
      } else {
        formData.append("date", fullDate.toISOString());
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Ju lutem plotësoni të gjitha fushat e nevojshme");
      setLoading(false);
      return;
    }

    setErrors({}); // pastrimi i gabimeve

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
      <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] py-8 ">
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
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formValues.category}
                  onChange={handleInputChange}
                >
                  <option value="">-- Zgjidh kategorinë --</option>
                  <option value="Inxh.Kompjuterike">Inxh.Kompjuterike</option>
                  <option value="Inxh.Mekanike">Inxh.Mekanike</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Titulli i eventit</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Shkruani titullin e eventit"
                  value={formValues.title}
                  onChange={handleInputChange}
                />
                {errors.title && (
                  <p className="text-red-500 text-sm">{errors.title}</p>
                )}
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
                <Label htmlFor="datetime">Data dhe Koha</Label>
                <Input
                  id="datetime"
                  name="datetime"
                  type="datetime-local"
                  value={datetime || ""}
                  onChange={(e) => {
                    setDatetime(e.target.value);
                    setErrors((prev) => ({ ...prev, datetime: "" }));
                  }}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full transition-all duration-200 focus:ring-2 focus:ring-primary focus:border-primary"
                />

                {errors.datetime && (
                  <p className="text-red-500 text-sm">{errors.datetime}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Lokacioni</Label>
                <Input
                  id="location"
                  name="location"
                  placeholder="Lokacioni i eventit"
                  value={formValues.location}
                  onChange={handleInputChange}
                />
                {errors.location && (
                  <p className="text-red-500 text-sm">{errors.location}</p>
                )}
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
