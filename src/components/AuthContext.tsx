"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { API_URL } from "@/_utilities/API_UTILS";

interface AuthContextType {
  isLoading: boolean;
  authorized: boolean;
  login: (username: string) => Promise<void>; // Simplified for example
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true); // <--- Crucial for "Loading..." screens
  const [authorized, setAuthorized] = useState(false);

  // 1. CHECK LOGIN STATUS ON MOUNT
  useEffect(() => {
    const checkUser = async () => {
      try {
        const res = await fetch(API_URL + "/verify_auth", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // <--- MUST have this to send cookie
        }).then((res) => {
          if (res.ok) {
            //console.log("Authentication Successful!");
            setAuthorized(true);
          } else if (res.status === 401) {
            console.log("unauthorized!");
          } else {
            console.log("BAHHH!");
            setAuthorized(false);
          }
        });
      } catch (err) {
        //console.error("Auth check error", err);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser().then((r) => {});
  }, []);

  const logout = async () => {
    await fetch(API_URL + "/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    })
      .then((res) => {
        console.log("Logout successfulsss");
        window.location.reload();
      })
      .catch((err) => {
        console.error("Logout failed", err);
      });
  };

  // (Add your login function here similar to the fetch logic above)
  const login = async (username: string) => {
    // ... perform login fetch ...
  };

  return (
    <AuthContext.Provider value={{ authorized, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
