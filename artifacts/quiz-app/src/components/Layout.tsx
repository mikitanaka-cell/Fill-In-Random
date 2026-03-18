import { ReactNode } from "react";
import { Link } from "wouter";
import { BookOpen } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none -z-10 opacity-30">
        <img 
          src={`${import.meta.env.BASE_URL}images/study-bg.png`} 
          alt="" 
          className="w-full h-full object-cover object-top opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
      </div>

      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide">空欄補充</span>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              問題一覧
            </Link>
            <Link href="/questions/new" className="text-sm font-medium px-4 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              問題を作成
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col">
        {children}
      </main>

      <footer className="w-full py-8 text-center text-sm text-muted-foreground border-t border-border/30 mt-auto">
        <p className="font-display">静かな学びの時間を。</p>
      </footer>
    </div>
  );
}
