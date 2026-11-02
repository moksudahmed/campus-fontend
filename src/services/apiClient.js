
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

function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
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

/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

const apiClient = {
  request: apiRequest,
};

export default apiClient;

