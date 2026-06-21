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
        alert(data.message || "Une erreur est survenue.");
        return;
      }

      // ✅ LOGIN SUCCESS
      if (tab === "login") {
        console.log("JWT TOKEN:", data.token);

        if (data.token) {
          localStorage.setItem("token", data.token);
          alert("Connexion réussie !");
        } else {
          alert("Connexion échouée : aucun jeton reçu.");
        }
      }

      // ✅ REGISTER SUCCESS
      if (tab === "signup") {
        alert(
          "Compte créé ! Vérifiez votre adresse e-mail pour confirmer l'inscription.",
        );
      }
    } catch (error) {
      console.error(error);
      alert("Erreur serveur. Vérifiez le backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>{tab === "login" ? "Connexion" : "Inscription"}</h2>

      {tab === "signup" && (
        <input
          placeholder="Nom complet"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      )}

      <br />

      <input
        placeholder="Adresse e-mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <button onClick={handleSubmit} disabled={loading}>
        {loading
          ? "Chargement..."
          : tab === "login"
            ? "Connexion"
            : "Inscription"}
      </button>

      <br />
      <br />

      <button onClick={() => setTab(tab === "login" ? "signup" : "login")}>
        Passer à {tab === "login" ? "l’inscription" : "la connexion"}
      </button>
    </div>
  );
}
