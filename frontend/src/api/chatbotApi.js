import api from "./axios";

export const chatbotApi = {
  send: ({
    message,
    sessionId,
    currentAnnonceId = null,
    ownerAnnonceId = null,
    intentHint = null,
  }) =>
    api.post("/api/chatbot", {
      message,
      sessionId,
      currentAnnonceId,
      ownerAnnonceId,
      intentHint,
    }),
};
