import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { darkPalette, lightPalette } from "@/components/ui/theme";
import {
  Card,
  Button,
  PageHeader,
  Input,
  Alert,
  GOLD,
  GOLD_MUTED,
  SERIF,
} from "@/components/ui";
import { api } from "@/utils/api";

function SettingsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { theme } = useTheme();
  const palette = theme === "dark" ? darkPalette : lightPalette;

  // Username form state
  const [newUsername, setNewUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState("");

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // tRPC mutations
  const updateUsername = api.user.updateUsername.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("dnd_token", data.token);
      }
      setUsernameSuccess(
        "Your battle name has been changed! Reloading your scroll...",
      );
      setUsernameError("");
      setNewUsername("");
      setTimeout(() => {
        void router.reload();
      }, 1200);
    },
    onError: (err) => {
      setUsernameError(err.message);
      setUsernameSuccess("");
    },
  });

  const updatePassword = api.user.updatePassword.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("dnd_token", data.token);
      }
      setPasswordSuccess(
        "Your secret passphrase has been changed! Reloading your scroll...",
      );
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        void router.reload();
      }, 1200);
    },
    onError: (err) => {
      setPasswordError(err.message);
      setPasswordSuccess("");
    },
  });

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess("");

    if (newUsername.trim().length < 3) {
      setUsernameError(
        "Your battle name must be at least 3 characters long, adventurer.",
      );
      return;
    }

    updateUsername.mutate({ username: newUsername.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (currentPassword.length < 1) {
      setPasswordError("You must provide your current passphrase.");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "Your new passphrase must be at least 6 characters long.",
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("The new passphrases do not match. Try again.");
      return;
    }

    updatePassword.mutate({
      currentPassword,
      newPassword,
    });
  };

  if (!user) return null;

  const labelStyle: React.CSSProperties = {
    display: "block",
    color: GOLD_MUTED,
    fontFamily: SERIF,
    fontSize: "13px",
    letterSpacing: "0.5px",
    marginBottom: "6px",
    textTransform: "uppercase",
  };

  const fieldGroupStyle: React.CSSProperties = {
    marginBottom: "16px",
  };

  const sectionTitleStyle: React.CSSProperties = {
    color: GOLD,
    fontFamily: SERIF,
    fontSize: "18px",
    fontWeight: "bold",
    letterSpacing: "1px",
    marginBottom: "16px",
    margin: 0,
  };

  return (
    <>
      <Head>
        <title>Account Settings — DnD Tool</title>
      </Head>

      <PageHeader
        title="Account Settings"
        subtitle="Modify your adventurer's identity and credentials"
      />

      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
        }}
      >
        {/* Change Username Section */}
        <Card>
          <h2 style={sectionTitleStyle}>Change Your Battle Name</h2>
          <p
            style={{
              color: palette.textSecondary,
              fontFamily: SERIF,
              fontSize: "13px",
              marginTop: "4px",
              marginBottom: "20px",
            }}
          >
            Currently known as: <strong>{user.username}</strong>
          </p>

          {usernameError && (
            <div style={{ marginBottom: "16px" }}>
              <Alert variant="error">{usernameError}</Alert>
            </div>
          )}
          {usernameSuccess && (
            <div style={{ marginBottom: "16px" }}>
              <Alert variant="success">{usernameSuccess}</Alert>
            </div>
          )}

          <form onSubmit={handleUsernameSubmit}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>New Battle Name</label>
              <Input
                type="text"
                placeholder="Enter your new title..."
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <Button
              type="submit"
              isLoading={updateUsername.isPending}
              disabled={updateUsername.isPending}
            >
              Rename Thyself
            </Button>
          </form>
        </Card>

        {/* Change Password Section */}
        <Card>
          <h2 style={sectionTitleStyle}>Change Your Secret Passphrase</h2>
          <p
            style={{
              color: palette.textSecondary,
              fontFamily: SERIF,
              fontSize: "13px",
              marginTop: "4px",
              marginBottom: "20px",
            }}
          >
            Guard your secrets well, adventurer. Choose a strong passphrase.
          </p>

          {passwordError && (
            <div style={{ marginBottom: "16px" }}>
              <Alert variant="error">{passwordError}</Alert>
            </div>
          )}
          {passwordSuccess && (
            <div style={{ marginBottom: "16px" }}>
              <Alert variant="success">{passwordSuccess}</Alert>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit}>
            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Current Passphrase</label>
              <Input
                type="password"
                placeholder="Your current secret..."
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>New Passphrase</label>
              <Input
                type="password"
                placeholder="Choose a new secret (min 6 chars)..."
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div style={fieldGroupStyle}>
              <label style={labelStyle}>Confirm New Passphrase</label>
              <Input
                type="password"
                placeholder="Repeat your new secret..."
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              isLoading={updatePassword.isPending}
              disabled={updatePassword.isPending}
            >
              Seal the Pact
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <Layout>
        <SettingsContent />
      </Layout>
    </ProtectedRoute>
  );
}
