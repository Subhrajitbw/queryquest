import { StepExplanation } from './explanationEngine';
import { getSchema } from './db';

export type Lesson = {
  title: string;
  theory: string;
  concept: string;
  syntax: string;
  commonPitfalls: string;
  example: {
    query: string;
    explanation: string;
  };
  tryIt: {
    question: string;
    expectedConcept: string;
  };
  hint: string;
  insight: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};

export type LearningPath = {
  title: string;
  description: string;
  lessons: Lesson[];
};

const AI_CACHE: Record<string, StepExplanation> = {};
const LESSON_CACHE: Record<string, LearningPath> = {};

export const MANDATORY_TOPICS = [
  { category: 'THEORY & BASICS', topics: ['What is a Database?', 'DBMS vs RDBMS', 'Relational Model Concepts', 'Primary & Foreign Keys', 'Database Schema & Instances'] },
  { category: 'DATA DEFINITION (DDL)', topics: ['CREATE DATABASE & TABLE', 'ALTER TABLE (Add/Drop/Modify)', 'DROP & TRUNCATE', 'Constraints (NOT NULL, UNIQUE, CHECK, DEFAULT)'] },
  { category: 'DATA MANIPULATION (DML)', topics: ['INSERT INTO', 'UPDATE Data', 'DELETE Data', 'UPSERT (Merge) Concepts'] },
  { category: 'BASIC QUERYING', topics: ['SELECT & Aliases', 'WHERE Clause & Operators', 'ORDER BY (ASC/DESC)', 'LIMIT & OFFSET', 'DISTINCT Values'] },
  { category: 'ADVANCED FILTERING', topics: ['LIKE & Wildcards', 'IN & BETWEEN', 'IS NULL / IS NOT NULL', 'Logical Operators (AND, OR, NOT)'] },
  { category: 'JOINS & RELATIONSHIPS', topics: ['INNER JOIN', 'LEFT & RIGHT JOIN', 'FULL OUTER JOIN', 'CROSS JOIN', 'Self Joins'] },
  { category: 'AGGREGATIONS', topics: ['COUNT, SUM, AVG', 'MIN & MAX', 'GROUP BY', 'HAVING Clause'] },
  { category: 'SUBQUERIES & CTES', topics: ['Scalar Subqueries', 'Correlated Subqueries', 'EXISTS & IN Subqueries', 'Common Table Expressions (CTEs)', 'Recursive CTEs'] },
  { category: 'BUILT-IN FUNCTIONS', topics: ['String Functions (CONCAT, SUBSTR)', 'Numeric Functions (ROUND, ABS)', 'Date & Time Functions', 'COALESCE & NULLIF', 'CASE Statements'] },
  { category: 'ADVANCED SQL', topics: ['Window Functions (RANK, ROW_NUMBER)', 'Views', 'Stored Procedures', 'Triggers', 'User Defined Functions'] },
  { category: 'DATABASE DESIGN', topics: ['Entity Relationship (ER) Diagrams', '1NF, 2NF, 3NF Normalization', 'BCNF & Higher Normalization', 'Denormalization Pros/Cons'] },
  { category: 'DBMS INTERNALS', topics: ['B-Tree & Hash Indexes', 'Clustered vs Non-Clustered Indexes', 'Query Execution Plans', 'Buffer Pool & Cache Management', 'Transaction Log (WAL)'] },
  { category: 'TRANSACTIONS & CONCURRENCY', topics: ['ACID Properties', 'Transaction Isolation Levels', 'Deadlocks & Prevention', 'Optimistic vs Pessimistic Locking'] },
  { category: 'SECURITY & ADMINISTRATION', topics: ['SQL Injection Prevention', 'Roles & Permissions (GRANT/REVOKE)', 'Database Backups & Recovery', 'Prepared Statements'] }
];

export type Chapter = {
  id: string;
  title: string;
  description: string;
  xp: number;
};

const CHAPTER_CACHE: Record<string, Chapter[]> = {};

// Latency tracking
let lastGroqLatency = 0;
let lastORLatency = 0;
let groqErrorCount = 0;

async function callAI(systemInstruction: string, prompt: string): Promise<string | null> {
  const cleanJSON = (text: string) => {
    try {
      // 1. Find the first '{' and last '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) return text;
      
      let jsonPart = text.substring(firstBrace, lastBrace + 1);
      
      // 2. Basic sanitization: remove trailing commas before closing braces/brackets
      jsonPart = jsonPart.replace(/,\s*([\]}])/g, '$1');
      
      // 3. Handle unescaped newlines inside strings (common in AI output)
      // This is tricky, but we can try to replace newlines that aren't followed by a key or a closing brace
      // Actually, it's safer to just try parsing and if it fails, do more aggressive cleaning
      
      return jsonPart;
    } catch (e) {
      return text;
    }
  };

  const timeout = 30000; // 30 seconds timeout
  const groqModels = ["meta-llama/llama-4-scout-17b-16e-instruct", "llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
  
  // Decide priority based on latency and errors
  // If Groq has failed 3 times in a row or is consistently slower than 10s, try OpenRouter first
  const shouldTryORFirst = (groqErrorCount >= 3) || (lastGroqLatency > 10000 && lastORLatency < 5000);

  const providers = shouldTryORFirst 
    ? [callOpenRouter, callGroq] 
    : [callGroq, callOpenRouter];

  for (const provider of providers) {
    const result = await provider(systemInstruction, prompt, timeout, groqModels);
    if (result) return result;
  }

  return null;

  async function callGroq(sys: string, p: string, t: number, models: string[]) {
    if (!process.env.NEXT_PUBLIC_GROQ_API_KEY) return null;
    
    for (const model of models) {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), t);

        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: sys + " IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no preamble." },
              { role: "user", content: p }
            ],
            temperature: 0.1,
            max_tokens: 2000
          }),
          signal: controller.signal
        });
        clearTimeout(id);

        if (res.ok) {
          const data = await res.json();
          lastGroqLatency = Date.now() - start;
          groqErrorCount = 0;
          if (data.choices?.[0]?.message?.content) {
            return cleanJSON(data.choices[0].message.content);
          }
        }
        groqErrorCount++;
        const errorText = await res.text();
        console.warn(`Groq model ${model} error: ${res.status} - ${errorText}`);
        if (res.status === 404 || res.status === 400) continue;
        break;
      } catch (err: any) {
        groqErrorCount++;
        console.warn(`Groq model ${model} failed:`, err.name === 'AbortError' ? 'Timeout' : err);
      }
    }
    return null;
  }

  async function callOpenRouter(sys: string, p: string, t: number) {
    if (!process.env.NEXT_PUBLIC_OPENROUTER_API_KEY) return null;
    const start = Date.now();
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), t);

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-ysf7mvqhpvqqcckzsnoiav-401971118343.asia-southeast1.run.app',
          "X-Title": "QueryQuest SQL Visualizer"
        },
        body: JSON.stringify({
          model: "qwen/qwen3-coder:free",
          messages: [
            { role: "system", content: sys + " IMPORTANT: You MUST respond with ONLY a valid JSON object. No markdown, no preamble." },
            { role: "user", content: p }
          ],
          temperature: 0.1,
          max_tokens: 2000
        }),
        signal: controller.signal
      });
      clearTimeout(id);

      if (res.ok) {
        const data = await res.json();
        lastORLatency = Date.now() - start;
        if (data.choices?.[0]?.message?.content) {
          return cleanJSON(data.choices[0].message.content);
        }
      }
      const errorText = await res.text();
      console.warn(`OpenRouter error: ${res.status} - ${errorText}`);
    } catch (err: any) {
      console.warn("OpenRouter failed:", err.name === 'AbortError' ? 'Timeout' : err);
    }
    return null;
  }
}

export async function generateMapChapters(): Promise<Chapter[]> {
  if (CHAPTER_CACHE['all']) return CHAPTER_CACHE['all'];

  const topicsStr = JSON.stringify(MANDATORY_TOPICS);
  const systemInstruction = "You are a database curriculum designer. Generate a comprehensive list of learning chapters covering the entire database journey.";
  const prompt = `Generate a list of 20-25 SQL/DBMS chapters based on these topics: ${topicsStr}.
Each chapter should have: id (ch1, ch2...), title (concise), description (engaging), xp (100-1000).
The chapters should follow a logical learning progression: Theory -> DDL -> DML -> Basic Querying -> Advanced Querying -> Joins -> Aggregations -> Subqueries -> Functions -> Advanced SQL -> Design -> Internals -> Transactions -> Security.

Output format:
{
  "chapters": [
    { "id": "ch1", "title": "...", "description": "...", "xp": 100 },
    ...
  ]
}`;

  const content = await callAI(systemInstruction, prompt);
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.chapters) {
        CHAPTER_CACHE['all'] = parsed.chapters;
        return parsed.chapters;
      }
    } catch (e) {
      console.warn("Map chapters parse failed, attempting fix:", e);
      try {
        const fixed = content
          .replace(/[\u0000-\u001F]+/g, " ")
          .replace(/,\s*([\]}])/g, "$1");
        const parsed = JSON.parse(fixed);
        if (parsed.chapters) {
          CHAPTER_CACHE['all'] = parsed.chapters;
          return parsed.chapters;
        }
      } catch (e2) {
        console.error("Map chapters fix failed:", e2);
      }
    }
  }

  // Static fallback if AI fails
  return [
    { id: 'ch1', title: 'The Basics', xp: 100, description: 'SELECT, FROM, WHERE' },
    { id: 'ch2', title: 'Filtering & Sorting', xp: 150, description: 'ORDER BY, LIMIT, LIKE' },
    { id: 'ch3', title: 'Aggregations', xp: 200, description: 'GROUP BY, HAVING, COUNT, SUM' },
    { id: 'ch4', title: 'Multiple Tables', xp: 250, description: 'INNER JOIN, LEFT JOIN' },
    { id: 'ch5', title: 'Advanced Joins', xp: 300, description: 'RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN' },
    { id: 'ch6', title: 'Subqueries', xp: 350, description: 'Nested SELECT statements' },
    { id: 'ch7', title: 'String Functions', xp: 200, description: 'CONCAT, SUBSTRING, LENGTH' },
    { id: 'ch8', title: 'Date & Time', xp: 250, description: 'DATE, TIME, EXTRACT' },
    { id: 'ch9', title: 'Math Functions', xp: 200, description: 'ROUND, CEIL, FLOOR, ABS' },
    { id: 'ch10', title: 'Window Functions', xp: 400, description: 'OVER, PARTITION BY, RANK' },
    { id: 'ch11', title: 'CTEs', xp: 450, description: 'Common Table Expressions' },
    { id: 'ch12', title: 'Database Modification', xp: 500, description: 'INSERT, UPDATE, DELETE' },
    { id: 'ch13', title: 'Data Storage', xp: 600, description: 'Disk, Memory, Buffer Pool' },
    { id: 'ch14', title: 'Concurrency & ACID', xp: 700, description: 'Transactions, Isolation Levels' },
    { id: 'ch15', title: 'Database Security', xp: 800, description: 'SQL Injection, Prepared Statements' },
  ];
}

export async function getAIExplanation(query: string, step: any): Promise<StepExplanation> {
  const stepStr = JSON.stringify({
    operation: step.operation,
    title: step.title,
    description: step.description,
    metadata: step.metadata,
  });
  
  const cacheKey = `${query}-${stepStr}`;
  if (AI_CACHE[cacheKey]) return AI_CACHE[cacheKey];

  const systemInstruction = "You are a beginner SQL tutor. Always respond in JSON format with keys: what, why, analogy, tip. Keep explanations short and simple. Do not include any other text in your response.";
  const prompt = `Query: ${query}\nStep: ${stepStr}\nExplain this step.`;

  const content = await callAI(systemInstruction, prompt);
  
  if (content) {
    try {
      const parsed = JSON.parse(content);
      const explanation = {
        what: parsed.what || "Processing this step",
        why: parsed.why || "The database is executing part of your query",
        analogy: parsed.analogy || "",
        tip: parsed.tip || ""
      };
      AI_CACHE[cacheKey] = explanation;
      return explanation;
    } catch (e) {
      console.warn("Explanation parse failed, attempting fix:", e);
      try {
        const fixed = content
          .replace(/[\u0000-\u001F]+/g, " ")
          .replace(/,\s*([\]}])/g, "$1");
        const parsed = JSON.parse(fixed);
        const explanation = {
          what: parsed.what || "Processing this step",
          why: parsed.why || "The database is executing part of your query",
          analogy: parsed.analogy || "",
          tip: parsed.tip || ""
        };
        AI_CACHE[cacheKey] = explanation;
        return explanation;
      } catch (e2) {
        console.error("Explanation fix failed:", e2);
      }
    }
  }

  return {
    what: "Processing this step",
    why: "The database is executing part of your query to get your results.",
    analogy: "Like a chef preparing one ingredient for a complex dish.",
    tip: "Understanding each step helps you write more efficient queries!"
  };
}

export async function generateLesson(topic: string, difficulty: string): Promise<Lesson | null> {
  const schema = await getSchema();
  const schemaStr = JSON.stringify(schema);

  const systemInstruction = `You are a friendly and patient SQL Tutor teaching a absolute beginner. 
  Your goal is to make complex database concepts feel simple and intuitive.
  The lesson MUST cover both the theoretical foundation and practical application. 
  The lesson MUST use the following existing database schema: ${schemaStr}.
  
  IMPORTANT:
  - Do NOT invent new tables. Use the ones provided.
  - Tone: Encouraging, clear, and simple. Use analogies where helpful.
  - Alignment: The 'tryIt' challenge MUST be strictly about the specific topic: "${topic}".
  - Usage: Explain exactly WHEN and WHY a developer would use this specific feature in a real-world app.
  - Theory: Explain the "Why" and the underlying principles in simple terms.
  - Concept: Explain the "How" with clear syntax examples and common use cases.
  - Example: Provide a valid SQL query that demonstrates the concept on the provided schema.
  - tryIt.expectedConcept: This MUST be the core SQL keyword or concept being taught in this lesson.
  - Keep it engaging, educational, and very easy to follow.`;

  const prompt = `Create a ${difficulty} level lesson about "${topic}".
  The lesson should feel like a friendly 1-on-1 tutoring session.
  
  Respond with a JSON object matching this structure:
  {
    "title": "A friendly, catchy title for the lesson",
    "theory": "A simple, beginner-friendly explanation of the theory behind ${topic}. Why do we need it?",
    "concept": "Practical explanation of how to use ${topic} in real-world scenarios.",
    "syntax": "The raw SQL syntax for ${topic} with placeholders (e.g., SELECT column FROM table).",
    "commonPitfalls": "Common mistakes beginners make with ${topic} and how to avoid them.",
    "example": { 
      "query": "A simple SQL query using ${topic} on the provided schema", 
      "explanation": "A step-by-step breakdown of what this query is doing in plain English" 
    },
    "tryIt": { 
      "question": "A fun, practical challenge that requires the user to write a query using ${topic}", 
      "expectedConcept": "The specific SQL keyword for this lesson" 
    },
    "hint": "An encouraging hint that points them in the right direction without giving the answer away",
    "insight": "A 'Pro-Tip' or 'Did you know?' style insight about ${topic} that adds extra value",
    "difficulty": "${difficulty}"
  }`;

  const content = await callAI(systemInstruction, prompt);
  if (content) {
    try {
      // Try standard parse
      return JSON.parse(content) as Lesson;
    } catch (e) {
      console.warn("Standard JSON parse failed, attempting fix:", e);
      try {
        // Attempt more aggressive cleaning for common AI JSON errors
        let fixed = content
          .replace(/[\u0000-\u001F]+/g, " ") // Remove control characters
          .replace(/\\n/g, "\\n") // Ensure newlines are escaped
          .replace(/\n/g, " ") // Replace literal newlines with space
          .replace(/,\s*([\]}])/g, "$1"); // Remove trailing commas
        
        // Try to find the JSON block again in case cleaning messed it up
        const first = fixed.indexOf('{');
        const last = fixed.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          fixed = fixed.substring(first, last + 1);
        }
        
        return JSON.parse(fixed) as Lesson;
      } catch (e2) {
        console.error("Aggressive JSON fix failed:", e2);
      }
    }
  }
  return null;
}

export async function generateLearningPath(topic: string): Promise<LearningPath | null> {
  if (LESSON_CACHE[topic]) return LESSON_CACHE[topic];

  const difficulties = ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced'];

  try {
    // Generate all lessons in parallel
    const lessonPromises = difficulties.map(difficulty => generateLesson(topic, difficulty));
    const results = await Promise.all(lessonPromises);
    
    // Filter out failed generations
    const lessons = results.filter((l): l is Lesson => l !== null);

    if (lessons.length > 0) {
      const path: LearningPath = {
        title: topic,
        description: `Master ${topic} with these interactive lessons.`,
        lessons
      };
      LESSON_CACHE[topic] = path;
      return path;
    }
  } catch (err) {
    console.error("Error in generateLearningPath:", err);
  }

  return null;
}

export async function generateAllLearningPaths(): Promise<LearningPath[]> {
  const allPaths: LearningPath[] = [];
  const topics = MANDATORY_TOPICS.flatMap(c => c.topics);
  
  // Note: In a real app, we might want to generate these on demand or in parallel
  // For now, we'll return what's in cache or generate them sequentially (slow)
  // or just return the topics list if we want to show them in UI first.
  
  // Let's just return the topics as empty paths for now if not generated, 
  // or just return the list of topics for the UI to handle.
  
  // Actually, the user asked for generateAllLearningPaths() to return LearningPath[]
  // I'll return the ones already in cache.
  return Object.values(LESSON_CACHE);
}

export function evaluateAnswer(userQuery: string, expectedConcept: string): boolean {
  const normalizedUser = userQuery.toLowerCase().trim();
  const normalizedExpected = expectedConcept.toLowerCase().trim();
  
  // Basic keyword matching
  return normalizedUser.includes(normalizedExpected);
}
