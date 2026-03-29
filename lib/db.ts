import initSqlJs, { Database } from 'sql.js';

let db: Database | null = null;
let initPromise: Promise<Database> | null = null;

export async function initDB(): Promise<Database> {
  if (db) return db;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: file => `/api/sql-wasm`
    });
    
    db = new SQL.Database();
    
    // Create tables
    db.run(`
      CREATE TABLE customers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        email TEXT,
        country TEXT
      );
      
      CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT,
        category TEXT,
        price REAL
      );
      
      CREATE TABLE suppliers (
        id INTEGER PRIMARY KEY,
        name TEXT,
        contact_name TEXT,
        country TEXT
      );
      
      CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        customer_id INTEGER,
        order_date TEXT,
        total_amount REAL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );
      
      CREATE TABLE order_items (
        id INTEGER PRIMARY KEY,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER,
        unit_price REAL,
        FOREIGN KEY(order_id) REFERENCES orders(id),
        FOREIGN KEY(product_id) REFERENCES products(id)
      );
      
      CREATE TABLE reviews (
        id INTEGER PRIMARY KEY,
        product_id INTEGER,
        customer_id INTEGER,
        rating INTEGER,
        comment TEXT,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(customer_id) REFERENCES customers(id)
      );
    `);

    // Insert data
    db.run(`
      INSERT INTO customers (name, email, country) VALUES
        ('Alice Smith', 'alice@example.com', 'USA'),
        ('Bob Johnson', 'bob@example.com', 'UK'),
        ('Charlie Brown', 'charlie@example.com', 'Canada'),
        ('Diana Prince', 'diana@example.com', 'USA'),
        ('Evan Wright', 'evan@example.com', 'Australia'),
        ('Fiona Gallagher', 'fiona@example.com', 'Ireland'),
        ('George Miller', 'george@example.com', 'UK'),
        ('Hannah Abbott', 'hannah@example.com', 'USA');

      INSERT INTO products (name, category, price) VALUES
        ('Laptop Pro', 'Electronics', 1299.99),
        ('Wireless Mouse', 'Electronics', 49.99),
        ('Mechanical Keyboard', 'Electronics', 149.99),
        ('Coffee Maker', 'Home', 89.99),
        ('Blender', 'Home', 59.99),
        ('Running Shoes', 'Sports', 119.99),
        ('Yoga Mat', 'Sports', 29.99),
        ('Dumbbells Set', 'Sports', 199.99);

      INSERT INTO suppliers (name, contact_name, country) VALUES
        ('TechCorp', 'John Doe', 'USA'),
        ('ElectroWorks', 'Jane Smith', 'China'),
        ('HomeGoods Inc', 'Mike Johnson', 'Germany'),
        ('SportsGear', 'Sarah Williams', 'UK'),
        ('FitLife', 'Chris Evans', 'USA'),
        ('GlobalTech', 'Anna Lee', 'Taiwan'),
        ('KitchenPlus', 'David Brown', 'Italy'),
        ('ActiveWear', 'Emma Davis', 'Canada');

      INSERT INTO orders (customer_id, order_date, total_amount) VALUES
        (1, '2023-10-01', 1349.98),
        (2, '2023-10-05', 89.99),
        (3, '2023-10-10', 149.99),
        (4, '2023-10-12', 119.99),
        (5, '2023-10-15', 259.98),
        (6, '2023-10-18', 1299.99),
        (7, '2023-10-20', 49.99),
        (8, '2023-10-25', 199.99);

      INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES
        (1, 1, 1, 1299.99),
        (1, 2, 1, 49.99),
        (2, 4, 1, 89.99),
        (3, 3, 1, 149.99),
        (4, 6, 1, 119.99),
        (5, 5, 1, 59.99),
        (5, 8, 1, 199.99),
        (6, 1, 1, 1299.99),
        (7, 2, 1, 49.99),
        (8, 8, 1, 199.99);

      INSERT INTO reviews (product_id, customer_id, rating, comment) VALUES
        (1, 1, 5, 'Excellent laptop, very fast!'),
        (2, 1, 4, 'Good mouse, but a bit small.'),
        (4, 2, 5, 'Makes great coffee.'),
        (3, 3, 5, 'Love the clicky keys.'),
        (6, 4, 4, 'Very comfortable for running.'),
        (5, 5, 3, 'It works, but is quite loud.'),
        (8, 5, 5, 'Solid dumbbells, good grip.'),
        (1, 6, 5, 'Best purchase I made this year.');
    `);

    return db;
  })();

  return initPromise;
}

export async function getSchema() {
  const database = await initDB();
  try {
    const tablesResult = database.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';");
    if (tablesResult.length === 0) return [];
    
    const tables = tablesResult[0].values.map(v => v[0] as string);
    const schema = [];
    
    for (const table of tables) {
      const colsResult = database.exec(`PRAGMA table_info(${table});`);
      if (colsResult.length > 0) {
        const columns = colsResult[0].values.map(v => ({
          name: v[1] as string,
          type: v[2] as string
        }));
        schema.push({ table, columns });
      }
    }
    return schema;
  } catch (error) {
    console.error("Failed to fetch schema", error);
    return [];
  }
}

export async function runQuery(query: string) {
  const database = await initDB();
  try {
    const result = database.exec(query);
    if (result.length === 0) {
      return { columns: [], values: [] };
    }
    return {
      columns: result[0].columns,
      values: result[0].values
    };
  } catch (error) {
    throw error;
  }
}
