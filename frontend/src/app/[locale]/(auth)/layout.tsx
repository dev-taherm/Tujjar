import { LocaleSwitcher } from "@/shared/ui/locale-switcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LocaleSwitcher variant="floating" />
      {children}
    </>
  );
}
