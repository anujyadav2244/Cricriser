const TOKENS_KEY = "authTokens";
const ROLE_KEY = "role";
const ACTIVE_TOKEN_KEY = "token";

const readTokens = () => {
  try {
    return JSON.parse(localStorage.getItem(TOKENS_KEY) || "{}");
  } catch {
    return {};
  }
};

const roleFromPath = () => {
  const path = window.location.pathname;
  if (path.startsWith("/admin")) return "ADMIN";
  if (path.startsWith("/team-owner")) return "TEAM_OWNER";
  if (path.startsWith("/player")) return "PLAYER";
  return localStorage.getItem(ROLE_KEY);
};

export const authStorage = {
  getToken: (role = roleFromPath()) => {
    if (!role) return null;
    return readTokens()[role] || null;
  },

  setAuth: (token, role) => {
    const tokens = readTokens();
    tokens[role] = token;
    localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    if (role) {
      localStorage.setItem(ROLE_KEY, role);
      sessionStorage.setItem(ROLE_KEY, role);
    }
    sessionStorage.setItem(ACTIVE_TOKEN_KEY, token);
  },

  clear: (role = roleFromPath()) => {
    const tokens = readTokens();
    if (role) {
      delete tokens[role];
      localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens));
    }
    sessionStorage.removeItem(ACTIVE_TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
    if (localStorage.getItem(ROLE_KEY) === role) {
      localStorage.removeItem(ROLE_KEY);
    }
  },
};
