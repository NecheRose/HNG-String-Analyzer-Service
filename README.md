# 🧩 HNG13 - Stage 1: String Analyzer Service

## 📘 Overview

String Analyzer Service is a RESTful API that analyzes strings and stores their computed properties for retrieval and filtering. It supports analytical computations such as **palindrome detection**, **word counting**, **unique character tracking**, and **SHA-256 hashing for string identification**.

This project is the Stage 1 submission for the **HNG 13 Backend Development Internship**, designed to test REST API design, data modeling, and query handling skills.

---

## 🚀 Features  

1. **Analyze and store strings**
2. **Compute string properties automatically**
3. **Detect palindromes**
4. **Generate SHA-256 hash for unique identification**
5. **List and filter analyzed strings**
6. **Support natural language queries (NLP-powered filters)**
7. **Delete strings from storage**

---

## ⚙️ Tech Stack

- **Language:** JavaScript
- **Runtime:** Node.js 
- **Framework:** Express.js
- **Database:** MongoDB
- **Hashing:** Node’s built-in crypto module (SHA-256)  

---

## 🌐 Live Demo

**View the hosted project:**  
[🔗 HNG-String-Analyzer-Service]() 

---

## ⚙️ How to Run Locally 

### 🧱 Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- npm or yarn

---

### 🔽 Installation

1️⃣ **Clone the Repository**
```bash
git clone https://github.com/NecheRose/HNG-String-Analyzer-Service.git
cd HNG-String-Analyzer-Service
```

---

2️⃣ **Install Dependencies**
```bash
npm install
```
This will install the following dependencies:

| Package                | Purpose                                              |
| ---------------------- | ---------------------------------------------------- |
| **express**            | Web framework for building the API                   |
| **mongodb**            | Persistent storage for data                          |
| **cors**               | Enables Cross-Origin Resource Sharing                |
| **dotenv**             | Loads environment variables                          |
| **mongoose**           | Connects the application to the database             |
| **nodemon** (dev)      | Automatically restarts the server during development |

---

3️⃣ 🔧 **Environment Variables**

Create a **.env** file in the root directory and add the following:
```
PORT=4000
```
**Note:** You can change the port number if needed.

---

4️⃣ ▶️ **Run the server**

```bash 
npm run dev
```

---

## ⚙️ API Endpoints 

### 🧠 String Properties Computed
For each analyzed string, the API computes and stores:

| Property                  | Description                                                                             |
|---------------------------|-----------------------------------------------------------------------------------------|
| `length`                  | Total number of characters in the string                                                |
| `is_palindrome`           | Boolean indicating if the string reads the same forwards & backwards (case-insensitive) |
| `unique_characters`       | Count of distinct characters in the string                                              |
| `word_count`              | Number of words separated by whitespace                                                 |
| `sha256_hash`             | SHA-256 hash of the string for unique identification                                    |
| `character_frequency_map` | Object/dictionary mapping each character to its occurrence count                        |

---

1. **Create/Analyze String**
Analyzes and stores a new string

`POST /strings`
Content-Type: application/json

**Request Body:**
```
{
  "value": "madam"
}
```

**Success Response (201 Created):**
```
{
  "id": "765cc52b3dbc1bb8ec279ef9c8ec3d0f251c0c92a6ecdc1870be8f7dc7538b21",
  "value": "madam",
  "properties": {
    "length": 5,
    "is_palindrome": true,
    "unique_characters": 3,
    "word_count": 1,
    "sha256_hash": "765cc52b3dbc1bb8ec279ef9c8ec3d0f251c0c92a6ecdc1870be8f7dc7538b21",
    "character_frequency_map": {
      "m": 2,
      "a": 2,
      "d": 1
    }
  },
    "created_at": "2025-10-22T10:44:42.944Z"
}
```

**Error Responses:**

|Status           	        | Message                                        |
|---------------------------|------------------------------------------------|
|`409 Conflict`    	        | String already exists in the system            |
|`400 Bad Request`          | Invalid request body or missing "value" field  |
|`422 Unprocessable Entity` | Invalid data type for "value" (must be string) |
 
---

2. **Get Specific String**
Retrieve a previously analyzed string by its original text

`GET /strings/{string_value}`

**Success Response (200 OK):**

```
{
  "id": "sha256_hash_value",
  "value": "requested string",
  "properties": { /* same as above */ },
  "created_at": "2025-08-27T10:00:00Z"
}
```

**Error Response:**

| Status          | Message                             |
|-----------------|-------------------------------------|
| `404 Not Found` | String does not exist in the system |

---

3. **Get All Strings with Filtering**
Retrieve all analyzed strings, optionally filtered by query parameters.

`GET /strings`

| Query Parameters     | Type    | Description                              |
|----------------------|---------|------------------------------------------|
| `is_palindrome`      | boolean | Filter by palindrome status (true/false) |
| `min_length`         | integer | Minimum string length                    |
| `max_length`         | integer | Maximum string length                    |
| `word_count`         | integer | Exact word count                         |
| `contains_character` | string  | single character to search for           |

**Example Request:**
`GET /strings?is_palindrome=true&min_length=5&max_length=20&word_count=2&contains_character=a`

**Success Response (200 OK):**
```
{
  "data": [
    {
      "id": "hash1",
      "value": "string1",
      "properties": { /* ... */ },
      "created_at": "2025-08-27T10:00:00Z"
    }
  ],
  "count": 15,
  "filters_applied": {
    "is_palindrome": true,
    "min_length": 5,
    "max_length": 20,
    "word_count": 2,
    "contains_character": "a"
  }
}
```

**Error Response:**

| Status            | Message                                 |
|-------------------|-----------------------------------------|
| `400 Bad Request` | Invalid query parameter values or types |

---

4. **Natural Language Filtering**
Interpret a human-readable query to dynamically filter stored strings.

`GET /strings/filter-by-natural-language?query=`

**Example Queries**

| Natural Language Query                             | Interpreted Filters                                   |
|----------------------------------------------------|-------------------------------------------------------|
| `all single word palindromic strings`              | `{ "word_count": 1, "is_palindrome": true }`          |
| `strings longer than 10 characters`                | `{ "min_length": 11 }`                                |
| `palindromic strings that contain the first vowel` | `{"is_palindrome": true, "contains_character": "a" }` |
| `strings containing the letter z`                  | `{ "contains_character": "z" }`                       |

**Success Response (200 OK)**
```
{
  "data": [ /* matching strings */ ],
  "count": 3,
  "interpreted_query": {
    "original": "all single word palindromic strings",
    "parsed_filters": {
      "word_count": 1,
      "is_palindrome": true
    }
  }
}
```

**Error responses**

|Status           	        | Message                                          |
|---------------------------|--------------------------------------------------|
|`400 Bad Request`          | Unable to parse natural language query           |
|`422 Unprocessable Entity` | Query parsed but resulted in conflicting filters |

---

5. **Delete String**
Deletes an analyzed string from the system.

`DELETE /strings/{string_value}`

**Success Response** — `204 No Content`
*(Empty response body)*

**Error Responses:**

|Status          | Message                             |
|----------------|-------------------------------------|
|`404 Not Found` | String does not exist in the system |

 
