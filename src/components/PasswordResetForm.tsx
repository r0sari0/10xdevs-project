import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { createBrowserClient } from "@/db/supabase.client";
import { toast } from "sonner";

export default function PasswordResetForm() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = useMemo(() => (typeof window !== "undefined" ? createBrowserClient() : null), []);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!email) {
      newErrors.email = "E-mail jest wymagany";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Nieprawidłowy format e-mail";
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
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      });

      if (error) {
        toast.error("Wystąpił błąd podczas wysyłania linku resetującego.");
        return;
      }

      setSuccess(true);
      toast.success("Link do resetowania hasła został wysłany!");
    } catch {
      toast.error("Wystąpił nieoczekiwany błąd. Spróbuj ponownie.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sprawdź swoją skrzynkę e-mail</CardTitle>
          <CardDescription>
            Jeśli konto powiązane z adresem <strong>{email}</strong> istnieje, wysłaliśmy link do resetowania hasła
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md bg-primary/10 p-4 text-sm">
            <p className="mb-2">Kliknij link w wiadomości e-mail, aby ustawić nowe hasło.</p>
            <p className="text-muted-foreground">
              Link będzie ważny przez 60 minut. Jeśli nie widzisz wiadomości, sprawdź folder spam.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button asChild className="w-full">
            <a href="/login">Przejdź do logowania</a>
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => {
              setSuccess(false);
              setEmail("");
            }}
          >
            Wyślij ponownie
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Resetuj hasło</CardTitle>
        <CardDescription>Wprowadź swój e-mail, a wyślemy Ci link do resetowania hasła</CardDescription>
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
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
          </Button>
          <Button variant="ghost" className="w-full gap-2" asChild>
            <a href="/login">
              <ArrowLeft className="size-4" />
              Wróć do logowania
            </a>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
