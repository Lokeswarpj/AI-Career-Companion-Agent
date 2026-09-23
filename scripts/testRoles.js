import { runSkillGapAnalysisAgent } from '../backend/services/skillGapAgent.js';
import { getDatabase, db } from '../backend/config/database.js';

async function main() {
  await getDatabase();

  const agileJob = await db.get("SELECT * FROM internships WHERE title LIKE '%Agile Delivery%' LIMIT 1");
  const uiuxJob = await db.get("SELECT * FROM internships WHERE title LIKE '%Product Design%' LIMIT 1");
  const aiJob = await db.get("SELECT * FROM internships WHERE title LIKE '%Machine Learning%' LIMIT 1");
  const devopsJob = await db.get("SELECT * FROM internships WHERE title LIKE '%Cloud Infrastructure%' LIMIT 1");
  const cyberJob = await db.get("SELECT * FROM internships WHERE title LIKE '%Cybersecurity%' LIMIT 1");

  const testStudent = {
    degree: 'B.Tech in Computer Science',
    university: 'State University',
    graduation_year: 2026,
    skills: ['Python', 'HTML', 'CSS', 'JavaScript'],
    projects: [],
    experience: []
  };

  if (agileJob) {
    console.log('\n--- Agile Role (' + agileJob.title + ') ---');
    const res = await runSkillGapAnalysisAgent(testStudent, agileJob);
    res.gapClassifications.criticalMissing.forEach(s => {
      console.log(`• ${s.skill.padEnd(20)} -> ⏱ ${s.roadmap.timeEstimate.padEnd(14)} | ${s.importance}`);
    });
  }

  if (uiuxJob) {
    console.log('\n--- UI/UX Role (' + uiuxJob.title + ' at ' + uiuxJob.company + ') ---');
    const res = await runSkillGapAnalysisAgent(testStudent, uiuxJob);
    res.gapClassifications.criticalMissing.forEach(s => {
      console.log(`• ${s.skill.padEnd(20)} -> ⏱ ${s.roadmap.timeEstimate.padEnd(14)} | ${s.importance}`);
    });
  }

  if (aiJob) {
    console.log('\n--- AI/ML Role (' + aiJob.title + ' at ' + aiJob.company + ') ---');
    const res = await runSkillGapAnalysisAgent(testStudent, aiJob);
    res.gapClassifications.criticalMissing.forEach(s => {
      console.log(`• ${s.skill.padEnd(20)} -> ⏱ ${s.roadmap.timeEstimate.padEnd(14)} | ${s.importance}`);
    });
  }

  if (devopsJob) {
    console.log('\n--- DevOps Role (' + devopsJob.title + ' at ' + devopsJob.company + ') ---');
    const res = await runSkillGapAnalysisAgent(testStudent, devopsJob);
    res.gapClassifications.criticalMissing.forEach(s => {
      console.log(`• ${s.skill.padEnd(20)} -> ⏱ ${s.roadmap.timeEstimate.padEnd(14)} | ${s.importance}`);
    });
  }

  if (cyberJob) {
    console.log('\n--- Cyber Role (' + cyberJob.title + ' at ' + cyberJob.company + ') ---');
    const res = await runSkillGapAnalysisAgent(testStudent, cyberJob);
    res.gapClassifications.criticalMissing.forEach(s => {
      console.log(`• ${s.skill.padEnd(20)} -> ⏱ ${s.roadmap.timeEstimate.padEnd(14)} | ${s.importance}`);
    });
  }
}

main().catch(console.error);
