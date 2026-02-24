import { Button } from "./components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";

export default function Login({ onLogin }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin();
  };

  return <div className="flex h-screen items-center justify-center">
    <Card className="center w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sky Corridors</CardTitle>
        <CardDescription>
          Унесите вашу е-пошту и лозинку за приступ
        </CardDescription>
        <CardAction>
          <Button variant="link">Регистрација</Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <form id="login-form" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Е-пошта</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Лозинка</Label>
                <a
                  href="#"
                  className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                >
                  Заборављена лозинка?
                </a>
              </div>
              <Input id="password" type="password" required />
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button type="submit" form="login-form" className="w-full">
          Пријава
        </Button>
        <Button variant="outline" className="w-full">
          Пријава помоћу Google-а
        </Button>
      </CardFooter>
    </Card>
  </div>;
}
