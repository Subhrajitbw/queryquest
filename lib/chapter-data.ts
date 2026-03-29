export const CHAPTER_CONTENT: Record<string, any> = {
  'ch1': {
    learn: {
      title: "The Basics: SELECT and FROM",
      content: "Welcome to SQL! SQL stands for Structured Query Language. It's the standard language for interacting with relational databases.\n\nThe most fundamental command in SQL is the `SELECT` statement. It allows you to retrieve data from a database table.\n\nTo get all columns from a table, you use the asterisk `*`.",
      examples: [
        "SELECT * FROM customers;",
        "SELECT first_name, last_name FROM customers;"
      ]
    },
    practice: {
      question: "Write a query to select all columns from the `products` table.",
      initialQuery: "-- Select all columns from products\n",
      expectedQuery: "SELECT * FROM products;"
    },
    quiz: [
      {
        question: "What does SQL stand for?",
        options: ["Simple Query Language", "Structured Query Language", "Standard Query Logic", "Sequential Query Language"],
        answerIndex: 1
      },
      {
        question: "Which keyword is used to retrieve data from a database?",
        options: ["GET", "FETCH", "SELECT", "PULL"],
        answerIndex: 2
      },
      {
        question: "Which symbol is used to select all columns from a table?",
        options: ["*", "%", "#", "@"],
        answerIndex: 0
      }
    ]
  },
  'ch2': {
    learn: {
      title: "Filtering & Sorting",
      content: "You can filter rows using the `WHERE` clause. It allows you to specify conditions that must be met for a row to be included in the result set.\n\nYou can also sort the results using the `ORDER BY` clause, and limit the number of rows returned using the `LIMIT` clause.",
      examples: [
        "SELECT * FROM orders WHERE total_amount > 100;",
        "SELECT * FROM products ORDER BY price DESC LIMIT 5;"
      ]
    },
    practice: {
      question: "Select all orders where the total amount is greater than 150, ordered by total amount descending.",
      initialQuery: "-- Filter and sort orders\n",
      expectedQuery: "SELECT * FROM orders WHERE total_amount > 150 ORDER BY total_amount DESC;"
    },
    quiz: [
      {
        question: "Which clause is used to filter records?",
        options: ["FILTER", "WHERE", "HAVING", "SORT"],
        answerIndex: 1
      },
      {
        question: "How do you sort the results in descending order?",
        options: ["ORDER BY column DESC", "SORT BY column DOWN", "ORDER DESC column", "SORT column DESC"],
        answerIndex: 0
      },
      {
        question: "Which clause limits the number of rows returned?",
        options: ["MAX", "TOP", "LIMIT", "ROWS"],
        answerIndex: 2
      }
    ]
  },
  'ch3': {
    learn: {
      title: "Aggregations",
      content: "Aggregation functions perform a calculation on a set of values and return a single value. Common functions include `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX`.\n\nThe `GROUP BY` clause groups rows that have the same values into summary rows.",
      examples: [
        "SELECT COUNT(*) FROM customers;",
        "SELECT status, COUNT(*) FROM orders GROUP BY status;"
      ]
    },
    practice: {
      question: "Count the number of products in each category.",
      initialQuery: "-- Count products by category\n",
      expectedQuery: "SELECT category, COUNT(*) FROM products GROUP BY category;"
    },
    quiz: [
      {
        question: "Which function returns the total sum of a numeric column?",
        options: ["TOTAL", "SUM", "ADD", "COUNT"],
        answerIndex: 1
      },
      {
        question: "Which clause is used to group rows that have the same values?",
        options: ["GROUP BY", "ORDER BY", "CLUSTER BY", "MATCH BY"],
        answerIndex: 0
      },
      {
        question: "Which function counts the number of rows?",
        options: ["SUM", "NUMBER", "COUNT", "TOTAL"],
        answerIndex: 2
      }
    ]
  },
  'ch13': {
    learn: {
      title: "Data Storage System",
      content: "Databases store data on persistent storage (like SSDs or HDDs) in fixed-size chunks called **Pages** or **Blocks** (typically 4KB or 8KB).\n\nBecause reading from disk is slow, databases use a **Buffer Pool** in memory (RAM). When you query data, the database first checks if the required page is in the Buffer Pool (a **Cache Hit**). If not, it reads the page from disk into memory (a **Cache Miss**), which is much slower.\n\nData can be stored in a **Heap** (unordered) or as an **Index-Organized Table** (ordered by primary key).",
      examples: [
        "-- A query that causes a cache miss (reads from disk)",
        "SELECT * FROM users WHERE id = 1000;",
        "-- A subsequent query for the same data causes a cache hit (reads from memory)",
        "SELECT * FROM users WHERE id = 1000;"
      ]
    },
    practice: {
      question: "Select all columns from the `products` table where the price is greater than 50.",
      initialQuery: "-- Find expensive products\n",
      expectedQuery: "SELECT * FROM products WHERE price > 50;"
    },
    quiz: [
      {
        question: "What is the memory area where databases cache disk pages called?",
        options: ["Disk Cache", "Buffer Pool", "Query Cache", "Page File"],
        answerIndex: 1
      },
      {
        question: "What happens when a requested page is NOT in the Buffer Pool?",
        options: ["Cache Hit", "Query Error", "Cache Miss (Disk I/O)", "Memory Overflow"],
        answerIndex: 2
      },
      {
        question: "Which storage medium is faster?",
        options: ["Hard Disk Drive (HDD)", "Solid State Drive (SSD)", "Memory (RAM)", "Magnetic Tape"],
        answerIndex: 2
      }
    ]
  },
  'ch14': {
    learn: {
      title: "Concurrency & ACID Principles",
      content: "Transactions must adhere to the **ACID** properties:\n- **Atomicity**: All or nothing.\n- **Consistency**: Data must be valid according to rules.\n- **Isolation**: Concurrent transactions shouldn't interfere.\n- **Durability**: Committed data is saved permanently.\n\n**Isolation Levels** control how strictly transactions are separated:\n1. **READ UNCOMMITTED**: Allows *Dirty Reads* (reading uncommitted data).\n2. **READ COMMITTED**: Prevents Dirty Reads, but allows *Non-Repeatable Reads*.\n3. **REPEATABLE READ**: Prevents Non-Repeatable Reads, but allows *Phantom Reads*.\n4. **SERIALIZABLE**: Strictest level, prevents all anomalies.",
      examples: [
        "BEGIN TRANSACTION;",
        "UPDATE accounts SET balance = balance - 100 WHERE id = 1;",
        "UPDATE accounts SET balance = balance + 100 WHERE id = 2;",
        "COMMIT;"
      ]
    },
    practice: {
      question: "Start a transaction, update the `orders` table to set `status` to 'Shipped' for order ID 1, and then commit.",
      initialQuery: "-- Write a transaction\n",
      expectedQuery: "BEGIN TRANSACTION; UPDATE orders SET status = 'Shipped' WHERE id = 1; COMMIT;"
    },
    quiz: [
      {
        question: "What does the 'A' in ACID stand for?",
        options: ["Availability", "Atomicity", "Accuracy", "Automation"],
        answerIndex: 1
      },
      {
        question: "Which concurrency anomaly occurs when a transaction reads data that has not yet been committed by another transaction?",
        options: ["Phantom Read", "Lost Update", "Dirty Read", "Non-Repeatable Read"],
        answerIndex: 2
      },
      {
        question: "Which isolation level is the strictest and prevents all concurrency anomalies?",
        options: ["READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE", "READ UNCOMMITTED"],
        answerIndex: 2
      }
    ]
  },
  'ch15': {
    learn: {
      title: "Database Security",
      content: "**SQL Injection** is a critical vulnerability where an attacker manipulates a query by injecting malicious SQL code. For example, entering `admin' OR '1'='1` into a login form can bypass authentication if the backend concatenates strings directly.\n\n**Prepared Statements** (Parameterized Queries) are the primary defense against SQL Injection. They send the SQL structure and the data separately, ensuring the database treats user input strictly as data, not executable code.\n\nOther security measures include **GRANT/REVOKE** for role-based access control and using **Views** to restrict access to sensitive columns.",
      examples: [
        "-- VULNERABLE (String Concatenation)",
        "query = \"SELECT * FROM users WHERE username = '\" + userInput + \"'\";",
        "-- SECURE (Prepared Statement)",
        "query = \"SELECT * FROM users WHERE username = ?\";",
        "execute(query, [userInput]);"
      ]
    },
    practice: {
      question: "Write a query to select all users where the username is 'admin'.",
      initialQuery: "-- Select admin user\n",
      expectedQuery: "SELECT * FROM users WHERE username = 'admin';"
    },
    quiz: [
      {
        question: "What is the primary defense against SQL Injection?",
        options: ["Encrypting passwords", "Prepared Statements", "Using a firewall", "Hiding the database IP"],
        answerIndex: 1
      },
      {
        question: "Which command is used to give a user permission to read a table?",
        options: ["ALLOW", "PERMIT", "GRANT", "GIVE"],
        answerIndex: 2
      },
      {
        question: "Why does `admin' OR '1'='1` bypass a vulnerable login?",
        options: ["It crashes the database", "It changes the password", "It makes the WHERE clause always evaluate to true", "It deletes the users table"],
        answerIndex: 2
      }
    ]
  }
};

// Fallback for missing chapters
const fallbackChapter = {
  learn: {
    title: "Coming Soon",
    content: "This chapter is currently under construction. Check back later!",
    examples: []
  },
  practice: {
    question: "Select all from customers.",
    initialQuery: "SELECT * FROM customers;",
    expectedQuery: "SELECT * FROM customers;"
  },
  quiz: [
    {
      question: "Is this chapter ready?",
      options: ["Yes", "No", "Maybe", "Soon"],
      answerIndex: 1
    }
  ]
};

export function getChapterData(id: string) {
  return CHAPTER_CONTENT[id] || fallbackChapter;
}
