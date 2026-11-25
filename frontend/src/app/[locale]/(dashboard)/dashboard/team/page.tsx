"use client";

import { useState } from "react";
import { useAuthStore } from "@/stores";
import { useMembers, useRoles, teamsApi } from "@/api/organizations";
import type { Membership, Role } from "@/shared/types";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Select, Badge, Tabs, Spinner, PageHeader } from "@/shared/ui";
import { UserPlus, Shield, Trash2, Mail } from "lucide-react";

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
  const acceptedMembers = memberList.filter((m: Membership) => m.is_accepted);
  const pendingInvites = memberList.filter((m: Membership) => !m.is_accepted);
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || t("inviteFailed"));
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
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosErr?.response?.data?.detail || t("removeFailed"));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        actions={
          <Button onClick={() => setShowInvite(true)}>
            <UserPlus className="me-2 h-4 w-4" /> {t("inviteMember")}
          </Button>
        }
      />

      <Tabs
        tabs={[
          { id: "members", label: t("members") },
          { id: "invitations", label: t("invitations"), badge: pendingInvites.length },
          { id: "roles", label: t("roles") },
        ]}
        active={tab}
        onChange={(id) => setTab(id as Tab)}
      />

      {tab === "members" && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Spinner className="h-6 w-6 text-ink-soft" /></div>
            ) : acceptedMembers.length === 0 ? (
              <div className="py-12 text-center text-sm text-ink-soft">{t("noMembers")}</div>
            ) : (
              <div className="divide-y divide-line">
                {acceptedMembers.map((member: Membership) => (
                  <div key={member.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rail text-sm font-medium text-ink-soft">
                        {(member.user_name || member.user_email || "").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{member.user_name || member.user_email}</p>
                        <p className="text-xs text-ink-soft">{member.user_email}</p>
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
                          className="rounded p-1 text-ink-soft hover:bg-error-soft hover:text-error"
                        >
                          {removing === member.user ? <Spinner className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
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
              <div className="py-12 text-center text-sm text-ink-soft">{t("noPendingInvites")}</div>
            ) : (
              <div className="divide-y divide-line">
                {pendingInvites.map((invite: Membership) => (
                  <div key={invite.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-soft text-sm font-medium text-warning">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{invite.user_email}</p>
                        <p className="text-xs text-ink-soft">{t("invitedOn")} {new Date(invite.invited_at).toLocaleDateString()}</p>
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
              <div className="py-12 text-center text-sm text-ink-soft">{t("noRoles")}</div>
            ) : (
              <div className="divide-y divide-line">
                {roleList.map((role: Role) => (
                  <div key={role.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                        <Shield className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{role.name}</p>
                        <p className="text-xs text-ink-soft">{role.permissions?.length || 0} {t("permissions").toLowerCase()}</p>
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
                options={roleList.map((r: Role) => ({ value: r.slug, label: r.name }))}
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
