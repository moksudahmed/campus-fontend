import { API_ENDPOINTS, DEMO_MODE } from '../config';
import TokenService from './tokenService';
import { apiRequest } from './apiClient';

/*
|--------------------------------------------------------------------------
| Option Service
|--------------------------------------------------------------------------
|
| Handles authenticated academic option/configuration requests.
|
| Backend API:
| GET /api/v1/option/current-term
|
| Authentication:
| Authorization: Bearer <access_token>
|
| Response:
| {
|   "year": 2026,
|   "term": 1
| }
|
| apiRequest() is responsible for:
| - Adding Authorization: Bearer <token>
| - Handling HTTP errors
| - Refreshing the access token when necessary
|
|--------------------------------------------------------------------------
*/

/**
 * Extract a useful error message from API errors.
 *
 * @param {any} error
 * @param {string} fallback
 * @returns {string}
 */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback
  );
}

/**
 * Fetch the currently configured academic year and term.
 *
 * Backend:
 * GET /api/v1/option/current-term
 *
 * @returns {Promise<Object>}
 *
 * Example:
 * {
 *   year: 2026,
 *   term: 1
 * }
 */
export const fetchCurrentTerm = async () => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      console.warn('[OPTION] Demo mode enabled.');

      return {
        year: 2026,
        term: 1,
      };
    }

    /*
    |--------------------------------------------------------------------------
    | Authentication Check
    |--------------------------------------------------------------------------
    */

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    |
    | apiRequest() automatically sends:
    |
    | Authorization: Bearer <access_token>
    |
    */

    const endpoint = API_ENDPOINTS.currentTerm;

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    /*
    |--------------------------------------------------------------------------
    | Validate API Response
    |--------------------------------------------------------------------------
    */

    if (!data || typeof data !== 'object') {
      throw new Error(
        'Invalid response received from the server.'
      );
    }

    if (
      data.year === undefined ||
      data.year === null ||
      data.term === undefined ||
      data.term === null
    ) {
      throw new Error(
        'Current academic year or term is missing from the server response.'
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Normalize Values
    |--------------------------------------------------------------------------
    */

    const year = Number(data.year);
    const term = Number(data.term);

    if (!Number.isInteger(year) || !Number.isInteger(term)) {
      throw new Error(
        'Invalid academic year or term received from the server.'
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate Term
    |--------------------------------------------------------------------------
    |
    | Metropolitan University academic terms:
    | 1 = Spring
    | 2 = Summer
    | 3 = Autumn
    |
    */

    if (![1, 2, 3].includes(term)) {
      throw new Error(
        `Invalid academic term received from the server: ${term}`
      );
    }

    return {
      year,
      term,
    };
  } catch (error) {
    console.error(
      '[OPTION] Failed to fetch current academic term:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve current academic term.'
      )
    );
  }
};

/**
 * Fetch only the current academic year.
 *
 * @returns {Promise<number>}
 */
export const fetchCurrentYear = async () => {
  const data = await fetchCurrentTerm();

  return data.year;
};

/**
 * Fetch only the current academic term number.
 *
 * @returns {Promise<number>}
 */
export const fetchCurrentTermNumber = async () => {
  const data = await fetchCurrentTerm();

  return data.term;
};

/**
 * Fetch the current academic period as a formatted string.
 *
 * Example:
 * "Spring 2026"
 *
 * @returns {Promise<string>}
 */
export const fetchCurrentAcademicPeriod = async () => {
  const data = await fetchCurrentTerm();

  const termNames = {
    1: 'Spring',
    2: 'Summer',
    3: 'Autumn',
  };

  return `${termNames[data.term]} ${data.year}`;
};

export default {
  fetchCurrentTerm,
  fetchCurrentYear,
  fetchCurrentTermNumber,
  fetchCurrentAcademicPeriod,
};

