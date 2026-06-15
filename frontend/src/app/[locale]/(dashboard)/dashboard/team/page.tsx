"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useMembers, useRoles, teamsApi } from "@/api/organizations";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select, Badge } from "@/shared/ui";
import { Users, UserPlus, Shield, Trash2, Mail, Check, X, Loader2 } from "lucide-react";

type Tab = "members" | "invitations" | "roles";

export default function TeamPage() {
  const t = useTranslations("dashboard.team");
  const tc = useTranslations("common");
  const organization = useAuthStore((s) => s.organization);
  const { data: members, isLoading } = useMembers(organization?.id);
  const { data: roles } = useRoles(organization?.id);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("members");
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("admin");
  const [inviting, setInviting] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const memberList = Array.isArray(members) ? members : [];
  const acceptedMembers = memberList.filter((m: any) => m.is_accepted);
  const pendingInvites = memberList.filter((m: any) => !m.is_accepted);
  const roleList = Array.isArray(roles) ? roles : [];

  const handleInvite = async () => {
    if (!organization?.id || !inviteEmail) return;
    setInviting(true);
    try {
      await teamsApi.inviteMember(organization.id, inviteEmail, inviteRole);
      toast.success(t("inviteSent"));
      setShowInvite(false);
      setInviteEmail("");
      queryClient.invalidateQueries({ queryKey: ["members", organization.id] });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("inviteFailed"));
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!organization?.id) return;
    setRemoving(userId);
    try {
      await teamsApi.removeMember(organization.id, userId);
      toast.success(t("memberRemoved"));
      queryClient.invalidateQueries({ queryKey: ["members", organization.id] });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || t("removeFailed"));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <Button onClick={() => setShowInvite(true)}>
          <UserPlus className="me-2 h-4 w-4" /> {t("inviteMember")}
        </Button>
      </div>

      <div className="flex gap-2 border-b pb-2">
        {(["members", "invitations", "roles"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg ${
              tab === tabKey
                ? "bg-primary-50 text-primary-700 border-b-2 border-primary-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabKey === "members" ? t("members") : tabKey === "invitations" ? t("invitations") : t("roles")}
            {tabKey === "invitations" && pendingInvites.length > 0 && (
              <span className="ms-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">{pendingInvites.length}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "members" && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
            ) : acceptedMembers.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">{t("noMembers")}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {acceptedMembers.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                        {(member.user_name || member.user_email || "").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user_name || member.user_email}</p>
                        <p className="text-xs text-gray-500">{member.user_email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={member.role_name === "Owner" ? "success" : "secondary"}>{member.role_name}</Badge>
                      {member.role_name !== "Owner" && (
                        <button
                          onClick={() => {
                            if (confirm(t("confirmRemoveMember"))) {
                              handleRemove(member.user);
                            }
                          }}
                          disabled={removing === member.user}
                          className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                        >
                          {removing === member.user ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "invitations" && (
        <Card>
          <CardContent className="p-0">
            {pendingInvites.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">{t("noPendingInvites")}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingInvites.map((invite: any) => (
                  <div key={invite.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-sm font-medium text-yellow-600">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{invite.user_email}</p>
                        <p className="text-xs text-gray-500">{t("invitedOn")} {new Date(invite.invited_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <Badge variant="warning">{invite.role_name}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "roles" && (
        <Card>
          <CardContent className="p-0">
            {roleList.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500">{t("noRoles")}</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {roleList.map((role: any) => (
                  <div key={role.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <Shield className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{role.name}</p>
                        <p className="text-xs text-gray-500">{role.permissions?.length || 0} {t("permissions").toLowerCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {role.is_system && <Badge variant="secondary">{t("system")}</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{t("inviteMember")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label={tc("email")}
                type="email"
                placeholder={t("emailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
              <Select
                label={t("role")}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                options={roleList.map((r: any) => ({ value: r.slug, label: r.name }))}
              />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setShowInvite(false)}>{tc("cancel")}</Button>
                <Button onClick={handleInvite} isLoading={inviting} disabled={!inviteEmail}>{t("sendInvite")}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
