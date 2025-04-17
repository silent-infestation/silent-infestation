class Api {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(url, method, data) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${url}`, options);
    const json = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data: json,
    };
  }

  get(url) {
    return this.request(url, "GET");
  }

  post(url, data) {
    return this.request(url, "POST", data);
  }

  put(url, data) {
    return this.request(url, "PUT", data);
  }

  del(url) {
    return this.request(url, "DELETE");
  }
}

// Création d'une instance unique de l'API
const api = new Api("http://0.0.0.0:23000/api");

export default api;
