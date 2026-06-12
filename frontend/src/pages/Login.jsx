import { useState } from "react";

export default function AuthPage() {
  const [tab, setTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ LOGIN + SIGNUP HANDLER
  const handleSubmit = async () => {
    setLoading(true);

    try {
      const url =
        tab === "login"
          ? "http://localhost:8095/api/auth/login"
          : "http://localhost:8095/api/auth/register";

      const body =
        tab === "login"
          ? {
              email: email,
              motDePasse: password,
            }
          : {
              nom: name,
              prenom: name,
              email: email,
              motDePasse: password,
              role: "ETUDIANT",
            };

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Something went wrong");
        return;
      }

      // ✅ LOGIN SUCCESS
      if (tab === "login") {
        console.log("JWT TOKEN:", data.token);

        if (data.token) {
          localStorage.setItem("token", data.token);
          alert("Login successful!");
        } else {
          alert("Login failed: no token received");
        }
      }

      // ✅ REGISTER SUCCESS
      if (tab === "signup") {
        alert("Account created! Please check your email for confirmation.");
      }
    } catch (error) {
      console.error(error);
      alert("Server error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>{tab === "login" ? "Login" : "Sign Up"}</h2>

      {tab === "signup" && (
        <input
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <br />

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Loading..." : tab === "login" ? "Login" : "Sign Up"}
      </button>

      <br /><br />

      <button onClick={() => setTab(tab === "login" ? "signup" : "login")}>
        Switch to {tab === "login" ? "Sign Up" : "Login"}
      </button>
    </div>
  );
}