"use client";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { User } from "../types/user";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Check authentication status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/user", {
        credentials: "include",
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        router.push("/dashboard");
        return { success: true };
      } else {
        return { success: false, error: data.error || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        router.push("/dashboard");
        return { success: true };
      } else {
        return { success: false, error: data.error || "Registration failed" };
      }
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: "Network error. Please try again." };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still clear user on error
      setUser(null);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Custom hooks for specific auth operations
export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  return { user, loading };
}

export function useRedirectIfAuthenticated() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  return { user, loading };
}

// "use client";

// import { useRouter } from "next/navigation";
// import {
//   useState,
//   useEffect,
//   createContext,
//   useContext,
//   ReactNode,
// } from "react";

// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

// interface AuthContextType {
//   user: User | null;
//   loading: boolean;
//   login: (
//     email: string,
//     password: string
//   ) => Promise<{ success: boolean; error?: string }>;
//   register: (
//     name: string,
//     email: string,
//     password: string
//   ) => Promise<{ success: boolean; error?: string }>;
//   logout: () => Promise<void>;
//   updateUser: (userData: Partial<User>) => void;
//   checkAuth: () => Promise<void>;
// }
// // interface AuthContextType {
// //   user: User | null;
// //   loading: boolean;
// //   login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
// //   logout: () => Promise<void>;
// //   register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
// // }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);
//   const router = useRouter();

//   // Check authentication status on mount
//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       setLoading(true);
//       const response = await fetch("/api/user", {
//         credentials: "include",
//       });

//       if (response.ok) {
//         const userData = await response.json();
//         setUser(userData.user);
//       } else {
//         setUser(null);
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error);
//       setUser(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email: string, password: string) => {
//     try {
//       setLoading(true);
//       const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setUser(data.user);
//         router.push("/dashboard");
//         return { success: true };
//       } else {
//         return { success: false, error: data.error || "Login failed" };
//       }
//     } catch (error) {
//       console.error("Login error:", error);
//       return { success: false, error: "Network error. Please try again." };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (name: string, email: string, password: string) => {
//     try {
//       setLoading(true);
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         credentials: "include",
//         body: JSON.stringify({ name, email, password }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setUser(data.user);
//         router.push("/dashboard");
//         return { success: true };
//       } else {
//         return { success: false, error: data.error || "Registration failed" };
//       }
//     } catch (error) {
//       console.error("Registration error:", error);
//       return { success: false, error: "Network error. Please try again." };
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       setLoading(true);
//       await fetch("/api/auth/logout", {
//         method: "POST",
//         credentials: "include",
//       });

//       setUser(null);
//       router.push("/");
//     } catch (error) {
//       console.error("Logout error:", error);
//       // Still clear user on error
//       setUser(null);
//       router.push("/");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateUser = (userData: Partial<User>) => {
//     setUser((prev) => (prev ? { ...prev, ...userData } : null));
//   };

//   const value: AuthContextType = {
//     user,
//     loading,
//     login,
//     register,
//     logout,
//     updateUser,
//     checkAuth,
//   };

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// }
// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error("useAuth must be used within an AuthProvider");
//   }
//   return context;
// }

// export function useAuthState() {
//   const [user, setUser] = useState<User | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     checkAuth();
//   }, []);

//   const checkAuth = async () => {
//     try {
//       const response = await fetch("/api/user");
//       if (response.ok) {
//         const data = await response.json();
//         setUser(data.user);
//       }
//     } catch (error) {
//       console.error("Auth check failed:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const login = async (email: string, password: string): Promise<boolean> => {
//     try {
//       const response = await fetch("/api/auth/login", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setUser(data.user);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error("Login failed:", error);
//       return false;
//     }
//   };

//   const register = async (
//     name: string,
//     email: string,
//     password: string
//   ): Promise<boolean> => {
//     try {
//       const response = await fetch("/api/auth/register", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ name, email, password }),
//       });

//       if (response.ok) {
//         const data = await response.json();
//         setUser(data.user);
//         return true;
//       }
//       return false;
//     } catch (error) {
//       console.error("Registration failed:", error);
//       return false;
//     }
//   };

//   const logout = async (): Promise<void> => {
//     try {
//       await fetch("/api/auth/logout", { method: "POST" });
//       setUser(null);
//     } catch (error) {
//       console.error("Logout failed:", error);
//     }
//   };

//   return {
//     user,
//     loading,
//     login,
//     logout,
//     register,
//   };
// }
