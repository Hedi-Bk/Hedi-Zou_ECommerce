import { toast } from "react-hot-toast"; //Notification that is shown to the User
import { create } from "zustand"; //Global state management
import axios from "../lib/axios";

export const useUserStore = create((set, get) => ({
  user: null,
  loading: false,
  checkingAuth: true,

  signup: async ({ name, email, password, confirmPassword }) => {
    set({ loading: true });

    if (password !== confirmPassword) {
      set({ loading: false });
      return toast.error("Passwords do not match");
    }

    try {
      const res = await axios.post("/auth/signup", {
        name,
        email,
        password,
      });
      /* 
            res = {
                data: {
                    user: {
                        _id: "id_de_l_utilisateur", // L'ID unique de l'utilisateur
                        name: "nom_de_l_utilisateur", // Le nom enregistré
                        email: "email_de_l_utilisateur", // L'email enregistré
                        role: "role_de_l_utilisateur", // Rôle de l'utilisateur
                    },
                    message: "User Created Successfully", // Confirmation
                },
                status: 201, // Code HTTP (201 = Created)
                statusText: "Created", // Description du code HTTP
                headers: { ... }, // En-têtes de la réponse
                config: { ... }, // Configuration de la requête
                request: { ... }, // Informations sur la requête
                };

        */
      //Defined in the auth.controller
      /*
      res.status(201).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: "User Created Successfully",
    });
        */
      set({ user: res.data, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "An error occurred");
    }
  },
  login: async ({ email, password }) => {
    set({ loading: true });

    try {
      const res = await axios.post("/auth/login", { email, password });

      set({ user: res.data.user, loading: false });
    } catch (error) {
      set({ loading: false });
      toast.error(error.response.data.message || "An error occurred");
    }
  },

  logout: async () => {
    try {
      await axios.post("/auth/logout");
      set({ user: null });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "An error occurred during logout"
      );
    }
  },

  checkAuth: async () => {
    set({ checkingAuth: true });
    try {
      const response = await axios.get("/auth/profile");
      if (response) {
        set({ user: response.data, checkingAuth: false });
      } else {
        console.log("You are not logged in");
      }
    } catch (error) {
      console.log("You are not logged(checkauth)=>", error.message);
      set({ checkingAuth: false, user: null });
    }
  },

  refreshToken: async () => {
    // Prevent multiple simultaneous refresh attempts
    if (get().checkingAuth) return;

    set({ checkingAuth: true });
    try {
      const response = await axios.post("/auth/refresh-token");
      set({ checkingAuth: false });
      return response.data;
    } catch (error) {
      set({ user: null, checkingAuth: false });
      throw error;
    }
  },
}));

// Axios interceptor for token refresh
let refreshPromise = null;

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it to complete
        if (refreshPromise) {
          await refreshPromise;
          return axios(originalRequest);
        }

        // Start a new refresh process
        refreshPromise = useUserStore.getState().refreshToken();
        await refreshPromise;
        refreshPromise = null;

        return axios(originalRequest);
      } catch (refreshError) {
        // If refresh fails, redirect to login or handle as needed
        useUserStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
