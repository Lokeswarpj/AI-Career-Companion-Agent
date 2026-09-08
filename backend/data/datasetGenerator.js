import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Structured templates across 15+ engineering domains
const domainTemplates = [
  {
    industry: "Artificial Intelligence & ML",
    roles: [
      {
        title: "AI & Machine Learning Engineering Intern",
        skills: ["Python", "PyTorch", "TensorFlow", "Scikit-Learn", "Machine Learning", "Git"],
        prefSkills: ["FastAPI", "Docker", "HuggingFace", "MLOps", "CUDA"],
        responsibilities: [
          "Develop, train, and evaluate machine learning models for classification, forecasting, and anomaly detection.",
          "Perform exploratory data analysis and feature engineering on structured and unstructured datasets.",
          "Build scalable inference pipelines using FastAPI and containerize services with Docker.",
          "Collaborate with senior AI researchers to benchmark latency, accuracy, and model drift in production."
        ],
        description: "Join our Applied AI team to develop and deploy cutting-edge machine learning models. You will work on real-world datasets, optimize model training workflows, and integrate AI services into enterprise applications.",
        qualifications: "Currently enrolled in B.Tech/M.Tech Computer Science, Data Science, or related quantitative field.",
        expReq: "Prior academic or personal projects in machine learning, deep learning, or computer vision.",
        eduReq: "B.Tech / B.E. / M.Tech / M.S. in Computer Science, AI, or Data Science (2025/2026 graduation)."
      },
      {
        title: "Generative AI & LLM Systems Intern",
        skills: ["Python", "LangChain", "Gemini API", "OpenAI API", "Vector Databases", "Prompt Engineering"],
        prefSkills: ["ChromaDB", "LlamaIndex", "FastAPI", "TypeScript", "RAG Architecture"],
        responsibilities: [
          "Design and implement Retrieval-Augmented Generation (RAG) pipelines for enterprise knowledge retrieval.",
          "Fine-tune lightweight open-source language models and evaluate generation accuracy using automated metrics.",
          "Implement semantic vector search, chunking strategies, and hybrid search indexing.",
          "Develop interactive conversational assistants and autonomous agent workflows with guardrails."
        ],
        description: "Work at the forefront of Generative AI! As an LLM Systems Intern, you will architect retrieval pipelines, experiment with state-of-the-art embedding models, and deploy production-grade agentic workflows.",
        qualifications: "Strong Python programming ability with hands-on experience using LLM APIs or open-source transformers.",
        expReq: "Demonstrated portfolio of GenAI, RAG, or chatbot projects (GitHub links appreciated).",
        eduReq: "Pursuing degree in Computer Science, Artificial Intelligence, or Electrical Engineering."
      },
      {
        title: "Computer Vision & Edge AI Intern",
        skills: ["Python", "OpenCV", "PyTorch", "Computer Vision", "Deep Learning", "C++"],
        prefSkills: ["YOLO", "TensorRT", "ONNX", "ROS", "Edge AI"],
        responsibilities: [
          "Develop object detection, segmentation, and tracking algorithms for real-time video streams.",
          "Optimize deep neural networks for edge computing hardware using TensorRT and ONNX runtime.",
          "Label, augment, and manage high-volume visual datasets for autonomous vision systems.",
          "Benchmark frame rates, memory footprint, and inference latency across edge devices."
        ],
        description: "Develop cutting-edge computer vision solutions for smart cameras, robotics, and industrial automation. You will train custom vision backbones and deploy real-time perception models.",
        qualifications: "Foundational knowledge in matrix algebra, image processing, and convolutional neural networks.",
        expReq: "Coursework or projects in Computer Vision and Deep Learning.",
        eduReq: "B.Tech/M.Tech in CS, Robotics, or Electronics & Communication."
      },
      {
        title: "Natural Language Processing (NLP) Intern",
        skills: ["Python", "NLP", "NLTK", "Spacy", "Transformers", "BERT"],
        prefSkills: ["PyTorch", "HuggingFace", "Regex", "Text Mining", "FastAPI"],
        responsibilities: [
          "Build text classification, named entity recognition (NER), and sentiment analysis pipelines.",
          "Clean and tokenize multilingual text corpora for downstream domain-specific transformer models.",
          "Evaluate semantic text similarity and contextual embeddings for search and information extraction.",
          "Publish clean REST APIs to expose NLP models for web applications."
        ],
        description: "Join our NLP research group to solve challenging linguistic intelligence problems, from multi-lingual document parsing to automated summarization and sentiment intelligence.",
        qualifications: "Knowledge of transformer architectures, tokenization techniques, and linguistic features.",
        expReq: "Familiarity with HuggingFace Hub, Spacy, or PyTorch text workflows.",
        eduReq: "Computer Science or Computational Linguistics student."
      }
    ]
  },
  {
    industry: "Full-Stack & Web Engineering",
    roles: [
      {
        title: "Full-Stack Web Developer Intern",
        skills: ["React", "JavaScript", "Node.js", "Express", "REST API", "SQL", "Git"],
        prefSkills: ["TypeScript", "PostgreSQL", "TailwindCSS", "Docker", "Next.js"],
        responsibilities: [
          "Design and build responsive, accessible web interfaces using modern React and component frameworks.",
          "Develop performant backend RESTful APIs with Node.js, Express, and relational database persistence.",
          "Write clean, modular code, implement robust authentication workflows (JWT/OAuth), and manage state.",
          "Collaborate with product designers and participate in agile sprint planning and code reviews."
        ],
        description: "Accelerate your full-stack engineering career by building customer-facing web applications. You will work across the entire stack, from interactive UI components to scalable backend microservices.",
        qualifications: "Solid understanding of HTML5, CSS3, JavaScript (ES6+), and asynchronous programming.",
        expReq: "At least 1-2 deployed full-stack web applications or active open-source contributions.",
        eduReq: "B.Tech / B.E. / BCA / MCA in Computer Science, IT, or related field."
      },
      {
        title: "Frontend UI/UX Engineer Intern",
        skills: ["React", "TypeScript", "HTML5", "CSS3", "JavaScript", "TailwindCSS"],
        prefSkills: ["Next.js", "Figma", "Redux", "Web Vitals", "Jest"],
        responsibilities: [
          "Translate Figma design prototypes into pixel-perfect, high-performance web applications.",
          "Optimize Core Web Vitals, rendering efficiency, and cross-browser responsiveness.",
          "Build reusable UI component design systems and write unit tests with React Testing Library.",
          "Implement fluid animations, transitions, and accessible keyboard navigation patterns."
        ],
        description: "Craft visually stunning, lightning-fast user interfaces. You will collaborate closely with UI designers and product managers to deliver engaging experiences loved by thousands of users.",
        qualifications: "Strong eye for design detail, typography, responsive breakpoints, and CSS layout engines (Flexbox/Grid).",
        expReq: "Portfolio of interactive web apps or responsive website clones.",
        eduReq: "B.Tech / BCA / Design & Technology undergraduate."
      },
      {
        title: "Backend Platform Engineer Intern",
        skills: ["Node.js", "Python", "SQL", "REST API", "PostgreSQL", "Git"],
        prefSkills: ["Java", "Docker", "Redis", "Microservices", "System Design"],
        responsibilities: [
          "Architect scalable backend services, database schemas, and transaction management layers.",
          "Optimize database queries, indexing strategies, and caching layers using Redis.",
          "Implement API security, rate limiting, token authentication, and error telemetry.",
          "Write unit and integration tests to ensure high test coverage and zero regressions."
        ],
        description: "Focus on backend architecture, high-throughput data processing, and distributed microservices. You will build the resilient infrastructure that powers our core platforms.",
        qualifications: "Proficiency in backend programming (Node.js, Python, or Java) and relational database concepts.",
        expReq: "Coursework in Database Management Systems (DBMS), Operating Systems, and Networking.",
        eduReq: "Computer Science or Information Technology engineering student."
      },
      {
        title: "Python Web & API Developer Intern",
        skills: ["Python", "FastAPI", "Django", "PostgreSQL", "REST API", "Git"],
        prefSkills: ["Docker", "Celery", "Redis", "PyTest", "AWS"],
        responsibilities: [
          "Develop asynchronous REST APIs using FastAPI and Django REST Framework.",
          "Implement background task queues with Celery and Redis for asynchronous job processing.",
          "Integrate third-party SaaS APIs, webhooks, and payment gateways.",
          "Write automated tests using PyTest and maintain comprehensive OpenAPI / Swagger documentation."
        ],
        description: "Build robust web backends and data APIs with Python. You will design clean endpoints, optimize async workloads, and deploy cloud-native microservices.",
        qualifications: "Strong mastery of Python syntax, OOP, and modern asynchronous frameworks.",
        expReq: "Hands-on experience developing backend APIs or web applications in Python.",
        eduReq: "Undergraduate in Computer Science, Software Engineering, or related degree."
      }
    ]
  },
  {
    industry: "Cloud & DevOps Engineering",
    roles: [
      {
        title: "Cloud Infrastructure & DevOps Intern",
        skills: ["Linux", "Docker", "Git", "Python", "Cloud Computing", "CI/CD", "Bash"],
        prefSkills: ["Kubernetes", "AWS", "Terraform", "GitHub Actions", "Prometheus"],
        responsibilities: [
          "Automate software build, test, and release pipelines using GitHub Actions and GitLab CI.",
          "Containerize legacy and modern applications using Docker multi-stage builds.",
          "Provision cloud infrastructure using Infrastructure-as-Code (IaC) tools like Terraform.",
          "Monitor system health, server uptime, and log aggregation with Grafana and Prometheus."
        ],
        description: "Gain hands-on enterprise cloud experience by managing modern CI/CD pipelines, container orchestration, and cloud infrastructure across AWS and Azure environments.",
        qualifications: "Familiarity with Linux command line, shell scripting, and core networking protocols (DNS, HTTP, TCP/IP).",
        expReq: "Academic coursework or self-study in Cloud Computing (AWS/Azure/GCP) and Containerization.",
        eduReq: "B.Tech / B.E. in CS, IT, Cloud Computing, or Electronics."
      },
      {
        title: "Site Reliability & Cloud Operations Intern",
        skills: ["Linux", "Python", "Bash", "AWS", "Networking", "Monitoring"],
        prefSkills: ["Docker", "Kubernetes", "Ansible", "Datadog", "Nginx"],
        responsibilities: [
          "Troubleshoot server latency, DNS routing, and load balancing configurations.",
          "Write Python and Bash automation scripts to streamline operational runbooks.",
          "Configure alerting rules, synthetic uptime monitors, and disaster recovery playbooks.",
          "Analyze infrastructure resource utilization to optimize cloud hosting costs."
        ],
        description: "Keep high-scale web platforms highly available and performant. You will learn site reliability engineering practices, incident response, and automated observability.",
        qualifications: "Solid understanding of operating systems, networking fundamentals, and scripting.",
        expReq: "Linux enthusiast with personal home lab, cloud trial, or server setup experience.",
        eduReq: "B.Tech / B.E. in Information Science, Computer Science, or Electrical Engineering."
      }
    ]
  },
  {
    industry: "Data Engineering & Analytics",
    roles: [
      {
        title: "Data Science & Business Analytics Intern",
        skills: ["Python", "SQL", "Pandas", "Data Analysis", "Data Visualization", "Statistics"],
        prefSkills: ["Tableau", "PowerBI", "Scikit-Learn", "Seaborn", "Jupyter"],
        responsibilities: [
          "Extract, clean, and transform multi-source tabular data using Python Pandas and SQL.",
          "Perform statistical hypothesis testing, cohort analysis, and customer segmentation.",
          "Build interactive executive dashboards in Tableau / PowerBI to visualize KPIs.",
          "Deliver actionable data-driven insights to product and marketing leadership teams."
        ],
        description: "Transform complex raw business data into strategic insights. You will work on real business problems, build automated dashboards, and perform exploratory statistical modeling.",
        qualifications: "Strong analytical problem-solving mindset and proficiency in SQL and Python data libraries.",
        expReq: "Projects demonstrating data storytelling, dashboarding, or predictive analytics.",
        eduReq: "Degree in Statistics, Mathematics, Data Science, Economics, or Computer Science."
      },
      {
        title: "Data Engineering & Pipeline Intern",
        skills: ["Python", "SQL", "ETL", "PostgreSQL", "Data Pipelines", "Git"],
        prefSkills: ["Apache Spark", "Airflow", "Snowflake", "Kafka", "Docker"],
        responsibilities: [
          "Design and orchestrate automated ETL/ELT pipelines for batch and streaming data.",
          "Optimize complex SQL queries, partitioning schemes, and data warehouse schemas.",
          "Implement data validation checks and quality monitoring to ensure data integrity.",
          "Integrate external REST APIs and cloud object stores into centralized analytical databases."
        ],
        description: "Build the data pipelines that power modern analytics and AI. You will learn distributed data processing, automated workflow orchestration, and data warehouse modeling.",
        qualifications: "Proficiency in writing advanced SQL (CTEs, Window Functions) and Python automation scripts.",
        expReq: "Experience working with relational databases and data transformation libraries.",
        eduReq: "Computer Science, Data Engineering, or Information Systems student."
      }
    ]
  },
  {
    industry: "Cybersecurity & Information Security",
    roles: [
      {
        title: "Cybersecurity Analyst & Threat Hunting Intern",
        skills: ["Network Security", "Linux", "Python", "Ethical Hacking", "Wireshark", "Cryptography"],
        prefSkills: ["SIEM", "Nmap", "Metasploit", "SOC", "Burp Suite"],
        responsibilities: [
          "Conduct vulnerability assessments and network packet inspections using Wireshark and Nmap.",
          "Analyze security logs in SIEM platforms to detect unauthorized access and potential malware activity.",
          "Support penetration testing of internal web applications and verify OWASP Top 10 remediation.",
          "Document security incidents, create compliance reports, and assist in security awareness training."
        ],
        description: "Defend digital infrastructure against modern cyber threats. You will join our Security Operations Center (SOC) to investigate anomalies, conduct security scans, and harden systems.",
        qualifications: "Deep interest in cybersecurity, network protocols, operating system internals, and cryptography.",
        expReq: "Participation in CTF competitions, TryHackMe/HackTheBox, or security coursework.",
        eduReq: "B.Tech / BCA / M.Tech in Cybersecurity, Computer Science, or Information Assurance."
      },
      {
        title: "Application Security (AppSec) Intern",
        skills: ["Web Security", "OWASP", "JavaScript", "Python", "Burp Suite", "Git"],
        prefSkills: ["SAST/DAST", "OAuth2", "Cryptography", "Secure Coding", "Linux"],
        responsibilities: [
          "Review source code for security vulnerabilities including SQLi, XSS, and broken access controls.",
          "Configure automated Static and Dynamic Application Security Testing (SAST/DAST) in CI/CD pipelines.",
          "Perform API security audits and assist developers in implementing secure coding best practices.",
          "Triage reported vulnerabilities and verify security patch effectiveness."
        ],
        description: "Help build secure software from the inside out. You will audit web applications, integrate automated code scanners, and collaborate with developers to fix vulnerabilities before production.",
        qualifications: "Understanding of web architectures, HTTP security headers, and common web attack vectors.",
        expReq: "Hands-on experience finding or fixing web application vulnerabilities.",
        eduReq: "Computer Science or Cybersecurity undergraduate."
      }
    ]
  },
  {
    industry: "Mobile Application Development",
    roles: [
      {
        title: "Mobile App Developer (Flutter / React Native) Intern",
        skills: ["Flutter", "React Native", "Dart", "JavaScript", "REST API", "Mobile UI"],
        prefSkills: ["TypeScript", "Firebase", "Redux", "Mobile State Management", "Git"],
        responsibilities: [
          "Build responsive cross-platform mobile apps for iOS and Android using Flutter or React Native.",
          "Integrate RESTful APIs, push notification services, and local SQLite/Hive caching.",
          "Implement modern mobile UI patterns, smooth page transitions, and offline-first state synchronization.",
          "Test mobile builds across different screen densities, device architectures, and OS versions."
        ],
        description: "Create sleek, engaging mobile applications used by thousands on the go. You will work on cross-platform frameworks, optimize memory and battery usage, and publish app updates.",
        qualifications: "Proficiency in Flutter/Dart or React Native/JavaScript and mobile UI development.",
        expReq: "At least one working mobile app project or published app on Play Store / GitHub.",
        eduReq: "Degree in Computer Science, Software Engineering, or related technical field."
      },
      {
        title: "Android Native Developer Intern",
        skills: ["Kotlin", "Java", "Android SDK", "XML", "REST API", "Git"],
        prefSkills: ["Jetpack Compose", "Coroutines", "Room Database", "MVVM", "Retrofit"],
        responsibilities: [
          "Develop native Android application features using Kotlin and Jetpack Compose.",
          "Architect robust data caching with Room Database and asynchronous networking with Retrofit.",
          "Implement modern Material Design 3 guidelines and accessible mobile navigation.",
          "Write unit tests with JUnit and Robolectric to ensure crash-free sessions."
        ],
        description: "Deep-dive into native Android engineering! You will leverage Kotlin coroutines, modern Jetpack Compose architecture, and native device hardware integrations.",
        qualifications: "Strong grasp of Kotlin/Java, Android component lifecycles (Activities/Fragments), and MVVM.",
        expReq: "Experience building native Android apps in Android Studio.",
        eduReq: "Computer Science or Mobile Computing student."
      }
    ]
  },
  {
    industry: "Quality Assurance & Test Automation",
    roles: [
      {
        title: "Software QA & Automation Engineer Intern",
        skills: ["Selenium", "JavaScript", "Python", "Automation Testing", "Jest", "Git"],
        prefSkills: ["Playwright", "Cypress", "Postman", "CI/CD", "PyTest"],
        responsibilities: [
          "Write and maintain end-to-end automated UI test suites using Playwright, Cypress, or Selenium.",
          "Design automated API testing workflows in Postman and integrate them into CI/CD pipelines.",
          "Perform exploratory regression testing, log detailed bug tickets in Jira, and verify fixes.",
          "Measure test coverage and partner with development teams to eliminate critical software flaws."
        ],
        description: "Ensure software reliability, performance, and defect-free releases. You will build automated testing frameworks for modern web applications and API microservices.",
        qualifications: "Understanding of software testing lifecycles (STLC), test case design, and scripting.",
        expReq: "Familiarity with test automation frameworks and manual testing methodologies.",
        eduReq: "Undergraduate in Computer Science, IT, or Engineering."
      }
    ]
  },
  {
    industry: "Product Design & UI/UX",
    roles: [
      {
        title: "Product Design & UI/UX Intern",
        skills: ["Figma", "UI/UX Design", "Wireframing", "User Research", "Prototyping", "Design Systems"],
        prefSkills: ["Design Tokens", "Usability Testing", "HTML/CSS", "Micro-animations", "Miro"],
        responsibilities: [
          "Create high-fidelity wireframes, interactive prototypes, and design specs in Figma.",
          "Conduct user interviews, usability testing, and synthesize user feedback into UX improvements.",
          "Expand and maintain consistent design systems, color palettes, and accessible component tokens.",
          "Handoff clean design specs to frontend engineers and review implementation fidelity."
        ],
        description: "Shape the visual and interactive experience of our flagship digital products. You will turn user research into intuitive workflows and stunning user interfaces.",
        qualifications: "Proficiency with Figma, auto-layout, design tokens, and user-centered design methodologies.",
        expReq: "Design portfolio showcasing wireframes, mobile/web mockups, and case studies.",
        eduReq: "Degree in Human-Computer Interaction, Design, Computer Science, or Multimedia."
      }
    ]
  },
  {
    industry: "Systems & Embedded / IoT",
    roles: [
      {
        title: "Embedded Systems & IoT Firmware Intern",
        skills: ["C", "C++", "Microcontrollers", "Embedded Systems", "Linux", "Git"],
        prefSkills: ["FreeRTOS", "UART/SPI/I2C", "ESP32", "Arduino", "MQTT", "Python"],
        responsibilities: [
          "Write low-level firmware in C/C++ for microcontrollers (ARM Cortex, ESP32, STM32).",
          "Interface hardware peripherals via I2C, SPI, and UART communication protocols.",
          "Develop lightweight IoT networking clients utilizing MQTT and BLE protocols.",
          "Debug hardware and firmware signals using oscilloscopes, logic analyzers, and serial monitors."
        ],
        description: "Connect the physical and digital worlds! You will develop real-time embedded firmware, interface sensors, and build wireless IoT devices for smart city and industrial applications.",
        qualifications: "Strong understanding of C/C++, digital logic, microcontroller architecture, and memory constraints.",
        expReq: "Hands-on embedded hardware lab or robotics project experience.",
        eduReq: "B.Tech / M.Tech in Electronics & Communication, Electrical Engineering, or Mechatronics."
      }
    ]
  },
  {
    industry: "Blockchain & Web3",
    roles: [
      {
        title: "Blockchain & Smart Contract Developer Intern",
        skills: ["Solidity", "JavaScript", "Ethereum", "Smart Contracts", "Web3.js", "Git"],
        prefSkills: ["Hardhat", "TypeScript", "Rust", "Ethers.js", "DeFi"],
        responsibilities: [
          "Write and test secure Ethereum smart contracts using Solidity and Hardhat.",
          "Build decentralized application (dApp) frontend integrations with Ethers.js and React.",
          "Perform gas optimization and automated vulnerability unit testing on smart contracts.",
          "Research emerging blockchain scaling solutions and decentralized identity protocols."
        ],
        description: "Build next-generation decentralized applications and verifiable smart contracts. You will gain hands-on experience with token standards, gas optimization, and Web3 integration.",
        qualifications: "Proficiency in JavaScript/TypeScript and foundational understanding of cryptography and blockchain.",
        expReq: "Familiarity with Solidity smart contracts or Web3 dApp development.",
        eduReq: "Computer Science or Software Engineering student."
      }
    ]
  },
  {
    industry: "Enterprise Software & Java",
    roles: [
      {
        title: "Java Full-Stack / Spring Boot Intern",
        skills: ["Java", "Spring Boot", "SQL", "REST API", "React", "Git", "Maven"],
        prefSkills: ["Hibernate", "Microservices", "PostgreSQL", "Docker", "JUnit"],
        responsibilities: [
          "Develop enterprise web applications using Java Spring Boot backend and React frontend.",
          "Design relational database schemas and implement ORM persistence using Hibernate / JPA.",
          "Build and secure RESTful microservices with Spring Security and JWT authentication.",
          "Write automated unit tests using JUnit and Mockito to maintain high code quality."
        ],
        description: "Learn enterprise-grade software engineering! You will build scalable microservices, manage database transactions, and deliver full-stack enterprise solutions.",
        qualifications: "Strong object-oriented programming (OOP) foundation in Java and understanding of MVC architectures.",
        expReq: "Experience building Java web applications or Spring Boot projects.",
        eduReq: "B.Tech / B.E. / MCA in Computer Science or Information Technology."
      }
    ]
  }
];

// Curated list of premier hiring companies and partners
const companies = [
  { name: "Infosys", location: "Bengaluru, India", source: "Infosys Springboard", tier: "Enterprise" },
  { name: "Google Cloud Ecosystem", location: "Hyderabad, India", source: "Campus Portal", tier: "Tech Giant" },
  { name: "Microsoft Azure Partner", location: "Pune, India", source: "Infosys Springboard", tier: "Tech Giant" },
  { name: "Amazon Web Services Partner", location: "Bengaluru, India", source: "RemoteOK", tier: "Tech Giant" },
  { name: "TCS Innovation Labs", location: "Chennai, India", source: "Campus Portal", tier: "Enterprise" },
  { name: "Wipro Digital Hub", location: "Noida, India", source: "Infosys Springboard", tier: "Enterprise" },
  { name: "Swiggy Tech Labs", location: "Bengaluru, India", source: "RemoteOK", tier: "High-Growth Product" },
  { name: "Zomato Engineering", location: "Gurugram, India", source: "Campus Portal", tier: "High-Growth Product" },
  { name: "Razorpay Financial", location: "Bengaluru, India", source: "Adzuna", tier: "FinTech Leader" },
  { name: "Flipkart Internet", location: "Bengaluru, India", source: "Campus Portal", tier: "E-Commerce" },
  { name: "PhonePe Tech", location: "Bengaluru, India", source: "Adzuna", tier: "FinTech Leader" },
  { name: "Accenture Technology", location: "Hyderabad, India", source: "Infosys Springboard", tier: "Enterprise" },
  { name: "IBM Cloud Systems", location: "Kochi, India", source: "Campus Portal", tier: "Enterprise" },
  { name: "Cisco Systems Network", location: "Bengaluru, India", source: "Infosys Springboard", tier: "Networking Leader" },
  { name: "Oracle Cloud Infrastructure", location: "Bengaluru, India", source: "Campus Portal", tier: "Enterprise" },
  { name: "NVIDIA AI Research Labs", location: "Pune, India", source: "Adzuna", tier: "AI Leader" },
  { name: "Databricks Partner", location: "Bengaluru, India", source: "RemoteOK", tier: "Data Platform" },
  { name: "Snowflake Analytics Hub", location: "Pune, India", source: "RemoteOK", tier: "Data Cloud" },
  { name: "Salesforce Ecosystem", location: "Hyderabad, India", source: "Campus Portal", tier: "SaaS Leader" },
  { name: "Atlassian Engineering", location: "Bengaluru, India", source: "RemoteOK", tier: "Productivity SaaS" },
  { name: "Uber Mobility Tech", location: "Hyderabad, India", source: "Adzuna", tier: "Mobility Tech" },
  { name: "Cred Financial", location: "Bengaluru, India", source: "Adzuna", tier: "FinTech Leader" },
  { name: "Zoho Corporation", location: "Chennai, India", source: "Campus Portal", tier: "SaaS Pioneer" },
  { name: "Paytm Payments Bank", location: "Noida, India", source: "Campus Portal", tier: "FinTech" },
  { name: "Postman API Labs", location: "Bengaluru, India", source: "RemoteOK", tier: "Developer Tools" },
  { name: "HCLTech Solutions", location: "Noida, India", source: "Infosys Springboard", tier: "Enterprise" },
  { name: "Tech Mahindra AI", location: "Pune, India", source: "Infosys Springboard", tier: "Enterprise" },
  { name: "Persistent Systems", location: "Pune, India", source: "Campus Portal", tier: "Digital Engineering" },
  { name: "L&T Technology Services", location: "Mumbai, India", source: "Campus Portal", tier: "Engineering" },
  { name: "Cognizant Digital", location: "Kolkata, India", source: "Campus Portal", tier: "Enterprise" }
];

const remoteOptions = ["Remote", "Hybrid", "On-site"];
const durations = ["3 Months", "6 Months", "4 Months", "5 Months"];
const stipends = [
  "₹25,000/month",
  "₹30,000/month",
  "₹35,000/month",
  "₹40,000/month",
  "₹45,000/month",
  "₹50,000/month",
  "₹28,000/month",
  "₹32,000/month"
];

export function generateCuratedInternships(targetCount = 180) {
  const dataset = [];
  let idCounter = 1;

  // Generate systematic cross-combinations ensuring rich diversity
  while (dataset.length < targetCount) {
    for (const domain of domainTemplates) {
      for (const role of domain.roles) {
        if (dataset.length >= targetCount) break;

        const company = companies[(dataset.length) % companies.length];
        const remoteType = remoteOptions[dataset.length % remoteOptions.length];
        const duration = durations[dataset.length % durations.length];
        const stipend = stipends[dataset.length % stipends.length];
        
        // Generate realistic dates
        const dayOffset = (dataset.length % 25) + 1;
        const postedDate = `2026-08-${String(dayOffset).padStart(2, '0')}`;
        const deadlineDate = `2026-10-${String((dayOffset % 28) + 1).padStart(2, '0')}`;
        
        const id = `intern-${String(idCounter).padStart(3, '0')}`;
        idCounter++;

        dataset.push({
          id,
          title: role.title,
          company: company.name,
          location: remoteType === 'Remote' ? `${company.location.split(',')[0]} (Remote Eligible)` : company.location,
          remote_type: remoteType,
          industry: domain.industry,
          description: role.description,
          responsibilities: role.responsibilities,
          required_skills: role.skills,
          preferred_skills: role.prefSkills,
          qualifications: role.qualifications,
          experience_requirements: role.expReq,
          education_requirements: role.eduReq,
          duration: duration,
          stipend: stipend,
          apply_url: `https://careers.${company.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/internships/${id}`,
          source: company.source,
          posted_date: postedDate,
          deadline: deadlineDate,
          is_demo: idCounter <= 10 ? 1 : 0
        });
      }
    }
  }

  return dataset;
}

// Generate and write file
const curatedData = generateCuratedInternships(180);
const outputPath = path.join(__dirname, 'curated_internships.json');
fs.writeFileSync(outputPath, JSON.stringify(curatedData, null, 2), 'utf-8');
console.log(`✅ Successfully generated curated dataset of ${curatedData.length} internship postings.`);
console.log(`Saved to: ${outputPath}`);
