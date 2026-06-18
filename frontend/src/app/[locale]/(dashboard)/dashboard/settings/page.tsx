"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/stores";
import { useTranslations } from "next-intl";
import { Shield, ShieldCheck, Key, AlertTriangle } from "lucide-react";

type Tab = "profile" | "security" | "2fa";

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // 2FA state
  const [twoFASecret, setTwoFASecret] = useState("");
  const [twoFAUri, setTwoFAUri] = useState("");
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFASetupMode, setTwoFASetupMode] = useState(false);
  const [twoFADisablePassword, setTwoFADisablePassword] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);

  // Profile Zod schema
  const profileSchema = z.object({
    firstName: z.string().min(1, "First name is required").max(150),
    lastName: z.string().min(1, "Last name is required").max(150),
    phone: z.string().max(20).optional().or(z.literal("")),
  });

  type ProfileForm = z.infer<typeof profileSchema>;

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.first_name || "",
      lastName: user?.last_name || "",
      phone: user?.phone || "",
    },
  });

  // Password Zod schema
  const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

  type PasswordForm = z.infer<typeof passwordSchema>;

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: passwordErrors },
    reset: resetPasswordForm,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const updateProfile = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateMe({ first_name: data.firstName, last_name: data.lastName, phone: data.phone }),
    onSuccess: (data) => {
      setUser(data);
      setMessage({ type: "success", text: t("profileUpdated") });
    },
    onError: () => setMessage({ type: "error", text: t("profileUpdateFailed") }),
  });

  const changePassword = useMutation({
    mutationFn: async (data: PasswordForm) => {
      const { apiClient } = await import("@/api/client");
      await apiClient.post("/auth/users/change_password/", {
        old_password: data.currentPassword,
        new_password: data.newPassword,
      });
    },
    onSuccess: () => {
      setMessage({ type: "success", text: t("passwordChanged") });
      resetPasswordForm();
    },
    onError: () => setMessage({ type: "error", text: t("passwordChangeFailed") }),
  });

  // 2FA mutations
  const setup2FA = useMutation({
    mutationFn: authApi.setup2FA,
    onSuccess: (data) => {
      setTwoFASecret(data.secret);
      setTwoFAUri(data.provisioning_uri);
      setTwoFASetupMode(true);
    },
  });

  const verify2FA = useMutation({
    mutationFn: (code: string) => authApi.verify2FA(code),
    onSuccess: () => {
      setMessage({ type: "success", text: "2FA enabled successfully" });
      setTwoFASetupMode(false);
      setTwoFACode("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => setMessage({ type: "error", text: "Invalid verification code" }),
  });

  const disable2FA = useMutation({
    mutationFn: (password: string) => authApi.disable2FA(password),
    onSuccess: () => {
      setMessage({ type: "success", text: "2FA disabled successfully" });
      setTwoFADisablePassword("");
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: () => setMessage({ type: "error", text: "Incorrect password" }),
  });

  const generateBackupCodes = useMutation({
    mutationFn: authApi.generateBackupCodes,
    onSuccess: (data) => {
      setBackupCodes(data.backup_codes);
    },
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {(["profile", "security", "2fa"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setMessage(null); }}
            className={`whitespace-nowrap px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === tabKey
                ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabKey === "profile" ? t("tabProfile") : tabKey === "security" ? t("tabSecurity") : t("tabTwoFactor")}
          </button>
        ))}
      </div>

      {message && (
        <div className={`rounded-lg p-3 text-sm ${
          message.type === "success" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
        }`}>
          {message.text}
        </div>
      )}

      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("profileInformation")}</CardTitle>
            <CardDescription>{t("profileDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile((data) => updateProfile.mutate(data))} className="space-y-4">
              <Input label={t("email")} value={user?.email || ""} disabled />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t("firstName")} error={profileErrors.firstName?.message} {...registerProfile("firstName")} />
                <Input label={t("lastName")} error={profileErrors.lastName?.message} {...registerProfile("lastName")} />
              </div>
              <Input label={t("phone")} error={profileErrors.phone?.message} {...registerProfile("phone")} />
              <Button type="submit" isLoading={updateProfile.isPending}>
                {tc("saveChanges")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
            <CardDescription>{t("securityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword((data) => changePassword.mutate(data))} className="space-y-4">
              <Input
                label={t("currentPassword")}
                type="password"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword("currentPassword")}
              />
              <Input
                label={t("newPassword")}
                type="password"
                error={passwordErrors.newPassword?.message}
                {...registerPassword("newPassword")}
              />
              <Input
                label={t("confirmNewPassword")}
                type="password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword("confirmPassword")}
              />
              <Button type="submit" isLoading={changePassword.isPending}>
                {t("changePassword")}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {tab === "2fa" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {t("twoFactorAuth")}
            </CardTitle>
            <CardDescription>{t("twoFactorDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.two_factor_enabled ? (
              <>
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                  <ShieldCheck className="h-4 w-4" />
                  {t("twoFactorEnabled")}
                </div>
                {backupCodes.length > 0 && (
                  <div className="rounded-lg border p-4 space-y-2">
                    <p className="text-sm font-medium">{t("backupCodes")}</p>
                    <p className="text-xs text-gray-500">{t("backupCodesWarning")}</p>
                    <div className="grid grid-cols-2 gap-1 font-mono text-sm">
                      {backupCodes.map((code, i) => (
                        <code key={i} className="rounded bg-gray-100 px-2 py-1">{code}</code>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-red-600">{t("disable2FA")}</p>
                  <Input
                    label={t("confirmPassword")}
                    type="password"
                    value={twoFADisablePassword}
                    onChange={(e) => setTwoFADisablePassword(e.target.value)}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => disable2FA.mutate(twoFADisablePassword)}
                    isLoading={disable2FA.isPending}
                    disabled={!twoFADisablePassword}
                  >
                    {t("disable2FA")}
                  </Button>
                </div>
              </>
            ) : twoFASetupMode ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">{t("scanQRCode")}</p>
                {twoFAUri && (
                  <div className="flex justify-center">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(twoFAUri)}`}
                      alt="2FA QR Code"
                      className="rounded-lg border"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">{t("manualEntry")}:</p>
                  <code className="block rounded-lg bg-gray-100 p-2 text-sm font-mono break-all">{twoFASecret}</code>
                </div>
                <Input
                  label={t("enterVerificationCode")}
                  value={twoFACode}
                  onChange={(e) => setTwoFACode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                />
                <div className="flex gap-2">
                  <Button onClick={() => verify2FA.mutate(twoFACode)} isLoading={verify2FA.isPending} disabled={twoFACode.length !== 6}>
                    {t("verifyAndEnable")}
                  </Button>
                  <Button variant="outline" onClick={() => { setTwoFASetupMode(false); setTwoFACode(""); }}>
                    {tc("cancel")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                  <Key className="h-4 w-4" />
                  {t("twoFactorNotEnabled")}
                </div>
                <Button onClick={() => setup2FA.mutate()} isLoading={setup2FA.isPending}>
                  {t("enable2FA")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
