import { db } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export const initialInternships = [
  {
    id: "intern-01",
    title: "AI & Machine Learning Engineering Intern",
    company: "Infosys",
    location: "Bengaluru, India",
    remote_type: "Hybrid",
    description: "Join the Applied AI team to develop cutting-edge generative AI models, LLM pipelines, and automated text intelligence workflows. You will collaborate on deploying fine-tuned models to enterprise cloud platforms and optimizing latency.",
    required_skills_json: JSON.stringify(["Python", "Machine Learning", "PyTorch", "NLP", "FastAPI", "Docker"]),
    preferred_qualifications: "Experience with LangChain, Gemini API or HuggingFace transformers. Strong background in linear algebra and data structures.",
    duration: "6 Months",
    stipend: "₹35,000/month",
    apply_url: "https://springboard.infosys.com",
    source: "Infosys Springboard",
    posted_date: "2026-08-25",
    deadline: "2026-09-30",
    industry: "Artificial Intelligence",
    is_demo: 1
  },
  {
    id: "intern-02",
    title: "Full-Stack Web Developer Intern",
    company: "Google Cloud Ecosystem Partner",
    location: "Hyderabad, India",
    remote_type: "Remote",
    description: "Build scalable web applications using React, Node.js, and Google Cloud services. You will design responsive UIs, develop REST APIs, write automated tests, and integrate authentication and database persistence layers.",
    required_skills_json: JSON.stringify(["React", "JavaScript", "Node.js", "Express", "REST API", "SQL", "Git"]),
    preferred_qualifications: "Familiarity with TailwindCSS, TypeScript, and modern state management. Previous hackathon or personal full-stack projects.",
    duration: "3 Months",
    stipend: "₹30,000/month",
    apply_url: "https://careers.google.com/students",
    source: "Campus Portal",
    posted_date: "2026-08-28",
    deadline: "2026-10-15",
    industry: "Software Engineering",
    is_demo: 1
  },
  {
    id: "intern-03",
    title: "Cloud & DevOps Intern",
    company: "Microsoft Azure Partner",
    location: "Pune, India",
    remote_type: "Hybrid",
    description: "Assist the Cloud Infrastructure team with CI/CD pipeline automation, containerization with Docker & Kubernetes, and cloud security monitoring. Learn enterprise Infrastructure-as-Code practices.",
    required_skills_json: JSON.stringify(["Linux", "Docker", "Git", "Python", "Cloud Computing", "CI/CD", "Bash"]),
    preferred_qualifications: "Familiarity with Kubernetes, Terraform, or AWS/Azure cloud certification basics.",
    duration: "6 Months",
    stipend: "₹28,000/month",
    apply_url: "https://careers.microsoft.com/students",
    source: "Infosys Springboard",
    posted_date: "2026-08-20",
    deadline: "2026-09-25",
    industry: "Cloud & DevOps",
    is_demo: 1
  },
  {
    id: "intern-04",
    title: "Data Science & Analytics Intern",
    company: "TCS Analytics",
    location: "Chennai, India",
    remote_type: "On-site",
    description: "Analyze large datasets, create predictive models, and build interactive executive dashboards using Python, Pandas, and Tableau/PowerBI. Translate raw business metrics into actionable insights.",
    required_skills_json: JSON.stringify(["Python", "SQL", "Pandas", "Data Analysis", "Data Visualization", "Statistics"]),
    preferred_qualifications: "Experience with Scikit-learn, Seaborn, and SQL query optimization. Good presentation and communication skills.",
    duration: "3 Months",
    stipend: "₹22,000/month",
    apply_url: "https://www.tcs.com/careers",
    source: "Campus Portal",
    posted_date: "2026-08-30",
    deadline: "2026-10-05",
    industry: "Data Science",
    is_demo: 1
  },
  {
    id: "intern-05",
    title: "Cybersecurity Analyst Intern",
    company: "Wipro Cybersecurity Hub",
    location: "Noida, India",
    remote_type: "Hybrid",
    description: "Support threat detection, vulnerability assessments, penetration testing, and security compliance audits. Work with SOC teams to identify anomalous activity and implement hardening measures.",
    required_skills_json: JSON.stringify(["Network Security", "Linux", "Python", "Ethical Hacking", "Wireshark", "Cryptography"]),
    preferred_qualifications: "CompTIA Security+ or CEH coursework, hands-on CTF challenge participation.",
    duration: "6 Months",
    stipend: "₹25,000/month",
    apply_url: "https://careers.wipro.com",
    source: "Infosys Springboard",
    posted_date: "2026-08-22",
    deadline: "2026-10-10",
    industry: "Cybersecurity",
    is_demo: 1
  },
  {
    id: "intern-06",
    title: "Frontend UI/UX Engineering Intern",
    company: "Swiggy Tech Labs",
    location: "Bengaluru, India",
    remote_type: "Remote",
    description: "Craft high-performance, accessible, and responsive user interfaces. Implement modern micro-interactions, optimize frontend load times, and bridge design tokens with component libraries.",
    required_skills_json: JSON.stringify(["React", "TypeScript", "CSS3", "HTML5", "UI/UX Design", "Figma", "Redux"]),
    preferred_qualifications: "Strong portfolio of interactive web designs, knowledge of Web Vitals and animations.",
    duration: "4 Months",
    stipend: "₹40,000/month",
    apply_url: "https://careers.swiggy.com",
    source: "RemoteOK",
    posted_date: "2026-09-01",
    deadline: "2026-10-20",
    industry: "Product Engineering",
    is_demo: 1
  },
  {
    id: "intern-07",
    title: "Backend Platform Engineer Intern",
    company: "Razorpay Financial",
    location: "Bengaluru, India",
    remote_type: "Hybrid",
    description: "Design high-throughput payment processing APIs, microservices, and database transaction engines. Solve concurrency challenges and build robust telemetry and caching systems.",
    required_skills_json: JSON.stringify(["Node.js", "Java", "PostgreSQL", "Redis", "REST API", "Microservices", "System Design"]),
    preferred_qualifications: "Understanding of ACID properties, rate limiting, and distributed caching.",
    duration: "6 Months",
    stipend: "₹45,000/month",
    apply_url: "https://razorpay.com/jobs",
    source: "Adzuna",
    posted_date: "2026-08-27",
    deadline: "2026-10-01",
    industry: "FinTech",
    is_demo: 1
  },
  {
    id: "intern-08",
    title: "Mobile App Developer (Flutter/React Native) Intern",
    company: "Zomato",
    location: "Gurugram, India",
    remote_type: "Hybrid",
    description: "Develop cross-platform mobile features for consumer applications with millions of active users. Integrate native device APIs, state management, push notifications, and offline caching.",
    required_skills_json: JSON.stringify(["Flutter", "React Native", "Dart", "JavaScript", "REST API", "Mobile UI"]),
    preferred_qualifications: "Published app on Play Store / App Store or active open-source mobile contributions.",
    duration: "3 Months",
    stipend: "₹35,000/month",
    apply_url: "https://zomato.com/careers",
    source: "Campus Portal",
    posted_date: "2026-08-29",
    deadline: "2026-10-12",
    industry: "Mobile Development",
    is_demo: 1
  }
];

export async function seedInternshipsIfNeeded() {
  const countRow = await db.get("SELECT COUNT(*) as count FROM internships");
  if (countRow && countRow.count > 0) {
    return;
  }

  console.log("Seeding initial internship catalog...");
  for (const item of initialInternships) {
    await db.run(
      `INSERT INTO internships 
       (id, title, company, location, remote_type, description, required_skills_json, preferred_qualifications, duration, stipend, apply_url, source, posted_date, deadline, industry, is_demo) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item.id,
        item.title,
        item.company,
        item.location,
        item.remote_type,
        item.description,
        item.required_skills_json,
        item.preferred_qualifications,
        item.duration,
        item.stipend,
        item.apply_url,
        item.source,
        item.posted_date,
        item.deadline,
        item.industry,
        item.is_demo
      ]
    );
  }
  console.log(`Seeded ${initialInternships.length} internships.`);
}
