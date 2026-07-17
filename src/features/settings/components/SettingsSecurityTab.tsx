"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { authClient } from "@/features/auth/client";
import { TotpQrCode } from "@/features/auth/ui/totp-qr-code";
import { createApiKeyAction } from "@/features/security/actions/create-api-key";
import type { ApiScopeBundleId } from "@/features/public-api/lib/api-scopes";
import { API_SCOPE_BUNDLES } from "@/features/public-api/lib/api-scopes";
import { recordTwoFactorAuditAction } from "@/features/security/actions/record-two-factor-audit";
import { revokeApiKeyAction } from "@/features/security/actions/revoke-api-key";
import { updateApiSecuritySettingsAction } from "@/features/security/actions/update-api-security-settings";
import { updateOutboundWebhookSettingsAction } from "@/features/security/actions/update-outbound-webhook-settings";
import { updateSecuritySettingsAction } from "@/features/security/actions/update-security-settings";
import type { PendingApprovalRow } from "@/features/agent-approval/queries/list-pending-approvals";
import type { SecuritySnapshot } from "../types";
import { SettingsActiveSessionsSection } from "./SettingsActiveSessionsSection";
import { SettingsApprovalsSection } from "./SettingsApprovalsSection";
import { SettingsCard } from "./settings-card";

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

type TwoFactorSetup = {
  totpURI: string;
  backupCodes: string[];
};

export function SettingsSecurityTab({
  security,
  pendingApprovals,
  canManageOrganization,
  require2faAdmin = false,
}: {
  security: SecuritySnapshot;
  pendingApprovals: PendingApprovalRow[];
  canManageOrganization: boolean;
  require2faAdmin?: boolean;
}) {
  const t = useTranslations("settings.security");
  const [keyName, setKeyName] = useState("Production API");
  const [scopeBundle, setScopeBundle] = useState<ApiScopeBundleId>(
    "workforceOperator",
  );
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(
    null,
  );
  const [verifyCode, setVerifyCode] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPasswordFor, setShowPasswordFor] = useState<"enable" | "disable" | null>(
    null,
  );
  const [requireTwoFactorForAdmins, setRequireTwoFactorForAdmins] = useState(
    security.requireTwoFactorForAdmins,
  );
  const [webhookUrl, setWebhookUrl] = useState(security.outboundWebhookUrl ?? "");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [apiIpAllowlist, setApiIpAllowlist] = useState(
    security.apiIpAllowlist ?? "",
  );
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(true);
  const [backupCodesPassword, setBackupCodesPassword] = useState("");
  const [showBackupCodesPassword, setShowBackupCodesPassword] = useState(false);
  const [regeneratedBackupCodes, setRegeneratedBackupCodes] = useState<
    string[] | null
  >(null);

  function handleChangePassword(): void {
    if (newPassword.length < 8) {
      setMessage(t("passwordTooShort"));
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage(t("passwordMismatch"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (result.error) {
        setMessage(result.error.message ?? t("changePasswordFailed"));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(t("passwordChanged"));
    });
  }

  function handleCreateKey(): void {
    startTransition(async () => {
      const result = await createApiKeyAction({
        name: keyName,
        scopeBundle,
      });
      if (!result.ok) {
        setMessage(result.message);
        return;
      }
      setCreatedKey(result.rawKey);
      setMessage(t("copyKeyNow"));
    });
  }

  function handleEnable2fa(): void {
    setShowPasswordFor("enable");
    setPasswordConfirm("");
    setMessage(null);
  }

  function handleConfirmEnable2fa(): void {
    if (!passwordConfirm.trim()) {
      setMessage(t("passwordRequired"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.twoFactor.enable({
        password: passwordConfirm,
      });
      if (result.error) {
        setMessage(result.error.message ?? t("enable2faFailed"));
        return;
      }
      if (result.data?.totpURI) {
        setTwoFactorSetup({
          totpURI: result.data.totpURI,
          backupCodes: result.data.backupCodes ?? [],
        });
        setShowPasswordFor(null);
        setPasswordConfirm("");
        setMessage(t("scanTotp"));
      }
    });
  }

  function handleDisable2fa(): void {
    setShowPasswordFor("disable");
    setPasswordConfirm("");
    setMessage(null);
  }

  function handleConfirmDisable2fa(): void {
    if (!passwordConfirm.trim()) {
      setMessage(t("passwordRequired"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.twoFactor.disable({
        password: passwordConfirm,
      });
      if (result.error) {
        setMessage(result.error.message ?? t("disable2faFailed"));
        return;
      }
      setTwoFactorSetup(null);
      setShowPasswordFor(null);
      setPasswordConfirm("");
      setRegeneratedBackupCodes(null);
      setMessage(t("twoFactorDisabled"));
      void recordTwoFactorAuditAction({ action: "security.2fa.disabled" });
    });
  }

  function handleVerify2fa(): void {
    startTransition(async () => {
      const result = await authClient.twoFactor.verifyTotp({
        code: verifyCode.trim(),
      });
      if (result.error) {
        setMessage(result.error.message ?? t("verifyFailed"));
        void recordTwoFactorAuditAction({
          action: "security.2fa.failed_attempt",
          metadata: { method: "totp", context: "enrollment" },
        });
        return;
      }
      setTwoFactorSetup(null);
      setVerifyCode("");
      setMessage(t("twoFactorEnabled"));
      void recordTwoFactorAuditAction({ action: "security.2fa.enabled" });
    });
  }

  function handleGenerateBackupCodes(): void {
    setShowBackupCodesPassword(true);
    setBackupCodesPassword("");
    setRegeneratedBackupCodes(null);
    setMessage(null);
  }

  function handleConfirmGenerateBackupCodes(): void {
    if (!backupCodesPassword.trim()) {
      setMessage(t("passwordRequired"));
      return;
    }

    startTransition(async () => {
      const result = await authClient.twoFactor.generateBackupCodes({
        password: backupCodesPassword,
      });
      if (result.error) {
        setMessage(result.error.message ?? t("generateBackupCodesFailed"));
        return;
      }

      const codes = result.data?.backupCodes ?? [];
      setRegeneratedBackupCodes(codes);
      setShowBackupCodesPassword(false);
      setBackupCodesPassword("");
      setMessage(t("backupCodesGenerated"));
      void recordTwoFactorAuditAction({
        action: "security.backup_codes.generated",
        metadata: { count: codes.length },
      });
    });
  }

  function handleDisable2faClick(): void {
    handleDisable2fa();
  }

  function handleRequire2faToggle(checked: boolean): void {
    setRequireTwoFactorForAdmins(checked);
    startTransition(async () => {
      const result = await updateSecuritySettingsAction({
        requireTwoFactorForAdmins: checked,
      });
      setMessage(result.ok ? t("orgPolicySaved") : result.message);
    });
  }

  function handleSaveWebhook(): void {
    startTransition(async () => {
      const result = await updateOutboundWebhookSettingsAction({
        outboundWebhookUrl: webhookUrl,
        outboundWebhookSecret: webhookSecret,
      });
      setMessage(result.ok ? t("webhookSaved") : result.message);
      if (result.ok) {
        setWebhookSecret("");
      }
    });
  }

  function handleSaveAllowlist(): void {
    startTransition(async () => {
      const result = await updateApiSecuritySettingsAction({
        apiIpAllowlist,
      });
      setMessage(result.ok ? t("allowlistSaved") : result.message);
    });
  }

  function handleRevokeKey(keyId: string): void {
    startTransition(async () => {
      const result = await revokeApiKeyAction(keyId);
      setMessage(result.ok ? t("keyRevoked") : result.message);
    });
  }

  return (
    <div className="grid gap-6">
      <SettingsCard title={t("authentication")} description={t("authenticationDesc")}>
        {require2faAdmin && !security.twoFactorEnabled ? (
          <div
            className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground"
            role="status"
          >
            {t("require2faAdminBanner")}
          </div>
        ) : null}
        <div className="grid gap-3">
          <StatusRow
            label={t("twoFactor")}
            value={security.twoFactorEnabled ? t("enabled") : t("notEnabled")}
          />
          <StatusRow
            label={t("activeSessions")}
            value={t("devices", { count: security.activeAuthSessions })}
          />

          <SettingsActiveSessionsSection
            sessions={security.authSessions}
            currentSessionId={security.currentSessionId}
          />

          {security.hasPasswordCredential ? (
            <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("changePassword")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("changePasswordDesc")}
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="current-password">{t("passwordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">{t("newPassword")}</Label>
                <Input
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-new-password">{t("confirmPassword")}</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="revoke-other-sessions" className="text-sm font-normal">
                  {t("revokeOtherSessions")}
                </Label>
                <Switch
                  id="revoke-other-sessions"
                  checked={revokeOtherSessions}
                  onCheckedChange={setRevokeOtherSessions}
                />
              </div>
              <Button
                type="button"
                disabled={
                  isPending ||
                  !currentPassword.trim() ||
                  !newPassword.trim() ||
                  !confirmPassword.trim()
                }
                onClick={handleChangePassword}
              >
                {t("changePasswordSubmit")}
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">{t("oauthOnlyAccount")}</p>
          )}

          {!security.twoFactorEnabled && !twoFactorSetup ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleEnable2fa}
            >
              {t("enable2fa")}
            </Button>
          ) : null}

          {showPasswordFor ? (
            <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">
                {showPasswordFor === "enable"
                  ? t("passwordPromptEnable")
                  : t("passwordPromptDisable")}
              </p>
              <div className="grid gap-2">
                <Label htmlFor="two-factor-password">{t("passwordLabel")}</Label>
                <Input
                  id="two-factor-password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={isPending || !passwordConfirm.trim()}
                  onClick={
                    showPasswordFor === "enable"
                      ? handleConfirmEnable2fa
                      : handleConfirmDisable2fa
                  }
                >
                  {showPasswordFor === "enable"
                    ? t("continueEnable2fa")
                    : t("confirmDisable2fa")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => {
                    setShowPasswordFor(null);
                    setPasswordConfirm("");
                  }}
                >
                  {t("cancel")}
                </Button>
              </div>
            </div>
          ) : null}

          {twoFactorSetup ? (
            <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4">
              <p className="text-xs text-muted-foreground">{t("scanTotp")}</p>
              <TotpQrCode uri={twoFactorSetup.totpURI} />
              <p className="text-xs text-muted-foreground">{t("totpUriLabel")}</p>
              <p className="break-all font-mono text-xs text-foreground">
                {twoFactorSetup.totpURI}
              </p>
              {twoFactorSetup.backupCodes.length > 0 ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("backupCodesLabel")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("backupCodesOnceLabel")}
                  </p>
                  <p className="font-mono text-xs text-foreground">
                    {twoFactorSetup.backupCodes.join(", ")}
                  </p>
                </>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="verify-totp">{t("verifyCode")}</Label>
                <Input
                  id="verify-totp"
                  value={verifyCode}
                  onChange={(event) => setVerifyCode(event.target.value)}
                  inputMode="numeric"
                  maxLength={8}
                />
              </div>
              <Button
                type="button"
                disabled={isPending || verifyCode.trim().length < 6}
                onClick={handleVerify2fa}
              >
                {t("verifyAndEnable")}
              </Button>
            </div>
          ) : null}

          {security.twoFactorEnabled && !showPasswordFor ? (
            <div className="grid gap-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleGenerateBackupCodes}
                >
                  {t("generateBackupCodes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  onClick={handleDisable2faClick}
                >
                  {t("disable2fa")}
                </Button>
              </div>

              {showBackupCodesPassword ? (
                <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    {t("passwordPromptBackupCodes")}
                  </p>
                  <div className="grid gap-2">
                    <Label htmlFor="backup-codes-password">{t("passwordLabel")}</Label>
                    <Input
                      id="backup-codes-password"
                      type="password"
                      autoComplete="current-password"
                      value={backupCodesPassword}
                      onChange={(event) =>
                        setBackupCodesPassword(event.target.value)
                      }
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      disabled={isPending || !backupCodesPassword.trim()}
                      onClick={handleConfirmGenerateBackupCodes}
                    >
                      {t("confirmGenerateBackupCodes")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => {
                        setShowBackupCodesPassword(false);
                        setBackupCodesPassword("");
                      }}
                    >
                      {t("cancel")}
                    </Button>
                  </div>
                </div>
              ) : null}

              {regeneratedBackupCodes && regeneratedBackupCodes.length > 0 ? (
                <div className="grid gap-2 rounded-xl border border-border bg-background/40 p-4">
                  <p className="text-xs text-muted-foreground">
                    {t("backupCodesOnceLabel")}
                  </p>
                  <p className="font-mono text-xs text-foreground">
                    {regeneratedBackupCodes.join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </SettingsCard>

      {canManageOrganization ? (
        <SettingsCard title={t("orgPolicy")} description={t("orgPolicyDesc")}>
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background/40 px-4 py-3">
            <div>
              <p className="text-sm text-foreground">{t("require2faAdmins")}</p>
              <p className="text-xs text-muted-foreground">
                {t("require2faAdminsDesc")}
              </p>
            </div>
            <Switch
              checked={requireTwoFactorForAdmins}
              disabled={isPending}
              onCheckedChange={handleRequire2faToggle}
            />
          </div>
        </SettingsCard>
      ) : null}

      <SettingsCard title={t("webhooks")} description={t("webhooksDesc")}>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="webhook-url">{t("webhookUrl")}</Label>
            <Input
              id="webhook-url"
              value={webhookUrl}
              disabled={!canManageOrganization}
              placeholder="https://example.com/webhooks/nullxes"
              onChange={(event) => setWebhookUrl(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="webhook-secret">{t("webhookSecret")}</Label>
            <Input
              id="webhook-secret"
              type="password"
              value={webhookSecret}
              disabled={!canManageOrganization}
              placeholder={
                security.outboundWebhookConfigured
                  ? t("webhookSecretConfigured")
                  : t("webhookSecretPlaceholder")
              }
              onChange={(event) => setWebhookSecret(event.target.value)}
            />
          </div>
          {canManageOrganization ? (
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={handleSaveWebhook}
            >
              {t("saveWebhook")}
            </Button>
          ) : null}
        </div>
      </SettingsCard>

      <SettingsCard title={t("apiAccess")}>
        <div className="grid gap-3">
          <StatusRow
            label={t("apiKeys")}
            value={security.apiKeysConfigured ? t("configured") : t("notConfigured")}
          />
          <StatusRow
            label={t("ipAllowlist")}
            value={
              security.apiIpAllowlist?.trim()
                ? t("ipAllowlistEnabled")
                : t("ipAllowlistDisabled")
            }
          />
          {canManageOrganization ? (
            <div className="grid gap-2">
              <Label htmlFor="api-ip-allowlist">{t("ipAllowlistInput")}</Label>
              <textarea
                id="api-ip-allowlist"
                value={apiIpAllowlist}
                rows={3}
                placeholder="203.0.113.10, 198.51.100.0/24"
                onChange={(event) => setApiIpAllowlist(event.target.value)}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={handleSaveAllowlist}
              >
                {t("saveAllowlist")}
              </Button>
            </div>
          ) : null}
          {canManageOrganization ? (
            <div className="grid gap-3 rounded-xl border border-border bg-background/40 p-4">
              <div className="grid gap-2">
                <label className="text-sm text-muted-foreground" htmlFor="api-key-name">
                  {t("keyName")}
                </label>
                <Input
                  id="api-key-name"
                  value={keyName}
                  onChange={(event) => setKeyName(event.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="api-scope-bundle">{t("scopeBundle")}</Label>
                <select
                  id="api-scope-bundle"
                  value={scopeBundle}
                  onChange={(event) =>
                    setScopeBundle(event.target.value as ApiScopeBundleId)
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                >
                  {Object.entries(API_SCOPE_BUNDLES).map(([id, bundle]) => (
                    <option key={id} value={id}>
                      {bundle.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  {API_SCOPE_BUNDLES[scopeBundle].description}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {API_SCOPE_BUNDLES[scopeBundle].scopes.join(", ")}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-background/40 p-3 text-xs text-muted-foreground">
                <p className="text-foreground">{t("apiDocsTitle")}</p>
                <p className="mt-1">{t("apiBaseUrl")}</p>
                <p className="font-mono text-foreground">/api/v1</p>
                <p className="mt-2">{t("apiAuthHeader")}</p>
                <p className="font-mono text-foreground">
                  Authorization: Bearer nx_live_...
                </p>
                <p className="mt-2">{t("apiDocsLink")}</p>
                <div className="mt-1 flex flex-col gap-1">
                  <a
                    href="/docs/api"
                    className="font-mono text-foreground underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    /docs/api
                  </a>
                  <a
                    href="/api/docs"
                    className="font-mono text-foreground underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    /api/docs
                  </a>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                disabled={isPending || !keyName.trim()}
                onClick={handleCreateKey}
              >
                {t("createApiKey")}
              </Button>
            </div>
          ) : null}
          {security.apiKeys.length > 0 ? (
            <div className="grid gap-2">
              {security.apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background/40 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-foreground">{key.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">
                      {key.keyPrefix}…
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(key.scopes ?? []).join(", ")}
                    </p>
                  </div>
                  {canManageOrganization ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleRevokeKey(key.id)}
                    >
                      {t("revokeKey")}
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {createdKey ? (
            <p className="rounded-lg border border-border bg-background/40 p-3 font-mono text-xs text-foreground">
              {createdKey}
            </p>
          ) : null}
          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
        </div>
      </SettingsCard>

      <SettingsApprovalsSection
        approvals={pendingApprovals}
        canManageOrganization={canManageOrganization}
      />
    </div>
  );
}
