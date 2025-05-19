"use client";

import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCircle, Mail, Building2, PencilLine, Trash2, Calendar, Users, X } from "lucide-react";
import { useState, useEffect } from "react";
import NextLink from "next/link";
import { Footer } from "@/components/footer";
import { sq } from "date-fns/locale";
import { format } from "date-fns";
import { toast } from "sonner";

// Tipi për eventet
interface Event {
  _id: string;
  title: string;
  description?: string;
  date: string;
  location?: string;
  capacity?: number;
  category: string;
  image?: string;
  status: string;
}

// Tipi për regjistrimet
interface Registration {
  _id: string;
  user: {
    name?: string;
    email?: string;
  } | null; // Lejo që user të jetë null
  status: string;
}

export default function ProfilePage() {
  const { user, updateUser, getAuthHeader } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [events, setEvents] = useState<Event[]>([]);
  const [registrations, setRegistrations] = useState<{ [key: string]: Registration[] }>({});
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Event>>({});
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);

  // Merr eventet e krijuara nga përdoruesi
  useEffect(() => {
    const fetchEvents = async () => {
      if (user?.id) {
        try {
          const response = await fetch(`/api/events/eventsuser?user-id=${user.id}`, {
            headers: getAuthHeader(),
          });
          if (response.ok) {
            const data = await response.json();
            setEvents(data);
          } else {
            console.error("Nuk u morën dot eventet");
            toast.error("Gabim gjatë marrjes së eventeve");
          }
        } catch (error) {
          console.error("Gabim gjatë marrjes së eventeve:", error);
          toast.error("Gabim gjatë marrjes së eventeve");
        }
      }
    };

    if (user?.id) {
      fetchEvents();
    }
  }, [user?.id, getAuthHeader]);

  // Fshi një event
  const handleDelete = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/eventsuser?eventId=${eventId}`, {
        method: "DELETE",
        headers: getAuthHeader(),
      });

      if (response.ok) {
        setEvents(events.filter((event) => event._id !== eventId));
        toast.success("Eventi u fshi me sukses");
      } else {
        console.error("Nuk u fshi dot eventi");
        toast.error("Gabim gjatë fshirjes së eventit");
      }
    } catch (error) {
      console.error("Gabim gjatë fshirjes së eventit:", error);
      toast.error("Gabim gjatë fshirjes së eventit");
    } finally {
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  // Hap dialogun për konfirmim fshirjeje
  const openDeleteDialog = (eventId: string, eventTitle: string) => {
    setEventToDelete({ id: eventId, title: eventTitle });
    setIsDeleteDialogOpen(true);
  };

  // Mbyll dialogun e konfirmimit
  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setEventToDelete(null);
  };

  // Merr regjistrimet për një event
  const fetchRegistrations = async (eventId: string) => {
    try {
      const response = await fetch(`/api/registrations?eventId=${eventId}`, {
        headers: getAuthHeader(),
      });
      if (response.ok) {
        const data = await response.json();
        setRegistrations((prev) => ({
          ...prev,
          [eventId]: Array.isArray(data) ? data : [],
        }));
        setSelectedEventId(eventId);
      } else {
        console.error("Nuk u morën dot regjistrimet");
        toast.error("Gabim gjatë marrjes së regjistrimeve");
      }
    } catch (error) {
      console.error("Gabim gjatë marrjes së regjistrimeve:", error);
      toast.error("Gabim gjatë marrjes së regjistrimeve");
    }
  };

  // Ndërro gjendjen e shfaqjes së regjistrimeve
  const toggleRegistrations = (eventId: string) => {
    if (selectedEventId === eventId) {
      setSelectedEventId(null);
    } else {
      fetchRegistrations(eventId);
    }
  };

  // Fillo editimin e një eventi
  const startEditing = (event: Event) => {
    setEditingEventId(event._id);
    setEditFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      capacity: event.capacity,
      category: event.category,
      image: event.image,
      status: event.status,
    });
  };

  // Anulo editimin
  const cancelEditing = () => {
    setEditingEventId(null);
    setEditFormData({});
  };

  // Përditëso eventin
  const handleEditSubmit = async (eventId: string) => {
    try {
      const response = await fetch(`/api/events/eventsuser?eventId=${eventId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(editFormData),
      });

      if (response.ok) {
        const updatedEvent = await response.json();
        setEvents(events.map((event) => (event._id === eventId ? updatedEvent : event)));
        setEditingEventId(null);
        setEditFormData({});
        toast.success("Eventi u përditësua me sukses");
      } else {
        console.error("Nuk u përditësua dot eventi");
        toast.error("Gabim gjatë përditësimit të eventit");
      }
    } catch (error) {
      console.error("Gabim gjatë përditësimit të eventit:", error);
      toast.error("Gabim gjatë përditësimit të eventit");
    }
  };

  // Përditëso statusin e regjistrimit
  const handleStatusChange = async (registrationId: string, newStatus: "pending" | "confirmed" | "cancelled") => {
    try {
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedRegistration = await response.json();
        setRegistrations((prev) => ({
          ...prev,
          [selectedEventId!]: prev[selectedEventId!].map((reg) =>
            reg._id === registrationId ? updatedRegistration : reg
          ),
        }));
        toast.success("Statusi i regjistrimit u përditësua me sukses");
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Gabim gjatë përditësimit të statusit");
      }
    } catch (error) {
      console.error("Gabim gjatë përditësimit të statusit:", error);
      toast.error("Gabim gjatë përditësimit të statusit");
    }
  };

  // Përditëso profilin
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      const response = await fetch("/api/users/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": user?.id || "",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
        }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
        toast.success("Profili u përditësua me sukses");
      } else {
        console.error("Nuk u përditësua dot profili");
        toast.error("Gabim gjatë përditësimit të profilit");
      }
    } catch (error) {
      console.error("Gabim gjatë përditësimit të profilit:", error);
      toast.error("Gabim gjatë përditësimit të profilit");
    }
  };

  // Formato datën
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("sq-AL", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Përcakto ngjyrën e badge sipas rolit
  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      staff: "bg-purple-100 text-purple-800",
      student: "bg-blue-100 text-blue-800",
      computer_engineering: "bg-green-100 text-green-800",
      mechanical_engineering: "bg-orange-100 text-orange-800",
    };
    return colors[role] || "bg-gray-100 text-gray-800";
  };

  // Përcakto ngjyrën e badge për statusin e regjistrimit
  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  // Nëse përdoruesi nuk është i kyçur
  if (!user) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-muted-foreground text-sm sm:text-base">
              Ju lutem kyçuni për të parë profilin tuaj.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Seksioni i Profilit */}
          <Card className="max-w-3xl mx-auto mb-8">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl">Profili</CardTitle>
                  <CardDescription className="text-sm sm:text-base">
                    Menaxhoni cilësimet e llogarisë tuaj
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base">Emri</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button type="submit" className="w-full sm:w-auto">Ruaj ndryshimet</Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsEditing(false)}
                      className="w-full sm:w-auto"
                    >
                      Anulo
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <UserCircle className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-medium">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid gap-3 text-sm sm:text-base">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>Email: {user.email}</span>
                    </div>
                    {(user.role === "computer_engineering" || user.role === "mechanical_engineering") && (
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Departamenti:{" "}
                          {user.role
                            .replace("_", " ")
                            .split(" ")
                            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                            .join(" ")}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto mt-4"
                    onClick={() => setIsEditing(true)}
                  >
                    <PencilLine className="h-4 w-4 mr-2" />
                    Edito Profilin
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Seksioni i Eventeve */}
          <Card className="max-w-3xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl sm:text-2xl">
                <Calendar className="h-5 w-5 text-primary" />
                Menaxhoni eventet tuaja
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm sm:text-base">
                    Asnjë event nuk është krijuar deri tani.
                  </p>
                  <Button className="mt-4" variant="outline" asChild>
                    <NextLink href="/create">
                      Krijo eventin tënd të parë
                    </NextLink>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event._id} className="bg-muted/50">
                      <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                          <div className="space-y-2">
                            <h4 className="font-semibold text-lg sm:text-xl">{event.title}</h4>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <time className="text-sm">{format(event.date, "d MMMM yyyy , HH:mm", { locale: sq })}</time>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleRegistrations(event._id)}
                              className="w-full sm:w-auto"
                            >
                              {selectedEventId === event._id ? (
                                <>
                                  <X className="h-4 w-4 mr-2" />
                                  Mbyll
                                </>
                              ) : (
                                <>
                                  <Users className="h-4 w-4 mr-2" />
                                  Shiko Regjistrimet
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => startEditing(event)}
                              className="w-full sm:w-auto"
                            >
                              <PencilLine className="h-4 w-4 mr-2" />
                              Edito
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(event._id, event.title)}
                              className="w-full sm:w-auto"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Fshij
                            </Button>
                          </div>
                        </div>

                        {/* Dialogu i konfirmimit për fshirje */}
                        {isDeleteDialogOpen && eventToDelete && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl space-y-4">
                              <h2 className="text-lg font-bold">A jeni të sigurt?</h2>
                              <p>A dëshironi ta fshini këtë event? Nuk mund të ktheheni pas.</p>
                              <div className="flex justify-end gap-2 pt-4">
                                <Button variant="outline" onClick={cancelDelete}>
                                  Largo
                                </Button>
                                <Button onClick={() => handleDelete(eventToDelete.id)}>
                                  Fshij
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {editingEventId === event._id && (
                          <div className="mt-4 p-4 border rounded-lg bg-white">
                            <h5 className="font-semibold text-lg sm:text-xl mb-4">Edito Eventin</h5>
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                handleEditSubmit(event._id);
                              }}
                              className="space-y-4"
                            >
                              <div className="space-y-2">
                                <Label htmlFor={`title-${event._id}`} className="text-sm sm:text-base">
                                  Titulli
                                </Label>
                                <Input
                                  id={`title-${event._id}`}
                                  value={editFormData.title || ""}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, title: e.target.value })
                                  }
                                  required
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`description-${event._id}`} className="text-sm sm:text-base">
                                  Përshkrimi
                                </Label>
                                <Input
                                  id={`description-${event._id}`}
                                  value={editFormData.description || ""}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, description: e.target.value })
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`date-${event._id}`} className="text-sm sm:text-base">
                                  Data dhe Ora
                                </Label>
                                <Input
                                  id={`date-${event._id}`}
                                  type="datetime-local"
                                  value={editFormData.date || ""}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, date: e.target.value })
                                  }
                                  required
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`location-${event._id}`} className="text-sm sm:text-base">
                                  Vendndodhja
                                </Label>
                                <Input
                                  id={`location-${event._id}`}
                                  value={editFormData.location || ""}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, location: e.target.value })
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`capacity-${event._id}`} className="text-sm sm:text-base">
                                  Kapaciteti
                                </Label>
                                <Input
                                  id={`capacity-${event._id}`}
                                  type="number"
                                  value={editFormData.capacity || ""}
                                  onChange={(e) =>
                                    setEditFormData({
                                      ...editFormData,
                                      capacity: parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`category-${event._id}`} className="text-sm sm:text-base">
                                  Kategoria
                                </Label>
                                <Select
                                  value={editFormData.category || ""}
                                  onValueChange={(value) =>
                                    setEditFormData({ ...editFormData, category: value })
                                  }
                                >
                                  <SelectTrigger id={`category-${event._id}`} className="w-full">
                                    <SelectValue placeholder="Zgjidh kategorinë" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Inxh.Kompjuterike">
                                      Inxhinieri Kompjuterike
                                    </SelectItem>
                                    <SelectItem value="Inxh.Mekanike">Inxhinieri Mekanike</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`image-${event._id}`} className="text-sm sm:text-base">
                                  URL e Imazhit
                                </Label>
                                <Input
                                  id={`image-${event._id}`}
                                  value={editFormData.image || ""}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, image: e.target.value })
                                  }
                                  className="w-full"
                                />
                              </div>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <Button type="submit" className="w-full sm:w-auto">Ruaj ndryshimet</Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={cancelEditing}
                                  className="w-full sm:w-auto"
                                >
                                  Anulo
                                </Button>
                              </div>
                            </form>
                          </div>
                        )}
                        {selectedEventId === event._id && registrations[event._id] && (
                          <div className="mt-4">
                            <h5 className="font-semibold text-lg sm:text-xl mb-2">
                              Regjistrimet për këtë event
                            </h5>
                            {registrations[event._id].length === 0 ? (
                              <p className="text-muted-foreground text-center py-4 text-sm sm:text-base">
                                Asnjë regjistrim për këtë event.
                              </p>
                            ) : (
                              <div className="border rounded-lg overflow-hidden">
                                <div className="hidden sm:grid sm:grid-cols-4 gap-4 bg-gray-50 p-3 font-semibold text-sm text-gray-600">
                                  <span>Emri</span>
                                  <span>Email</span>
                                  <span>Statusi</span>
                                  <span>Veprime</span>
                                </div>
                                {registrations[event._id].map((reg) => (
                                  <div
                                    key={reg._id}
                                    className="flex flex-col sm:grid sm:grid-cols-4 gap-2 sm:gap-4 p-3 border-t sm:items-center"
                                  >
                                    <div className="flex items-center gap-2 sm:gap-0">
                                      <span className="sm:hidden font-semibold text-sm ">Emri:</span>
                                      <span className="text-sm">{reg.user?.name || "Nuk dihet"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-0">
                                      <span className="sm:hidden font-semibold text-sm">Email:</span>
                                      <span className="text-sm">{reg.user?.email || "Nuk dihet"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-0">
                                      <span className="sm:hidden font-semibold text-sm">Statusi:</span>
                                      <Badge
                                        className={`${getStatusBadgeColor(
                                          reg.status
                                        )} ml-3 px-3 py-1 text-xs inline-flex items-center justify-center`}
                                      >
                                        {reg.status === "pending"
                                          ? "Në pritje"
                                          : reg.status === "confirmed"
                                          ? "Konfirmuar"
                                          : "Anuluar"}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 sm:gap-0">
                                      <span className="sm:hidden font-semibold text-sm">Veprime:</span>
                                      <Select
                                        value={reg.status}
                                        onValueChange={(value) =>
                                          handleStatusChange(reg._id, value as "pending" | "confirmed" | "cancelled")
                                        }
                                        disabled={reg.status === "confirmed"}
                                      >
                                        <SelectTrigger
                                          className={
                                            reg.status === "confirmed"
                                              ? "opacity-50 cursor-not-allowed w-full sm:w-[150px] text-xs"
                                              : "w-full sm:w-[150px] text-xs"
                                          }
                                          disabled={reg.status === "confirmed"}
                                        >
                                          <SelectValue placeholder="Ndrysho statusin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="pending">Në pritje</SelectItem>
                                          <SelectItem value="confirmed">Konfirmuar</SelectItem>
                                          <SelectItem value="cancelled">Anuluar</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}