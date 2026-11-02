import { API_ENDPOINTS, DEMO_MODE } from '../config';
import TokenService from './tokenService';
import { apiRequest } from './apiClient';

/*
|--------------------------------------------------------------------------
| Course Service
|--------------------------------------------------------------------------
|
| All authenticated course requests use apiRequest().
|
| apiRequest() handles:
| - API proxy URL construction
| - Authorization header
| - Access token
| - Token refresh
| - API errors
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| Normalize Student ID
|--------------------------------------------------------------------------
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


/*
|--------------------------------------------------------------------------
| Error Message Helper
|--------------------------------------------------------------------------
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


/*
|--------------------------------------------------------------------------
| Fetch All Courses
|--------------------------------------------------------------------------
|
| API:
| GET /api/v1/course/{studentId}
|
| Example:
| GET /api/v1/course/221-115-001
|
|--------------------------------------------------------------------------
*/

export const fetchCourses = async (studentId) => {
  try {
    const cleanStudentId = normalizeStudentId(studentId);

    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      console.warn('[COURSE] Demo mode enabled.');

      return {
        studentId: cleanStudentId,
        courses: [],
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
    | Build Endpoint
    |--------------------------------------------------------------------------
    */

    const endpoint =
      `${API_ENDPOINTS.course}/${encodeURIComponent(
        cleanStudentId
      )}`;


    /*console.log(
      '[COURSE] Fetching courses:',
      endpoint
    );*/


    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    */

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });


    /*console.log(
      '[COURSE] Courses response:',
      data
    );*/


    return data;

  } catch (error) {
    console.error(
      '[COURSE] Failed to fetch courses:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve courses.'
      )
    );
  }
};


/*
|--------------------------------------------------------------------------
| Fetch Current Term / Enrolled Courses
|--------------------------------------------------------------------------
|
| API:
| GET /api/v1/course/enrolled/{studentId}
|
| Example:
| GET /api/v1/course/enrolled/221-115-001
|
|--------------------------------------------------------------------------
*/

export const fetchCurrentTermCourses = async (
  studentId
) => {
  try {
    const cleanStudentId = normalizeStudentId(studentId);


    /*
    |--------------------------------------------------------------------------
    | Demo Mode
    |--------------------------------------------------------------------------
    */

    if (DEMO_MODE) {
      console.warn(
        '[COURSE] Demo mode enabled.'
      );

      return {
        studentId: cleanStudentId,
        courses: [],
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
    | Build Endpoint
    |--------------------------------------------------------------------------
    */

    const endpoint =
      `${API_ENDPOINTS.currentTermCourses}/${encodeURIComponent(
        cleanStudentId
      )}`;


    /*console.log(
      '[COURSE] Fetching current term courses:',
      endpoint
    );*/


    /*
    |--------------------------------------------------------------------------
    | API Request
    |--------------------------------------------------------------------------
    */

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });


    /*console.log(
      '[COURSE] Current term courses response:',
      data
    );*/


    return data;

  } catch (error) {
    console.error(
      '[COURSE] Failed to fetch current term courses:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve current term course information.'
      )
    );
  }
};


/*
|--------------------------------------------------------------------------
| Fetch My Courses
|--------------------------------------------------------------------------
|
| Allows components to pass the authenticated user object
| instead of manually extracting studentId.
|
|--------------------------------------------------------------------------
*/

export const fetchMyCourses = async (user) => {
  const studentId =
    user?.studentId ||
    user?.student_id ||
    user?.id;

  if (!studentId) {
    throw new Error(
      'Unable to determine the current student ID.'
    );
  }

  return fetchCourses(studentId);
};


/*
|--------------------------------------------------------------------------
| Fetch My Current Term Courses
|--------------------------------------------------------------------------
*/

export const fetchMyCurrentTermCourses = async (
  user
) => {
  const studentId =
    user?.studentId ||
    user?.student_id ||
    user?.id;

  if (!studentId) {
    throw new Error(
      'Unable to determine the current student ID.'
    );
  }

  return fetchCurrentTermCourses(studentId);
};


/*
|--------------------------------------------------------------------------
| Default Export
|--------------------------------------------------------------------------
*/

export default {
  fetchCourses,
  fetchCurrentTermCourses,
  fetchMyCourses,
  fetchMyCurrentTermCourses,
};

