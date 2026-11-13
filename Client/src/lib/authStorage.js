const TOKEN_KEY = "token";
const ROLE_KEY = "role";

export const authStorage = {
  getToken: () => sessionStorage.getItem(TOKEN_KEY),

  setAuth: (token, role) => {
    sessionStorage.setItem(TOKEN_KEY, token);
    if (role) {
      sessionStorage.setItem(ROLE_KEY, role);
    }
  },

  clear: () => {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  },
};
