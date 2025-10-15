import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { createBrowserClient } from "@/db/supabase.client";
import type { User } from "@supabase/supabase-js";

export default function Topbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => typeof window !== 'undefined' ? createBrowserClient() : null, []);

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <nav className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold">Flashcards</div>
        </div>
        <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
      </nav>
    );
  }

  return (
    <nav className="container mx-auto flex h-16 items-center justify-between px-4" data-testid="topbar">
      <a href="/" className="flex items-center gap-2">
        <div className="text-xl font-bold">Flashcards</div>
      </a>

      <div className="flex items-center gap-2">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative size-9 rounded-full p-0" data-testid="user-avatar-button">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(user.email ?? "")}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium leading-none">Konto</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onSelect={() => {
                  const form = document.createElement('form');
                  form.method = 'POST';
                  form.action = '/api/auth/signout';
                  document.body.appendChild(form);
                  form.submit();
                }}
              >
                <LogOut className="mr-2 size-4" />
                <span>Wyloguj</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <>
            <Button variant="ghost" asChild>
              <a href="/login">Zaloguj się</a>
            </Button>
            <Button asChild>
              <a href="/register">Zarejestruj się</a>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}


