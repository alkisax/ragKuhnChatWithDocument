import express from "express";
import { scraperControler } from './scraper.tiny.controller';

const router = express.Router();

// POST /api/scraper/scrape
router.post("/scrape", scraperControler.scrapeTinyController);

export default router;
