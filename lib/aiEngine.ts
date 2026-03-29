// src/lib/aiEngine.ts
import { StepExplanation } from './explanationEngine';
import { getSchema } from './db';

// ============================================================================
// TYPES
// ============================================================================

export type Lesson = {
  title: string;
  summary: string;
  learningObjectives: string[];
  theory: string;
  mentalModel: string;
  whenToUse: string;
  concept: string;
  syntax: string;
  syntaxPatterns: string[];
  commonPitfalls: string[];
  example: {
    query: string;
    explanation: string;
    breakdown: string[];
  };
  tryIt: {
    question: string;
    expectedConcept: string;
    starterQuery: string;
    successChecklist: string[];
  };
  hint: string;
  insight: string;
  recap: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
};

export type LearningPath = {
  title: string;
  description: string;
  lessons: Lesson[];
};

export type LearningMode = 'intuitive' | 'reference' | 'challenge';

export type Chapter = {
  id: string;
  title: string;
  description: string;
  xp: number;
  focus: 'theory' | 'practice' | 'balanced';
  prerequisites?: string[];
  handsOnProject?: string;
};

// ============================================================================
// CONSTANTS & CACHE
// ============================================================================

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

const AI_CACHE: Record<string, StepExplanation> = {};
const LESSON_CACHE: Record<string, LearningPath> = {};
const CHAPTER_CACHE: Record<string, Chapter[]> = {};

// ============================================================================
// AI PROVIDER LAYER (Server-side API with fallback)
// ============================================================================

async function callAI(systemInstruction: string, prompt: string): Promise<string | null> {
  try {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        systemInstruction,
        prompt,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data.content || null;
    }

    console.warn(`AI API error: ${res.status}`);
    return null;
  } catch (err: any) {
    console.warn('AI call failed:', err.message);
    return null;
  }
}

// ============================================================================
// CHAPTER GENERATION (Hero's Journey Progression)
// ============================================================================

export async function generateMapChapters(): Promise<Chapter[]> {
  if (CHAPTER_CACHE['all']) return CHAPTER_CACHE['all'];

  const topicsStr = JSON.stringify(MANDATORY_TOPICS);
  
  // ═══════════════════════════════════════════════════════════════════════
  // SYSTEM INSTRUCTION - CURRICULUM DESIGNER
  // ═══════════════════════════════════════════════════════════════════════
  const systemInstruction = `You are a world-class database curriculum designer creating an engaging learning journey for QueryQuest.

DESIGN PRINCIPLES:
• Build intuition BEFORE syntax - help learners understand WHY before HOW
• Use warm, conversational language like a senior engineer mentoring a junior
• Every chapter must connect to real developer scenarios: dashboards, e-commerce, analytics
• Avoid academic dryness - write with energy, clarity, and purpose
• Use concrete, visualizable examples learners can relate to

CHAPTER STRUCTURE:
• id: "ch1", "ch2", etc. (sequential)
• title: 2-5 words, action-oriented & specific ("Filter Orders by Date" not "Filtering")
• description: "You'll learn to [do X] so you can [solve Y real problem]"
• xp: 100-1000 based on cognitive load (beginner:100-300, intermediate:300-600, advanced:600-1000)
• focus: 'theory' | 'practice' | 'balanced' - guides UI teaching style
• prerequisites: optional array of chapter IDs that should come before this one
• handsOnProject: optional string describing a mini-project for this chapter

CONTENT ALIGNMENT RULES:
• Each chapter must build logically on previous chapters (check prerequisites)
• Theory chapters must include visual metaphors and conceptual understanding
• Practice chapters must include runnable SQL examples using real schemas
• Balanced chapters combine both theory and hands-on exercises`;

  const prompt = `Generate 24 SQL/DBMS chapters based on these mandatory topics: ${topicsStr}.

STRICT LEARNING PROGRESSION (each chapter builds on previous):

🟢 FOUNDATION - Mental Models First (ch1-ch4)
  ch1: "What is Data?" → Tables as spreadsheets, rows as records, columns as attributes
  ch2: "Create Your Database" → CREATE DATABASE, USE, schema thinking as "blueprint"
  ch3: "Design Tables Intuitively" → CREATE TABLE, data types as "what kind of info", PRIMARY KEY as "unique ID badge"
  ch4: "Connect Data with Keys" → FOREIGN KEY visualized as "hyperlinks between tables"

🔵 CORE QUERYING - Learn by Doing (ch5-ch12)
  ch5-7: SELECT, WHERE, operators → "Ask precise questions of your data"
  ch8-9: ORDER BY, LIMIT → "Sort and paginate results like a pro"
  ch10-12: JOINs visualized → Venn diagrams + e-commerce examples (orders+customers)

🟡 PRACTICAL POWER - Real-World Patterns (ch13-ch18)
  ch13-14: Aggregations → "Summarize thousands of rows into insights"
  ch15-16: Subqueries vs CTEs → When to nest vs when to name (with performance intuition)
  ch17-18: Functions & CASE → "Transform data and add business logic in SQL"

🔴 ADVANCED MASTERY - Under-the-Hood Expertise (ch19-ch24)
  ch19-20: Indexes → "Why some queries are instant, others crawl" (B-Tree visual metaphor)
  ch21-22: Query Plans → "Read the database's execution strategy"
  ch23: Transactions & ACID → "Prevent chaos when multiple users edit"
  ch24: Security → "Stop SQL injection before hackers start"

CRITICAL RULES:
1. NO generic titles - every title must be specific and action-oriented
2. Descriptions must mention a concrete skill AND a real-world outcome
3. XP must reflect cognitive load + "aha moment" value, not just topic complexity
4. Every chapter should implicitly answer: "Why should I care about this RIGHT NOW?"
5. Theory chapters MUST include a visual metaphor; practice chapters MUST use runnable examples

Output format - ONLY valid JSON, no markdown:
{
  "chapters": [
    { 
      "id": "ch1", 
      "title": "What is Data?", 
      "description": "Understand tables, rows, and columns using spreadsheet analogies so you can design databases that make sense", 
      "xp": 100,
      "focus": "theory",
      "prerequisites": [],
      "handsOnProject": "Sketch a simple user table on paper"
    },
    ...
  ]
}`;

  const content = await callAI(systemInstruction, prompt);
  
  if (content) {
    try {
      const parsed = JSON.parse(content);
      if (parsed.chapters && Array.isArray(parsed.chapters)) {
        const validated = validateChapterProgression(parsed.chapters);
        if (validated) {
          CHAPTER_CACHE['all'] = parsed.chapters;
          return parsed.chapters;
        }
      }
    } catch (e) {
      console.warn("Chapter parse failed, attempting fix:", e);
      try {
        const fixed = content
          .replace(/[\u0000-\u001F]+/g, " ")
          .replace(/,\s*([\]}])/g, "$1");
        const first = fixed.indexOf('{');
        const last = fixed.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          const parsed = JSON.parse(fixed.substring(first, last + 1));
          if (parsed.chapters) {
            CHAPTER_CACHE['all'] = parsed.chapters;
            return parsed.chapters;
          }
        }
      } catch (e2) {
        console.error("Chapter fix failed:", e2);
      }
    }
  }

  // ███████████████████████████████████████████████████████████████████████
  // STATIC FALLBACK - Properly sequenced progression (CRITICAL FOR RELIABILITY)
  // ███████████████████████████████████████████████████████████████████████
  return [
    { id: 'ch1', title: 'What is Data?', description: 'Understand tables, rows, and columns using spreadsheet analogies so you can design databases that make sense', xp: 100, focus: 'theory', prerequisites: [], handsOnProject: 'Sketch a simple user table on paper' },
    { id: 'ch2', title: 'Create Your Database', description: 'Use CREATE DATABASE and USE to set up your workspace so you can start building real schemas', xp: 120, focus: 'practice', prerequisites: ['ch1'] },
    { id: 'ch3', title: 'Design Tables Intuitively', description: 'Master CREATE TABLE and data types by thinking "what kind of info" each column holds', xp: 180, focus: 'balanced', prerequisites: ['ch2'], handsOnProject: 'Design a products table for an e-commerce store' },
    { id: 'ch4', title: 'Connect Data with Keys', description: 'Use PRIMARY and FOREIGN keys to link tables like hyperlinks between web pages', xp: 220, focus: 'balanced', prerequisites: ['ch3'] },
    { id: 'ch5', title: 'Ask Questions with SELECT', description: 'Retrieve specific columns from tables to answer real business questions', xp: 150, focus: 'practice', prerequisites: ['ch3'] },
    { id: 'ch6', title: 'Filter Data Precisely', description: 'Use WHERE, AND, OR to find exactly the records you need from thousands', xp: 200, focus: 'practice', prerequisites: ['ch5'] },
    { id: 'ch7', title: 'Sort and Limit Results', description: 'Order data with ORDER BY and paginate with LIMIT for clean, usable outputs', xp: 180, focus: 'practice', prerequisites: ['ch6'] },
    { id: 'ch8', title: 'Join Tables Visually', description: 'Combine customers and orders with INNER JOIN using Venn diagram thinking', xp: 300, focus: 'balanced', prerequisites: ['ch4', 'ch5'], handsOnProject: 'Build a customer order report' },
    { id: 'ch9', title: 'Keep All Records with LEFT JOIN', description: 'Include unmatched rows for complete reports when some data is optional', xp: 350, focus: 'practice', prerequisites: ['ch8'] },
    { id: 'ch10', title: 'Master All Join Types', description: 'Choose RIGHT, FULL, and CROSS JOIN for specialized reporting scenarios', xp: 400, focus: 'theory', prerequisites: ['ch9'] },
    { id: 'ch11', title: 'Handle NULL Values', description: 'Use IS NULL, COALESCE, and NULLIF to manage missing data gracefully', xp: 250, focus: 'practice', prerequisites: ['ch6'] },
    { id: 'ch12', title: 'Pattern Match with LIKE', description: 'Search text with wildcards to find partial matches in user input', xp: 220, focus: 'practice', prerequisites: ['ch6'] },
    { id: 'ch13', title: 'Summarize with Aggregates', description: 'Use COUNT, SUM, AVG to turn thousands of rows into actionable insights', xp: 300, focus: 'practice', prerequisites: ['ch5'] },
    { id: 'ch14', title: 'Group Data Meaningfully', description: 'Master GROUP BY and HAVING to segment analytics by category, date, or user', xp: 400, focus: 'balanced', prerequisites: ['ch13'], handsOnProject: 'Build a monthly sales dashboard' },
    { id: 'ch15', title: 'Nest Queries with Subqueries', description: 'Solve complex problems by querying the results of other queries', xp: 450, focus: 'theory', prerequisites: ['ch14'] },
    { id: 'ch16', title: 'Simplify with CTEs', description: 'Write readable, modular queries using WITH clauses for complex logic', xp: 500, focus: 'practice', prerequisites: ['ch15'], handsOnProject: 'Refactor a nested query into a CTE' },
    { id: 'ch17', title: 'Transform Data with Functions', description: 'Use string, date, and numeric functions to clean and format query results', xp: 280, focus: 'practice', prerequisites: ['ch5'] },
    { id: 'ch18', title: 'Add Logic with CASE', description: 'Implement if-else business rules directly in your SQL queries', xp: 320, focus: 'balanced', prerequisites: ['ch17'], handsOnProject: 'Categorize customers by spending tier' },
    { id: 'ch19', title: 'Speed Up Queries with Indexes', description: 'Understand B-Tree indexes as "phonebook lookup" to make searches instant', xp: 600, focus: 'theory', prerequisites: ['ch6'] },
    { id: 'ch20', title: 'Choose Index Types Wisely', description: 'Pick clustered vs non-clustered indexes based on your query patterns', xp: 650, focus: 'theory', prerequisites: ['ch19'] },
    { id: 'ch21', title: 'Read Query Execution Plans', description: 'Diagnose slow queries by reading the database\'s step-by-step strategy', xp: 700, focus: 'balanced', prerequisites: ['ch19'], handsOnProject: 'Optimize a slow report query' },
    { id: 'ch22', title: 'Window Functions Demystified', description: 'Use RANK, ROW_NUMBER, and PARTITION BY for advanced analytics without self-joins', xp: 750, focus: 'practice', prerequisites: ['ch14'] },
    { id: 'ch23', title: 'Keep Data Safe with Transactions', description: 'Use BEGIN, COMMIT, and ROLLBACK with ACID properties to prevent data corruption', xp: 800, focus: 'theory', prerequisites: ['ch2'] },
    { id: 'ch24', title: 'Prevent SQL Injection', description: 'Write secure queries with parameterization to block hacker attacks before they start', xp: 850, focus: 'practice', prerequisites: ['ch5'], handsOnProject: 'Audit and fix a vulnerable login query' },
  ];
}

// ============================================================================
// PROGRESSION VALIDATOR (Ensures logical chapter ordering)
// ============================================================================

function validateChapterProgression(chapters: Chapter[]): boolean {
  const tierMap: Record<string, number> = {
    'create database': 1, 'create table': 1, 'primary key': 1, 'foreign key': 1,
    'select': 2, 'where': 2, 'order by': 2, 'limit': 2,
    'join': 3, 'inner join': 3, 'left join': 3,
    'aggregate': 4, 'group by': 4, 'having': 4,
    'subquery': 5, 'cte': 5,
    'function': 6, 'case': 6,
    'index': 7, 'query plan': 7,
    'transaction': 8, 'acid': 8,
    'security': 9, 'injection': 9
  };

  let maxTierSeen = 0;
  
  for (const chapter of chapters) {
    const titleLower = chapter.title.toLowerCase();
    const descLower = chapter.description.toLowerCase();
    const content = `${titleLower} ${descLower}`;
    
    let chapterTier = 0;
    for (const [keyword, tier] of Object.entries(tierMap)) {
      if (content.includes(keyword)) {
        chapterTier = Math.max(chapterTier, tier);
      }
    }
    
    if (chapterTier > 0 && chapterTier < maxTierSeen) {
      console.warn(`Progression warning: "${chapter.title}" (tier ${chapterTier}) appears after higher-tier content (tier ${maxTierSeen})`);
    }
    maxTierSeen = Math.max(maxTierSeen, chapterTier);
  }
  
  return true;
}

// ============================================================================
// TOPIC-SPECIFIC PRACTICE BUILDER (Ensures practice matches topic exactly)
// ============================================================================

function buildTopicSpecificPractice(topic: string, schema: any, difficulty: string): {
  question: string;
  starterQuery: string;
  successChecklist: string[];
  hint: string;
} {
  const topicLower = topic.toLowerCase();
  
  const practicePatterns: Record<string, {
    question: (schema: any) => string;
    starter: (schema: any) => string;
    checklist: (schema: any) => string[];
    hint: string;
  }> = {
    'data type': {
      question: (s) => `Create a table called 'products' with columns: id (INTEGER PRIMARY KEY), name (TEXT NOT NULL), price (REAL NOT NULL), and created_at (TEXT). Then insert one sample product.`,
      starter: (s) => `-- Create products table with correct data types\nCREATE TABLE products (\n  -- Define columns with appropriate data types\n);\n\n-- Insert a sample product\n`,
      checklist: (s) => [
        'Query contains CREATE TABLE products',
        'id column uses INTEGER with PRIMARY KEY',
        'name column uses TEXT with NOT NULL',
        'price column uses REAL or DECIMAL',
        'INSERT statement matches the column data types'
      ],
      hint: 'Match each column to its data type: INTEGER for whole numbers, TEXT for strings, REAL for decimals. NOT NULL means the column must have a value.'
    },
    'create table': {
      question: (s) => `Create a new table called "audit_log" with columns: id (PRIMARY KEY), action (TEXT), timestamp (TEXT DEFAULT CURRENT_TIMESTAMP), and user_id (INTEGER).`,
      starter: (s) => `-- Create audit_log table with required columns\nCREATE TABLE audit_log (\n  -- Add your columns here\n);`,
      checklist: (s) => [
        'Query contains CREATE TABLE audit_log',
        'Has id column with PRIMARY KEY constraint',
        'Has timestamp column with DEFAULT value',
        'Has user_id as INTEGER'
      ],
      hint: 'Define each column with its type and constraint. Use DEFAULT for automatic values.'
    },
    'primary key': {
      question: (s) => `Add a PRIMARY KEY constraint to the "id" column of an existing "products" table.`,
      starter: (s) => `-- Add PRIMARY KEY to products.id\nALTER TABLE products\n`,
      checklist: (s) => [
        'Query uses ALTER TABLE products',
        'Contains ADD PRIMARY KEY or ADD CONSTRAINT PRIMARY KEY',
        'References the id column'
      ],
      hint: 'Use ALTER TABLE ... ADD PRIMARY KEY (column_name) or ADD CONSTRAINT for named keys.'
    },
    'foreign key': {
      question: (s) => `Add a FOREIGN KEY to "orders.user_id" that references "users.id" to enforce referential integrity.`,
      starter: (s) => `-- Add foreign key constraint to orders table\nALTER TABLE orders\n`,
      checklist: (s) => [
        'Query uses ALTER TABLE orders',
        'Contains FOREIGN KEY (user_id) REFERENCES users(id)',
        'Uses correct referencing syntax'
      ],
      hint: 'The syntax is: ADD FOREIGN KEY (child_col) REFERENCES parent_table(parent_col).'
    },
    'insert into': {
      question: (s) => `Insert a new user with email "test@example.com", name "Test User", and created_at as current timestamp into the users table.`,
      starter: (s) => `-- Insert new user record\nINSERT INTO users (email, name, created_at)\nVALUES `,
      checklist: (s) => [
        'Query starts with INSERT INTO users',
        'Specifies columns: email, name, created_at',
        'Uses VALUES with matching data types',
        'String values are wrapped in single quotes'
      ],
      hint: 'Match the column order with the VALUES order. Use quotes for strings.'
    },
    'select': {
      question: (s) => `Select only the email and name columns from the users table, excluding passwords and internal IDs.`,
      starter: (s) => `-- Select specific columns from users\nSELECT `,
      checklist: (s) => [
        'Query starts with SELECT email, name',
        'Has FROM users clause',
        'Does NOT select password or sensitive columns',
        'Returns only the two requested columns'
      ],
      hint: 'List only the columns you need after SELECT, separated by commas.'
    },
    'where': {
      question: (s) => `Find all users who signed up in the last 30 days AND have verified their email.`,
      starter: (s) => `-- Find recently verified users\nSELECT * FROM users\nWHERE `,
      checklist: (s) => [
        'Query has WHERE clause with two conditions',
        'Uses AND to combine conditions',
        'Filters for verified status',
        'Uses date comparison for signup time'
      ],
      hint: 'Use AND to require both conditions. For dates, compare against current timestamp.'
    },
    'order by': {
      question: (s) => `List all products sorted by price from highest to lowest, then by name alphabetically for ties.`,
      starter: (s) => `-- Sort products by price desc, then name asc\nSELECT * FROM products\n`,
      checklist: (s) => [
        'Query has ORDER BY clause',
        'First sort is price DESC (highest first)',
        'Second sort is name ASC (alphabetical)',
        'Uses comma to separate multiple sort columns'
      ],
      hint: 'ORDER BY column1 DESC, column2 ASC - specify direction for each column.'
    },
    'limit': {
      question: (s) => `Get the top 10 most expensive products, showing only name and price.`,
      starter: (s) => `-- Top 10 expensive products\nSELECT name, price FROM products\n`,
      checklist: (s) => [
        'Query selects only name and price columns',
        'Has ORDER BY price DESC',
        'Has LIMIT 10 at the end',
        'Returns maximum 10 rows'
      ],
      hint: 'Use LIMIT after ORDER BY to get the top N results from sorted data.'
    },
    'join': {
      question: (s) => `Get all orders with their customer names by joining orders and users tables on user_id.`,
      starter: (s) => `-- Orders with customer names\nSELECT orders.*, users.name as customer_name\nFROM orders\n`,
      checklist: (s) => [
        'Query uses JOIN (INNER JOIN or just JOIN)',
        'Joins orders to users on orders.user_id = users.id',
        'Selects at least order fields and user name',
        'Only returns orders that have a matching user'
      ],
      hint: 'JOIN returns only rows where the join condition matches in BOTH tables.'
    },
    'left join': {
      question: (s) => `List ALL users including those who have never placed an order, showing NULL for order fields when no orders exist.`,
      starter: (s) => `-- All users with their orders (if any)\nSELECT users.*, orders.id as order_id\nFROM users\n`,
      checklist: (s) => [
        'Query uses LEFT JOIN or LEFT OUTER JOIN',
        'Starts FROM users (the "left" table to preserve all rows)',
        'Joins to orders on users.id = orders.user_id',
        'Returns users even when they have no matching orders'
      ],
      hint: 'LEFT JOIN keeps all rows from the left table, filling with NULL when no match exists on the right.'
    },
    'group by': {
      question: (s) => `Count how many orders each user has placed, showing user_id and order count, sorted by most orders first.`,
      starter: (s) => `-- Order count per user\nSELECT user_id, COUNT(*) as order_count\nFROM orders\n`,
      checklist: (s) => [
        'Query has GROUP BY user_id',
        'Uses COUNT(*) to count orders per group',
        'Has ORDER BY order_count DESC for sorting',
        'Returns one row per user_id with their count'
      ],
      hint: 'Every column in SELECT that isn\'t aggregated must appear in GROUP BY.'
    },
    'having': {
      question: (s) => `Find users who have placed more than 5 orders, showing their user_id and order count.`,
      starter: (s) => `-- Users with many orders\nSELECT user_id, COUNT(*) as order_count\nFROM orders\nGROUP BY user_id\n`,
      checklist: (s) => [
        'Query uses GROUP BY user_id',
        'Has HAVING COUNT(*) > 5 (not WHERE)',
        'HAVING filters aggregated results, WHERE filters raw rows',
        'Returns only users meeting the threshold'
      ],
      hint: 'Use HAVING to filter after aggregation. Use WHERE to filter before aggregation.'
    },
    'count': {
      question: (s) => `Count how many users have verified their email address.`,
      starter: (s) => `-- Count verified users\nSELECT COUNT(*) as verified_count\nFROM users\n`,
      checklist: (s) => [
        'Query uses COUNT(*) or COUNT(column)',
        'Has WHERE clause filtering for verified status',
        'Returns a single row with the count value',
        'Alias like "verified_count" makes output clear'
      ],
      hint: 'COUNT(*) counts all rows; COUNT(column) counts non-NULL values in that column.'
    },
    'case': {
      question: (s) => `Categorize products as \'Cheap\' (< $20), \'Mid\' ($20-100), or \'Premium\' (> $100) using a CASE statement.`,
      starter: (s) => `-- Product price categories\nSELECT \n  name,\n  price,\n  CASE \n    -- Add your conditions here\n  END as price_category\nFROM products`,
      checklist: (s) => [
        'Query uses CASE WHEN price < 20 THEN \'Cheap\'',
        'Has WHEN price BETWEEN 20 AND 100 THEN \'Mid\' or equivalent',
        'Has WHEN price > 100 THEN \'Premium\' or ELSE \'Premium\'',
        'Ends with END and aliases the result as price_category'
      ],
      hint: 'CASE WHEN condition THEN result ... END. Conditions are evaluated in order; first match wins.'
    },
    'index': {
      question: (s) => `Create an index on the "email" column of the users table to speed up login lookups.`,
      starter: (s) => `-- Index for fast email lookups\nCREATE INDEX `,
      checklist: (s) => [
        'Query uses CREATE INDEX index_name ON users(email)',
        'Index name is descriptive (e.g., idx_users_email)',
        'Specifies the email column for indexing',
        'Could add UNIQUE if emails must be distinct'
      ],
      hint: 'CREATE INDEX name ON table(column). Indexes speed up WHERE, JOIN, and ORDER BY on that column.'
    },
    'transaction': {
      question: (s) => `Write a transaction that transfers $100 from user A\'s balance to user B\'s balance, ensuring both updates succeed or both fail.`,
      starter: (s) => `-- Atomic balance transfer\nBEGIN;\n\n-- Deduct from user A\nUPDATE accounts SET balance = balance - 100 WHERE user_id = 1;\n\n-- Add to user B\nUPDATE accounts SET balance = balance + 100 WHERE user_id = 2;\n\n-- Commit if both succeed, or ROLLBACK if any fail\n`,
      checklist: (s) => [
        'Query starts with BEGIN or START TRANSACTION',
        'Has two UPDATE statements modifying balances',
        'Uses COMMIT to finalize or ROLLBACK to undo',
        'Both updates must succeed for COMMIT to make changes permanent'
      ],
      hint: 'Transactions use BEGIN...COMMIT. If any statement fails, use ROLLBACK to undo all changes.'
    }
  };
  
  let matchedPattern = null;
  for (const [key, pattern] of Object.entries(practicePatterns)) {
    if (topicLower.includes(key) || key.includes(topicLower)) {
      matchedPattern = pattern;
      break;
    }
  }
  
  if (matchedPattern) {
    return {
      question: matchedPattern.question(schema),
      starterQuery: matchedPattern.starter(schema),
      successChecklist: matchedPattern.checklist(schema),
      hint: matchedPattern.hint
    };
  }
  
  return {
    question: `Practice using ${topic} with the provided schema. Write a query that demonstrates the concept in a realistic scenario.`,
    starterQuery: `-- Practice: ${topic}\n-- Write your query below using the available tables:\n${Object.keys(schema.tables || {}).join(', ')}\n\n`,
    successChecklist: [
      `Query demonstrates the ${topic} concept`,
      'Query is syntactically valid SQL',
      'Query uses tables/columns from the provided schema',
      'Query produces meaningful results for the scenario'
    ],
    hint: `Focus on applying ${topic} correctly. Reference the schema to ensure you're using valid table and column names.`
  };
}

// ============================================================================
// LESSON GENERATION (Intuitive Teaching Framework with Topic-Specific Practice)
// ============================================================================

export async function generateLesson(topic: string, difficulty: string, mode: LearningMode = 'intuitive'): Promise<Lesson | null> {
  const schema = await getSchema();
  const schemaStr = JSON.stringify(schema);

  const practice = buildTopicSpecificPractice(topic, schema, difficulty);

  const modeInstructions: Record<LearningMode, string> = {
    intuitive: `• Start with a real problem: "Imagine you need to find duplicate users..."
• Use "Explain → Show → Try" loop: mental model → minimal example → guided practice
• For theory: use visual metaphors + before/after performance examples
• Pitfalls: mistake + why it happens + how to spot + how to fix`,
    reference: `• Focus on syntax patterns, edge cases, and official documentation links
• Include parameter variations and dialect differences (PostgreSQL vs MySQL)
• Emphasize performance characteristics and when to avoid certain patterns`,
    challenge: `• Jump straight to hands-on challenges with incremental hints
• Provide minimal theory - let learners discover concepts through doing
• Include "stretch goals" for advanced learners`
  };

  // ═══════════════════════════════════════════════════════════════════════
  // SYSTEM INSTRUCTION - SQL EDUCATOR (PROPERLY ALIGNED)
  // ═══════════════════════════════════════════════════════════════════════
  const systemInstruction = `You are a world-class SQL educator creating premium, interactive lessons for QueryQuest.

TEACHING PHILOSOPHY:
• Build deep intuition BEFORE syntax - help learners understand WHY before HOW
• Use warm, conversational language like a senior engineer mentoring a junior
• Every concept must connect to real developer scenarios: dashboards, analytics, e-commerce, user management
• Avoid academic dryness - write with energy, clarity, and purpose
• Use concrete examples learners can visualize and relate to

SCHEMA CONSTRAINTS:
• The lesson MUST use ONLY this database schema: ${schemaStr}
• NEVER invent tables, columns, or relationships that don't exist in this schema
• All SQL examples must be immediately runnable against this exact schema
• If the schema lacks tables for an example, adapt to use what exists

${modeInstructions[mode]}

CONTENT QUALITY STANDARDS:
• Learning objectives: measurable and specific ("Write queries that..." not "Understand...")
• Mental models: vivid, memorable analogies that stick (1-2 sentences)
• Common pitfalls: actual mistakes learners make, with prevention strategies
• Examples: production-relevant patterns, not toy problems
• Hints: guide discovery, don't give away answers
• Insights: wisdom from years of experience (performance, debugging, design)

STRUCTURE REQUIREMENTS:
• theory: 3-5 paragraphs building conceptual understanding progressively (200-400 words)
• concept: Include at least one edge case or gotcha that matters in practice
• example.breakdown: Each bullet explains one logical step of query execution
• tryIt.question: MUST require applying the exact topic "${topic}" - no generic exercises
• tryIt.successChecklist: MUST validate that the learner used ${topic} correctly
• All arrays: distinct, non-redundant items with high information density

CONTENT ALIGNMENT RULES (CRITICAL):
• The worked example MUST demonstrate the specific concept taught in the theory
• If teaching Data Types (DDL), the example must show CREATE TABLE or type enforcement
• If teaching WHERE clauses (DQL), the example must show filtering logic with conditions
• If teaching JOINs, the example must show table relationships being combined
• NEVER provide a SELECT example for a CREATE TABLE concept (mismatched DDL vs DQL)
• The theory claims must be proven by the example (e.g., if theory says "improves performance", example shows timing or explains why)
• Learning objectives must match what the example demonstrates

TOPIC-SPECIFIC PRACTICE REQUIREMENTS:
• The tryIt question must directly practice "${topic}" - if topic is "LEFT JOIN", the challenge must require using LEFT JOIN
• The successChecklist must include concrete checks that verify ${topic} was applied correctly
• The example query must demonstrate ${topic} in a realistic scenario using the provided schema
• The hint must nudge toward applying ${topic}, not just any solution

Return ONLY valid JSON. No markdown, no preamble, no explanatory text outside the JSON.`;

  const prompt = `Create a ${difficulty}-level ${mode} lesson about "${topic}" for QueryQuest.

LESSON DESIGN FRAMEWORK:

1. OPENING HOOK: Start with why ${topic} matters in real applications. What problem does it solve?

2. CONCEPTUAL FOUNDATION: Build the mental model first. What is the underlying idea? How does it work at a high level?

3. PRACTICAL APPLICATION: When do developers actually use ${topic}? Give 2-3 concrete scenarios from real products.

4. SYNTAX & PATTERNS: Show the canonical form for ${topic}, then 2-4 common variations learners will encounter.

5. WORKED EXAMPLE: A complete, runnable query on the provided schema that demonstrates ${topic} with step-by-step breakdown.

6. GUIDED PRACTICE: A challenge that REQUIRES applying ${topic} specifically, not just any SQL. Include a scaffold if helpful.

7. EXPERT INSIGHT: Share wisdom about ${topic} that takes years to learn—performance tips, debugging strategies, or design patterns.

Return ONLY valid JSON with this exact structure:
{
  "title": "Compelling, specific title about ${topic} (not generic)",
  "summary": "2-3 sentences describing what the learner will be able to DO with ${topic} after this lesson",
  "learningObjectives": [
    "Action-oriented outcome using ${topic} (e.g., 'Write ${topic} queries that...')",
    "Action-oriented outcome using ${topic}",
    "Action-oriented outcome using ${topic}",
    "Action-oriented outcome using ${topic} (optional)"
  ],
  "theory": "3-5 paragraph explanation of ${topic} building from first principles. Start with the problem ${topic} solves, introduce the solution, explain how it works. Use analogies where helpful. Aim for 200-400 words total.",
  "mentalModel": "A single vivid analogy that makes ${topic} intuitive (1-2 sentences)",
  "whenToUse": "2-3 real-world scenarios where ${topic} is the right tool. Be specific about the use case.",
  "concept": "How ${topic} actually behaves in practice. Include edge cases, performance considerations, or common misconceptions. 2-4 paragraphs.",
  "syntax": "The canonical SQL pattern for ${topic} with clear placeholders",
  "syntaxPatterns": [
    "Common ${topic} variation 1 with brief description",
    "Common ${topic} variation 2 with brief description",
    "Common ${topic} pattern 3 if applicable"
  ],
  "commonPitfalls": [
    "Specific mistake when using ${topic} and how to avoid it",
    "Specific mistake when using ${topic} and how to avoid it",
    "Specific mistake when using ${topic} if applicable"
  ],
  "example": {
    "query": "Complete, runnable SQL query using ${topic} with the provided schema",
    "explanation": "2-3 sentence plain-English description of what this ${topic} query accomplishes",
    "breakdown": [
      "Step 1: What the database does first with ${topic}",
      "Step 2: How data flows through the ${topic} operation",
      "Step 3: Intermediate result or transformation from ${topic}",
      "Step 4: Final output produced by ${topic}"
    ]
  },
  "tryIt": {
    "question": "${practice.question}",
    "expectedConcept": "${topic}",
    "starterQuery": "${practice.starterQuery.replace(/\n/g, '\\n')}",
    "successChecklist": [
      "${practice.successChecklist[0]}",
      "${practice.successChecklist[1]}",
      "${practice.successChecklist[2]}",
      "${practice.successChecklist[3] || 'Query executes without syntax errors'}"
    ]
  },
  "hint": "${practice.hint}",
  "insight": "Expert-level tip about ${topic}: performance optimization, debugging strategy, or design pattern that takes years to learn (2-3 sentences)",
  "recap": [
    "Key takeaway 1: the core ${topic} concept in one sentence",
    "Key takeaway 2: the main ${topic} syntax or pattern",
    "Key takeaway 3: when to use ${topic} in practice"
  ],
  "difficulty": "${difficulty}"
}

CRITICAL: Return ONLY the JSON object. No markdown code blocks, no explanatory text before or after. The tryIt section MUST practice ${topic} specifically. The example MUST align with the theory (DDL theory = DDL example, DQL theory = DQL example).`;

  const content = await callAI(systemInstruction, prompt);
  
  if (content) {
    try {
      const lesson = JSON.parse(content) as Lesson;
      
      // Validate alignment before returning
      if (!validateLessonAlignment(lesson, topic)) {
        console.warn(`Lesson alignment warning for topic: ${topic}`);
      }
      
      return lesson;
    } catch (e) {
      console.warn("Lesson parse failed, attempting fix:", e);
      try {
        let fixed = content
          .replace(/[\u0000-\u001F]+/g, " ")
          .replace(/\\n/g, "\\n")
          .replace(/\n/g, " ")
          .replace(/,\s*([\]}])/g, "$1");
        
        const first = fixed.indexOf('{');
        const last = fixed.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          fixed = fixed.substring(first, last + 1);
        }
        const lesson = JSON.parse(fixed) as Lesson;
        
        if (!validateLessonAlignment(lesson, topic)) {
          console.warn(`Lesson alignment warning for topic: ${topic}`);
        }
        
        return lesson;
      } catch (e2) {
        console.error("Aggressive lesson fix failed:", e2);
      }
    }
  }
  return null;
}

// ============================================================================
// LESSON ALIGNMENT VALIDATOR (Ensures theory matches example)
// ============================================================================

function validateLessonAlignment(lesson: Lesson, topic: string): boolean {
  const topicLower = topic.toLowerCase();
  const theoryLower = lesson.theory.toLowerCase();
  const exampleLower = lesson.example.query.toLowerCase();
  
  // DDL topics should have DDL examples (CREATE, ALTER, DROP)
  const ddlTopics = ['create table', 'create database', 'alter table', 'drop', 'data type', 'primary key', 'foreign key', 'constraint', 'index'];
  const isDDLTopic = ddlTopics.some(t => topicLower.includes(t));
  const isDDLExample = exampleLower.includes('create') || exampleLower.includes('alter') || exampleLower.includes('drop');
  
  // DQL topics should have DQL examples (SELECT, WHERE, JOIN)
  const dqlTopics = ['select', 'where', 'join', 'group by', 'having', 'order by', 'limit', 'count', 'sum', 'avg'];
  const isDQLTopic = dqlTopics.some(t => topicLower.includes(t));
  const isDQLExample = exampleLower.includes('select');
  
  // Check for mismatches
  if (isDDLTopic && !isDDLExample && !isDQLTopic) {
    console.warn(`⚠️ MISMATCH: Topic "${topic}" is DDL but example is not DDL`);
    return false;
  }
  
  if (isDQLTopic && !isDQLExample) {
    console.warn(`⚠️ MISMATCH: Topic "${topic}" is DQL but example is not DQL`);
    return false;
  }
  
  // Check learning objectives mention the topic
  const objectivesMentionTopic = lesson.learningObjectives.some((obj: string) =>
    obj.toLowerCase().includes(topicLower.split(' ')[0])
  );
  
  if (!objectivesMentionTopic) {
    console.warn(`⚠️ MISMATCH: Learning objectives don't mention topic "${topic}"`);
    return false;
  }
  
  return true;
}

// ============================================================================
// STEP EXPLANATION (For query visualizer breakdowns)
// ============================================================================

export async function getAIExplanation(query: string, step: any): Promise<StepExplanation> {
  const stepStr = JSON.stringify({
    operation: step.operation,
    title: step.title,
    description: step.description,
    metadata: step.metadata,
  });
  
  const cacheKey = `${query}-${stepStr}`;
  if (AI_CACHE[cacheKey]) return AI_CACHE[cacheKey];

  const systemInstruction = `You are a beginner-friendly SQL tutor. Always respond in JSON format with keys: what, why, analogy, tip. Keep explanations short, warm, and simple. Use everyday analogies. Do not include any other text.`;
  
  const prompt = `Query: ${query}\nStep: ${stepStr}\n\nExplain this step like I'm a junior developer learning SQL for the first time.`;

  const content = await callAI(systemInstruction, prompt);
  
  if (content) {
    try {
      const parsed = JSON.parse(content);
      const explanation: StepExplanation = {
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
        const explanation: StepExplanation = {
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

// ============================================================================
// LEARNING PATH GENERATION (Scaffolded Difficulty Progression)
// ============================================================================

export async function generateLearningPath(topic: string, mode: LearningMode = 'intuitive'): Promise<LearningPath | null> {
  if (LESSON_CACHE[topic]) return LESSON_CACHE[topic];

  const difficulties = ['beginner', 'beginner', 'intermediate', 'intermediate', 'advanced'];

  try {
    const lessonPromises = difficulties.map(difficulty => 
      generateLesson(topic, difficulty, mode)
    );
    const results = await Promise.all(lessonPromises);

    const lessons = results.filter((l: Lesson | null): l is Lesson => l !== null);

    if (lessons.length > 0) {
      const path: LearningPath = {
        title: topic,
        description: `Master ${topic} through a carefully scaffolded journey: build intuition with mental models, study runnable examples, then apply your knowledge to hands-on challenges that mirror real developer workflows.`,
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

export async function generateAllLearningPaths(mode: LearningMode = 'intuitive'): Promise<LearningPath[]> {
  return Object.values(LESSON_CACHE);
}

// ============================================================================
// ANSWER EVALUATION (Topic-Aware Validation)
// ============================================================================

export function evaluateAnswer(userQuery: string, expectedConcept: string, schema?: any): {
  passed: boolean;
  feedback: string;
  suggestions: string[];
} {
  const normalizedUser = userQuery.toLowerCase().trim();
  const normalizedExpected = expectedConcept.toLowerCase().trim();
  
  const suggestions: string[] = [];
  
  const topicKeywords: Record<string, string[]> = {
    'select': ['select', 'from'],
    'where': ['where'],
    'join': ['join', 'inner join', 'left join', 'right join', 'full join'],
    'group by': ['group by'],
    'having': ['having'],
    'order by': ['order by'],
    'limit': ['limit'],
    'count': ['count('],
    'sum': ['sum('],
    'avg': ['avg('],
    'like': ['like'],
    'in': [' in ('],
    'between': ['between'],
    'is null': ['is null', 'is not null'],
    'case': ['case ', ' end'],
    'coalesce': ['coalesce('],
    'subquery': ['select', 'from', 'where'],
    'cte': ['with ', 'as '],
    'window': ['over (', 'partition by', 'rank()', 'row_number()'],
    'index': ['create index', 'on ('],
    'transaction': ['begin', 'commit', 'rollback'],
    'create table': ['create table'],
    'insert': ['insert into'],
    'update': ['update'],
    'delete': ['delete from'],
  };
  
  const keywords = topicKeywords[normalizedExpected] || [normalizedExpected];
  const hasKeyword = keywords.some(kw => normalizedUser.includes(kw));
  
  if (schema && hasKeyword) {
    const schemaTables = Object.keys(schema.tables || {});
    const userTables = normalizedUser.match(/\b(from|join)\s+(\w+)/gi);
    
    if (userTables) {
      for (const match of userTables) {
        const parts = match.split(/\s+/);
        const table = parts[parts.length - 1]?.replace(/[^a-z0-9_]/gi, '');
        if (table && !schemaTables.includes(table) && table !== 'dual') {
          suggestions.push(`Table "${table}" not found in schema. Available: ${schemaTables.join(', ')}`);
          return { passed: false, feedback: 'Query references unknown tables.', suggestions };
        }
      }
    }
  }
  
  if (!hasKeyword) {
    suggestions.push(`Try using ${expectedConcept} in your query`);
    if (keywords[0]) {
      suggestions.push(`Example pattern: ... ${keywords[0].toUpperCase()} ...`);
    }
    return { 
      passed: false, 
      feedback: `Your query doesn't appear to use ${expectedConcept}.`, 
      suggestions 
    };
  }
  
  return { 
    passed: true, 
    feedback: `Great! You applied ${expectedConcept} correctly.`, 
    suggestions: suggestions.length > 0 ? suggestions : ['Consider optimizing with an index on frequently filtered columns.']
  };
}

// ============================================================================
// UTILITY: Get Next Recommended Chapter (Progression-Aware)
// ============================================================================

export function getNextRecommendedChapter(
  completedChapterIds: string[],
  allChapters: Chapter[]
): Chapter | null {
  const available = allChapters.filter(chapter => {
    if (!chapter.prerequisites?.length) return true;
    return chapter.prerequisites.every((prereq: string) =>
      completedChapterIds.includes(prereq)
    );
  });

  if (available.length === 0) return null;

  return available.sort((a, b) => {
    if (a.xp !== b.xp) return a.xp - b.xp;
    const focusOrder: Record<string, number> = { practice: 0, balanced: 1, theory: 2 };
    return focusOrder[a.focus] - focusOrder[b.focus];
  })[0];
}

// ============================================================================
// EXPORT TOPIC-SPECIFIC PRACTICE BUILDER FOR TESTING/EXTENSION
// ============================================================================

export { buildTopicSpecificPractice };