const API_BASE_URL = 'localhost:3000/api';

async function request(url, method, data) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${url}`, options);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Something went wrong');
  }

  return response.json();
}

export function get(url) {
  return request(url, 'GET');
}

export function post(url, data) {
  return request(url, 'POST', data);
}

export function put(url, data) {
  return request(url, 'PUT', data);
}

export function del(url) {
  return request(url, 'DELETE');
}
