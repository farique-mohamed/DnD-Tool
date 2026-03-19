import { type NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import { useRouter } from "next/router";
import { api } from "../utils/api";

const LoginPage: NextPage = () => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const login = api.auth.login.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("dnd_token", data.token);
      }
      void router.push("/dashboard");
    },
    onError: (err) => {
      setMessage({ text: err.message, type: "error" });
    },
  });

  const register = api.auth.register.useMutation({
    onSuccess: (data) => {
      if (data.token) {
        localStorage.setItem("dnd_token", data.token);
      }
      void router.push("/dashboard");
    },
    onError: (err) => {
      setMessage({ text: err.message, type: "error" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (isRegistering) {
      register.mutate({ username, password });
    } else {
      login.mutate({ username, password });
    }
  };

  const isLoading = login.isPending || register.isPending;

  return (
    <>
      <Head>
        <title>DnD Tool — Enter the Realm</title>
        <meta name="description" content="A Dungeons & Dragons companion tool" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main style={styles.main}>
        {/* Overlay */}
        <div style={styles.overlay} />

        <div style={styles.container}>
          {/* Title */}
          <div style={styles.titleBlock}>
            <div style={styles.ornament}>⚔️</div>
            <h1 style={styles.title}>DnD Tool</h1>
            <p style={styles.subtitle}>Enter the Realm of Adventure</p>
            <div style={styles.divider} />
          </div>

          {/* Form card */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              {isRegistering ? "Create Your Character" : "Begin Your Quest"}
            </h2>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.fieldGroup}>
                <label htmlFor="username" style={styles.label}>
                  Adventurer Name
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your name..."
                  required
                  disabled={isLoading}
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#8b6914";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              <div style={styles.fieldGroup}>
                <label htmlFor="password" style={styles.label}>
                  Secret Passphrase
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your passphrase..."
                  required
                  disabled={isLoading}
                  style={styles.input}
                  onFocus={(e) => Object.assign(e.target.style, styles.inputFocus)}
                  onBlur={(e) => {
                    e.target.style.borderColor = "#8b6914";
                    e.target.style.boxShadow = "none";
                  }}
                />
              </div>

              {message && (
                <div
                  style={{
                    ...styles.message,
                    ...(message.type === "success" ? styles.messageSuccess : styles.messageError),
                  }}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  ...styles.button,
                  ...(isLoading ? styles.buttonDisabled : {}),
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) Object.assign(e.currentTarget.style, styles.buttonHover);
                }}
                onMouseLeave={(e) => {
                  Object.assign(e.currentTarget.style, { ...styles.button, ...(isLoading ? styles.buttonDisabled : {}) });
                }}
              >
                {isLoading
                  ? "Rolling the dice..."
                  : isRegistering
                  ? "Create Character"
                  : "Enter the Realm"}
              </button>
            </form>

            <div style={styles.toggle}>
              <span style={styles.toggleText}>
                {isRegistering ? "Already an adventurer?" : "New to the realm?"}
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(!isRegistering);
                  setMessage(null);
                }}
                style={styles.toggleButton}
                onMouseEnter={(e) => Object.assign(e.currentTarget.style, styles.toggleButtonHover)}
                onMouseLeave={(e) => Object.assign(e.currentTarget.style, { color: "#c9a84c", textDecoration: "none" })}
              >
                {isRegistering ? "Sign in" : "Register"}
              </button>
            </div>
          </div>

          <p style={styles.footer}>
            Powered by tRPC · PostgreSQL · Next.js
          </p>
        </div>
      </main>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    backgroundImage: `url("/dnd-background.svg")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundAttachment: "fixed",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "linear-gradient(135deg, rgba(10,5,2,0.82) 0%, rgba(30,12,5,0.75) 50%, rgba(10,5,2,0.82) 100%)",
  },
  container: {
    position: "relative",
    zIndex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    width: "100%",
    maxWidth: "440px",
    padding: "2rem 1.5rem",
  },
  titleBlock: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  ornament: {
    fontSize: "3rem",
    marginBottom: "0.5rem",
    filter: "drop-shadow(0 0 12px rgba(201,168,76,0.8))",
  },
  title: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "3.5rem",
    fontWeight: 700,
    color: "#c9a84c",
    textShadow: "0 0 20px rgba(201,168,76,0.6), 0 2px 4px rgba(0,0,0,0.8)",
    letterSpacing: "0.1em",
    lineHeight: 1.1,
  },
  subtitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "1rem",
    color: "#d4b896",
    marginTop: "0.5rem",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    opacity: 0.9,
  },
  divider: {
    width: "80px",
    height: "2px",
    background: "linear-gradient(90deg, transparent, #c9a84c, transparent)",
    margin: "1.25rem auto 0",
  },
  card: {
    width: "100%",
    background: "rgba(15, 8, 3, 0.88)",
    border: "1px solid #5a3e1b",
    borderRadius: "4px",
    padding: "2.5rem 2rem",
    boxShadow: "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(201,168,76,0.1)",
    backdropFilter: "blur(8px)",
  },
  cardTitle: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "1.4rem",
    color: "#c9a84c",
    textAlign: "center",
    marginBottom: "1.75rem",
    letterSpacing: "0.05em",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.25rem",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.4rem",
  },
  label: {
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontSize: "0.85rem",
    color: "#b8934a",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    backgroundColor: "rgba(30, 15, 5, 0.9)",
    border: "1px solid #8b6914",
    borderRadius: "3px",
    color: "#e8d5b0",
    fontSize: "1rem",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputFocus: {
    borderColor: "#c9a84c",
    boxShadow: "0 0 0 2px rgba(201,168,76,0.25)",
  },
  message: {
    padding: "0.75rem 1rem",
    borderRadius: "3px",
    fontSize: "0.9rem",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    textAlign: "center",
  },
  messageSuccess: {
    backgroundColor: "rgba(34, 68, 20, 0.7)",
    border: "1px solid #4a7c2a",
    color: "#a8e06a",
  },
  messageError: {
    backgroundColor: "rgba(68, 15, 10, 0.7)",
    border: "1px solid #8b2a1e",
    color: "#f08070",
  },
  button: {
    width: "100%",
    padding: "0.85rem",
    background: "linear-gradient(135deg, #7a4a0a 0%, #c9a84c 50%, #7a4a0a 100%)",
    border: "1px solid #c9a84c",
    borderRadius: "3px",
    color: "#1a0e02",
    fontSize: "1rem",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    transition: "opacity 0.2s, box-shadow 0.2s",
    marginTop: "0.5rem",
  },
  buttonHover: {
    boxShadow: "0 0 16px rgba(201,168,76,0.5)",
    opacity: 0.92,
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  toggle: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    marginTop: "1.5rem",
  },
  toggleText: {
    color: "#8a7060",
    fontSize: "0.875rem",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  toggleButton: {
    background: "none",
    border: "none",
    color: "#c9a84c",
    fontSize: "0.875rem",
    fontFamily: "'Georgia', 'Times New Roman', serif",
    cursor: "pointer",
    textDecoration: "none",
    padding: 0,
  },
  toggleButtonHover: {
    color: "#e8d08a",
    textDecoration: "underline",
  },
  footer: {
    marginTop: "1.5rem",
    color: "rgba(180, 150, 100, 0.45)",
    fontSize: "0.75rem",
    letterSpacing: "0.1em",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
};

export default LoginPage;
