import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildKnowledgeBase } from './ragService.js';
import { vectorStore } from './vectorStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function seedInternshipsIfNeeded() {
  try {
    const datasetPath = path.join(__dirname, '..', 'data', 'curated_internships.json');
    let curatedList = [];

    if (fs.existsSync(datasetPath)) {
      const fileData = fs.readFileSync(datasetPath, 'utf-8');
      curatedList = JSON.parse(fileData);
    }

    const countRow = await db.get("SELECT COUNT(*) as count FROM internships");
    const count = countRow ? countRow.count : 0;

    // If dataset is missing or has fewer than 150 items, seed the full curated knowledge base
    if (count < 150 && curatedList.length > 0) {
      console.log(`[SeedData] Seeding comprehensive internship knowledge base (${curatedList.length} curated postings)...`);
      
      // Clear legacy items
      await db.run("DELETE FROM internships");

      for (const item of curatedList) {
        await db.run(
          `INSERT INTO internships 
           (id, title, company, location, remote_type, description, responsibilities_json, required_skills_json, preferred_skills_json, preferred_qualifications, experience_requirements, education_requirements, duration, stipend, apply_url, source, posted_date, deadline, industry, is_demo) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            item.title,
            item.company,
            item.location,
            item.remote_type,
            item.description,
            JSON.stringify(item.responsibilities || []),
            JSON.stringify(item.required_skills || []),
            JSON.stringify(item.preferred_skills || []),
            item.qualifications || '',
            item.experience_requirements || '',
            item.education_requirements || '',
            item.duration || '3 Months',
            item.stipend || '₹25,000/month',
            item.apply_url || '',
            item.source || 'Curated',
            item.posted_date || '2026-08-01',
            item.deadline || '2026-10-01',
            item.industry || 'Technology',
            item.is_demo || 0
          ]
        );
      }
      console.log(`[SeedData] Inserted ${curatedList.length} internships into SQLite.`);

      // Build RAG knowledge base & vector index
      const allJobs = await db.all("SELECT * FROM internships");
      await buildKnowledgeBase(allJobs);
    } else {
      // Initialize vector store in-memory index from existing SQLite database chunks
      const chunkCountRow = await db.get("SELECT COUNT(*) as count FROM internship_chunks");
      if (!chunkCountRow || chunkCountRow.count === 0) {
        console.log('[SeedData] Building vector chunks for existing internship database...');
        const allJobs = await db.all("SELECT * FROM internships");
        await buildKnowledgeBase(allJobs);
      } else {
        await vectorStore.initialize();
      }
    }
  } catch (err) {
    console.error('[SeedData] Error during internship knowledge base seeding:', err);
  }
}
