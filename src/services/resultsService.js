import { API_ENDPOINTS, DEMO_MODE } from '../config';
import TokenService from './tokenService';
import { apiRequest } from './apiClient';

/*
|--------------------------------------------------------------------------
| Result Service
|--------------------------------------------------------------------------
|
| All authenticated result requests go through apiRequest().
|
| apiRequest() is responsible for:
| - Adding Authorization: Bearer <token>
| - Handling HTTP errors
| - Refreshing the access token when necessary
|
|--------------------------------------------------------------------------
*/

/**
 * Validate student ID.
 *
 * @param {string|number} studentId
 * @returns {string}
 */
function normalizeStudentId(studentId) {
  if (
    studentId === null ||
    studentId === undefined ||
    String(studentId).trim() === ''
  ) {
    throw new Error('Student ID is required.');
  }

  return String(studentId).trim();
}

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
 * Fetch all academic results for a student.
 *
 * API:
 * GET /api/v1/result/{studentId}
 *
 * @param {string|number} studentId
 * @returns {Promise<Object>}
 */
export const fetchResults = async (studentId) => {
  try {
    const cleanStudentId =studentId; //normalizeStudentId(studentId);
    
    if (DEMO_MODE) {
      console.warn('[RESULT] Demo mode enabled.');

      return {
        studentId: cleanStudentId,
        results: [],
      };
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error('Your session has expired. Please login again.');
    }

    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    */
    

    const endpoint = `${API_ENDPOINTS.result}/${encodeURIComponent(
      cleanStudentId
    )}`;

    

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    //console.log('[RESULT] Results response:', data);

    return data;
  } catch (error) {
    console.error('[RESULT] Failed to fetch student results:', error);

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve student results.'
      )
    );
  }
};

/**
 * Fetch current term results for a student.
 *
 * API:
 * GET /api/v1/result/current_term_results/{studentId}
 *
 * @param {string|number} studentId
 * @returns {Promise<Object>}
 */
export const fetchCurrentResults = async (studentId) => {
  try {
    const cleanStudentId = studentId; //normalizeStudentId(studentId);
   
    if (DEMO_MODE) {
      console.warn('[RESULT] Demo mode enabled.');

      return {
        studentId: cleanStudentId,
        results: [],
      };
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error('Your session has expired. Please login again.');
    }

    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    */
  
    const endpoint =
      `${API_ENDPOINTS.currentTermResults}/${encodeURIComponent(
        cleanStudentId
      )}`;

    /*console.log(
      '[RESULT] Fetching current term results:',
      endpoint
    );*/

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    /*console.log(
      '[RESULT] Current term results response:',
      data
    );*/

    return data;
  } catch (error) {
    console.error(
      '[RESULT] Failed to fetch current term results:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve current term results.'
      )
    );
  }
};

/**
 * Fetch results using the currently authenticated student.
 *
 * This is useful when /auth/me provides studentId.
 *
 * @param {Object} user
 * @returns {Promise<Object>}
 */
export const fetchMyResults = async (user) => {
  const studentId =
    user?.studentId ||
    user?.student_id ||
    user?.id;

  if (!studentId) {
    throw new Error(
      'Unable to determine the current student ID.'
    );
  }

  return fetchResults(studentId);
};

/**
 * Fetch current term results using the currently
 * authenticated student.
 *
 * @param {Object} user
 * @returns {Promise<Object>}
 */
export const fetchMyCurrentResults = async (user) => {
  const studentId =
    user?.studentId ||
    user?.student_id ||
    user?.id;

  if (!studentId) {
    throw new Error(
      'Unable to determine the current student ID.'
    );
  }

  return fetchCurrentResults(studentId);
};

export default {
  fetchResults,
  fetchCurrentResults,
  fetchMyResults,
  fetchMyCurrentResults,
};

