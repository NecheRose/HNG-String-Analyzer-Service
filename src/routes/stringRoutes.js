import { Router } from "express";
import { analyzeString, getSpecificString, getAllStrings, filterByNaturalLanguage, deleteString} from "../controllers/stringAnalyzer.js";


const stringRouter = Router();


stringRouter
    .post("/", analyzeString)
    .get("/", getAllStrings)
    .get("/filter-by-natural-language", filterByNaturalLanguage)
    .get("/:string_value", getSpecificString)
    .delete("/:string_value", deleteString)
    

export default stringRouter;
      
      
    