import axios from "axios";
import { API_ENDPOINTS, DEMO_MODE } from "../config";
import TokenService from "./tokenService";
import { apiRequest } from "./apiClient";

const FALLBACK_PHOTO = "/default-avatar.jpg";

/**
 * Normalize student ID
 */
function normalizeStudentId(studentId) {
  return studentId;
  /*if (studentId === null || studentId === undefined) {
    return "";
  }

  return String(studentId).trim();*/
}

/**
 * Get a readable API error message
 */
function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.message ||
    fallback
  );
}

/**
 * Make sure the user is authenticated
 */
function requireAuthentication() {
  if (!TokenService.hasAccessToken()) {
    throw new Error("Authentication token is missing.");
  }
}

/**
 * Get the current user's student ID
 */
function getStudentId(user) {
  return normalizeStudentId(
    user?.studentId ||
      user?.student_id ||
      user?.studentID ||
      user?.id
  );
}

/**
 * Fetch student record
 */
export const fetchStudentRecord = async (studentId) => {
  const cleanStudentId = normalizeStudentId(studentId);

  if (!cleanStudentId) {
    throw new Error("Student ID is required.");
  }

  if (DEMO_MODE) {
    return {
      studentId: cleanStudentId,
    };
  }

  requireAuthentication();

  try {
    const endpoint = `${API_ENDPOINTS.studentRecord}/${encodeURIComponent(
      cleanStudentId
    )}`;
  
    return await apiRequest(endpoint, {
      method: "GET",
    });
  } catch (error) {
    console.error(
      "[STUDENT] Failed to fetch student record:",
      error?.message || "Request failed"
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to retrieve student record. Please try again."
      )
    );
  }
};

/**
 * Fetch student photo
 *
 * This endpoint returns an image/blob,
 * so Axios is intentionally used directly here.
 */
export const fetchStudentPhoto = async (studentId) => {
  const cleanStudentId = normalizeStudentId(studentId);

  if (!cleanStudentId) {
    console.error("[STUDENT] Student ID is missing.");
    return FALLBACK_PHOTO;
  }

  if (DEMO_MODE) {
    return FALLBACK_PHOTO;
  }

  const token = TokenService.getAccessToken();

  if (!token) {
    console.error("[STUDENT] Authentication token is missing.");
    return FALLBACK_PHOTO;
  }

  try {
    const apiUrl = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000/api').replace(/\/$/, '');

    const photoUrl = `${apiUrl}${
      API_ENDPOINTS.studentPhoto
    }/${encodeURIComponent(cleanStudentId)}`;

    const response = await axios.get(photoUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "image/*",
      },
      responseType: "blob",
    });

    /**
     * Make sure we actually received an image.
     */
    if (!response.data || !(response.data instanceof Blob)) {
      console.error("[STUDENT] Server did not return a valid image.");
      return FALLBACK_PHOTO;
    }

    /**
     * Check the content type.
     */
    const contentType =
      response.headers?.["content-type"] ||
      response.data.type ||
      "";

    if (!contentType.startsWith("image/")) {
      console.error(
        "[STUDENT] Server returned a non-image response."
      );

      return FALLBACK_PHOTO;
    }

    /**
     * Convert Blob to browser image URL.
     */
    return URL.createObjectURL(response.data);
  } catch (error) {
    console.error(
      "[STUDENT] Failed to fetch student photo:",
      getErrorMessage(error, "Unable to load student photo.")
    );

    return FALLBACK_PHOTO;
  }
};

/**
 * Fetch current user's student record
 */
export const fetchMyStudentRecord = async (user) => {
  const studentId = getStudentId(user);

  if (!studentId) {
    throw new Error("Student ID is not available.");
  }

  return fetchStudentRecord(studentId);
};

/**
 * Fetch current user's student photo
 */
export const fetchMyStudentPhoto = async (user) => {
  const studentId = getStudentId(user);

  if (!studentId) {
    return FALLBACK_PHOTO;
  }

  return fetchStudentPhoto(studentId);
};

export default {
  fetchStudentRecord,
  fetchStudentPhoto,
  fetchMyStudentRecord,
  fetchMyStudentPhoto,
};