class Api {
  constructor(baseURL) {
    // Assurez-vous d'inclure le protocole (http:// ou https://)
    this.baseURL = baseURL;
  }

  async request(url, method, data) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${url}`, options);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Something went wrong');
    }

    return response.json();
  }

  get(url) {
    return this.request(url, 'GET');
  }

  post(url, data) {
    return this.request(url, 'POST', data);
  }

  put(url, data) {
    return this.request(url, 'PUT', data);
  }

  del(url) {
    return this.request(url, 'DELETE');
  }
}

// Création d'une instance unique de l'API
const api = new Api('http://localhost:3000/api');

export default api;
