
/*
|--------------------------------------------------------------------------
| Token Storage Keys
|--------------------------------------------------------------------------
*/

const ACCESS_TOKEN_KEY =
  'student_portal_access_token';

const REFRESH_TOKEN_KEY =
  'student_portal_refresh_token';

const REMEMBER_KEY =
  'student_portal_remember';

/*
|--------------------------------------------------------------------------
| Token Service
|--------------------------------------------------------------------------
*/

const TokenService = {
  /*
  |--------------------------------------------------------------------------
  | Set Tokens
  |--------------------------------------------------------------------------
  */

  setTokens({
    accessToken,
    refreshToken = null,
    remember = true,
  }) {
    if (!accessToken) {
      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Decide storage
    |--------------------------------------------------------------------------
    |
    | remember = true
    | -> localStorage
    |
    | remember = false
    | -> sessionStorage
    |
    |--------------------------------------------------------------------------
    */

    const storage =
      remember
        ? localStorage
        : sessionStorage;

    /*
    |--------------------------------------------------------------------------
    | Clear old tokens from both storages
    |--------------------------------------------------------------------------
    */

    this.clearTokens();

    /*
    |--------------------------------------------------------------------------
    | Save Access Token
    |--------------------------------------------------------------------------
    */

    storage.setItem(
      ACCESS_TOKEN_KEY,
      accessToken
    );

    /*
    |--------------------------------------------------------------------------
    | Save Refresh Token
    |--------------------------------------------------------------------------
    */

    if (refreshToken) {
      storage.setItem(
        REFRESH_TOKEN_KEY,
        refreshToken
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Save Remember State
    |--------------------------------------------------------------------------
    */

    storage.setItem(
      REMEMBER_KEY,
      remember ? 'true' : 'false'
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Get Access Token
  |--------------------------------------------------------------------------
  */

  getAccessToken() {
    return (
      localStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        ACCESS_TOKEN_KEY
      ) ||
      null
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Get Refresh Token
  |--------------------------------------------------------------------------
  */

  getRefreshToken() {
    return (
      localStorage.getItem(
        REFRESH_TOKEN_KEY
      ) ||
      sessionStorage.getItem(
        REFRESH_TOKEN_KEY
      ) ||
      null
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Check Remember
  |--------------------------------------------------------------------------
  */

  isRemembered() {
    return (
      localStorage.getItem(
        REMEMBER_KEY
      ) === 'true'
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Check Access Token
  |--------------------------------------------------------------------------
  */

  hasAccessToken() {
    return Boolean(
      this.getAccessToken()
    );
  },

  /*
  |--------------------------------------------------------------------------
  | Clear Tokens
  |--------------------------------------------------------------------------
  */

  clearTokens() {
    /*
    |--------------------------------------------------------------------------
    | localStorage
    |--------------------------------------------------------------------------
    */

    localStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    localStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    localStorage.removeItem(
      REMEMBER_KEY
    );

    /*
    |--------------------------------------------------------------------------
    | sessionStorage
    |--------------------------------------------------------------------------
    */

    sessionStorage.removeItem(
      ACCESS_TOKEN_KEY
    );

    sessionStorage.removeItem(
      REFRESH_TOKEN_KEY
    );

    sessionStorage.removeItem(
      REMEMBER_KEY
    );
  },
};

export default TokenService;

