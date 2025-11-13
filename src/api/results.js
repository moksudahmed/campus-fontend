import axios from 'axios';

const apiUrl = process.env.REACT_APP_API_URL;
const API_URL = `${apiUrl}api`;

export const fetchResults = async (student_id, token) => {
  const response = await axios.get(`${API_URL}/final-exams/student/${student_id}`,{    
    headers: { Authorization: `Bearer ${token}` },
  });    

  
  return response.data;
};
