"use client";

import React, { useState } from "react";

export default function ScanForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [crawlerResults, setCrawlerResults] = useState([]);

  const handleChange = (e) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResponseMessage("");
    setCrawlerResults([]);

    try {
      const response = await fetch("/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startUrl: url }),
      });

      const data = await response.json();

      if (response.ok) {
        setResponseMessage(data.message);
        if (data.crawlerResults) {
          setCrawlerResults(data.crawlerResults);
        }
      } else {
        setResponseMessage(data.error || "An error occurred.");
      }
    } catch (error) {
      setResponseMessage("An unexpected error occurred.");
      console.error("Error submitting the form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="container">
        <h1>Submit a URL</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="url">URL:</label>
            <input
              type="url"
              id="url"
              name="url"
              value={url}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Submitting..." : "Submit"}
          </button>
        </form>

        {isLoading && (
          <div className="spinner-container">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}

        {responseMessage && <p className="response-message">{responseMessage}</p>}

        {crawlerResults.length > 0 && (
          <div className="results">
            <h2>Your website is susceptible to SQL injection at these routes:</h2>
            <ul>
              {crawlerResults.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        h1 {
          text-align: center;
          margin-bottom: 20px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }

        input {
          width: 100%;
          padding: 10px;
          margin-bottom: 5px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 16px;
        }

        button {
          display: block;
          width: 100%;
          padding: 10px;
          background-color: #0070f3;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        button:hover {
          background-color: #005bb5;
        }

        button:disabled {
          background-color: #aaa;
          cursor: not-allowed;
        }

        .spinner-container {
          display: flex;
          align-items: center;
          flex-direction: column;
          margin-top: 15px;
        }

        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #0070f3;
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .response-message {
          margin-top: 20px;
          text-align: center;
          font-size: 16px;
        }

        .results {
          margin-top: 20px;
        }

        .results h2 {
          margin-bottom: 10px;
        }

        .results ul {
          list-style-type: disc;
          margin-left: 20px;
        }

        .results li {
          margin-bottom: 5px;
        }
      `}</style>
    </>
  );
}
