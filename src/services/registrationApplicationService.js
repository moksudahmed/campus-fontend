
import { API_ENDPOINTS, DEMO_MODE } from '../config';
import TokenService from './tokenService';
import { apiRequest, apiRequestJSON } from './apiClient';

/*
|--------------------------------------------------------------------------
| Registration Application Service
|--------------------------------------------------------------------------
|
| All authenticated registration requests go through apiRequest().
|
| apiRequest() is responsible for:
| - Adding Authorization: Bearer <token>
| - Handling HTTP errors
| - Refreshing the access token when necessary
|
|--------------------------------------------------------------------------
*/

/**
 * Validate application ID.
 *
 * @param {string|number} applicationId
 * @returns {string}
 */
function normalizeApplicationId(applicationId) {
  if (
    applicationId === null ||
    applicationId === undefined ||
    String(applicationId).trim() === ''
  ) {
    throw new Error('Application ID is required.');
  }

  return String(applicationId).trim();
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
 * Normalize API list responses.
 *
 * @param {Object|Array} data
 * @returns {Array}
 */
function normalizeList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;

  return [];
}

/**
 * Return demo application data.
 *
 * @returns {Array}
 */
function getDemoApplications() {
  return [];
}

/* -------------------------------------------------------------------------- */
/* Current Academic Term                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fetch the currently configured academic term and year.
 *
 * API:
 * GET /api/v1/option/current-term
 *
 * @returns {Promise<Object>}
 */
export const fetchCurrentAcademicTerm = async () => {
  try {
    if (DEMO_MODE) {
      console.warn('[REGISTRATION] Demo mode enabled.');

      return {
        year: new Date().getFullYear(),
        term: 1,
      };
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const data = await apiRequest(API_ENDPOINTS.currentTerm, {
      method: 'GET',
    });

    return data;
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch current academic term:',
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

/* -------------------------------------------------------------------------- */
/* Student Applications                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Create a new registration application.
 *
 * API:
 * POST /api/v1/registration-applications
 *
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const createApplication = async (payload) => {
  try {
    // Check demo mode
    if (DEMO_MODE) {
      throw new Error(
        'Registration is unavailable in demo mode.'
      );
    }

    // Check authentication
    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    // Validate payload
    if (
      !payload ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new Error(
        'Invalid registration application data.'
      );
    }

    // Prepare request payload
    const requestPayload = {
      ...payload,
    };

    // Serialize JSON explicitly
    const jsonBody = JSON.stringify(requestPayload);

    // API endpoint
    const endpoint =
      API_ENDPOINTS.registrationApplications;

    // Debug information
   /* console.log(
      '[REGISTRATION] Create application endpoint:',
      endpoint
    );

    console.log(
      '[REGISTRATION] Original payload:',
      requestPayload
    );

    console.log(
      '[REGISTRATION] Serialized JSON:',
      jsonBody
    );*/

    // Send POST request
    const response = await apiRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonBody,
    });
    
    /*console.log(
      '[REGISTRATION] Application created successfully:',
      response
    );*/

    return response;

  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to create application:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to create registration application.'
      )
    );
  }
};

/**
 * Fetch all applications belonging to the authenticated student.
 *
 * API:
 * GET /api/v1/registration-applications/mine
 *
 * @returns {Promise<Array>}
 */

/**
 * Fetch all applications belonging to the authenticated student.
 *
 * API:
 * GET /api/v1/registration-applications/mine
 *
 * @returns {Promise<Array>}
 */
export const fetchMyApplications = async () => {  
  try {
    if (DEMO_MODE) {
      console.warn('[REGISTRATION] Demo mode enabled.');
      return getDemoApplications();
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint = API_ENDPOINTS.mine;

    //console.log('[REGISTRATION] Fetching applications:', endpoint);

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });    
    return normalizeList(data);

  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch student applications:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve registration applications.'
      )
    );
  }
};

/**
 * Fetch a single application belonging to the authenticated student.
 *
 * API:
 * GET /api/v1/registration-applications/mine/{application_id}
 *
 * @param {string|number} applicationId
 * @returns {Promise<Object>}
 */
export const fetchApplication = async (applicationId) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      console.warn('[REGISTRATION] Demo mode enabled.');

      return null;
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.mine}/${encodeURIComponent(
        cleanApplicationId
      )}`;

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    return data;
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch application:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to retrieve registration application.'
      )
    );
  }
};

/**
 * Update an existing registration application.
 *
 * API:
 * PATCH /api/v1/registration-applications/{application_id}
 *
 * @param {string|number} applicationId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const updateApplication = async (
  applicationId,
  payload
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}`;

    return await apiRequest(endpoint, {
      method: 'PATCH',
      body: payload,
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to update application:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to update registration application.')
    );
  }
};

/**
 * Submit a registration application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/submit
 *
 * @param {string|number} applicationId
 * @returns {Promise<Object>}
 */
export const submitApplication = async (applicationId) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/submit`;

    return await apiRequest(endpoint, {
      method: 'POST',
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to submit application:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to submit registration application.')
    );
  }
};

/**
 * Cancel a registration application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/cancel
 *
 * @param {string|number} applicationId
 * @param {string} remarks
 * @returns {Promise<Object>}
 */

export const cancelApplication = async (
  applicationId,
  remarks = ''
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/cancel`;

    return await apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify({
        remarks: remarks || null,
      }),
    });

  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to cancel application:',
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        'Unable to cancel registration application.'
      )
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Application Subject Details                                                */
/* -------------------------------------------------------------------------- */

/**
 * Add a subject to an application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/details
 *
 * @param {string|number} applicationId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */

export const addApplicationSubject = async (
  applicationId,
  payload
) => {
  try {
    // 1. Normalize application ID
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (!cleanApplicationId) {
      throw new Error(
        "Invalid registration application ID."
      );
    }

    // 2. Check demo mode
    if (DEMO_MODE) {
      throw new Error(
        "Registration is unavailable in demo mode."
      );
    }

    // 3. Check authentication
    if (!TokenService.hasAccessToken()) {
      throw new Error(
        "Your session has expired. Please login again."
      );
    }

    // 4. Read subject IDs
    const offeredModuleID = Number(
      payload?.offeredModuleID ??
      payload?.offered_module_id
    );

    const moduleRegistrationID = Number(
      payload?.moduleRegistrationID ??
      payload?.module_registration_id
    );

    // 5. Determine registration type from payload status
    // Supplementary registration uses moduleRegistrationID.
    const isSupplementary =
      String(payload?.status ?? payload?.apd_reg_status)
        .toUpperCase() === "SUPPLE";

    // 6. Validate the appropriate subject ID
    if (isSupplementary) {
      if (
        !Number.isSafeInteger(moduleRegistrationID) ||
        moduleRegistrationID <= 0
      ) {
        throw new Error(
          "Please select a valid module registration ID for supplementary registration."
        );
      }
    } else {
      if (
        !Number.isSafeInteger(offeredModuleID) ||
        offeredModuleID <= 0
      ) {
        throw new Error(
          "Please select a valid offered module ID."
        );
      }
    }

    // 7. Prepare backend-compatible JSON payload
    const requestPayload = {
      offeredModuleID: isSupplementary
        ? null
        : offeredModuleID,

      moduleRegistrationID: isSupplementary
        ? moduleRegistrationID
        : null,

      apd_detail_remarks:
        payload?.remarks ??
        payload?.apd_detail_remarks ??
        null,

      apd_reg_status:
        payload?.status ??
        payload?.apd_reg_status ??
        (isSupplementary ? "Supple" : "Regular"),
    };

    // 8. Construct API endpoint
    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${
        encodeURIComponent(cleanApplicationId)
      }/details`;

    // 9. Debug information
    /*console.log(
      "[REGISTRATION] Application ID:",
      cleanApplicationId
    );

    console.log(
      "[REGISTRATION] Registration status:",
      requestPayload.apd_reg_status
    );

    console.log(
      "[REGISTRATION] Request payload:",
      requestPayload
    );*/

    // 10. Send POST request
    const response = await apiRequestJSON(endpoint, {
      method: "POST",
      body: requestPayload,
    });

    // 11. Return response
    /*console.log(
      "[REGISTRATION] Subject added successfully:",
      response
    );*/

    return response;

  } catch (error) {
    console.error(
      "[REGISTRATION] Failed to add application subject:",
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to add subject to application."
      )
    );
  }
};

/**
 * Remove a subject from an application.
 *
 * API:
 * DELETE /api/v1/registration-applications/{application_id}/details/{detail_id}
 *
 * @param {string|number} applicationId
 * @param {string|number} detailId
 * @returns {Promise<Object>}
 */
export const removeApplicationSubject = async (
  applicationId,
  detailId
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (
      detailId === null ||
      detailId === undefined ||
      String(detailId).trim() === ''
    ) {
      throw new Error('Application detail ID is required.');
    }

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/details/${encodeURIComponent(String(detailId).trim())}`;

    return await apiRequest(endpoint, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to remove application subject:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to remove subject from application.')
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Application History                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Fetch application history.
 *
 * API:
 * GET /api/v1/registration-applications/{application_id}/history
 *
 * @param {string|number} applicationId
 * @returns {Promise<Array>}
 */
export const fetchApplicationHistory = async (applicationId) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      return [];
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/history`;

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    return normalizeList(data);
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch application history:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to retrieve application history.')
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Available Offered Subjects                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Fetch available offered subjects for a term and year.
 *
 * API:
 * GET /api/v1/registration-applications/available-subjects
 *
 * @param {number|string} term
 * @param {number|string} year
 * @returns {Promise<Array>}
 */

export const fetchAvailableSubjects = async (
  regi_type,
  term,
  year
) => {
  try {
    if (!TokenService.hasAccessToken()) {
      throw new Error(
        "Your session has expired. Please login again."
      );
    }

    if (
      regi_type == null ||
      term == null ||
      year == null
    ) {
      throw new Error(
        "Registration type, term, and year are required."
      );
    }

    const params = new URLSearchParams({
      regi_type: String(regi_type),
      term: String(term),
      year: String(year),
    });

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/available-subjects?${params.toString()}`;

    const data = await apiRequest(endpoint, {
      method: "GET",
    });

    return data?.subjects || [];

  } catch (error) {
    console.error(
      "[REGISTRATION] Failed to fetch available subjects:",
      error
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to load available subjects."
      )
    );
  }
};

export const fetchAvailableSubjects2 = async (term, year) => {
  try {
    if (
      term === null ||
      term === undefined ||
      year === null ||
      year === undefined
    ) {
      throw new Error('Academic term and year are required.');
    }

    if (DEMO_MODE) {
      console.warn('[REGISTRATION] Demo mode enabled.');

      return [];
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const params = new URLSearchParams({
      term: String(term),
      year: String(year),
    });

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/available-subjects?${params.toString()}`;

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    return normalizeList(data);
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch available subjects:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to retrieve available subjects.')
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Registrar Review                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Fetch applications waiting for registrar review.
 *
 * API:
 * GET /api/v1/registration-applications/review/queue
 *
 * @returns {Promise<Array>}
 */
export const fetchReviewQueue = async () => {
  try {
    if (DEMO_MODE) {
      return [];
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/review/queue`;

    const data = await apiRequest(endpoint, {
      method: 'GET',
    });

    return normalizeList(data);
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to fetch review queue:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to retrieve review queue.')
    );
  }
};

/**
 * Start reviewing an application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/review/start
 *
 * @param {string|number} applicationId
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export const startApplicationReview = async (
  applicationId,
  payload = {}
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/review/start`;

    return await apiRequest(endpoint, {
      method: 'POST',
      body: payload,
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to start application review:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to start application review.')
    );
  }
};

/**
 * Request changes to an application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/review/request-changes
 *
 * @param {string|number} applicationId
 * @param {string} remarks
 * @returns {Promise<Object>}
 */
export const requestApplicationChanges = async (
  applicationId,
  remarks
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/review/request-changes`;

    return await apiRequest(endpoint, {
      method: 'POST',
      body: { remarks },
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to request application changes:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to request application changes.')
    );
  }
};

/**
 * Approve a registration application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/review/approve
 *
 * @param {string|number} applicationId
 * @param {string} remarks
 * @returns {Promise<Object>}
 */
export const approveApplication = async (
  applicationId,
  remarks = ''
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/review/approve`;

    return await apiRequest(endpoint, {
      method: 'POST',
      body: { remarks },
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to approve application:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to approve registration application.')
    );
  }
};

/**
 * Reject a registration application.
 *
 * API:
 * POST /api/v1/registration-applications/{application_id}/review/reject
 *
 * @param {string|number} applicationId
 * @param {string} remarks
 * @returns {Promise<Object>}
 */
export const rejectApplication = async (
  applicationId,
  remarks
) => {
  try {
    const cleanApplicationId =
      normalizeApplicationId(applicationId);

    if (DEMO_MODE) {
      throw new Error('Registration is unavailable in demo mode.');
    }

    if (!TokenService.hasAccessToken()) {
      throw new Error(
        'Your session has expired. Please login again.'
      );
    }

    const endpoint =
      `${API_ENDPOINTS.registrationApplications}/${encodeURIComponent(
        cleanApplicationId
      )}/review/reject`;

    return await apiRequest(endpoint, {
      method: 'POST',
      body: { remarks },
    });
  } catch (error) {
    console.error(
      '[REGISTRATION] Failed to reject application:',
      error
    );

    throw new Error(
      getErrorMessage(error, 'Unable to reject registration application.')
    );
  }
};

/* -------------------------------------------------------------------------- */
/* Fetch Applications Using Authenticated Student                            */
/* -------------------------------------------------------------------------- */

/**
 * Fetch applications belonging to the authenticated student.
 *
 * @returns {Promise<Array>}
 */
export const fetchMyRegistrationApplications = async () => {
  return fetchMyApplications();
};

/* -------------------------------------------------------------------------- */
/* Default Export                                                             */
/* -------------------------------------------------------------------------- */

export default {
  fetchCurrentAcademicTerm,
  createApplication,
  fetchMyApplications,
  fetchApplication,
  updateApplication,
  submitApplication,
  cancelApplication,
  addApplicationSubject,
  removeApplicationSubject,
  fetchApplicationHistory,
  fetchAvailableSubjects,
  fetchReviewQueue,
  startApplicationReview,
  requestApplicationChanges,
  approveApplication,
  rejectApplication,
  fetchMyRegistrationApplications,
};
