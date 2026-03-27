import { Link } from 'wouter';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="text-center py-10">
        <div className="w-24 h-24 mx-auto bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(255,255,255,0.4)]">
          <span className="font-serif font-bold text-3xl text-black">UM</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4 text-glow">Universe Moon</h1>
        <p className="text-muted-foreground text-lg italic">"Tempat kenangan, cerita, dan ikatan yang tak pernah pudar."</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-4 text-primary">Tentang Kami</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">
            Universe Moon (UM) adalah komunitas eksklusif tempat kita merangkai memori di bawah langit yang sama. Didirikan dengan tujuan menjaga tali persaudaraan dan menciptakan momen indah bersama.
          </p>
          <ul className="text-sm space-y-2 text-muted-foreground border-t border-white/10 pt-4">
            <li><strong>Founder:</strong> iyuyun</li>
            <li><strong>Est:</strong> 27 November 2025</li>
            <li><strong>Members:</strong> 26 Bintang</li>
          </ul>
        </div>

        <div className="glass p-8 rounded-3xl">
          <h2 className="text-xl font-bold mb-4 text-accent">Aturan Semesta</h2>
          <ul className="text-sm space-y-3 text-gray-300 list-disc list-inside pl-4">
            <li>Saling menghormati sesama member.</li>
            <li>Dilarang membuat keributan / drama.</li>
            <li>Aktif dalam kegiatan dan diskusi grup.</li>
            <li>Menjaga rahasia di dalam Vault.</li>
            <li>Bersenang-senang dan jadilah dirimu sendiri.</li>
          </ul>
        </div>
      </div>

      <div className="glass p-8 rounded-3xl text-center mt-8 bg-gradient-to-t from-primary/10 to-transparent">
        <h2 className="text-2xl font-serif font-bold mb-4">Bergabung dengan Semesta</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-lg mx-auto">
          Ingin menjadi bagian dari perjalanan kami? Cek halaman Open Member untuk informasi rekrutmen terbaru.
        </p>
        <Link href="/opmem" className="inline-block bg-white text-black px-6 py-3 rounded-full font-bold text-sm hover:scale-105 transition-transform">
          Lihat Status OpMem
        </Link>
      </div>
    </div>
  );
}
