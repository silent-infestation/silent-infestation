import api from "./api";

describe("Api class", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should make a GET request", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ message: "success" }),
    });

    const result = await api.get("/test");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/test",
      expect.objectContaining({
        method: "GET",
      })
    );

    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { message: "success" },
    });
  });

  test("should make a POST request", async () => {
    const payload = { name: "Test" };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: jest.fn().mockResolvedValue({ id: 1 }),
    });

    const result = await api.post("/items", payload);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(payload),
      })
    );

    expect(result).toEqual({
      ok: true,
      status: 201,
      data: { id: 1 },
    });
  });

  test("should make a PUT request", async () => {
    const update = { name: "Updated" };

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ success: true }),
    });

    const result = await api.put("/items/1", update);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items/1",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify(update),
      })
    );

    expect(result).toEqual({
      ok: true,
      status: 200,
      data: { success: true },
    });
  });

  test("should make a DELETE request", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: jest.fn().mockResolvedValue({}),
    });

    const result = await api.del("/items/1");

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3000/api/items/1",
      expect.objectContaining({
        method: "DELETE",
      })
    );

    expect(result).toEqual({
      ok: true,
      status: 204,
      data: {},
    });
  });

  test("should handle blob response type", async () => {
    const fakeBlob = new Blob(["test"], { type: "text/plain" });

    fetch.mockResolvedValueOnce({
      blob: jest.fn().mockResolvedValue(fakeBlob),
    });

    const result = await api.get("/download", { responseType: "blob" });

    expect(fetch).toHaveBeenCalled();
    expect(result).toBeInstanceOf(Blob);
  });

  test("should handle JSON parse error gracefully", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    });

    const result = await api.get("/error");

    expect(result).toEqual({
      ok: false,
      status: 500,
      data: {},
    });
  });
});
