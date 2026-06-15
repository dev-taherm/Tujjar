"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/shared/ui";
import { authApi } from "@/api/queries";
import { useAuthStore } from "@/stores";
import { useTranslations } from "next-intl";

type Tab = "profile" | "security";

export default function SettingsPage() {
  const t = useTranslations("dashboard.settings");
  const tc = useTranslations("common");
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("profile");
  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const updateProfile = useMutation({
    mutationFn: () => authApi.updateMe({ first_name: firstName, last_name: lastName, phone }),
    onSuccess: (data) => {
      setUser(data);
      setMessage({ type: "success", text: t("profileUpdated") });
    },
    onError: () => setMessage({ type: "error", text: t("profileUpdateFailed") }),
  });

  const changePassword = useMutation({
    mutationFn: async () => {
      const { apiClient } = await import("@/api/client");
      await apiClient.post("/auth/users/change_password/", {
        old_password: currentPassword,
        new_password: newPassword,
      });
    },
    onSuccess: () => {
      setMessage({ type: "success", text: t("passwordChanged") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => setMessage({ type: "error", text: t("passwordChangeFailed") }),
  });

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">{t("title")}</h1>

      <div className="flex gap-2 border-b pb-2">
        {(["profile", "security"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => { setTab(tabKey); setMessage(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === tabKey
                ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabKey === "profile" ? t("tabProfile") : t("tabSecurity")}
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
          <CardContent className="space-y-4">
            <Input label={t("email")} value={user?.email || ""} disabled />
            <div className="grid grid-cols-2 gap-4">
              <Input label={t("firstName")} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input label={t("lastName")} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <Input label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Button onClick={() => updateProfile.mutate()} isLoading={updateProfile.isPending}>
              {tc("saveChanges")}
            </Button>
          </CardContent>
        </Card>
      )}

      {tab === "security" && (
        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
            <CardDescription>{t("securityDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label={t("currentPassword")}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label={t("newPassword")}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label={t("confirmNewPassword")}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newPassword !== confirmPassword) {
                  setMessage({ type: "error", text: t("passwordsNoMatch") });
                  return;
                }
                if (newPassword.length < 8) {
                  setMessage({ type: "error", text: t("passwordMin") });
                  return;
                }
                changePassword.mutate();
              }}
              isLoading={changePassword.isPending}
            >
              {t("changePassword")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
