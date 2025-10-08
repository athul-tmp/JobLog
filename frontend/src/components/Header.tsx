import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button'; 

export default function Header() {
  const { isAuthenticated, logout } = useAuth();
  
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
      
        <Link href="/" className="text-3xl font-extrabold tracking-tight text-foreground">
          JobLog 
        </Link>

        {/* Navigation */}
        <nav className="flex items-center space-x-2">
          {isAuthenticated ? (
            <>
              {/* Authenticated State */}
              <Link href="/dashboard" passHref>
                <Button variant="link" className="text-foreground/80 text-base"> 
                  Dashboard
                </Button>
              </Link>
              <Button onClick={logout} variant="secondary" className="text-base"> 
                Log Out
              </Button>
            </>
          ) : (
            <>
              {/* Unauthenticated State */}
              <Link href="/login" passHref>
                <Button variant="link" className="text-foreground/80 text-base">
                  Log In
                </Button>
              </Link>
              <Link href="/register" passHref>
                <Button variant="link" className="text-foreground/80 text-base"> 
                  Register
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}