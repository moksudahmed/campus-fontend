
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import authService from "../services/authService";
import TokenService from "../services/tokenService";

const AuthContext = createContext(null);

function getErrorMessage(error, fallback = "Something went wrong.") {
  const value = error?.response?.data ?? error;

  if (typeof value === "string") {
    return value;
  }

  if (typeof value?.message === "string") {
    return value.message;
  }

  if (typeof value?.detail === "string") {
    return value.detail;
  }

  if (Array.isArray(value?.detail)) {
    return value.detail
      .map((item) => item?.msg || String(item))
      .join(", ");
  }

  return fallback;
}

/**
 * Return the actual student profile from common API response formats.
 * Examples:
 *   { student_id: "...", personID: 123 }
 *   { user: { student_id: "...", personID: 123 } }
 *   { data: { student: { student_id: "...", personID: 123 } } }
 */
function normalizeStudentProfile(response) {
  let result = response;

  for (let i = 0; i < 5; i += 1) {
    if (
      !result ||
      typeof result !== "object" ||
      Array.isArray(result)
    ) {
      return null;
    }

    if (
      result.student &&
      typeof result.student === "object" &&
      !Array.isArray(result.student)
    ) {
      result = result.student;
      continue;
    }

    if (
      result.user &&
      typeof result.user === "object" &&
      !Array.isArray(result.user)
    ) {
      result = result.user;
      continue;
    }

    if (
      result.data &&
      typeof result.data === "object" &&
      !Array.isArray(result.data)
    ) {
      result = result.data;
      continue;
    }

    break;
  }

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    return null;
  }

  const studentId =
    result.student_id ??
    result.studentID ??
    result.studentId;

  // Accept a profile only when it has a student identifier.
  if (
    studentId === undefined ||
    studentId === null ||
    String(studentId).trim() === ""
  ) {
    return null;
  }

  return result;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  /**
   * Login with student ID and password.
   */
  const login = useCallback(async (loginId, password, remember = true) => {
    setAuthError("");

    try {
      const result = await authService.login(
        String(loginId ?? "").trim(),
        password,
        remember
      );

      if (!result || typeof result !== "object") {
        throw new Error("Invalid login response from the server.");
      }

      if (result.success === false) {
        throw new Error(getErrorMessage(result, "Login failed."));
      }

      const requiresOtp =
        result.requiresOtp === true ||
        result.requires_otp === true ||
        result.otp_required === true;

      if (requiresOtp) {
        setUser(null);
        return result;
      }

      const profile = normalizeStudentProfile(result);

      if (!profile) {
        throw new Error(
          "Login response did not contain a valid student profile."
        );
      }

      setUser(profile);
      return profile;
    } catch (error) {
      setAuthError(getErrorMessage(error, "Unable to sign in."));
      throw error;
    }
  }, []);

  /**
   * Verify OTP and authenticate the student.
   */
  const verifyOtp = useCallback(
    async (studentID, otp, remember = true) => {
      setAuthError("");

      try {
        if (
          !String(studentID ?? "").trim() ||
          !String(otp ?? "").trim()
        ) {
          throw new Error("Student ID and OTP are required.");
        }

        if (typeof authService.verifyOtp !== "function") {
          throw new Error("OTP verification is not configured.");
        }

        const result = await authService.verifyOtp(
          String(studentID).trim(),
          String(otp).trim(),
          remember
        );

        if (!result || typeof result !== "object") {
          throw new Error(
            "Invalid response after OTP verification."
          );
        }

        if (
          result.success === false ||
          result.verified === false ||
          result.requiresOtp === true ||
          result.requires_otp === true ||
          result.otp_required === true
        ) {
          throw new Error(
            getErrorMessage(result, "OTP verification failed.")
          );
        }

        if (!TokenService.hasAccessToken()) {
          throw new Error(
            "OTP verification returned no access token."
          );
        }

        const profile = normalizeStudentProfile(result);

        if (!profile) {
          throw new Error(
            "OTP was verified, but the student profile is missing."
          );
        }

        setUser(profile);
        setAuthError("");

        return profile;
      } catch (error) {
        setAuthError(
          getErrorMessage(
            error,
            "OTP verification failed. Please try again."
          )
        );

        throw error;
      }
    },
    []
  );

  /**
   * Set the authenticated profile after a successful login.
   */
  const completeLogin = useCallback((verifiedUser) => {
    const profile = normalizeStudentProfile(verifiedUser);

    if (!profile) {
      throw new Error("Invalid student profile after authentication.");
    }

    setUser(profile);
    setAuthError("");

    return profile;
  }, []);

  /**
   * Clear the local session.
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      TokenService.clearTokens();
      setUser(null);
      setAuthError("");
      setLoading(false);
    }
  }, []);

  /**
   * Restore the session on application startup.
   * authService.me() must use the existing access token and return
   * the current authenticated student's profile.
   */
  const bootstrap = useCallback(async () => {
    setLoading(true);

    if (!TokenService.hasAccessToken()) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const currentUser = await authService.me();
      const profile = normalizeStudentProfile(currentUser);

      if (!profile) {
        throw new Error("Invalid student profile from the server.");
      }

      setUser(profile);
      setAuthError("");
    } catch (error) {
      TokenService.clearTokens();
      setUser(null);
      setAuthError(
        getErrorMessage(
          error,
          "Your session has expired. Please sign in again."
        )
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const value = useMemo(
    () => ({
      user,
      loading,
      authError,
      isAuthenticated: Boolean(user),
      login,
      verifyOtp,
      completeLogin,
      logout,
    }),
    [
      user,
      loading,
      authError,
      login,
      verifyOtp,
      completeLogin,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
