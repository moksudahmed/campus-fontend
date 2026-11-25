
import {
  API_BASE_URL,
  API_ENDPOINTS,
} from '../config';

import TokenService from './tokenService';

/*
|--------------------------------------------------------------------------
| Prevent multiple simultaneous refresh requests
|--------------------------------------------------------------------------
*/

let refreshPromise = null;

/*
|--------------------------------------------------------------------------
| Build URL
|--------------------------------------------------------------------------
*/

/*function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}*/
/*
|--------------------------------------------------------------------------
| Build URL - PHP Proxy Compatible
|--------------------------------------------------------------------------
*/

function buildUrl(endpoint) {
  if (!endpoint) {
    throw new Error("API endpoint is required.");
  }

  // Direct API URL (if configured)
  if (
    endpoint.startsWith("http://") ||
    endpoint.startsWith("https://")
  ) {
    return endpoint;
  }

  // Normalize endpoint
  const cleanEndpoint = endpoint.startsWith("/")
    ? endpoint
    : `/${endpoint}`;

  /*
   * API_BASE_URL:
   * https://campus.metrouni.ac.bd/api/api.php
   *
   * Endpoint:
   * /api/v1/registration-applications/available-subjects?regi_type=2&term=2&year=2026
   */

  const proxyUrl = new URL(API_BASE_URL);

  proxyUrl.searchParams.set("path", cleanEndpoint);

  return proxyUrl.toString();
}
/*
|--------------------------------------------------------------------------
| Parse Response
|--------------------------------------------------------------------------
*/

async function parseResponse(response) {
  const contentType =
    response.headers.get('content-type') || '';

  if (
    contentType.includes(
      'application/json'
    )
  ) {
    return await response
      .json()
      .catch(() => ({}));
  }

  const text =
    await response
      .text()
      .catch(() => '');

  return text
    ? { message: text }
    : {};
}

/*
|--------------------------------------------------------------------------
| Extract Error
|--------------------------------------------------------------------------
*/

function getErrorMessage(
  data,
  fallback
) {
  if (
    Array.isArray(data?.detail)
  ) {
    return data.detail
      .map(
        (item) =>
          item?.msg ||
          item?.message ||
          String(item)
      )
      .join(', ');
  }

  return (
    data?.detail ||
    data?.message ||
    data?.error ||
    fallback
  );
}

/*
|--------------------------------------------------------------------------
| Refresh Token
|--------------------------------------------------------------------------
*/

async function refreshAccessToken() {
  /*
  |--------------------------------------------------------------------------
  | Prevent duplicate refresh requests
  |--------------------------------------------------------------------------
  */

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise =
    (async () => {
      try {
        const refreshToken =
          TokenService.getRefreshToken();

        if (!refreshToken) {
          throw new Error(
            'No refresh token available.'
          );
        }

        const response =
          await fetch(
            buildUrl(
              API_ENDPOINTS.refresh
            ),
            {
              method: 'POST',

              headers: {
                'Content-Type':
                  'application/json',

                Accept:
                  'application/json',
              },

              body: JSON.stringify({
                refresh_token:
                  refreshToken,
              }),
            }
          );

        const data =
          await parseResponse(
            response
          );

        if (!response.ok) {
          throw new Error(
            getErrorMessage(
              data,
              'Session expired.'
            )
          );
        }

        const accessToken =
          data?.access_token ||
          data?.accessToken ||
          data?.token ||
          data?.data?.access_token ||
          data?.data?.accessToken;

        const newRefreshToken =
          data?.refresh_token ||
          data?.refreshToken ||
          data?.data?.refresh_token ||
          data?.data?.refreshToken ||
          refreshToken;

        if (!accessToken) {
          throw new Error(
            'No access token returned during refresh.'
          );
        }

        TokenService.setTokens({
          accessToken,
          refreshToken:
            newRefreshToken,
          remember:
            TokenService.isRemembered(),
        });

        return accessToken;
      } catch (error) {
        TokenService.clearTokens();
        throw error;
      } finally {
        refreshPromise = null;
      }
    })();

  return refreshPromise;
}

/*
|--------------------------------------------------------------------------
| API Request
|--------------------------------------------------------------------------
|
| Usage:
|
| apiRequest('/students')
|
| apiRequest('/students', {
|   method: 'POST',
|   body: JSON.stringify(data)
| })
|
|--------------------------------------------------------------------------
*/
export async function apiRequest(
  endpoint,
  options = {},
  retryOn401 = true
) {
  const url = buildUrl(endpoint);

  /*
  |--------------------------------------------------------------------------
  | Get access token
  |--------------------------------------------------------------------------
  */

  const accessToken = TokenService.getAccessToken();

  /*
  |--------------------------------------------------------------------------
  | Headers
  |--------------------------------------------------------------------------
  */

  const headers = {
    Accept: "application/json",
    ...(options.headers || {}),
  };

  /*
  |--------------------------------------------------------------------------
  | Add JSON Content-Type automatically
  |--------------------------------------------------------------------------
  */

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !(options.body instanceof URLSearchParams) &&
    !headers["Content-Type"]
  ) {
    headers["Content-Type"] = "application/json";
  }

  /*
  |--------------------------------------------------------------------------
  | Authorization
  |--------------------------------------------------------------------------
  */

  if (accessToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  /*
  |--------------------------------------------------------------------------
  | Request
  |--------------------------------------------------------------------------
  */

  let response;  
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    console.error("[API] Network error:", error);

    throw new Error(
      "Unable to connect to the server."
    );
  }
 
  /*
  |--------------------------------------------------------------------------
  | Unauthorized - try to refresh token
  |--------------------------------------------------------------------------
  */

  if (
    response.status === 401 &&
    retryOn401
  ) {
    try {
      /*
      |--------------------------------------------------------------------------
      | Refresh access token
      |--------------------------------------------------------------------------
      */

      const newAccessToken =
        await refreshAccessToken();

      if (!newAccessToken) {
        throw new Error(
          "Unable to refresh access token."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Retry original request with new token
      |--------------------------------------------------------------------------
      */

      const retryHeaders = {
        ...headers,
        Authorization:
          `Bearer ${newAccessToken}`,
      };

      const retryResponse =
        await fetch(url, {
          ...options,
          headers: retryHeaders,
        });

      const retryData =
        await parseResponse(retryResponse);

      /*
      |--------------------------------------------------------------------------
      | Retry failed
      |--------------------------------------------------------------------------
      */

      if (!retryResponse.ok) {
        throw new Error(
          getErrorMessage(
            retryData,
            `Request failed (${retryResponse.status}).`
          )
        );
      }

      return retryData;

    } catch (error) {
      /*
      |--------------------------------------------------------------------------
      | Token refresh failed
      |--------------------------------------------------------------------------
      */

      console.error(
        "[AUTH] Token refresh failed:",
        error
      );

      TokenService.clearTokens();

      throw new Error(
        "Your session has expired. Please login again."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Parse normal response
  |--------------------------------------------------------------------------
  */

  const data = await parseResponse(response);

  /*
  |--------------------------------------------------------------------------
  | Handle normal API errors
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Request failed (${response.status}).`
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Return successful response
  |--------------------------------------------------------------------------
  */

  return data;
}

export async function apiRequestJSON(
  endpoint,
  options = {},
  retryOn401 = true
) {
  const url = buildUrl(endpoint);

  /*
  |--------------------------------------------------------------------------
  | Get access token
  |--------------------------------------------------------------------------
  */

  const accessToken = TokenService.getAccessToken();

  /*
  |--------------------------------------------------------------------------
  | Prepare request body
  |--------------------------------------------------------------------------
  */

  const originalBody = options.body;

  const isFormData =
    typeof FormData !== "undefined" &&
    originalBody instanceof FormData;

  const isURLSearchParams =
    typeof URLSearchParams !== "undefined" &&
    originalBody instanceof URLSearchParams;

  const isBlob =
    typeof Blob !== "undefined" &&
    originalBody instanceof Blob;

  const isArrayBuffer =
    typeof ArrayBuffer !== "undefined" &&
    originalBody instanceof ArrayBuffer;

  const isJSONBody =
    originalBody !== undefined &&
    originalBody !== null &&
    typeof originalBody === "object" &&
    !isFormData &&
    !isURLSearchParams &&
    !isBlob &&
    !isArrayBuffer;

  // Serialize JavaScript objects exactly once.
  const requestBody = isJSONBody
    ? JSON.stringify(originalBody)
    : originalBody;

  /*
  |--------------------------------------------------------------------------
  | Headers
  |--------------------------------------------------------------------------
  */

  const headers = new Headers(options.headers || {});

  headers.set("Accept", "application/json");

  /*
  |--------------------------------------------------------------------------
  | JSON Content-Type
  |--------------------------------------------------------------------------
  */

  if (isJSONBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  /*
  |--------------------------------------------------------------------------
  | Authorization
  |--------------------------------------------------------------------------
  */

  if (accessToken && !headers.has("Authorization")) {
    headers.set(
      "Authorization",
      `Bearer ${accessToken}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Prepare request options
  |--------------------------------------------------------------------------
  */

  const requestOptions = {
    ...options,
    headers,
    body: requestBody,
  };

  /*
  |--------------------------------------------------------------------------
  | Debug request
  |--------------------------------------------------------------------------
  */

  //console.log("[API] Request URL:", url);
  //console.log("[API] Request method:", options.method || "GET");

  /*if (isJSONBody) {
    console.log("[API] JSON request body:", requestBody);
  }*/

  /*
  |--------------------------------------------------------------------------
  | Send request
  |--------------------------------------------------------------------------
  */

  let response;

  try {
    response = await fetch(url, requestOptions);

  } catch (error) {
    console.error("[API] Network error:", error);

    throw new Error(
      "Unable to connect to the server."
    );
  }
  
  /*
  |--------------------------------------------------------------------------
  | Unauthorized - Refresh access token
  |--------------------------------------------------------------------------
  */

  if (
    response.status === 401 &&
    retryOn401
  ) {
    try {
      const newAccessToken =
        await refreshAccessToken();

      if (!newAccessToken) {
        throw new Error(
          "Unable to refresh access token."
        );
      }

      /*
      |--------------------------------------------------------------------------
      | Retry original request with new token
      |--------------------------------------------------------------------------
      */

      const retryHeaders = new Headers(headers);

      retryHeaders.set(
        "Authorization",
        `Bearer ${newAccessToken}`
      );

      const retryResponse = await fetch(url, {
        ...requestOptions,
        headers: retryHeaders,
      });

      const retryData =
        await parseResponse(retryResponse);

      if (!retryResponse.ok) {
        throw new Error(
          getErrorMessage(
            retryData,
            `Request failed (${retryResponse.status}).`
          )
        );
      }

      return retryData;

    } catch (error) {
      console.error(
        "[AUTH] Token refresh failed:",
        error
      );

      TokenService.clearTokens();

      throw new Error(
        "Your session has expired. Please login again."
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Parse normal response
  |--------------------------------------------------------------------------
  */

  const data = await parseResponse(response);

  /*
  |--------------------------------------------------------------------------
  | Handle API errors
  |--------------------------------------------------------------------------
  */

  if (!response.ok) {
    throw new Error(
      getErrorMessage(
        data,
        `Request failed (${response.status}).`
      )
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Return successful response
  |--------------------------------------------------------------------------
  */

  return data;
}

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

const apiClient = {
  request: apiRequest,
};

export default apiClient;

