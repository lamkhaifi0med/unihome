import api from "./axios";

export const authApi = {
  registerStudent: (data) => api.post("/api/auth/register", data),
  registerOwner: (user, cinFile) => {
    const formData = new FormData();
    formData.append(
      "user",
      new Blob([JSON.stringify(user)], { type: "application/json" }),
    );
    formData.append("cinFile", cinFile);
    return api.post("/api/auth/register", formData);
  },
  login: (email, motDePasse) =>
    api.post("/api/auth/login", { email, motDePasse }),
  confirmEmail: (token) => api.get("/api/auth/confirm", { params: { token } }),
  resendConfirmation: (email) =>
    api.post("/api/auth/resend-confirmation", { email }),
  forgotPassword: (email) => api.post("/api/auth/forgot-password", { email }),
  resetPassword: (token, motDePasse) =>
    api.post("/api/auth/reset-password", { token, newPassword: motDePasse }),
};
