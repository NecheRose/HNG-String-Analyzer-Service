import String from "../models/stringRecord.js";
import crypto from "crypto";


// Check palindrome
function isPalindrome(str) {  
  const cleaned = str.toLowerCase().replace(/\s+/g, "");
  return cleaned === cleaned.split("").reverse().join("");
}

// Character frequency map
function getCharacterFrequencyMap(str) {
  const frequencyMap = {};
  for (const char of str) {
    if (char.trim() === "") continue; // skip spaces
    frequencyMap[char] = (frequencyMap[char] || 0) + 1;
  }
  return frequencyMap;
};

// Create / Analyze a string
export const analyzeString = async (req, res) => {
  try {
    const {value} = req.body;

    if (!value) {
      return res.status(400).json({message: "Invalid request body or missing 'value' field"});
    }

    if (typeof value !== "string") {
      return res.status(422).json({message: "Value must be a string"})
    }

    // Hash for uniqueness
    const hash = crypto.createHash("sha256").update(value).digest("hex");

    const existingString = await String.findOne({ "properties.sha256_hash": hash });
    if (existingString) {
      return res.status(409).json({message: "String already exists in the system "});
    }

    const properties = {
      length: value.length,
      is_palindrome: isPalindrome(value),
      unique_characters: new Set(value.replace(/\s+/g, "").toLowerCase()).size,
      word_count: value.trim().split(/\s+/).length,
      sha256_hash: hash,
      character_frequency_map: getCharacterFrequencyMap(value),
    };

    // Save to DB
    const newString = new String({
      id: hash,
      value,
      properties,
      created_at: new Date().toISOString(),
    });

    await newString.save();

    return res.status(201).json(newString);
  } catch (error) {
    console.error("Error analyzing string:", error);
    return res.status(500).json({message: "Internal server error" });
  }
};


 // Get a specific string by value
export const getSpecificString = async (req, res) => {
  try {
    const { string_value } = req.params;

    // Recompute hash to locate it easily
    const hash = crypto.createHash("sha256").update(string_value).digest("hex");
    const record = await String.findOne({ "properties.sha256_hash": hash });

    if (!record) { 
      return res.status(404).json({ error: "String does not exist in the system" });
    };

    return res.status(200).json(record);
  } catch (error) {
    console.error("Error fetching specific string:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};


// Get all strings (with filters)
export const getAllStrings = async (req, res) => {
  try {
    const { is_palindrome, min_length, max_length, word_count, contains_character } = req.query;

    const filters = {};
    const filtersApplied = {};

    // Boolean Filter Validation
    if (is_palindrome !== undefined) {
      if (is_palindrome !== "true" && is_palindrome !== "false") {
        return res.status(400).json({ message: "Invalid query parameter values or types" });
      }
      filters["properties.is_palindrome"] = is_palindrome === "true";
      filtersApplied.is_palindrome = filters["properties.is_palindrome"];
    }

    // Min Length Validation 
    if (min_length !== undefined) {
      const min = parseInt(min_length);
      if (isNaN(min)) {
        return res.status(400).json({ message: "Invalid query parameter values or types" });
      }
      filters["properties.length"] = { ...filters["properties.length"], $gte: min };
      filtersApplied.min_length = min;
    }

    // Max Length Validation
    if (max_length !== undefined) {
      const max = parseInt(max_length);
      if (isNaN(max)) {
        return res.status(400).json({ message: "Invalid query parameter values or types" });
      }
      filters["properties.length"] = { ...filters["properties.length"], $lte: max };
      filtersApplied.max_length = max;
    }

    // Word Count Validation 
    if (word_count !== undefined) {
      const wc = parseInt(word_count);
      if (isNaN(wc)) {
        return res.status(400).json({ message: "Invalid query parameter values or types" });
      }
      filters["properties.word_count"] = wc;
      filtersApplied.word_count = wc;
    }

    // Character Validation 
    if (contains_character !== undefined) {
      if (typeof contains_character !== "string" || contains_character.length !== 1) {
        return res.status(400).json({ message: "Invalid query parameter values or types" });
      }
      filters.value = { $regex: contains_character, $options: "i" };
      filtersApplied.contains_character = contains_character;
    }

    const results = await String.find(filters);

    return res.status(200).json({
      data: results,
      count: results.length,
      filters_applied: filtersApplied,
    });

  } catch (error) {
    console.error("Error fetching strings:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

 

// Natural language filtering
export const filterByNaturalLanguage = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Missing query parameter" });

    let parsedFilters = {};

    // Normalize to lowercase for matching
    const q = query.toLowerCase();

    // Interpret common patterns
    if (q.includes("palindromic")) parsedFilters.is_palindrome = true;
    if (q.includes("non-palindromic")) parsedFilters.is_palindrome = false;
    if (q.includes("single word")) parsedFilters.word_count = 1;
    if (q.match(/longer than (\d+)/)) parsedFilters.min_length = parseInt(q.match(/longer than (\d+)/)[1]) + 1;
    if (q.match(/shorter than (\d+)/)) parsedFilters.max_length = parseInt(q.match(/shorter than (\d+)/)[1]) - 1;
    if (q.match(/containing the letter (\w)/)) parsedFilters.contains_character = q.match(/containing the letter (\w)/)[1];
    if (q.match(/contain the letter (\w)/)) parsedFilters.contains_character = q.match(/contain the letter (\w)/)[1];

    // Heuristic for "first vowel"
    if (q.includes("first vowel")) parsedFilters.contains_character = "a";

    // No filters extracted at all
    if (Object.keys(parsedFilters).length === 0) {
      return res.status(400).json({ message: "Unable to parse natural language query" });
    }

    // Check conflicting filters
    const conflicts = [];
    
    if (q.includes("palindromic") && q.includes("non-palindromic")) {
      conflicts.push("Conflicting palindrome conditions");
    }

    if (q.includes("single word") && (q.includes("multiple word") || q.includes("more than one word"))) {
      conflicts.push("Conflicting word count conditions (single vs multiple)");
    }

    if (parsedFilters.min_length && parsedFilters.max_length && parsedFilters.min_length > parsedFilters.max_length) {
      conflicts.push("min_length cannot be greater than max_length");
    }

    // Return conflict response
    if (conflicts.length > 0) {
      return res.status(422).json({ message: "Query parsed but resulted in conflicting filters" });
    }

    // Build MongoDB filters
    const filters = {};

    if (parsedFilters.is_palindrome !== undefined)
      filters["properties.is_palindrome"] = parsedFilters.is_palindrome;

    if (parsedFilters.word_count)
      filters["properties.word_count"] = parsedFilters.word_count;

    if (parsedFilters.min_length)
      filters["properties.length"] = { ...filters["properties.length"], $gte: parsedFilters.min_length };

    if (parsedFilters.max_length)
      filters["properties.length"] = { ...filters["properties.length"], $lte: parsedFilters.max_length };

    if (parsedFilters.contains_character)
      filters.value = { $regex: parsedFilters.contains_character, $options: "i" };

    const data = await String.find(filters);

    return res.status(200).json({
      data,
      count: data.length,
      interpreted_query: {
        original: query,
        parsed_filters: parsedFilters,
      },
    });

  } catch (error) {
    console.error("Error in natural language filter:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


// Delete a string by value
export const deleteString = async (req, res) => {
   try {
    const { string_value } = req.params;

    const hash = crypto.createHash("sha256").update(string_value).digest("hex");

    const record = await String.findOneAndDelete({ "properties.sha256_hash": hash });
    if (!record) { 
      return res.status(404).json({ error: "String does not exist in the system" });
    }

    return res.status(204).send(); // No Content
  } catch (error) {
    console.error("Error deleting string:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};






