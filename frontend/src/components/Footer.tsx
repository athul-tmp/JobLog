export default function Footer() {
  return (
    <footer className="w-full border-t border-border/50 py-6 mt-12 bg-background/90">
      <div className="container mx-auto text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} JobLog
      </div>
    </footer>
  );
}