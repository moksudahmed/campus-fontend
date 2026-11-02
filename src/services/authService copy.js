import {
  API_BASE_URL,
  API_ENDPOINTS,
  DEMO_MODE,
} from "../config";

import TokenService from "./tokenService";
import { apiRequest } from "./apiClient";

/*
|--------------------------------------------------------------------------
| Production-Safe Logger
|--------------------------------------------------------------------------
|
| Development:
|   console.log / warn / error are available.
|
| Production:
|   application logs are disabled.
|
| Note:
|   This does NOT hide browser DevTools Network entries such as
|   "POST ... 401 (Unauthorized)".
|
|--------------------------------------------------------------------------
*/

const isProduction =
  process.env.NODE_ENV === "production";

const logger = {
  log: (...args) => {
    if (!isProduction) {
      console.log(...args);
    }
  },

  info: (...args) => {
    if (!isProduction) {
      console.info(...args);
    }
  },

  warn: (...args) => {
    if (!isProduction) {
      console.warn(...args);
    }
  },

  error: (...args) => {
    if (!isProduction) {
      console.error(...args);
    }
  },

  debug: (...args) => {
    if (!isProduction) {
      console.debug(...args);
    }
  },
};

/*
|--------------------------------------------------------------------------
| Demo User
|--------------------------------------------------------------------------
*/

const demoUser = {
  id: "221-115-001",
  studentId: "221-115-001",
  name: "Mr. Udoy Roy Debasish",
  program:
    "B. Sc. (Engg.) in Computer Science and Engineering (CSE)",
  batch: "56",
  section: "A",
  academicYear: "Spring 2022",
  admissionDate: "2021-11-08",
  dateOfBirth: "2001-10-20",
  gender: "Male",
  bloodGroup: "O+",
  nationality: "Bangladeshi",
  mobile: "01608623917",
  guardianMobile: "01770124111",
  avatarUrl: "",
};

/*
|--------------------------------------------------------------------------
| Helper: Get Complete API URL
|--------------------------------------------------------------------------
*/

function getApiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

/*
|--------------------------------------------------------------------------
| Helper: Normalize Authentication Response
|--------------------------------------------------------------------------
|
| Supports:
|
| {
|   "access_token": "...",
|   "refresh_token": "...",
|   "user": {...}
| }
|
| OR
|
| {
|   "accessToken": "...",
|   "refreshToken": "...",
|   "user": {...}
| }
|
| OR
|
| {
|   "token": "..."
| }
|
|--------------------------------------------------------------------------
*/

function normalizeAuthResponse(data = {}) {
  const accessToken =
    data.access_token ||
    data.accessToken ||
    data.token ||
    data.data?.access_token ||
    data.data?.accessToken ||
    data.data?.token ||
    null;

  const refreshToken =
    data.refresh_token ||
    data.refreshToken ||
    data.data?.refresh_token ||
    data.data?.refreshToken ||
    null;

  const user =
    data.user ||
    data.student_id ||
    data.data?.user ||
    data.data?.student_id ||
    null;

  return {
    accessToken,
    refreshToken,
    user,
  };
}

/*
|--------------------------------------------------------------------------
| Helper: Handle Network Errors
|--------------------------------------------------------------------------
*/

function normalizeNetworkError(error) {
  if (
    error?.name === "TypeError" &&
    String(error.message || "").includes("Failed to fetch")
  ) {
    return new Error(
      "Unable to connect to the server. Please check your internet connection or API server."
    );
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error(
    "An unexpected error occurred. Please try again."
  );
}

/*
|--------------------------------------------------------------------------
| Helper: Extract Backend Error Message
|--------------------------------------------------------------------------
|
| Handles:
|
| {
|   "detail": "Incorrect username or password"
| }
|
| And FastAPI validation:
|
| {
|   "detail": [
|     {
|       "loc": ["body", "username"],
|       "msg": "Field required"
|     }
|   ]
| }
|
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  data,
  fallback = "Request failed."
) {
  if (!data) {
    return fallback;
  }

  /*
  |--------------------------------------------------------------------------
  | FastAPI validation errors
  |--------------------------------------------------------------------------
  */

  if (Array.isArray(data.detail)) {
    const messages = data.detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        return (
          item?.msg ||
          item?.message ||
          item?.detail ||
          null
        );
      })
      .filter(Boolean);

    if (messages.length > 0) {
      return messages.join(", ");
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Normal detail
  |--------------------------------------------------------------------------
  */

  if (typeof data.detail === "string") {
    return data.detail;
  }

  /*
  |--------------------------------------------------------------------------
  | message
  |--------------------------------------------------------------------------
  */

  if (typeof data.message === "string") {
    return data.message;
  }

  /*
  |--------------------------------------------------------------------------
  | error
  |--------------------------------------------------------------------------
  */

  if (typeof data.error === "string") {
    return data.error;
  }

  return fallback;
}

/*
|--------------------------------------------------------------------------
| Helper: Safely Parse Fetch Response
|--------------------------------------------------------------------------
*/

async function parseResponse(response) {
  const contentType =
    response.headers.get("content-type") || "";

  /*
  |--------------------------------------------------------------------------
  | JSON response
  |--------------------------------------------------------------------------
  */

  if (contentType.includes("application/json")) {
    return await response
      .json()
      .catch(() => ({}));
  }

  /*
  |--------------------------------------------------------------------------
  | Non JSON response
  |--------------------------------------------------------------------------
  */

  const text = await response
    .text()
    .catch(() => "");

  if (!text) {
    return {};
  }

  return {
    message: text,
  };
}

/*
|--------------------------------------------------------------------------
| Authentication Service
|--------------------------------------------------------------------------
*/

const authService = {
  /*
  |--------------------------------------------------------------------------
  | LOGIN
  |--------------------------------------------------------------------------
  |
  | FastAPI OAuth2PasswordRequestForm expects:
  |
  | Content-Type:
  | application/x-www-form-urlencoded
  |
  | username=...
  | password=...
  |
  |--------------------------------------------------------------------------
  */

  async login(
    loginId,
    password,
    remember = true
  ) {
    /*
    |--------------------------------------------------------------------------
    | Validate input
    |--------------------------------------------------------------------------
    */

    if (
      !loginId ||
      !String(loginId).trim()
    ) {
      throw new Error(
        "Enter your Student ID/Login ID."
      );
    }

    if (!password) {
      throw new Error(
        "Enter your password."
      );
    }

    const cleanLoginId =
      String(loginId).trim();

    /*
    |--------------------------------------------------------------------------
    | DEMO MODE
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      const accessToken =
        `demo.${btoa(
          `${cleanLoginId}:${Date.now()}`
        )}`;

      TokenService.setTokens({
        accessToken,
        refreshToken:
          "demo-refresh-token",
        remember,
      });

      return {
        ...demoUser,
        studentId: cleanLoginId,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | REAL API
    |--------------------------------------------------------------------------
    */

    const url =
      getApiUrl(API_ENDPOINTS.login);

    /*
    |--------------------------------------------------------------------------
    | Build form-urlencoded request
    |--------------------------------------------------------------------------
    */

    const formData =
      new URLSearchParams();

    formData.append(
      "username",
      cleanLoginId
    );

    formData.append(
      "password",
      password
    );

    try {
      /*
      |--------------------------------------------------------------------------
      | Send Login Request
      |--------------------------------------------------------------------------
      */

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",

          Accept:
            "application/json",
        },

        body:
          formData.toString(),
      });

      /*
      |--------------------------------------------------------------------------
      | Parse Response
      |--------------------------------------------------------------------------
      */

      const data =
        await parseResponse(response);

      /*
      |--------------------------------------------------------------------------
      | Backend Error
      |--------------------------------------------------------------------------
      */
      if (data?.message) {
        throw new Error(data.message);
      }

      if (!response.ok) {
        throw new Error("Login failed.");
      }
      /*if (!response.ok) {
        
        const message =
          getErrorMessage(
            data,
            response.status === 401
              ? "Invalid login credentials."
              : "Login failed."
          );

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT
        |--------------------------------------------------------------------------
        |
        | Do NOT console.error() here.
        |
        | 401 is an expected authentication response when
        | credentials are incorrect.
        |
        |--------------------------------------------------------------------------
        */

        /*throw new Error(message);
      }*/

      /*
      |--------------------------------------------------------------------------
      | Normalize Response
      |--------------------------------------------------------------------------
      */

      const {
        accessToken,
        refreshToken,
        user,
      } =
        normalizeAuthResponse(data);

      /*
      |--------------------------------------------------------------------------
      | Validate Access Token
      |--------------------------------------------------------------------------
      */

      if (!accessToken) {
        logger.error(
          "[AUTH] No access token returned:",
          data
        );

        throw new Error(
          "Login succeeded but the server did not return an access token."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Store Tokens
      |--------------------------------------------------------------------------
      */

      TokenService.setTokens({
        accessToken,
        refreshToken,
        remember,
      });

      /*
      |--------------------------------------------------------------------------
      | User included in login response
      |--------------------------------------------------------------------------
      */

      if (user) {
        return user;
      }

      /*
      |--------------------------------------------------------------------------
      | User not included.
      | Get current user from /me
      |--------------------------------------------------------------------------
      */

      return await authService.me();
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | IMPORTANT:
      |
      | Do not log login errors in production.
      |
      | In development, logger.error() can still help debugging.
      |--------------------------------------------------------------------------
      */

      logger.error(
        "[AUTH] Login error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | Network Error
      |--------------------------------------------------------------------------
      */

      if (
        error?.name === "TypeError" &&
        String(error.message || "").includes(
          "Failed to fetch"
        )
      ) {
        throw new Error(
          "Unable to connect to the server. Please check your internet connection or API server."
        );
      }

      throw error instanceof Error
        ? error
        : new Error(
            "Unable to login. Please try again."
          );
    }
  },

  /*
  |--------------------------------------------------------------------------
  | GET CURRENT USER
  |--------------------------------------------------------------------------
  */

  async me() {
    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      return demoUser;
    }

    /*
    |--------------------------------------------------------------------------
    | Make authenticated request
    |--------------------------------------------------------------------------
    */

    const data =
      await apiRequest(
        API_ENDPOINTS.me
      );

    /*
    |--------------------------------------------------------------------------
    | Normalize User Response
    |--------------------------------------------------------------------------
    */

    return (
      data?.user ||
      data?.student ||
      data?.data?.user ||
      data?.data?.student ||
      data?.data ||
      data
    );
  },

  /*
  |--------------------------------------------------------------------------
  | REFRESH ACCESS TOKEN
  |--------------------------------------------------------------------------
  */

  async refreshToken() {
    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      const accessToken =
        TokenService.getAccessToken();

      if (accessToken) {
        return accessToken;
      }

      throw new Error(
        "Demo session expired."
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get Refresh Token
    |--------------------------------------------------------------------------
    */

    const refreshToken =
      TokenService.getRefreshToken();

    if (!refreshToken) {
      throw new Error(
        "No refresh token available."
      );
    }

    const url =
      getApiUrl(
        API_ENDPOINTS.refresh
      );

    try {
      /*
      |--------------------------------------------------------------------------
      | Refresh Request
      |--------------------------------------------------------------------------
      */

      const response = await fetch(url, {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Accept:
            "application/json",
        },

        body: JSON.stringify({
          refresh_token:
            refreshToken,
        }),
      });

      const data =
        await parseResponse(response);

      /*
      |--------------------------------------------------------------------------
      | Refresh Failed
      |--------------------------------------------------------------------------
      */

      if (!response.ok) {
        TokenService.clearTokens();

        throw new Error(
          getErrorMessage(
            data,
            "Your session has expired. Please login again."
          )
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Normalize Response
      |--------------------------------------------------------------------------
      */

      const {
        accessToken,
        refreshToken:
          newRefreshToken,
      } =
        normalizeAuthResponse(data);

      /*
      |--------------------------------------------------------------------------
      | Validate Access Token
      |--------------------------------------------------------------------------
      */

      if (!accessToken) {
        TokenService.clearTokens();

        throw new Error(
          "The server did not return a new access token."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Save New Tokens
      |--------------------------------------------------------------------------
      */

      TokenService.setTokens({
        accessToken,

        refreshToken:
          newRefreshToken ||
          refreshToken,

        remember:
          TokenService.isRemembered(),
      });

      return accessToken;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Do not expose refresh errors in production
      |--------------------------------------------------------------------------
      */

      logger.error(
        "[AUTH] Token refresh error:",
        error
      );

      TokenService.clearTokens();

      throw error instanceof Error
        ? error
        : new Error(
            "Session expired. Please login again."
          );
    }
  },

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  async logout() {
    const accessToken =
      TokenService.getAccessToken();

    try {
      /*
      |--------------------------------------------------------------------------
      | Call Backend Logout
      |--------------------------------------------------------------------------
      */

      if (
        !DEMO_MODE &&
        accessToken
      ) {
        try {
          await apiRequest(
            API_ENDPOINTS.logout,
            {
              method: "POST",
            },
            false
          );
        } catch (error) {
          /*
          |--------------------------------------------------------------------------
          | Important:
          |
          | Even if backend logout fails,
          | local session must still be removed.
          |--------------------------------------------------------------------------
          */

          logger.warn(
            "[AUTH] Backend logout failed:",
            error
          );
        }
      }
    } finally {
      /*
      |--------------------------------------------------------------------------
      | Always clear local authentication
      |--------------------------------------------------------------------------
      */

      TokenService.clearTokens();
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CHECK AUTHENTICATION
  |--------------------------------------------------------------------------
  */

  isAuthenticated() {
    return TokenService.hasAccessToken();
  },

  /*
  |--------------------------------------------------------------------------
  | GET ACCESS TOKEN
  |--------------------------------------------------------------------------
  */

  getAccessToken() {
    return TokenService.getAccessToken();
  },

  /*
  |--------------------------------------------------------------------------
  | GET REFRESH TOKEN
  |--------------------------------------------------------------------------
  */

  getRefreshToken() {
    return TokenService.getRefreshToken();
  },

  /*
  |--------------------------------------------------------------------------
  | CLEAR SESSION
  |--------------------------------------------------------------------------
  */

  clearSession() {
    TokenService.clearTokens();
  },

  /*
  |--------------------------------------------------------------------------
  | CHANGE PASSWORD
  |--------------------------------------------------------------------------
  */

  async changePassword(
    payload,
    token
  ) {
    try {
      const {
        student_id,
        password,
      } = payload || {};

      if (
        !student_id ||
        !password
      ) {
        throw new Error(
          "Missing student ID or password."
        );
      }

      const endpoint =
        getApiUrl(
          `${API_ENDPOINTS.changePassword}/${encodeURIComponent(
            student_id
          )}`
        );

      const response =
        await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            token,
            student_id,
            new_password:
              password,
          }),
        });

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to reset password."
          )
        );
      }

      return data;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | No console output here.
      | Caller receives the error normally.
      |--------------------------------------------------------------------------
      */

      throw normalizeNetworkError(error);
    }
  },

  /*
  |--------------------------------------------------------------------------
  | CHANGE EMAIL
  |--------------------------------------------------------------------------
  */

  async changeEmail(
    payload,
    token
  ) {
    try {
      const {
        student_id,
        new_email,
      } = payload || {};

      if (
        !student_id ||
        !new_email
      ) {
        throw new Error(
          "Student ID and new email are required."
        );
      }

      const endpoint =
        getApiUrl(
          `${API_ENDPOINTS.changeEmail}/${encodeURIComponent(
            student_id
          )}`
        );

      const response =
        await fetch(endpoint, {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            ...(token
              ? {
                  Authorization:
                    `Bearer ${token}`,
                }
              : {}),
          },

          body: JSON.stringify({
            student_id,
            email: new_email,
          }),
        });

      const data =
        await parseResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            data,
            "Failed to update email."
          )
        );
      }

      return data;
    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | No console output here.
      |--------------------------------------------------------------------------
      */

      throw normalizeNetworkError(error);
    }
  },
};

/*
|--------------------------------------------------------------------------
| Export
|--------------------------------------------------------------------------
*/

export const changePassword =
  authService.changePassword;

export const changeEmail =
  authService.changeEmail;

export default authService;