import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { createBrowserClient } from "@/db/supabase.client";
import { toast } from "sonner";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; }>({});
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useMemo(() => typeof window !== 'undefined' ? createBrowserClient() : null, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "E-mail jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Nieprawidłowy format e-mail";
    }

    if (!password) {
      newErrors.password = "Hasło jest wymagane";
    } else if (password.length < 8) {
      newErrors.password = "Hasło musi mieć co najmniej 8 znaków";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !supabase) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        switch (error.message) {
          case "Invalid login credentials":
            toast.error("Nieprawidłowe dane logowania.");
            break;
          case "Email not confirmed":
            toast.error("Adres e-mail nie został potwierdzony. Sprawdź swoją skrzynkę odbiorczą.");
            break;
          default:
            toast.error("Wystąpił nieoczekiwany błąd podczas logowania.");
            break;
        }
        return;
      }

      toast.success("Zalogowano pomyślnie!");
      // Force a full page reload to sync session between client and server
      window.location.replace("/");
      
    } catch (error) {
      toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Zaloguj się</CardTitle>
        <CardDescription>
          Wprowadź swój e-mail i hasło, aby uzyskać dostęp do konta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!errors.email}
              disabled={isLoading}
              data-testid="email-input"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Hasło</Label>
              <a
                href="/password-reset"
                className="text-sm text-primary hover:underline"
              >
                Zapomniałeś hasła?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!errors.password}
              disabled={isLoading}
              data-testid="password-input"
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading} data-testid="login-button">
            {isLoading ? "Logowanie..." : "Zaloguj się"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <a href="/register" className="text-primary hover:underline">
              Zarejestruj się
            </a>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}


