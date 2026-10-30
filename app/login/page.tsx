"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, FieldError, Input, Label, TextField } from "@heroui/react";

import { useAuth } from "@/lib/auth-context";
import { roleHome } from "@/lib/roles";
import { Logo } from "@/components/icons";

const errorMessage = (code: string) =>
  code === "auth/too-many-requests"
    ? "Çok fazla deneme yapıldı. Lütfen biraz sonra tekrar deneyin."
    : code === "auth/network-request-failed"
      ? "Bağlantı hatası. İnternetinizi kontrol edin."
      : "Kullanıcı adı veya şifre hatalı.";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loading, login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) router.replace(roleHome[profile.role]);
  }, [loading, user, profile, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username, password);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError(errorMessage((err as { code?: string }).code ?? ""));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo size={40} />
        <h1 className="text-2xl font-bold">Çamaşırhane</h1>
        <p className="text-sm text-muted">
          Yıkama isteklerinizi ve bakiyenizi buradan takip edin.
        </p>
      </div>
      <Card className="w-full max-w-sm">
        <Card.Header>
          <Card.Title>Giriş yap</Card.Title>
          <Card.Description>
            Talebeler kullanıcı adı olarak talebe numarasını kullanır.
          </Card.Description>
        </Card.Header>
        <Card.Content>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <TextField
              fullWidth
              isRequired
              autoComplete="username"
              name="username"
              value={username}
              onChange={setUsername}
            >
              <Label>Kullanıcı adı</Label>
              <Input autoCapitalize="none" placeholder="Örn. 12345" />
            </TextField>
            <TextField
              fullWidth
              isRequired
              autoComplete="current-password"
              isInvalid={error !== null}
              name="password"
              type="password"
              value={password}
              onChange={setPassword}
            >
              <Label>Şifre</Label>
              <Input />
              <FieldError>{error}</FieldError>
            </TextField>
            <Button fullWidth isPending={submitting} type="submit">
              Giriş yap
            </Button>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
