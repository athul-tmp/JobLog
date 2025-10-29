import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 py-6 bg-background/90">
      <div className="container mx-auto text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4">
        &copy; {new Date().getFullYear()} JobLog
        <span className="hidden sm:inline">|</span> 
        <Link href="/privacy&terms" className="text-foreground/70 hover:underline transition-colors duration-150">
          Privacy & Terms
        </Link>
      </div>
    </footer>
  );
}