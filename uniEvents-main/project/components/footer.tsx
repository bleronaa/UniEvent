"use client";

import Link from "next/link";
import { Github, Twitter, Facebook, Instagram } from "lucide-react"; // Add any other icons you prefer

export function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-5 w-full">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center flex-col sm:flex-row">
      <div className="flex flex-col items-center sm:items-start gap-4">
        <p className="text-lg font-semibold">UniEvents</p>
        <p className="text-sm text-center sm:text-left">
          &copy; {new Date().getFullYear()} UniEvents. Të gjitha te drejtat e rezervuara.
        </p>
      </div>

      <div className="flex gap-6 mt-4 sm:mt-0">
        
        <Link href="https://www.facebook.com/uibm02" target="_blank">
          <Facebook className="h-6 w-6 text-white hover:text-primary-600" />
        </Link>
        <Link href="https://www.instagram.com/uibm_net/" target="_blank">
          <Instagram className="h-6 w-6 text-white hover:text-primary-600" />
        </Link>
      </div>
    </div>
  </footer>
  );
}
