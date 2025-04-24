class Api {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(url, method, data, customOptions = {}) {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      ...customOptions,
    };

    if (data && method !== "GET") {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${url}`, options);

    if (customOptions.responseType === "blob") {
      return response.blob();
    }

    const json = await response.json().catch(() => ({}));

    return {
      ok: response.ok,
      status: response.status,
      data: json,
    };
  }

  get(url, options = {}) {
    return this.request(url, "GET", undefined, options);
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

const urlApi = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
if (!urlApi) {
  throw new Error("API URL is not defined. Please set NEXT_PUBLIC_API_URL or API_URL.");
}
const api = new Api(urlApi);
export default api;
