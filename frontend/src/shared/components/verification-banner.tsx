"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, X } from "lucide-react";
import { Button } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/stores";

export function VerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.is_verified || dismissed) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await authApi.resendVerification(user.email);
      toast.success("Verification email sent. Please check your inbox.");
    } catch {
      toast.error("Failed to send verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-4 mt-4 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 md:mx-8 md:mt-8">
      <Mail className="h-5 w-5 shrink-0 text-amber-600" />
      <p className="flex-1 text-sm text-amber-800">
        Your email is not verified. Please check your inbox or click below to resend.
      </p>
      <Button
        size="sm"
        variant="outline"
        onClick={handleResend}
        disabled={sending}
        className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
      >
        {sending ? "Sending..." : "Resend Email"}
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-1 text-amber-600 hover:bg-amber-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
