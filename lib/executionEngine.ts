import { Database } from 'sql.js';
import { generateExplanation, StepExplanation } from './explanationEngine';

export type Phase = "PARSE" | "VALIDATE" | "PLAN" | "ACCESS" | "EXECUTE" | "RESULT" | "ERROR";

export type Operation =
  | "TOKENIZE"
  | "SYNTAX_CHECK"
  | "SEMANTIC_CHECK"
  | "PLAN_BUILD"
  | "TABLE_SCAN"
  | "INDEX_SCAN"
  | "FILTER"
  | "JOIN"
  | "GROUP"
  | "AGGREGATE"
  | "SORT"
  | "LIMIT"
  | "PROJECT"
  | "RETURN";

export interface ExecutionStep {
  id: number;
  phase: Phase;
  title: string;
  description: string;
  explanation: string | StepExplanation;
  operation?: Operation;
  queryFragment?: string;
  dataBefore?: any[];
  dataAfter?: any[];
  highlight?: {
    rows?: number[];
    columns?: string[];
    cells?: { row: number; column: string }[];
  };
  metadata?: {
    table?: string;
    indexUsed?: boolean;
    rowsScanned?: number;
    rowsReturned?: number;
    condition?: string;
  };
  isSubquery?: boolean;
  visual?: {
    showTables?: string[];
    showIndexTree?: boolean;
    showDisk?: boolean;
    showMemory?: boolean;
    animation?: "scan" | "filter" | "join" | "sort" | "group" | "none";
    type?: string;
    joinType?: string;
    showVennDiagram?: boolean;
    leftTable?: string;
    rightTable?: string;
    matchingKeys?: string[];
    leftRows?: any[];
    rightRows?: any[];
    matches?: number;
  };
}

export interface QueryAST {
  select: { column: string; alias?: string }[];
  from: string;
  fromAlias?: string;
  joins?: {
    table: string;
    alias?: string;
    type: "INNER" | "LEFT" | "RIGHT" | "FULL";
    on: [string, string];
  }[];
  where?: WhereCondition;
  groupBy?: string[];
  having?: {
    column: string;
    operator: string;
    value: any;
  };
  orderBy?: {
    column: string;
    direction: 'ASC' | 'DESC';
  }[];
  limit?: number;
  raw: string;
}

export type WhereCondition = {
  type: "AND" | "OR" | "BASIC";
  left?: WhereCondition;
  right?: WhereCondition;
  column?: string;
  operator?: string;
  value?: any;
  isSubquery?: boolean;
  subquery?: QueryAST;
};

export function parseQuery(query: string): QueryAST | null {
  const q = query.trim().replace(/;/g, '').replace(/\s+/g, ' ');
  
  const getPart = (keyword: string, nextKeywords: string[]) => {
    const regex = new RegExp(`${keyword}\\s+([\\s\\S]+?)(?:\\s+(?:${nextKeywords.join('|')})|$)`, 'i');
    const match = q.match(regex);
    return match ? match[1].trim() : null;
  };

  const selectPart = getPart('SELECT', ['FROM']);
  const fromPart = getPart('FROM', ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'WHERE', 'GROUP BY', 'ORDER BY', 'LIMIT']);
  
  if (!selectPart || !fromPart) {
    // Fallback AST for simple queries if parsing fails but it looks like a SELECT
    if (q.toLowerCase().startsWith('select')) {
      const parts = q.split(/\s+from\s+/i);
      return {
        select: [{ column: '*' }],
        from: parts[1]?.trim().split(/\s+/)[0] || 'unknown',
        raw: query
      };
    }
    return null;
  }

  const select = selectPart.split(',').map(s => {
    const parts = s.trim().split(/\s+AS\s+/i);
    return { column: parts[0].trim(), alias: parts[1]?.trim() };
  });

  // Handle table alias in FROM
  const fromParts = fromPart.trim().split(/\s+/);
  const from = fromParts[0];
  const fromAlias = fromParts.length > 1 ? fromParts[1] : undefined;

  // Joins
  const joins: QueryAST['joins'] = [];
  const joinRegex = /(?:(LEFT|RIGHT|FULL|INNER)\s+)?JOIN\s+([\w\d_]+)(?:\s+([\w\d_]+))?\s+ON\s+([\w\d_.]+\s*=\s*[\w\d_.]+)/gi;
  let joinMatch;
  while ((joinMatch = joinRegex.exec(q)) !== null) {
    const onParts = joinMatch[4].split('=').map(s => s.trim());
    joins.push({
      type: (joinMatch[1]?.toUpperCase() as any) || "INNER",
      table: joinMatch[2],
      alias: joinMatch[3],
      on: [onParts[0], onParts[1]]
    });
  }

  // Where
  const wherePart = getPart('WHERE', ['GROUP BY', 'ORDER BY', 'LIMIT']);
  let where: WhereCondition | undefined;
  if (wherePart) {
    if (wherePart.toUpperCase().includes(' AND ')) {
      const parts = wherePart.split(/\s+AND\s+/i);
      where = {
        type: "AND",
        left: parseBasicCondition(parts[0]),
        right: parseBasicCondition(parts[1])
      };
    } else if (wherePart.toUpperCase().includes(' OR ')) {
      const parts = wherePart.split(/\s+OR\s+/i);
      where = {
        type: "OR",
        left: parseBasicCondition(parts[0]),
        right: parseBasicCondition(parts[1])
      };
    } else {
      where = parseBasicCondition(wherePart);
    }
  }

  const groupPart = getPart('GROUP BY', ['HAVING', 'ORDER BY', 'LIMIT']);
  const havingPart = getPart('HAVING', ['ORDER BY', 'LIMIT']);
  const orderPart = getPart('ORDER BY', ['LIMIT']);
  const limitPart = getPart('LIMIT', []);

  return {
    select,
    from,
    fromAlias,
    joins: joins.length > 0 ? joins : undefined,
    where,
    groupBy: groupPart ? groupPart.split(',').map(s => s.trim()) : undefined,
    having: havingPart ? parseHaving(havingPart) : undefined,
    orderBy: orderPart ? orderPart.split(',').map(s => {
      const parts = s.trim().split(/\s+/);
      return { column: parts[0], direction: (parts[1]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC' };
    }) : undefined,
    limit: limitPart ? parseInt(limitPart) : undefined,
    raw: query
  };
}

function parseBasicCondition(cond: string): WhereCondition {
  cond = cond.trim();
  const subqueryMatch = cond.match(/(\w+)\s+(IN|EXISTS)\s*\((.+)\)/i);
  if (subqueryMatch) {
    const ast = parseQuery(subqueryMatch[3]);
    return {
      type: "BASIC",
      column: subqueryMatch[1],
      operator: subqueryMatch[2].toUpperCase(),
      isSubquery: true,
      subquery: ast || undefined
    };
  }

  const match = cond.match(/([\w\d_.]+)\s*(=|>|<|>=|<=|!=|LIKE|IN)\s*(.+)/i);
  if (match) {
    return {
      type: "BASIC",
      column: match[1],
      operator: match[2].toUpperCase(),
      value: match[3].trim().replace(/^'|'$/g, '')
    };
  }
  return { type: "BASIC" };
}

function parseHaving(cond: string) {
  const match = cond.match(/(\w+)\s*(=|>|<|>=|<=|!=)\s*(.+)/i);
  if (match) {
    return {
      column: match[1],
      operator: match[2],
      value: match[3].trim().replace(/^'|'$/g, '')
    };
  }
  return undefined;
}

export async function buildExecutionSteps(ast: QueryAST, db: Database): Promise<ExecutionStep[]> {
  const steps: ExecutionStep[] = [];
  let stepId = 1;
  let currentData: any[] = [];
  const query = ast.raw;

  const getValue = (row: any, col: string) => {
    if (row[col] !== undefined) return row[col];
    const cleanCol = col.split('.').pop();
    const match = Object.keys(row).find(k =>
      k === cleanCol || k.endsWith(`.${cleanCol}`)
    );
    return match ? row[match] : undefined;
  };

  const pushStep = (step: Omit<ExecutionStep, 'id'>) => {
    const dataBefore = step.dataBefore ?? [...currentData];
    const dataAfter = step.dataAfter !== undefined ? [...step.dataAfter] : [...currentData];
    
    // Auto-detect columns if not provided
    const columns = (step as any).columns ?? 
                   (dataAfter.length > 0 ? Object.keys(dataAfter[0]) : 
                   (dataBefore.length > 0 ? Object.keys(dataBefore[0]) : []));

    steps.push({ 
      ...step, 
      id: stepId++,
      dataBefore,
      dataAfter,
      explanation: step.operation ? generateExplanation(step, ast) : step.explanation,
      metadata: {
        ...step.metadata,
        columns: columns as string[]
      }
    } as any);

    currentData = dataAfter;
  };

  // 1. PARSE
  const tokens = query.split(/\s+/).filter(t => t.length > 0);
  pushStep({
    phase: "PARSE",
    title: "Query Parsing",
    description: "Analyzing query structure and keywords.",
    explanation: "The database engine breaks down the SQL string into individual tokens and builds an Abstract Syntax Tree (AST) to understand the query's intent.",
    operation: "TOKENIZE",
    queryFragment: query,
    metadata: { 
      tokens,
      queryLength: query.length,
      tokenCount: tokens.length
    } as any,
    dataAfter: []
  });

  // 2. VALIDATE
  const tables = [ast.from];
  const joins = ast.joins?.map(j => j.table) || [];
  const columns = ast.select.map(s => s.column);
  pushStep({
    phase: "VALIDATE",
    title: "Semantic Validation",
    description: "Checking tables, columns, and permissions.",
    explanation: "The engine verifies that all referenced tables and columns exist in the database catalog and that the user has the necessary permissions to access them.",
    operation: "SEMANTIC_CHECK",
    metadata: { 
      tables, 
      joins,
      columns,
      schemaChecked: true
    } as any,
    dataAfter: []
  });

  const getTableData = (tableName: string) => {
    try {
      // Handle potential aliases in table name (e.g. "customers c")
      const realTableName = tableName.split(/\s+/)[0];
      const res = db.exec(`SELECT * FROM ${realTableName}`);
      if (res.length === 0) return null;
      return { columns: res[0].columns, values: res[0].values.map(row => {
        const obj: any = {};
        res[0].columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
      })};
    } catch (e) {
      return null;
    }
  };

  const baseTable = getTableData(ast.from);
  const baseTableName = ast.from.split(/\s+/)[0];

  if (!baseTable) {
    pushStep({ 
      phase: "ERROR", 
      title: "Table Not Found", 
      description: `Table '${baseTableName}' not found.`, 
      explanation: "The table does not exist in the database.", 
      operation: "SEMANTIC_CHECK" 
    });
    return steps;
  }

  // 3. PLAN
  const plan = ["SCAN"];
  if (ast.joins) plan.push("JOIN");
  if (ast.where) plan.push("FILTER");
  if (ast.groupBy) plan.push("GROUP", "AGGREGATE");
  if (ast.orderBy) plan.push("SORT");
  plan.push("PROJECT");

  pushStep({
    phase: "PLAN",
    title: "Query Optimization",
    description: "Building the execution plan.",
    explanation: "The optimizer selects the best join order and access methods.",
    operation: "PLAN_BUILD",
    metadata: { plan } as any,
    dataAfter: []
  });

  // 4. ACCESS
  pushStep({
    phase: "ACCESS",
    title: "Data Access",
    description: `Scanning table ${baseTableName}.`,
    explanation: "Loading data from disk into the buffer pool.",
    operation: "TABLE_SCAN",
    metadata: { 
      table: baseTableName,
      columns: baseTable.columns 
    } as any,
    dataAfter: [...baseTable.values],
    visual: { showDisk: true, showMemory: true }
  });

  // 5. SUBQUERY EXECUTION
  const checkSubqueries = async (cond?: WhereCondition) => {
    if (!cond) return;
    if (cond.isSubquery && cond.subquery) {
      const mainDataBeforeSubquery = [...currentData];

      pushStep({
        phase: "EXECUTE",
        title: "Executing Subquery",
        description: "Running nested query",
        explanation: "Subqueries are evaluated before the main query filters are applied.",
        operation: "PLAN_BUILD",
        dataBefore: mainDataBeforeSubquery,
        dataAfter: mainDataBeforeSubquery,
        visual: {
          type: "subquery-start"
        }
      });

      const nestedSteps = await buildExecutionSteps(cond.subquery, db);
      const lastNestedStep = nestedSteps[nestedSteps.length - 1];
      const subResult = lastNestedStep.dataAfter || [];
      const subColumns = (lastNestedStep.metadata as any)?.columns || [];
      cond.value = subResult.map(r => Object.values(r)[0]);

      nestedSteps.forEach(s => {
        s.id = stepId++;
        s.isSubquery = true;
        steps.push(s);
      });

      pushStep({
        phase: "RESULT",
        title: "Subquery Result",
        description: "Subquery returned result set",
        explanation: "The subquery execution is complete and the results are ready for the main query.",
        operation: "RETURN",
        dataBefore: [], // Hide input data for result step
        dataAfter: subResult,
        isSubquery: true,
        metadata: { columns: subColumns } as any,
        visual: {
          type: "subquery-result",
          result: subResult
        } as any
      });

      // CRITICAL: Restore main query data context after subquery execution
      currentData = mainDataBeforeSubquery;

      pushStep({
        phase: "EXECUTE",
        title: "Subquery Connection",
        description: `Connecting ${baseTableName} with subquery results.`,
        explanation: `The main query will now use the results from the subquery to filter rows in ${baseTableName}.`,
        operation: "FILTER",
        dataBefore: mainDataBeforeSubquery,
        dataAfter: mainDataBeforeSubquery,
        visual: {
          type: "subquery",
          parentTable: baseTableName,
          subTable: cond.subquery.from,
          connectionColumn: cond.column,
          resultValues: cond.value
        } as any
      });
    }
    if (cond.left) await checkSubqueries(cond.left);
    if (cond.right) await checkSubqueries(cond.right);
  };
  await checkSubqueries(ast.where);

  // 6. JOIN
  if (ast.joins) {
    for (const join of ast.joins) {
      const joinTable = getTableData(join.table);
      if (!joinTable) {
        pushStep({ 
          phase: "ERROR", 
          title: "Join Table Not Found", 
          description: `Table '${join.table}' not found.`, 
          explanation: "The table referenced in the JOIN clause does not exist in the database.",
          operation: "SEMANTIC_CHECK" 
        });
        return steps;
      }

      const [leftOn, rightOn] = join.on;
      const leftCol = leftOn.includes('.') ? leftOn.split('.')[1] : leftOn;
      const rightCol = rightOn.includes('.') ? rightOn.split('.')[1] : rightOn;

      const matchingRows = [];
      for (const leftRow of currentData) {
        for (const rightRow of joinTable.values) {
          if (leftRow[leftCol] === rightRow[rightCol]) {
            matchingRows.push({ left: leftRow, right: rightRow });
            if (matchingRows.length >= 3) break;
          }
        }
        if (matchingRows.length >= 3) break;
      }

      pushStep({
        phase: "EXECUTE",
        title: `${join.type} JOIN`,
        description: `Joining ${baseTableName} with ${join.table}.`,
        explanation: "Using Nested Loop Join to combine rows based on the join condition.",
        operation: "JOIN",
        dataBefore: currentData,
        dataAfter: currentData,
        visual: { 
          animation: "join", 
          showTables: [baseTableName, join.table],
          type: "join",
          joinType: join.type,
          showVennDiagram: true,
          leftTable: ast.fromAlias || baseTableName,
          rightTable: join.alias || join.table,
          matchingKeys: [leftCol, rightCol],
          leftRows: currentData.slice(0, 3),
          rightRows: joinTable.values.slice(0, 3),
          matches: matchingRows.length
        }
      });

      const joinedData: any[] = [];
      const leftMatched = new Set();
      const rightMatched = new Set();
      const leftPrefix = ast.fromAlias || baseTableName;
      const rightPrefix = join.alias || join.table;

      for (let i = 0; i < currentData.length; i++) {
        let foundMatch = false;
        for (let j = 0; j < joinTable.values.length; j++) {
          const leftRow = currentData[i];
          const rightRow = joinTable.values[j];
          if (leftRow[leftCol] === rightRow[rightCol]) {
            foundMatch = true;
            leftMatched.add(i);
            rightMatched.add(j);
            
            // Create a new row with prefixed keys
            const newRow: any = {};
            // Add left row columns
            Object.entries(leftRow).forEach(([k, v]) => {
              newRow[k] = v;
              newRow[`${leftPrefix}.${k}`] = v;
            });
            // Add right row columns
            Object.entries(rightRow).forEach(([k, v]) => {
              newRow[k] = v;
              newRow[`${rightPrefix}.${k}`] = v;
            });
            joinedData.push(newRow);
          }
        }
        if (!foundMatch && (join.type === "LEFT" || join.type === "FULL")) {
          const newRow: any = {};
          Object.entries(currentData[i]).forEach(([k, v]) => {
            newRow[k] = v;
            newRow[`${leftPrefix}.${k}`] = v;
          });
          joinTable.columns.forEach(c => {
            newRow[c] = null;
            newRow[`${rightPrefix}.${c}`] = null;
          });
          joinedData.push(newRow);
        }
      }

      if (join.type === "RIGHT" || join.type === "FULL") {
        for (let j = 0; j < joinTable.values.length; j++) {
          if (!rightMatched.has(j)) {
            const newRow: any = {};
            const firstRow = currentData[0] || {};
            Object.keys(firstRow).forEach(c => {
              newRow[c] = null;
              newRow[`${leftPrefix}.${c}`] = null;
            });
            Object.entries(joinTable.values[j]).forEach(([k, v]) => {
              newRow[k] = v;
              newRow[`${rightPrefix}.${k}`] = v;
            });
            joinedData.push(newRow);
          }
        }
      }

      const joinedColumns = [...Object.keys(currentData[0] || {}), ...joinTable.columns.map(c => `${rightPrefix}.${c}`)];

      pushStep({
        phase: "EXECUTE",
        title: "Join Result",
        description: `Produced ${joinedData.length} rows.`,
        explanation: "The join operation has finished merging the datasets.",
        operation: "JOIN",
        dataAfter: joinedData,
        metadata: { columns: joinedColumns } as any
      });
    }
  }

  // 7. WHERE
  if (ast.where) {
    pushStep({
      phase: "EXECUTE",
      title: "Filtering Rows",
      description: "Applying WHERE conditions.",
      explanation: "Evaluating predicates for each row.",
      operation: "FILTER",
      dataBefore: currentData,
      dataAfter: currentData,
      visual: { animation: "filter" }
    });

    const evaluate = (row: any, cond: WhereCondition): boolean => {
      if (cond.type === "AND") return evaluate(row, cond.left!) && evaluate(row, cond.right!);
      if (cond.type === "OR") return evaluate(row, cond.left!) || evaluate(row, cond.right!);
      
      const val = getValue(row, cond.column!);
      const target = cond.value;
      
      switch (cond.operator) {
        case '=': return val == target;
        case '>': return val > target;
        case '<': return val < target;
        case '>=': return val >= target;
        case '<=': return val <= target;
        case '!=': return val != target;
        case 'LIKE': return String(val).includes(String(target).replace(/%/g, ''));
        case 'IN': 
          if (Array.isArray(target)) return target.includes(val);
          return String(target).split(',').map(s => s.trim()).includes(String(val));
        default: return true;
      }
    };

    const filteredData = currentData.filter(row => evaluate(row, ast.where!));
    pushStep({
      phase: "EXECUTE",
      title: "Filter Result",
      description: `Kept ${filteredData.length} rows.`,
      explanation: "Rows that did not satisfy the WHERE condition were removed.",
      operation: "FILTER",
      dataAfter: filteredData,
      metadata: { columns: Object.keys(currentData[0] || {}) } as any
    });
  }

  // 8. GROUP BY
  let groups: Record<string, any[]> = {};
  if (ast.groupBy) {
    pushStep({
      phase: "EXECUTE",
      title: "Grouping",
      description: `Grouping by ${ast.groupBy.join(', ')}.`,
      explanation: "Aggregating rows into buckets.",
      operation: "GROUP",
      dataBefore: currentData,
      dataAfter: currentData,
      visual: { animation: "group" }
    });

    currentData.forEach(row => {
      const key = ast.groupBy!.map(col => getValue(row, col)).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
    });
  }

  // 9. AGGREGATE
  if (ast.groupBy) {
    const aggregated: any[] = [];
    const aggFuncs = ast.select.filter(s => /COUNT|SUM|AVG|MIN|MAX/i.test(s.column));

    Object.entries(groups).forEach(([key, rows]) => {
      const result: any = {};
      const keyParts = key.split('|');
      ast.groupBy!.forEach((col, i) => result[col] = keyParts[i]);

      aggFuncs.forEach(agg => {
        const match = agg.column.match(/(COUNT|SUM|AVG|MIN|MAX)\((.+)\)/i);
        if (match) {
          const func = match[1].toUpperCase();
          const col = match[2].trim();
          const vals = rows.map(r => Number(getValue(r, col))).filter(v => !isNaN(v));
          
          let val = 0;
          if (func === 'COUNT') val = rows.length;
          else if (func === 'SUM') val = vals.reduce((a, b) => a + b, 0);
          else if (func === 'AVG') val = vals.reduce((a, b) => a + b, 0) / vals.length;
          else if (func === 'MIN') val = Math.min(...vals);
          else if (func === 'MAX') val = Math.max(...vals);
          
          result[agg.alias || agg.column] = val;
        }
      });
      aggregated.push(result);
    });

    pushStep({
      phase: "EXECUTE",
      title: "Aggregation",
      description: "Computing summary values.",
      explanation: "For each group, the engine calculates summary values like COUNT, SUM, or AVG.",
      operation: "AGGREGATE",
      dataAfter: aggregated,
      metadata: { columns: Object.keys(aggregated[0] || {}) } as any
    });
  }

  // 10. HAVING
  if (ast.having) {
    const { column, operator, value } = ast.having;
    const filteredData = currentData.filter(row => {
      const val = getValue(row, column);
      switch (operator) {
        case '=': return val == value;
        case '>': return val > value;
        case '<': return val < value;
        case '>=': return val >= value;
        case '<=': return val <= value;
        case '!=': return val != value;
        default: return true;
      }
    });
    pushStep({
      phase: "EXECUTE",
      title: "Having Filter",
      description: `Applying HAVING ${column} ${operator} ${value}`,
      explanation: "The HAVING clause filters groups based on aggregate values.",
      operation: "FILTER",
      dataAfter: filteredData,
      metadata: { columns: Object.keys(currentData[0] || {}) } as any
    });
  }

  // 11. SORT
  if (ast.orderBy) {
    pushStep({
      phase: "EXECUTE",
      title: "Sorting",
      description: "Ordering result set.",
      explanation: "The database engine reorders the rows based on the specified columns in the ORDER BY clause.",
      operation: "SORT",
      dataBefore: currentData,
      dataAfter: currentData,
      visual: { animation: "sort" }
    });

    const sortedData = [...currentData].sort((a, b) => {
      for (const order of ast.orderBy!) {
        const valA = getValue(a, order.column);
        const valB = getValue(b, order.column);
        if (valA < valB) return order.direction === 'ASC' ? -1 : 1;
        if (valA > valB) return order.direction === 'ASC' ? 1 : -1;
      }
      return 0;
    });

    pushStep({
      phase: "EXECUTE",
      title: "Sort Complete",
      description: "Data reordered.",
      explanation: "The sort operation has finished organizing the rows.",
      operation: "SORT",
      dataAfter: sortedData,
      metadata: { columns: Object.keys(currentData[0] || {}) } as any
    });
  }

  // 12. LIMIT
  if (ast.limit !== undefined) {
    const limitedData = currentData.slice(0, ast.limit);
    pushStep({
      phase: "EXECUTE",
      title: "Limit",
      description: `Returning top ${ast.limit} rows.`,
      explanation: "The engine stops processing after the specified number of rows have been collected.",
      operation: "LIMIT",
      dataAfter: limitedData,
      metadata: { columns: Object.keys(currentData[0] || {}) } as any
    });
  }

  // 13. PROJECTION
  if (ast.select[0].column !== '*') {
    const projectedColumns = ast.select.map(s => s.alias || s.column);
    const projectedData = currentData.map(row => {
      const newRow: any = {};
      ast.select.forEach(s => {
        const key = s.alias || s.column;
        const val = getValue(row, s.column);
        newRow[key] = val !== undefined ? val : null;
      });
      return newRow;
    });
    pushStep({
      phase: "EXECUTE",
      title: "Projection",
      description: "Selecting final columns.",
      explanation: "The engine discards any columns that were not requested in the SELECT clause.",
      operation: "PROJECT",
      dataAfter: projectedData,
      metadata: { columns: projectedColumns } as any
    });
  }

  // 14. RESULT
  const finalColumns = (steps[steps.length - 1].metadata as any)?.columns || 
                      (currentData.length > 0 ? Object.keys(currentData[0]) : baseTable.columns);

  pushStep({
    phase: "RESULT",
    title: "Final Result",
    description: "Query execution completed.",
    explanation: "The query has been successfully executed, and the final result set is returned to the user.",
    operation: "RETURN",
    dataAfter: [...currentData],
    metadata: { 
      rowsReturned: currentData.length,
      columns: finalColumns
    } as any
  });

  return steps;
}
