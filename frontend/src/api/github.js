import axios from "axios";

const API = "http://127.0.0.1:8000";

export const getRepository = async () => {
    const response = await axios.get(`${API}/github/repo`);
    return response.data;
};

export const scanRepository = async (url) => {
    const response = await axios.post(`${API}/github/scan`, {
        url: url
    });

    return response.data;
};