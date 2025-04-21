/**
 * @jest-environment node
 */

import { describe, expect, test, jest, beforeEach } from "@jest/globals";
import axios from "axios";
import FormData from "form-data";
import {
  createMaliciousFile,
  extractMatchingFilePath,
  buildFormData,
  findUploadedFile,
  analyzeStructuredForm,
  testUploadForms,
} from "../../../../../scripts/audit/modules/uploadForm";

jest.mock("axios");

describe("createMaliciousFile", () => {
  test("should return expected malicious file structure", () => {
    const file = createMaliciousFile();
    expect(file.filename).toBe("malicious.php");
    expect(file.content.toString()).toBe("<?php echo 'VULNERABLE AAAAA'; ?>");
  });
});

describe("extractMatchingFilePath", () => {
  test("should return a matching path if found in HTML", () => {
    const body = "<div>/uploads/malicious.php</div>";
    const result = extractMatchingFilePath(body, "malicious.php");
    expect(result).toBe("/uploads/malicious.php");
  });

  test("should return null if no match found", () => {
    const body = "<div>No match here</div>";
    const result = extractMatchingFilePath(body, "missing.php");
    expect(result).toBeNull();
  });

  test("should handle edge cases with invalid regex characters", () => {
    const body = "<div>/uploads/malicious[1].php</div>";
    const result = extractMatchingFilePath(body, "malicious[1].php");
    expect(result).toBe("/uploads/malicious[1].php");
  });
});

describe("buildFormData", () => {
  test("should append all non-file fields and file correctly", () => {
    const file = createMaliciousFile();
    const form = buildFormData(
      { username: "test", file: "" },
      { username: "text", file: "file" },
      file
    );
    expect(form).toBeInstanceOf(FormData);
  });

  test("should handle form with no inputs", () => {
    const file = createMaliciousFile();
    const form = buildFormData({}, {}, file);
    expect(form).toBeInstanceOf(FormData);
  });
});

describe("findUploadedFile", () => {
  beforeEach(() => {
    axios.get.mockReset();
  });

  test("should return URL if file found in common paths", async () => {
    axios.get.mockResolvedValue({ status: 200, data: "VULNERABLE AAAAA" });
    const result = await findUploadedFile("http://test.com/", "malicious.php");
    expect(result).toContain("malicious.php");
  });

  test("should return URL if file found during crawl", async () => {
    let callCount = 0;
    axios.get.mockImplementation((_url) => {
      callCount++;
      if (callCount === 1) return Promise.reject(new Error("fail"));
      return Promise.resolve({ status: 200, data: "malicious.php" });
    });

    const result = await findUploadedFile("http://test.com/", "malicious.php");
    expect(result).toContain("http://test.com");
  });

  test("should return null if file not found", async () => {
    axios.get.mockResolvedValue({ status: 200, data: "nope" });
    const result = await findUploadedFile("http://test.com/", "missing.php");
    expect(result).toBeNull();
  });

  test("should skip invalid URLs during crawl", async () => {
    axios.get.mockResolvedValue({ status: 200, data: '<a href="javascript:void(0)">Click</a>' });
    const result = await findUploadedFile("http://test.com/", "something.php");
    expect(result).toBeNull();
  });
});

describe("analyzeStructuredForm", () => {
  test("should detect vulnerability and call noteFinding", async () => {
    const fakeFinding = jest.fn();
    const fileUrl = "http://test.com/uploads/malicious.php";

    axios.post.mockResolvedValue({
      status: 200,
      data: `<div>${fileUrl}</div>`,
      headers: {},
    });
    axios.get.mockResolvedValue({
      data: "VULNERABLE AAAAA",
      headers: { "content-type": "text/html" },
    });

    await analyzeStructuredForm(
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: { user: "admin", fileField: "" },
        formInputs: { user: "text", fileField: "file" },
      },
      "http://test.com/",
      fakeFinding
    );

    expect(fakeFinding).toHaveBeenCalledWith(
      "upload_form_vulnerability",
      "http://test.com/",
      expect.stringContaining("Malicious script executed"),
      expect.any(Object)
    );
  });

  test("should detect fallback discovery and call noteFinding", async () => {
    const fakeFinding = jest.fn();

    axios.post.mockResolvedValue({ status: 200, data: "No match", headers: {} });
    axios.get.mockImplementation((url) => {
      if (url.includes("uploads/malicious.php")) {
        return Promise.resolve({
          status: 200,
          data: "VULNERABLE AAAAA",
          headers: { "content-type": "text/html" },
        });
      }
      return Promise.reject(new Error("404 Not Found"));
    });

    await analyzeStructuredForm(
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: { fileField: "" },
        formInputs: { fileField: "file" },
      },
      "http://test.com/",
      fakeFinding
    );

    expect(fakeFinding).toHaveBeenCalledWith(
      "upload_form_vulnerability",
      "http://test.com/",
      expect.stringContaining("publicly accessible"),
      expect.any(Object)
    );
  });

  test("should handle redirected file vulnerability", async () => {
    const fakeFinding = jest.fn();
    axios.post.mockResolvedValue({
      status: 302,
      data: "redirecting...",
      headers: { location: "/redirected.php" },
    });
    axios.get.mockResolvedValue({
      data: "VULNERABLE AAAAA",
      headers: { "content-type": "text/html" },
    });

    await analyzeStructuredForm(
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: { fileField: "" },
        formInputs: { fileField: "file" },
      },
      "http://test.com/",
      fakeFinding
    );

    expect(fakeFinding).toHaveBeenCalledWith(
      "upload_form_vulnerability",
      "http://test.com/",
      expect.stringContaining("Malicious script executed"),
      expect.any(Object)
    );
  });

  test("should not report vulnerability if no indicators found", async () => {
    const fakeFinding = jest.fn();
    axios.post.mockResolvedValue({ status: 200, data: "clean", headers: {} });
    axios.get.mockResolvedValue({ status: 200, data: "no vulnerability" });

    await analyzeStructuredForm(
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: { field: "value" },
        formInputs: { field: "text" },
      },
      "http://test.com/",
      fakeFinding
    );

    expect(fakeFinding).not.toHaveBeenCalled();
  });

  test("should handle submission errors gracefully", async () => {
    const fakeFinding = jest.fn();
    axios.post.mockRejectedValue(new Error("Request failed"));
    await analyzeStructuredForm(
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: {},
        formInputs: {},
      },
      "http://test.com/",
      fakeFinding
    );
    expect(fakeFinding).not.toHaveBeenCalled();
  });
});

describe("testUploadForms", () => {
  test("should trigger finding if vulnerability is detected in a form", async () => {
    const fakeFinding = jest.fn();

    axios.post.mockResolvedValue({
      status: 200,
      data: "<div>/uploads/malicious.php</div>",
      headers: {},
    });

    axios.get.mockResolvedValue({
      data: "VULNERABLE AAAAA",
      headers: { "content-type": "text/html" },
    });

    const forms = [
      {
        method: "POST",
        actionUrl: "http://test.com/upload.php",
        formData: { user: "admin", fileField: "" },
        formInputs: { user: "text", fileField: "file" },
      },
    ];

    await testUploadForms(forms, "http://test.com/", fakeFinding);

    expect(fakeFinding).toHaveBeenCalledTimes(1);
    expect(fakeFinding.mock.calls[0][0]).toBe("upload_form_vulnerability");
  });

  test("should not test GET forms", async () => {
    const fakeFinding = jest.fn();
    const forms = [{ method: "GET", actionUrl: "", formData: {}, formInputs: {} }];
    await testUploadForms(forms, "http://test.com/", fakeFinding);
    expect(fakeFinding).not.toHaveBeenCalled();
  });
});
