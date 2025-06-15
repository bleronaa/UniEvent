"use client";

import { useState } from "react";
import { useRouter } from "next/navigation"; // Shto useRouter
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Calendar, LogIn, LogOut, UserPlus, UserCircle, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner"; // Shto sonner për mesazhe

export function Navbar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter(); // Inicializo useRouter

  // Funksion për të trajtuar logout-in
  const handleLogout = async () => {
    try {
      await logout(); // Thirr logout nga useAuth
      toast.success("U çkyçe me sukses");
      router.push("/login"); // Ridrejto në /login
      setIsOpen(false); // Mbyll menynë mobile (nëse është e hapur)
    } catch (error) {
      console.error("Gabim gjatë logout-it:", error);
      toast.error("Dështoi çkyçja, provo përsëri");
    }
  };

  return (
    <div className="border-b bg-white shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <Image
                src="/assets/images/logo.png"
                width={120}
                height={44}
                alt="UniEvents logo"
                className="w-[100px] sm:w-[120px] lg:w-[140px]"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {user && (
              <NavigationMenu>
                <NavigationMenuList className="flex gap-2">
                  <NavigationMenuItem>
                    <Link href="/#events" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Eventet
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/create" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Krijo event
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/registrations" legacyBehavior passHref>
                      <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                        Regjistrimet
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            )}
            <div className="flex items-center gap-2">
              {user ? (
                <>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/profile" className="flex items-center gap-2">
                      <UserCircle className="h-4 w-4" />
                      <span className="text-sm">{user.name}</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Dil
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Kyqu
                    </Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Regjistrohu
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Hap menunë">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[240px] sm:w-[300px]">
                <VisuallyHidden>
                  <SheetTitle>Menuja e Navigimit</SheetTitle>
                </VisuallyHidden>
                <div className="flex flex-col gap-6 pt-6">
                  {user && (
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/"
                        className="text-sm sm:text-base font-medium text-gray-700 hover:text-primary py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Eventet
                      </Link>
                      <Link
                        href="/create"
                        className="text-sm sm:text-base font-medium text-gray-700 hover:text-primary py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Krijo event
                      </Link>
                      <Link
                        href="/registrations"
                        className="text-sm sm:text-base font-medium text-gray-700 hover:text-primary py-2"
                        onClick={() => setIsOpen(false)}
                      >
                        Regjistrimet e mia
                      </Link>
                    </div>
                  )}
                  <div className="border-t pt-4">
                    {user ? (
                      <div className="flex flex-col gap-4">
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 text-sm sm:text-base font-medium text-gray-700 hover:text-primary py-2"
                          onClick={() => setIsOpen(false)}
                        >
                          <UserCircle className="h-4 w-4" />
                          {user.name}
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleLogout}
                          className="w-full justify-start py-2 text-sm sm:text-base"
                        >
                          <LogOut className="h-4 w-4 mr-2" />
                          Dil
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link
                            href="/login"
                            className="flex items-center gap-2 w-full py-2 text-sm sm:text-base"
                            onClick={() => setIsOpen(false)}
                          >
                            <LogIn className="h-4 w-4" />
                            Kyqu
                          </Link>
                        </Button>
                        <Button size="sm" asChild>
                          <Link
                            href="/register"
                            className="flex items-center gap-2 w-full py-2 text-sm sm:text-base"
                            onClick={() => setIsOpen(false)}
                          >
                            <UserPlus className="h-4 w-4" />
                            Regjistrohu
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}