import { Link } from "wouter";
import { Telescope } from "lucide-react";
import { DynamicSky } from "@/components/Theme/DynamicSky";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative">
      <DynamicSky />
      <div className="glass rounded-3xl p-12 text-center max-w-md w-full relative z-10">
        <Telescope className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
        <h1 className="text-4xl font-serif font-bold mb-4 text-glow">Lost in Space</h1>
        <p className="text-muted-foreground mb-8">
          Sepertinya kamu tersesat di ujung semesta. Halaman yang kamu cari tidak ditemukan.
        </p>
        <Link href="/">
          <span className="inline-block bg-white text-black font-bold px-8 py-3 rounded-full hover:bg-gray-200 transition-colors">
            Kembali ke Bumi
          </span>
        </Link>
      </div>
    </div>
  );
}
