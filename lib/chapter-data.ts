export type ChapterSection = {
  heading: string;
  body: string;
};

export type ChapterQuizQuestion = {
  question: string;
  options: string[];
  answerIndex: number;
  explanation?: string;
};

export type ChapterData = {
  learn: {
    title: string;
    summary: string;
    content: string;
    objectives: string[];
    sections: ChapterSection[];
    examples: string[];
    pitfalls: string[];
    keyTakeaways: string[];
  };
  practice: {
    question: string;
    initialQuery: string;
    expectedQuery: string;
    starterTips: string[];
    successChecks: string[];
  };
  quiz: ChapterQuizQuestion[];
};

export const CHAPTER_CONTENT: Record<string, ChapterData> = {
  ch1: {
    learn: {
      title: 'The Basics: SELECT and FROM',
      summary:
        'This chapter teaches the first mental model every SQL learner needs: a table is a named dataset, and SELECT is how you ask the database to show you specific columns from it. By the end, you will write your first real queries and understand what happens when the database retrieves data.',
      content:
        'SQL begins with retrieval. Before you can filter, join, aggregate, or optimize anything, you need to understand how a database returns rows from a table.\n\nThe SELECT statement tells the database which columns you want to see. The FROM clause tells it where those columns live. Together they form the core sentence structure of most SQL queries.\n\nThink of a database table like a spreadsheet: it has named columns and many rows of data. When you write SELECT, you are choosing which columns to display. When you write FROM, you are pointing to which spreadsheet to read from.\n\nBeginners often start with SELECT * because it is convenient—it returns every column without naming them. But strong habits come from learning to request only the fields you actually need. This matters for performance, readability, and preventing bugs when schemas change.\n\nIn real applications, almost every feature starts with retrieval: loading a user profile, displaying a product catalog, showing order history, or populating a dropdown list. Mastering SELECT and FROM is your first step toward building data-driven features.',
      objectives: [
        'Understand the role of SELECT and FROM in every query',
        'Read the difference between selecting all columns and specific columns',
        'Recognize why column-level selection matters in real applications',
        'Write basic queries that retrieve data from a single table',
      ],
      sections: [
        {
          heading: 'Why retrieval comes first',
          body: 'Most product features depend on reading data: loading dashboards, showing order history, listing products, or fetching profiles. SELECT is the gateway to all of that behavior. Before you can transform or analyze data, you must first retrieve it from storage.',
        },
        {
          heading: 'How the database interprets SELECT',
          body: 'The database reads the table named in FROM, then constructs a result set containing the columns requested in SELECT. Even a simple query is building a new view of the data—a temporary result that exists only while the query runs. This result can be displayed in a UI, used in further calculations, or passed to another system.',
        },
        {
          heading: 'Why SELECT * is only a starting point',
          body: 'SELECT * is useful while exploring a schema or debugging, but in production code it can return unnecessary data, make results harder to read, and create fragile application code if schemas change. Explicitly naming columns makes your intent clear and your code more maintainable.',
        },
        {
          heading: 'The anatomy of a simple query',
          body: 'Every SELECT query follows the same structure: keywords (SELECT, FROM), column names or *, and a table name. The database processes these in order: first it locates the table, then it extracts the requested columns, and finally it returns the result set to your application.',
        },
      ],
      examples: [
        '-- Return all columns from a table\nSELECT * FROM customers;\n\n-- Return specific columns only\nSELECT first_name, last_name, email FROM customers;\n\n-- Return a single column\nSELECT product_name FROM products;',
      ],
      pitfalls: [
        'Using a table name that does not exist in the schema—always verify table names before querying.',
        'Forgetting that SELECT returns a result set, not a permanent copy of data—the original table remains unchanged.',
        'Relying on SELECT * when you only need a few fields—this can slow down queries and make code harder to maintain.',
        'Misspelling column names—SQL is case-insensitive for keywords but column names must match the schema exactly.',
      ],
      keyTakeaways: [
        'SELECT chooses columns—it defines what data you want to see.',
        'FROM chooses the source table—it tells the database where to look.',
        'A query result is a shaped view of stored data, not a permanent change.',
        'Explicit column names are clearer and safer than SELECT * in production code.',
      ],
    },
    practice: {
      question: 'Write a query to return all columns from the `products` table.',
      initialQuery: '-- Return every column from products\n',
      expectedQuery: 'SELECT * FROM products;',
      starterTips: [
        'Start with the SELECT keyword.',
        'Use * only because the task explicitly asks for all columns.',
        'Do not forget the FROM clause.',
        'End your query with a semicolon (optional in some databases but good practice).',
      ],
      successChecks: [
        'The query reads from the products table.',
        'It returns all available columns.',
        'The syntax is valid and the query executes without errors.',
      ],
    },
    quiz: [
      {
        question: 'What does SQL stand for?',
        options: [
          'Simple Query Language',
          'Structured Query Language',
          'Standard Query Logic',
          'Sequential Query Language',
        ],
        answerIndex: 1,
        explanation: 'SQL (Structured Query Language) is the standard language for defining, querying, and manipulating relational data. It has been in use since the 1970s and remains foundational to modern data systems.',
      },
      {
        question: 'Which keyword retrieves data from a table?',
        options: ['GET', 'FETCH', 'SELECT', 'READ'],
        answerIndex: 2,
        explanation: 'SELECT is the retrieval keyword at the center of most read queries. It tells the database which columns to return in the result set.',
      },
      {
        question: 'Why can SELECT specific_column be better than SELECT *?',
        options: [
          'It always runs slower',
          'It makes schemas larger',
          'It returns only the data you actually need',
          'It deletes unused columns',
        ],
        answerIndex: 2,
        explanation: 'Selecting only needed columns improves clarity, reduces data transfer, and makes your code more robust to schema changes. It also helps the database optimize query execution.',
      },
      {
        question: 'What happens if you SELECT from a table that does not exist?',
        options: [
          'The query returns an empty result',
          'The database creates the table',
          'The query fails with an error',
          'The database suggests a similar table name',
        ],
        answerIndex: 2,
        explanation: 'The database will return an error indicating the table does not exist. Always verify table names before writing queries.',
      },
    ],
  },
  ch2: {
    learn: {
      title: 'Filtering and Sorting with WHERE and ORDER BY',
      summary:
        'This chapter moves from “show me the table” to “show me the rows I care about, in the order I care about.” That shift is where SQL starts to feel useful in applications.',
      content:
        'Real product queries rarely need every row. A storefront needs available products, an admin page needs recent orders, and a search tool needs results ordered in a predictable way.\n\nThe WHERE clause narrows the working set by applying conditions. ORDER BY then organizes the surviving rows so the output is meaningful to humans or downstream application logic.\n\nThese two clauses together form the core of most everyday SQL work.',
      objectives: [
        'Filter rows using practical conditions',
        'Understand the difference between filtering and sorting',
        'Compose WHERE and ORDER BY in the same query',
      ],
      sections: [
        {
          heading: 'Filtering decides inclusion',
          body: 'WHERE acts like a gate. Each row is tested against the condition, and only rows that satisfy it move forward into the result set.',
        },
        {
          heading: 'Sorting organizes the output',
          body: 'ORDER BY does not change which rows qualify. It changes how the returned rows are arranged, which matters for usability and interpretation.',
        },
        {
          heading: 'Why this matters in products',
          body: 'Most interfaces need both: “show only shipped orders” and “show the newest first” are separate but complementary concerns.',
        },
      ],
      examples: [
        'SELECT * FROM orders WHERE total_amount > 100;',
        'SELECT * FROM products ORDER BY price DESC LIMIT 5;',
        "SELECT * FROM orders WHERE status = 'Shipped' ORDER BY created_at DESC;",
      ],
      pitfalls: [
        'Confusing WHERE with ORDER BY',
        'Using quotes incorrectly around strings or numbers',
        'Forgetting DESC when you want highest values first',
      ],
      keyTakeaways: [
        'WHERE chooses rows.',
        'ORDER BY chooses order.',
        'They solve different problems and are often used together.',
      ],
    },
    practice: {
      question:
        'Select all orders where the total amount is greater than 150, ordered by total amount descending.',
      initialQuery: '-- Filter and sort orders\n',
      expectedQuery: 'SELECT * FROM orders WHERE total_amount > 150 ORDER BY total_amount DESC;',
      starterTips: [
        'Write the table source first in your head: orders.',
        'Add the filter before the sort.',
        'Descending means larger totals should appear first.',
      ],
      successChecks: [
        'Only orders above 150 are returned.',
        'The result is sorted by total_amount descending.',
      ],
    },
    quiz: [
      {
        question: 'Which clause filters records before they appear in the result?',
        options: ['FILTER', 'WHERE', 'HAVING', 'ORDER BY'],
        answerIndex: 1,
        explanation: 'WHERE applies conditions to rows before the final result is produced.',
      },
      {
        question: 'What does DESC mean in ORDER BY price DESC?',
        options: ['Delete selected column', 'Sort from highest to lowest', 'Filter duplicates', 'Return only numeric values'],
        answerIndex: 1,
        explanation: 'DESC sorts values in descending order.',
      },
      {
        question: 'Which statement is true?',
        options: [
          'ORDER BY removes rows',
          'WHERE changes column names',
          'WHERE filters and ORDER BY sorts',
          'Both clauses do the same job',
        ],
        answerIndex: 2,
        explanation: 'Filtering and ordering are separate stages with different responsibilities.',
      },
    ],
  },
  ch3: {
    learn: {
      title: 'Aggregations and GROUP BY',
      summary:
        'This chapter teaches how SQL turns many rows into summaries. Instead of listing every record, you begin asking analytical questions such as counts, totals, averages, and grouped metrics.',
      content:
        'Aggregation is how SQL becomes a reporting language. Functions like COUNT, SUM, AVG, MIN, and MAX collapse many rows into a smaller set of answers.\n\nGROUP BY adds structure by telling the database which rows should be collected together before those aggregate functions run. This is what powers reports like “orders per customer” or “sales per category.”',
      objectives: [
        'Use aggregate functions correctly',
        'Understand how GROUP BY creates buckets of rows',
        'Read grouped results as summaries rather than raw records',
      ],
      sections: [
        {
          heading: 'Aggregate functions summarize data',
          body: 'COUNT answers how many, SUM answers how much, AVG answers the typical value, and MIN/MAX identify extremes.',
        },
        {
          heading: 'GROUP BY defines the bucket',
          body: 'When you group by a column such as category, the database creates one internal bucket per category and computes aggregates inside each bucket.',
        },
        {
          heading: 'Why grouping changes how you think',
          body: 'Once you group data, the result rows no longer represent individual records. They represent summaries of many records.',
        },
      ],
      examples: [
        'SELECT COUNT(*) FROM customers;',
        'SELECT status, COUNT(*) FROM orders GROUP BY status;',
        'SELECT category_id, AVG(price) FROM products GROUP BY category_id;',
      ],
      pitfalls: [
        'Selecting non-grouped columns without aggregating them',
        'Forgetting that grouped results are summaries, not raw rows',
        'Using GROUP BY when a simple COUNT(*) would do',
      ],
      keyTakeaways: [
        'Aggregate functions summarize many rows.',
        'GROUP BY defines how rows are bucketed.',
        'Grouped output should be read as analytics, not raw data.',
      ],
    },
    practice: {
      question: 'Count the number of products in each category.',
      initialQuery: '-- Count products by category\n',
      expectedQuery: 'SELECT category, COUNT(*) FROM products GROUP BY category;',
      starterTips: [
        'You need one row per category.',
        'COUNT(*) gives the number of rows inside each group.',
        'Any non-aggregated selected column must also be grouped.',
      ],
      successChecks: [
        'The result includes category values.',
        'The result includes a count per category.',
        'Rows are grouped by category.',
      ],
    },
    quiz: [
      {
        question: 'What does COUNT(*) return?',
        options: ['The first row only', 'The number of rows', 'The total of numeric values', 'A sorted list of rows'],
        answerIndex: 1,
        explanation: 'COUNT(*) returns how many rows are in the evaluated set.',
      },
      {
        question: 'Why is GROUP BY needed with SELECT status, COUNT(*)?',
        options: [
          'To rename the table',
          'To divide rows into one bucket per status',
          'To sort the output alphabetically',
          'To limit the number of results',
        ],
        answerIndex: 1,
        explanation: 'GROUP BY tells the engine how to form the categories that COUNT should summarize.',
      },
      {
        question: 'Which is a common aggregation mistake?',
        options: [
          'Using COUNT(*)',
          'Grouping by the category column',
          'Selecting extra non-grouped columns without aggregation',
          'Using AVG with numbers',
        ],
        answerIndex: 2,
        explanation: 'Grouped queries must either aggregate or group the columns they select.',
      },
    ],
  },
  ch13: {
    learn: {
      title: 'How Databases Store and Read Data',
      summary:
        'This chapter introduces the physical side of databases: pages on disk, pages in memory, and why the buffer pool matters so much for performance.',
      content:
        'A relational database is not just a logical system of tables and rows. Under the hood, it stores data in fixed-size pages on disk and tries to keep frequently used pages in memory.\n\nWhen your query needs a row, the engine usually reads the page containing that row. If the page is already in memory, access is fast. If not, the engine has to perform disk I/O, which is much slower.\n\nThis is why storage layout and caching behavior influence performance long before you reach “advanced optimization.”',
      objectives: [
        'Understand the difference between disk storage and memory access',
        'Recognize what the buffer pool is doing for your queries',
        'Connect query performance to physical storage behavior',
      ],
      sections: [
        {
          heading: 'Pages are the unit of storage',
          body: 'Databases do not usually read one row at a time from disk. They read pages, each containing multiple rows or index entries.',
        },
        {
          heading: 'The buffer pool is a working memory cache',
          body: 'Frequently accessed pages are kept in RAM so repeated queries can avoid slow disk reads.',
        },
        {
          heading: 'Why this matters to developers',
          body: 'Even good SQL can be slow if it forces unnecessary page reads. Understanding storage helps explain why indexes and access paths matter.',
        },
      ],
      examples: [
        'SELECT * FROM users WHERE id = 1000;',
        'SELECT * FROM products WHERE price > 50;',
        'SELECT id, total FROM orders ORDER BY created_at DESC LIMIT 20;',
      ],
      pitfalls: [
        'Thinking rows are fetched independently from disk one by one',
        'Assuming a repeated query always hits disk again',
        'Ignoring that physical layout can affect performance',
      ],
      keyTakeaways: [
        'Disk is persistent but slower than memory.',
        'The buffer pool reduces repeated disk access.',
        'Physical storage behavior shapes query performance.',
      ],
    },
    practice: {
      question: 'Select all products where the price is greater than 50.',
      initialQuery: '-- Find expensive products\n',
      expectedQuery: 'SELECT * FROM products WHERE price > 50;',
      starterTips: [
        'Use the products table.',
        'The comparison belongs in a WHERE clause.',
        'This query is simple, but it still triggers a real access path under the hood.',
      ],
      successChecks: [
        'The query reads from products.',
        'It filters using price > 50.',
      ],
    },
    quiz: [
      {
        question: 'What is the buffer pool?',
        options: ['A backup archive', 'An in-memory cache of database pages', 'A schema design tool', 'A SQL parser'],
        answerIndex: 1,
        explanation: 'The buffer pool stores pages in RAM so they can be reused without repeated disk access.',
      },
      {
        question: 'What is a cache miss?',
        options: ['A deleted row', 'A missing SQL keyword', 'A needed page not found in memory', 'A failed transaction'],
        answerIndex: 2,
        explanation: 'A cache miss means the engine must fetch the needed page from disk.',
      },
      {
        question: 'Why do storage internals matter to query writers?',
        options: [
          'They determine font size in the editor',
          'They help explain why some access paths are faster',
          'They replace the need for indexes',
          'They make SQL syntax optional',
        ],
        answerIndex: 1,
        explanation: 'Performance is strongly influenced by how much data the engine has to read and from where.',
      },
    ],
  },
  ch14: {
    learn: {
      title: 'Transactions, Concurrency, and ACID',
      summary:
        'This chapter explains how databases protect correctness when multiple operations or multiple users interact with the same data at the same time.',
      content:
        'Transactions let the database treat multiple statements as one logical unit of work. If something fails halfway through, the system can roll the whole operation back instead of leaving the data in a broken state.\n\nConcurrency adds a second challenge: multiple users may try to read or write related data at the same time. Isolation levels and locking strategies exist so these overlapping operations do not corrupt correctness.',
      objectives: [
        'Understand why transactions are grouped into units of work',
        'Learn what ACID protects in a real system',
        'Recognize why concurrent access creates anomalies',
      ],
      sections: [
        {
          heading: 'Atomicity protects the unit of work',
          body: 'Either the whole transaction succeeds or none of it should become visible. This is critical for operations like transferring money or updating multiple related rows.',
        },
        {
          heading: 'Isolation protects overlapping activity',
          body: 'Without isolation, one transaction may see half-finished data from another or overwrite data unexpectedly.',
        },
        {
          heading: 'Durability preserves committed work',
          body: 'Once a transaction commits, the database must make sure the result survives crashes or restarts.',
        },
      ],
      examples: [
        'BEGIN TRANSACTION;',
        'UPDATE accounts SET balance = balance - 100 WHERE id = 1;',
        'UPDATE accounts SET balance = balance + 100 WHERE id = 2;',
        'COMMIT;',
      ],
      pitfalls: [
        'Thinking BEGIN and COMMIT are only for advanced systems',
        'Ignoring rollback behavior when multi-step writes can fail',
        'Assuming concurrent transactions never interfere with each other',
      ],
      keyTakeaways: [
        'Transactions group related work safely.',
        'ACID properties exist to protect correctness.',
        'Concurrency control prevents subtle and costly data bugs.',
      ],
    },
    practice: {
      question:
        "Start a transaction, update the `orders` table to set `status` to 'Shipped' for order ID 1, and then commit.",
      initialQuery: "-- Write a transaction\nBEGIN TRANSACTION;\n\n-- your update here\n\nCOMMIT;",
      expectedQuery: "BEGIN TRANSACTION; UPDATE orders SET status = 'Shipped' WHERE id = 1; COMMIT;",
      starterTips: [
        'A transaction should have a clear beginning and end.',
        'The update belongs between BEGIN and COMMIT.',
        'Think about why this pattern matters if another statement could fail.',
      ],
      successChecks: [
        'The query starts a transaction.',
        'It updates order 1 to Shipped.',
        'It commits the change explicitly.',
      ],
    },
    quiz: [
      {
        question: "What does the 'A' in ACID stand for?",
        options: ['Availability', 'Atomicity', 'Accuracy', 'Automation'],
        answerIndex: 1,
        explanation: 'Atomicity means all parts of the transaction succeed together or fail together.',
      },
      {
        question: 'What is a dirty read?',
        options: [
          'Reading deleted files',
          'Reading uncommitted changes from another transaction',
          'Reading rows without ordering',
          'Reading old backup data',
        ],
        answerIndex: 1,
        explanation: 'Dirty reads occur when one transaction observes changes another transaction has not committed yet.',
      },
      {
        question: 'Why might a database roll back a transaction?',
        options: [
          'To sort rows alphabetically',
          'To save memory only',
          'To undo partial work after an error',
          'To remove duplicate columns',
        ],
        answerIndex: 2,
        explanation: 'Rollback restores consistency when part of the transaction fails.',
      },
    ],
  },
  ch15: {
    learn: {
      title: 'Database Security and SQL Injection Prevention',
      summary:
        'This chapter teaches the most important application-level database defense: keeping user input separate from SQL structure so the database never mistakes data for executable code.',
      content:
        'SQL Injection happens when an application builds SQL by concatenating raw user input into the query string. If the input changes the logic of the query, an attacker may bypass authentication, expose data, or manipulate records.\n\nPrepared statements solve this by separating the SQL template from the values provided at runtime. The database receives the structure and the data independently, which prevents the input from becoming SQL instructions.',
      objectives: [
        'Recognize how unsafe string concatenation creates risk',
        'Understand why parameterized queries are safer',
        'Connect secure querying to real application behavior',
      ],
      sections: [
        {
          heading: 'Why concatenation is dangerous',
          body: 'If the application builds a SQL string directly from user input, that input can alter the WHERE clause, append operators, or terminate strings in unexpected ways.',
        },
        {
          heading: 'Prepared statements preserve intent',
          body: 'With parameterized queries, the SQL structure stays fixed. The database treats the supplied values as data, not logic.',
        },
        {
          heading: 'Security is also about access design',
          body: 'Prepared statements are essential, but broader security also includes least privilege, views, role management, and careful exposure of sensitive columns.',
        },
      ],
      examples: [
        "-- Vulnerable\nSELECT * FROM users WHERE username = '" + "' + userInput + '" + "';",
        '-- Safe pattern\nSELECT * FROM users WHERE username = ?;',
        'GRANT SELECT ON users TO reporting_role;',
      ],
      pitfalls: [
        'Thinking escaping alone is enough in every case',
        'Using direct string concatenation for login or search features',
        'Giving broad table access when a narrower permission model would work',
      ],
      keyTakeaways: [
        'Input should never change SQL structure.',
        'Prepared statements separate code from data.',
        'Security also depends on permissions and exposure boundaries.',
      ],
    },
    practice: {
      question: "Write a query to select all users where the username is 'admin'.",
      initialQuery: '-- Select the admin user safely\n',
      expectedQuery: "SELECT * FROM users WHERE username = 'admin';",
      starterTips: [
        'This challenge is simple SQL, but connect it mentally to safer parameterized application code.',
        'Use the users table and a WHERE clause.',
        'Match the username exactly.',
      ],
      successChecks: [
        'The query reads from users.',
        "It filters where username equals 'admin'.",
      ],
    },
    quiz: [
      {
        question: 'What is the primary defense against SQL Injection?',
        options: ['Encrypting passwords', 'Prepared statements', 'Using a firewall', 'Obscuring table names'],
        answerIndex: 1,
        explanation: 'Prepared statements keep user input from altering the SQL structure.',
      },
      {
        question: "Why can `admin' OR '1'='1` be dangerous in a vulnerable query?",
        options: [
          'It changes the database engine',
          'It can make the condition always true',
          'It automatically deletes data',
          'It disables indexes',
        ],
        answerIndex: 1,
        explanation: 'If injected into a concatenated string, it can transform the WHERE clause into an always-true condition.',
      },
      {
        question: 'What does least privilege mean?',
        options: [
          'Only admins may log in',
          'Every user gets full read access',
          'Grant only the permissions needed for the task',
          'Store all queries in one file',
        ],
        answerIndex: 2,
        explanation: 'Least privilege reduces blast radius by limiting what any role or service can do.',
      },
    ],
  },
};

const fallbackChapter: ChapterData = {
  learn: {
    title: 'Chapter Under Construction',
    summary:
      'This chapter is available, but its handcrafted teaching content has not been expanded yet.',
    content:
      'The chapter page will still let you practice and quiz yourself, but the long-form learning material for this topic is still being upgraded.\n\nUse the learning hub for the most detailed AI-generated path right now, then return here for chapter-specific review as this curriculum fills out.',
    objectives: [
      'Understand the broad topic at a high level',
      'Use the linked practice prompt as a quick application exercise',
    ],
    sections: [
      {
        heading: 'Current state',
        body: 'This chapter is using a fallback content pack until a more detailed narrative is added.',
      },
      {
        heading: 'Best next step',
        body: 'Open the learning hub version of this topic for the richer, AI-generated lesson path.',
      },
    ],
    examples: ['SELECT * FROM customers;'],
    pitfalls: ['Assuming this placeholder chapter contains the full curriculum depth yet'],
    keyTakeaways: [
      'The chapter route is still usable.',
      'The learning hub currently provides the deepest lesson experience.',
    ],
  },
  practice: {
    question: 'Select all rows from customers.',
    initialQuery: 'SELECT * FROM customers;',
    expectedQuery: 'SELECT * FROM customers;',
    starterTips: [
      'Use a basic SELECT query.',
      'The task is intentionally simple for placeholder content.',
    ],
    successChecks: [
      'The query selects from customers.',
      'It returns all columns.',
    ],
  },
  quiz: [
    {
      question: 'Is this fallback chapter fully detailed yet?',
      options: ['Yes', 'No', 'Almost', 'Only visually'],
      answerIndex: 1,
      explanation: 'This is a temporary placeholder until the chapter receives its full content pack.',
    },
  ],
};

export function getChapterData(id: string) {
  return CHAPTER_CONTENT[id] || fallbackChapter;
}
