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
import { format } from "date-fns";
import { sq } from "date-fns/locale";

export default function CreateEventPage() {
  const router = useRouter();
  const { user, token, isLoading, initializeClientAuth } = useAuth();
  const [loading, setLoading] = useState(false);
  const [datetime, setDatetime] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formValues, setFormValues] = useState({
    title: "",
    category: "",
    location: "",
  });

  // Thirr initializeClientAuth kur faqja montohet
  useEffect(() => {
    initializeClientAuth();
  }, [initializeClientAuth]);

  useEffect(() => {
    console.log("Auth state:", { user, isLoading });
    if (isLoading) return; // Prit derisa gjendja e autentikimit të ngarkohet
    if (!user) {
      console.log("Redirecting to /login");
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setImageUrl(value);
    if (value.trim()) {
      setErrors((prev) => ({ ...prev, image: "" }));
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);

    const title = formData.get("title")?.toString().trim();
    const category = formData.get("category")?.toString().trim();
    const location = formData.get("location")?.toString().trim();
    const imageFile = formData.get("image") as File | null;
    const imageUrlValue = formData.get("imageUrl")?.toString().trim();

    const newErrors: { [key: string]: string } = {};

    // Validimi i fushave të detyrueshme
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

    // Validimi për imazh
    if (!imageFile?.size && !imageUrlValue) {
      newErrors.image = "Ju lutem ngarkoni një foto ose jepni URL-në e fotos";
    } else if (imageUrlValue) {
      try {
        new URL(imageUrlValue);
      } catch {
        newErrors.image = "Ju lutem jepni një URL të vlefshme për imazhin";
      }
    }

    // Vendos gabimet dhe ndërpre nëse ka gabime
    if (Object.keys(newErrors).length > 0) {
      console.log("Validation errors:", newErrors);
      setErrors(newErrors);
      toast.error("Ju lutem plotësoni të gjitha fushat e nevojshme");
      setLoading(false);
      return;
    }

    // Pastro gabimet nëse validimi kalon
    setErrors({});

    if (user && user.id) {
      formData.append("organizer", user.id);
    } else {
      toast.error("Përdoruesi nuk është i vlefshëm");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "x-user-id": user.id,
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        if (
          errorData.error === "Ju lutem ngarkoni një imazh ose jepni një URL imazhi" ||
          errorData.error === "Ju lutem jepni një URL të vlefshme për imazhin"
        ) {
          setErrors((prev) => ({
            ...prev,
            image: errorData.error,
          }));
          toast.error(errorData.error);
        } else {
          toast.error(errorData.error || "Dështoi krijimi i eventit");
        }
        setLoading(false);
        return;
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
              {/* Kategoria */}
              <div className="space-y-2">
                <Label htmlFor="category">Kategoria *</Label>
                <select
                  id="category"
                  name="category"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={formValues.category}
                  onChange={handleInputChange}
                >
                  <option value="">-- Zgjidh kategorinë --</option>
                  <option value="Inxh.Kompjuterike">_tx.Inxh.Kompjuterike</option>
                  <option value="Inxh.Mekanike">Inxh.Mekanike</option>
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm">{errors.category}</p>
                )}
              </div>

              {/* Titulli */}
              <div className="space-y-2">
                <Label htmlFor="title">Titulli i eventit *</Label>
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

              {/* Përshkrimi */}
              <div className="space-y-2">
                <Label htmlFor="description">Përshkrimi</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Përshkruani eventin tuaj"
                />
              </div>

              {/* Data dhe Koha */}
              <div className="space-y-2">
                <Label htmlFor="datetime">Data dhe Koha *</Label>
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
                />
                {datetime && !errors.datetime && (
                  <p className="text-sm text-gray-600">
                    Data e zgjedhur:{" "}
                    {format(new Date(datetime), "d MMMM yyyy", { locale: sq })}
                  </p>
                )}
                {errors.datetime && (
                  <p className="text-red-500 text-sm">{errors.datetime}</p>
                )}
              </div>

              {/* Lokacioni */}
              <div className="space-y-2">
                <Label htmlFor="location">Lokacioni *</Label>
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

              {/* Kapaciteti */}
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

              {/* Imazhi */}
              <div className="space-y-2">
                <Label htmlFor="image">Imazhi i eventit *</Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Ose jepni një URL për imazhin:
                </p>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="url"
                  placeholder="https://shembull.com/imazh.jpg"
                  value={imageUrl}
                  onChange={handleImageUrlChange}
                />
                {errors.image && (
                  <p className="text-red-500 text-sm font-medium mt-1">
                    {errors.image}
                  </p>
                )}
              </div>

              {/* Butoni Submit */}
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