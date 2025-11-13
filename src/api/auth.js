import axios from 'axios';
import qs from 'qs';

//const API_URL = process.env.REACT_APP_API_URL;
//const API_URL = `http://127.0.0.1:8000/api/`;
const apiUrl = process.env.REACT_APP_API_URL;
const API_URL = `${apiUrl}api/v1/auth/`;

export const login = async (credentials) => {
  try {
    // Prepare form data
    const formData = new FormData();
    for (const key in credentials) {
      formData.append(key, credentials[key]);
    }

    // Send API request
    const response = await axios.post(`${API_URL}login`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log("✅ Login successful:");
    return response.data;

  } catch (error) {
    const message =
      error.response?.data?.message ||
      error.response?.data?.detail ||
      "Unable to login. Please try again.";

    console.error("❌ Login API error:", error.response?.data || error.message);
    throw new Error(message);
  }
};

export const register = async (userInfo) => {
  await axios.post(`${API_URL}register`, userInfo);
};

export const createUser = async (data, token) => {
 
  try {
    const res = await axios.post(`${API_URL}create-user`,
      {
        username: data.username,
        email: data.email,
        password: data.password,
        role: data.role,
      },
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    //console.log("✅ User created successfully:", res.data);
    return res.data;
  } catch (error) {
    if (error.response) {
      console.error("❌ Server error:", error.response.data);
    } else if (error.request) {
      console.error("❌ Network error: No response received", error.request);
    } else {
      console.error("❌ Unexpected error:", error.message);
    }
  }
};
export const fetchUsers = async (token) => {
  const response = await axios.get(API_URL, {
    headers: { Authorization: `Bearer ${token}` },
  });  
  return response.data;
};
export const forgotPassword = async (data) => {
  const email = data.email; // extract email from object
  
  try {
    if (!email) {
      throw new Error("Email or username is required to reset password.");
    }
    
    const response = await fetch(`http://127.0.0.1:8000/frontend/api/forgot-password/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // If your backend expects a body (like ResetPasswordRequest)
      body: JSON.stringify({ student_id: email }), // or other fields as required
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Failed to send reset link.");
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Forgot Password Error:", error.message || error);
    throw new Error(error.message || "Unable to process password reset request.");
  }
};


export const updateUser = async (id, data, token) => {
 
  return fetch(`${API_URL}update-user/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
};

export const deleteUser = async (id, token) => {
  return fetch(`/api/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const resetPassword = async (payload, token) => {  
  try {
    // Destructure and validate payload
    
    const { student_id, login_id, password } = payload;
    if (!student_id || !password) {
      throw new Error("Missing student ID or password.");
    }
    
    // Build request URL
    const endpoint = `${API_URL}change-password/${student_id}`;

    // Send request
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }), // only add token if available
      },
      body: JSON.stringify({
        //login_id,
        new_password: password, // use consistent naming with backend
      }),
    });

    // Handle non-JSON responses gracefully
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid server response format.");
    }

    // Handle unsuccessful responses
    if (!response.ok) {
      console.error("❌ Server response:", data);
      throw new Error(data?.message || data?.detail || "Failed to reset password.");
    }

    console.log("✅ Password reset successful:", data);
    return data;
  } catch (error) {
    console.error("❌ Error resetting password:", error.message || error);
    throw new Error(error.message || "Unexpected error while resetting password.");
  }
};
// Frontend:
export const assignRole = async (id, role, token) => {
    return fetch(`${API_URL}assign-role/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ role }),
  });
};
