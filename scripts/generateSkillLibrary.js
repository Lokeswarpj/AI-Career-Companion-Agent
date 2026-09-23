import fs from 'fs';

// Read all 180 curated internships to extract all skills
const data = JSON.parse(fs.readFileSync('./backend/data/curated_internships.json', 'utf8'));
const allSkills = new Set();
data.forEach(item => {
  let req = item.required_skills || [];
  let pref = item.preferred_skills || [];
  if (typeof req === 'string') { try { req = JSON.parse(req); } catch(e){ req = []; } }
  if (typeof pref === 'string') { try { pref = JSON.parse(pref); } catch(e){ pref = []; } }
  [...req, ...pref].forEach(s => {
    if (s && typeof s === 'string') allSkills.add(s.trim());
  });
});

console.log(`Found ${allSkills.size} unique skills in curated dataset.`);
