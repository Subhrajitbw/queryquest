import { generateExplanation, StepExplanation } from './explanationEngine';
import { initDB } from './db';

export type Phase = 'PARSE' | 'VALIDATE' | 'PLAN' | 'ACCESS' | 'EXECUTE' | 'RESULT' | 'ERROR';

export type Operation =
  | 'TOKENIZE'
  | 'SYNTAX_CHECK'
  | 'SEMANTIC_CHECK'
  | 'PLAN_BUILD'
  | 'TRANSACTION'
  | 'TABLE_SCAN'
  | 'INDEX_SCAN'
  | 'FILTER'
  | 'JOIN'
  | 'SUBQUERY'
  | 'GROUP'
  | 'AGGREGATE'
  | 'SORT'
  | 'LIMIT'
  | 'PROJECT'
  | 'RETURN';

export interface QueryExecutionResult {
  success: boolean;
  rows: any[];
  columns: string[];
  error?: string;
}

export interface ExecutionContext {
  accessedTables: string[];
  accessType: 'FULL_SCAN' | 'INDEX_SCAN';
  indexColumn?: string;
  filterColumn?: string;
  filterValue?: any;
  joinKeys?: string[];
  isTransaction: boolean;
  indexedValues?: Array<string | number>;
  comparisons?: string[];
  lockTargets?: string[];
  walEntries?: string[];
  autoCommit?: boolean;
  durabilityTarget?: string;
  consistencyCheck?: string;
}

export interface ExecutionStep {
  id: number;
  phase: Phase;
  title: string;
  description: string;
  query: string;
  explanation: string | StepExplanation;
  operation?: Operation;
  queryFragment?: string;
  result: QueryExecutionResult;
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
    columns?: string[];
    tokens?: string[];
    plan?: string[];
    joins?: string[];
    queryLength?: number;
    tokenCount?: number;
  };
  isSubquery?: boolean;
  executionContext?: ExecutionContext;
  visual?: {
    showTables?: string[];
    showIndexTree?: boolean;
    showDisk?: boolean;
    showMemory?: boolean;
    animation?: 'scan' | 'filter' | 'join' | 'sort' | 'group' | 'none';
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
    type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
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
  type: 'AND' | 'OR' | 'BASIC';
  left?: WhereCondition;
  right?: WhereCondition;
  column?: string;
  operator?: string;
  value?: any;
  isSubquery?: boolean;
  subquery?: QueryAST;
};

function normalizeQuery(query: string) {
  return query.trim().replace(/;+\s*$/g, '');
}

function getStatementParts(query: string) {
  return query
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

function isTransactionQuery(query: string) {
  return /\b(BEGIN|START\s+TRANSACTION|COMMIT|ROLLBACK|SAVEPOINT)\b/i.test(query);
}

function isWriteQuery(query: string) {
  return /^\s*(INSERT|UPDATE|DELETE|UPSERT|MERGE|REPLACE)\b/i.test(query);
}

function extractAccessedTablesFromRawQuery(query: string) {
  const matches = Array.from(
    query.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO|DELETE\s+FROM)\s+([\w\d_]+)/gi)
  ).map((match) => match[1]);

  return Array.from(new Set(matches));
}

function rowsFromExec(columns: string[], values: any[][]) {
  return values.map((valueRow) => {
    const row: Record<string, any> = {};
    columns.forEach((column, index) => {
      row[column] = valueRow[index];
    });
    return row;
  });
}

export async function executeQuery(query: string): Promise<QueryExecutionResult> {
  const normalizedQuery = normalizeQuery(query);
  console.log('[executionEngine] executeQuery original:', query);
  console.log('[executionEngine] executeQuery normalized:', normalizedQuery);

  try {
    const db = await initDB();
    const result = db.exec(normalizedQuery);

    if (result.length === 0) {
      console.log('[executionEngine] executeQuery success: 0 rows');
      return {
        success: true,
        rows: [],
        columns: [],
      };
    }

    const primaryResult = result[0];
    const rows = rowsFromExec(primaryResult.columns, primaryResult.values as any[][]);

    console.log('[executionEngine] executeQuery success:', {
      columns: primaryResult.columns,
      rowCount: rows.length,
    });

    return {
      success: true,
      rows,
      columns: primaryResult.columns,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown SQL execution error';
    console.error('[executionEngine] executeQuery error:', message);

    return {
      success: false,
      rows: [],
      columns: [],
      error: message,
    };
  }
}

export function parseQuery(query: string): QueryAST | null {
  const q = normalizeQuery(query).replace(/\s+/g, ' ');

  const getPart = (keyword: string, nextKeywords: string[]) => {
    const regex = new RegExp(`${keyword}\\s+([\\s\\S]+?)(?:\\s+(?:${nextKeywords.join('|')})|$)`, 'i');
    const match = q.match(regex);
    return match ? match[1].trim() : null;
  };

  const selectPart = getPart('SELECT', ['FROM']);
  const fromPart = getPart('FROM', ['JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'WHERE', 'GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']);

  if (!selectPart || !fromPart) {
    if (q.toLowerCase().startsWith('select')) {
      const parts = q.split(/\s+from\s+/i);
      return {
        select: [{ column: '*' }],
        from: parts[1]?.trim().split(/\s+/)[0] || 'unknown',
        raw: query,
      };
    }
    return null;
  }

  const select = selectPart.split(',').map((segment) => {
    const parts = segment.trim().split(/\s+AS\s+/i);
    return { column: parts[0].trim(), alias: parts[1]?.trim() };
  });

  const fromParts = fromPart.trim().split(/\s+/);
  const from = fromParts[0];
  const fromAlias = fromParts.length > 1 ? fromParts[1] : undefined;

  const joins: QueryAST['joins'] = [];
  const joinRegex = /(?:(LEFT|RIGHT|FULL|INNER)\s+)?JOIN\s+([\w\d_]+)(?:\s+([\w\d_]+))?\s+ON\s+([\w\d_.]+\s*=\s*[\w\d_.]+)/gi;
  let joinMatch: RegExpExecArray | null;
  while ((joinMatch = joinRegex.exec(q)) !== null) {
    const onParts = joinMatch[4].split('=').map((segment) => segment.trim());
    joins.push({
      type: (joinMatch[1]?.toUpperCase() as any) || 'INNER',
      table: joinMatch[2],
      alias: joinMatch[3],
      on: [onParts[0], onParts[1]],
    });
  }

  const wherePart = getPart('WHERE', ['GROUP BY', 'HAVING', 'ORDER BY', 'LIMIT']);
  let where: WhereCondition | undefined;
  if (wherePart) {
    if (wherePart.toUpperCase().includes(' AND ')) {
      const parts = wherePart.split(/\s+AND\s+/i);
      where = {
        type: 'AND',
        left: parseBasicCondition(parts[0]),
        right: parseBasicCondition(parts[1]),
      };
    } else if (wherePart.toUpperCase().includes(' OR ')) {
      const parts = wherePart.split(/\s+OR\s+/i);
      where = {
        type: 'OR',
        left: parseBasicCondition(parts[0]),
        right: parseBasicCondition(parts[1]),
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
    groupBy: groupPart ? groupPart.split(',').map((segment) => segment.trim()) : undefined,
    having: havingPart ? parseHaving(havingPart) : undefined,
    orderBy: orderPart
      ? orderPart.split(',').map((segment) => {
          const parts = segment.trim().split(/\s+/);
          return {
            column: parts[0],
            direction: (parts[1]?.toUpperCase() as 'ASC' | 'DESC') || 'ASC',
          };
        })
      : undefined,
    limit: limitPart ? parseInt(limitPart, 10) : undefined,
    raw: query,
  };
}

function parseBasicCondition(condition: string): WhereCondition {
  const trimmed = condition.trim();
  const subqueryMatch = trimmed.match(/(\w+)\s+(IN|EXISTS)\s*\((.+)\)/i);
  if (subqueryMatch) {
    const ast = parseQuery(subqueryMatch[3]);
    return {
      type: 'BASIC',
      column: subqueryMatch[1],
      operator: subqueryMatch[2].toUpperCase(),
      isSubquery: true,
      subquery: ast || undefined,
    };
  }

  const match = trimmed.match(/([\w\d_.]+)\s*(=|>|<|>=|<=|!=|LIKE|IN)\s*(.+)/i);
  if (!match) {
    return { type: 'BASIC' };
  }

  return {
    type: 'BASIC',
    column: match[1],
    operator: match[2].toUpperCase(),
    value: match[3].trim().replace(/^'|'$/g, ''),
  };
}

function parseHaving(condition: string) {
  const match = condition.match(/(\w+)\s*(=|>|<|>=|<=|!=)\s*(.+)/i);
  if (!match) {
    return undefined;
  }

  return {
    column: match[1],
    operator: match[2],
    value: match[3].trim().replace(/^'|'$/g, ''),
  };
}

function stringifyWhere(condition?: WhereCondition): string {
  if (!condition) {
    return '';
  }

  if (condition.type === 'AND' || condition.type === 'OR') {
    return `(${stringifyWhere(condition.left)} ${condition.type} ${stringifyWhere(condition.right)})`;
  }

  if (condition.isSubquery && condition.subquery) {
    return `${condition.column} ${condition.operator} (${normalizeQuery(condition.subquery.raw)})`;
  }

  return `${condition.column} ${condition.operator} ${condition.value}`;
}

function findPrimaryFilter(condition?: WhereCondition): {
  column?: string;
  value?: any;
} {
  if (!condition) {
    return {};
  }

  if (condition.type === 'AND' || condition.type === 'OR') {
    const left = findPrimaryFilter(condition.left);
    if (left.column) {
      return left;
    }

    return findPrimaryFilter(condition.right);
  }

  return {
    column: condition.column,
    value: condition.value,
  };
}

function inferAccessType(ast: QueryAST): {
  accessType: ExecutionContext['accessType'];
  indexColumn?: string;
  filterColumn?: string;
  filterValue?: any;
} {
  const primaryFilter = findPrimaryFilter(ast.where);
  const filterColumn = primaryFilter.column?.split('.').pop();
  const filterValue = primaryFilter.value;
  const orderColumn = ast.orderBy?.[0]?.column?.split('.').pop();

  const indexCandidate = filterColumn || orderColumn;
  const looksIndexed = !!indexCandidate && /(^id$|_id$)/i.test(indexCandidate);

  return {
    accessType: looksIndexed ? 'INDEX_SCAN' : 'FULL_SCAN',
    indexColumn: looksIndexed ? indexCandidate : undefined,
    filterColumn,
    filterValue,
  };
}

async function getIndexedValues(table: string | undefined, column: string | undefined) {
  if (!table || !column) {
    return undefined;
  }

  const result = await executeQuery(
    `SELECT ${column} FROM ${table} WHERE ${column} IS NOT NULL ORDER BY ${column} ASC LIMIT 12`
  );

  if (!result.success || result.rows.length === 0) {
    return undefined;
  }

  return result.rows
    .map((row) => row[column])
    .filter((value) => typeof value === 'number' || typeof value === 'string') as Array<string | number>;
}

function buildComparisons(indexedValues: Array<string | number> | undefined, target: any) {
  if (!indexedValues || indexedValues.length === 0 || target === undefined) {
    return undefined;
  }

  const midpoint = Math.floor(indexedValues.length / 2);
  const root = indexedValues[midpoint];
  const branch = indexedValues[Math.floor(midpoint / 2)] ?? indexedValues[0];
  const rightBranch = indexedValues[Math.floor((midpoint + indexedValues.length - 1) / 2)] ?? indexedValues[indexedValues.length - 1];

  const comparisons: string[] = [];
  if (target <= root) {
    comparisons.push(`${target} <= ${root} -> move left from root`);
    comparisons.push(
      `${target} ${target <= branch ? '<=' : '>'} ${branch} -> descend to matching leaf range`
    );
  } else {
    comparisons.push(`${target} > ${root} -> move right from root`);
    comparisons.push(
      `${target} ${target <= rightBranch ? '<=' : '>'} ${rightBranch} -> descend to matching leaf range`
    );
  }
  comparisons.push(`Leaf lookup resolves value ${target}`);

  return comparisons;
}

function buildFromClause(ast: QueryAST) {
  return `FROM ${ast.from}${ast.fromAlias ? ` ${ast.fromAlias}` : ''}`;
}

function buildJoinClauses(ast: QueryAST, joinCount?: number) {
  const joins = ast.joins?.slice(0, joinCount ?? ast.joins.length) ?? [];
  return joins
    .map((join) => {
      const joinType = join.type === 'INNER' ? 'INNER JOIN' : `${join.type} JOIN`;
      return `${joinType} ${join.table}${join.alias ? ` ${join.alias}` : ''} ON ${join.on[0]} = ${join.on[1]}`;
    })
    .join(' ');
}

function buildQuery(ast: QueryAST, options?: {
  select?: string;
  joinCount?: number;
  includeWhere?: boolean;
  includeGroupBy?: boolean;
  includeHaving?: boolean;
  includeOrderBy?: boolean;
  includeLimit?: boolean;
}) {
  const selectClause = options?.select ?? '*';
  const whereClause = options?.includeWhere && ast.where ? ` WHERE ${stringifyWhere(ast.where)}` : '';
  const groupByClause = options?.includeGroupBy && ast.groupBy ? ` GROUP BY ${ast.groupBy.join(', ')}` : '';
  const havingClause = options?.includeHaving && ast.having
    ? ` HAVING ${ast.having.column} ${ast.having.operator} ${ast.having.value}`
    : '';
  const orderByClause = options?.includeOrderBy && ast.orderBy
    ? ` ORDER BY ${ast.orderBy.map((item) => `${item.column} ${item.direction}`).join(', ')}`
    : '';
  const limitClause = options?.includeLimit && ast.limit !== undefined ? ` LIMIT ${ast.limit}` : '';

  return [
    `SELECT ${selectClause}`,
    buildFromClause(ast),
    buildJoinClauses(ast, options?.joinCount),
    whereClause,
    groupByClause,
    havingClause,
    orderByClause,
    limitClause,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function buildJoinVisual(ast: QueryAST, joinIndex: number) {
  const join = ast.joins?.[joinIndex];
  if (!join) {
    return undefined;
  }

  const leftSourceQuery =
    joinIndex === 0
      ? buildQuery(ast, { select: '*', joinCount: 0 })
      : buildQuery(ast, { select: '*', joinCount: joinIndex });
  const rightSourceQuery = `SELECT * FROM ${join.table}${join.alias ? ` ${join.alias}` : ''}`;

  const [leftResult, rightResult] = await Promise.all([
    executeQuery(leftSourceQuery),
    executeQuery(rightSourceQuery),
  ]);

  const leftKey = join.on[0].split('.').pop() || join.on[0];
  const rightKey = join.on[1].split('.').pop() || join.on[1];

  const leftRows = leftResult.rows.slice(0, 4);
  const rightRows = rightResult.rows.slice(0, 4);
  const matches = leftRows.filter((leftRow) =>
    rightRows.some((rightRow) => leftRow[leftKey] === rightRow[rightKey])
  ).length;

  return {
    animation: 'join' as const,
    type: 'join',
    joinType: join.type,
    showVennDiagram: true,
    leftTable: ast.fromAlias || ast.from,
    rightTable: join.alias || join.table,
    matchingKeys: [leftKey, rightKey],
    leftRows,
    rightRows,
    matches,
  };
}

type StepDescriptor = {
  phase: Phase;
  title: string;
  description: string;
  operation: Operation;
  query: string;
  metadata?: ExecutionStep['metadata'];
  visual?: ExecutionStep['visual'];
};

async function buildExecutionContext(
  descriptor: StepDescriptor,
  ast: QueryAST,
  result: QueryExecutionResult
): Promise<ExecutionContext> {
  const normalizedQuery = normalizeQuery(descriptor.query);
  const accessedTables = Array.from(
    new Set([
      ast.from,
      ...(ast.joins?.map((join) => join.table) ?? []),
      ...extractAccessedTablesFromRawQuery(normalizedQuery),
    ].filter(Boolean))
  );

  const accessInference = inferAccessType(ast);
  const joinKeys = descriptor.operation === 'JOIN'
    ? descriptor.visual?.matchingKeys
    : ast.joins?.flatMap((join) => join.on.map((part) => part.split('.').pop() || part));

  const isTransaction = isTransactionQuery(ast.raw) || isWriteQuery(ast.raw) || isTransactionQuery(normalizedQuery);
  const autoCommit = !isTransaction;
  const lockTargets = descriptor.phase === 'EXECUTE' || isTransaction ? accessedTables : [];
  const walEntries =
    isTransaction || isWriteQuery(normalizedQuery)
      ? [
          `WAL append: ${descriptor.operation ?? 'STEP'} on ${accessedTables.join(', ') || 'query scope'}`,
          result.success ? 'Flush log record before commit visibility' : 'Abort changes and preserve pre-step state',
        ]
      : [];
  const consistencyCheck =
    descriptor.operation === 'JOIN'
      ? `Join keys ${joinKeys?.join(' = ') || 'must align'} to preserve relational consistency.`
      : descriptor.operation === 'FILTER'
        ? `Predicate ${descriptor.metadata?.condition || 'must remain true'} determines valid rows.`
        : result.success
          ? 'This step preserves valid row and column structure.'
          : 'Execution failed before consistency could be guaranteed.';

  const indexValues = await getIndexedValues(accessedTables[0], accessInference.indexColumn);

  return {
    accessedTables,
    accessType: accessInference.accessType,
    indexColumn: accessInference.indexColumn,
    filterColumn: accessInference.filterColumn,
    filterValue: accessInference.filterValue,
    joinKeys,
    isTransaction,
    indexedValues: indexValues,
    comparisons: buildComparisons(indexValues, accessInference.filterValue),
    lockTargets,
    walEntries,
    autoCommit,
    durabilityTarget: isTransaction || isWriteQuery(normalizedQuery) ? 'Write-Ahead Log and committed pages' : 'Result stream only',
    consistencyCheck,
  };
}

async function descriptorToStep(
  descriptor: StepDescriptor,
  ast: QueryAST,
  previousRows: any[],
  id: number
): Promise<ExecutionStep> {
  console.log('[executionEngine] step query:', {
    id,
    title: descriptor.title,
    query: descriptor.query,
  });

  const result = await executeQuery(descriptor.query);
  const executionContext = await buildExecutionContext(descriptor, ast, result);

  console.log('[executionEngine] step result:', {
    id,
    title: descriptor.title,
    success: result.success,
    rowCount: result.rows.length,
    columns: result.columns,
    error: result.error,
  });

  const step: ExecutionStep = {
    id,
    phase: result.success ? descriptor.phase : 'ERROR',
    title: result.success ? descriptor.title : `${descriptor.title} Failed`,
    description: result.success ? descriptor.description : result.error || descriptor.description,
    query: descriptor.query,
    queryFragment: descriptor.query,
    operation: descriptor.operation,
    result,
    dataBefore: previousRows,
    dataAfter: result.rows,
    metadata: {
      ...descriptor.metadata,
      rowsReturned: result.rows.length,
      columns: result.columns,
    },
    executionContext,
    visual: descriptor.visual,
    explanation: '',
  };

  step.explanation = step.operation
    ? generateExplanation(step, ast)
    : step.description;

  return step;
}

export async function buildExecutionSteps(input: string | QueryAST): Promise<ExecutionStep[]> {
  const ast = typeof input === 'string' ? parseQuery(input) : input;

  if (!ast && typeof input === 'string') {
    const query = input;
    const normalizedQuery = normalizeQuery(query);
    const statements = getStatementParts(query);
    const isTransactionFlow = isTransactionQuery(query) || statements.some(isWriteQuery);

    if (isTransactionFlow) {
      const transactionPlan = ['TRANSACTION', 'RETURN'];
      const descriptors: StepDescriptor[] = [
        {
          phase: 'PARSE',
          title: 'Parse Query',
          description: 'Tokenize the SQL query and identify transaction boundaries.',
          operation: 'TOKENIZE',
          query: normalizedQuery,
          metadata: {
            tokens: normalizedQuery.split(/\s+/).filter(Boolean),
            queryLength: normalizedQuery.length,
            tokenCount: normalizedQuery.split(/\s+/).filter(Boolean).length,
          },
        },
        {
          phase: 'VALIDATE',
          title: 'Validate Transaction Statements',
          description: 'Confirm the transaction statements can execute in sequence.',
          operation: 'SEMANTIC_CHECK',
          query: normalizedQuery,
          metadata: {
            joins: extractAccessedTablesFromRawQuery(normalizedQuery),
          },
        },
        {
          phase: 'PLAN',
          title: 'Build Transaction Plan',
          description: 'Assemble the transactional execution path, including commit and rollback behavior.',
          operation: 'PLAN_BUILD',
          query: normalizedQuery,
          metadata: {
            plan: transactionPlan,
          },
        },
        {
          phase: 'EXECUTE',
          title: 'Execute Transaction',
          description: 'Run the write statements inside a transactional boundary.',
          operation: 'TRANSACTION',
          query: normalizedQuery,
          metadata: {
            table: extractAccessedTablesFromRawQuery(normalizedQuery)[0],
          },
        },
        {
          phase: 'RESULT',
          title: 'Return Execution Result',
          description: 'Report whether the transactional sequence completed successfully.',
          operation: 'RETURN',
          query: normalizedQuery,
        },
      ];

      const transactionAst: QueryAST = {
        select: [{ column: '*' }],
        from: extractAccessedTablesFromRawQuery(normalizedQuery)[0] || 'unknown',
        raw: query,
      };

      const steps: ExecutionStep[] = [];
      let previousRows: any[] = [];
      for (let index = 0; index < descriptors.length; index += 1) {
        const step = await descriptorToStep(descriptors[index], transactionAst, previousRows, index + 1);
        steps.push(step);
        if (!step.result.success) break;
        previousRows = step.result.rows;
      }

      return steps;
    }
  }

  if (!ast) {
    const query = typeof input === 'string' ? input : input.raw;
    const result = await executeQuery(query);
    const accessedTables = extractAccessedTablesFromRawQuery(query);
    const transactionDetected = isTransactionQuery(query) || getStatementParts(query).some(isWriteQuery);
    return [
      {
        id: 1,
        phase: 'ERROR',
        title: 'Unable to Build Execution Steps',
        description: 'The step engine could not parse this SQL into executable educational steps.',
        query,
        queryFragment: query,
        explanation: 'The parser could not derive a consistent execution plan from this SQL.',
        operation: 'SYNTAX_CHECK',
        result,
        dataBefore: [],
        dataAfter: result.rows,
        metadata: {
          columns: result.columns,
          rowsReturned: result.rows.length,
        },
        executionContext: {
          accessedTables,
          accessType: 'FULL_SCAN',
          isTransaction: transactionDetected,
          lockTargets: transactionDetected ? accessedTables : [],
          walEntries: transactionDetected
            ? ['WAL append: transaction statements registered', result.success ? 'Commit path available' : 'Rollback path required']
            : [],
          autoCommit: !transactionDetected,
          durabilityTarget: transactionDetected ? 'Write-Ahead Log and committed pages' : 'Result stream only',
          consistencyCheck: result.success
            ? 'Execution completed without a parsed relational plan.'
            : 'The engine could not build a consistent plan from this SQL.',
        },
      },
    ];
  }

  const normalizedOriginalQuery = normalizeQuery(ast.raw);
  const tokens = normalizedOriginalQuery.split(/\s+/).filter(Boolean);
  const accessInference = inferAccessType(ast);
  const plan = [accessInference.accessType === 'INDEX_SCAN' ? 'INDEX_SCAN' : 'TABLE_SCAN'];
  if (ast.joins?.length) plan.push('JOIN');
  if (ast.where) plan.push('FILTER');
  if (ast.groupBy) plan.push('GROUP', 'AGGREGATE');
  if (ast.orderBy) plan.push('SORT');
  if (ast.limit !== undefined) plan.push('LIMIT');
  if (ast.select[0]?.column !== '*') plan.push('PROJECT');
  plan.push('RETURN');

  const descriptors: StepDescriptor[] = [
    {
      phase: 'PARSE',
      title: 'Parse Query',
      description: 'Tokenize the SQL query and validate its structure against the playground dialect.',
      operation: 'TOKENIZE',
      query: normalizedOriginalQuery,
      metadata: {
        tokens,
        queryLength: normalizedOriginalQuery.length,
        tokenCount: tokens.length,
      },
    },
    {
      phase: 'VALIDATE',
      title: 'Validate Query',
      description: 'Confirm the referenced tables and columns are executable in the shared SQL engine.',
      operation: 'SEMANTIC_CHECK',
      query: normalizedOriginalQuery,
      metadata: {
        table: ast.from,
        joins: ast.joins?.map((join) => join.table),
      },
    },
    {
      phase: 'PLAN',
      title: 'Build Execution Plan',
      description: 'Assemble the ordered SQL execution plan used by both playground and visualizer.',
      operation: 'PLAN_BUILD',
      query: normalizedOriginalQuery,
      metadata: {
        plan,
      },
    },
    {
      phase: 'ACCESS',
      title: `${accessInference.accessType === 'INDEX_SCAN' ? 'Index Scan' : 'Scan'} ${ast.from}`,
      description:
        accessInference.accessType === 'INDEX_SCAN'
          ? `Use the ${accessInference.indexColumn} access path on ${ast.from} before later operators run.`
          : `Load rows from ${ast.from} as the execution starting point.`,
      operation: accessInference.accessType === 'INDEX_SCAN' ? 'INDEX_SCAN' : 'TABLE_SCAN',
      query: buildQuery(ast, { select: '*', joinCount: 0 }),
      metadata: {
        table: ast.from,
        indexUsed: accessInference.accessType === 'INDEX_SCAN',
        condition: ast.where ? stringifyWhere(ast.where) : undefined,
      },
      visual: {
        showDisk: true,
        showMemory: true,
        animation: 'scan',
        showTables: [ast.from],
        showIndexTree: accessInference.accessType === 'INDEX_SCAN',
      },
    },
  ];

  if (ast.joins?.length) {
    for (let index = 0; index < ast.joins.length; index += 1) {
      const join = ast.joins[index];
      descriptors.push({
        phase: 'EXECUTE',
        title: `${join.type} JOIN ${join.table}`,
        description: `Combine ${ast.from} with ${join.table} using ${join.on[0]} = ${join.on[1]}.`,
        operation: 'JOIN',
        query: buildQuery(ast, { select: '*', joinCount: index + 1 }),
        metadata: {
          table: join.table,
          condition: `${join.on[0]} = ${join.on[1]}`,
        },
        visual: await buildJoinVisual(ast, index),
      });
    }
  }

  if (ast.where) {
    if (ast.where.isSubquery && ast.where.subquery) {
      descriptors.push({
        phase: 'EXECUTE',
        title: 'Execute Subquery',
        description: 'Resolve the nested query before applying the outer filter.',
        operation: 'SUBQUERY',
        query: normalizeQuery(ast.where.subquery.raw),
        metadata: {
          condition: stringifyWhere(ast.where),
        },
        visual: {
          animation: 'filter',
          type: 'subquery',
        },
      });
    }

    descriptors.push({
      phase: 'EXECUTE',
      title: 'Apply Filters',
      description: 'Filter the joined dataset using the WHERE clause.',
      operation: 'FILTER',
      query: buildQuery(ast, { select: '*', joinCount: ast.joins?.length ?? 0, includeWhere: true }),
      metadata: {
        condition: stringifyWhere(ast.where),
      },
      visual: {
        animation: 'filter',
      },
    });
  }

  if (ast.groupBy) {
    descriptors.push({
      phase: 'EXECUTE',
      title: 'Group Rows',
      description: `Group result rows by ${ast.groupBy.join(', ')}.`,
      operation: 'GROUP',
      query: buildQuery(ast, {
        select: ast.select.map((segment) => segment.alias ? `${segment.column} AS ${segment.alias}` : segment.column).join(', '),
        joinCount: ast.joins?.length ?? 0,
        includeWhere: !!ast.where,
        includeGroupBy: true,
      }),
      visual: {
        animation: 'group',
      },
    });
  }

  if (ast.orderBy) {
    descriptors.push({
      phase: 'EXECUTE',
      title: 'Sort Rows',
      description: 'Order the result set using the ORDER BY clause.',
      operation: 'SORT',
      query: buildQuery(ast, {
        select: ast.groupBy
          ? ast.select.map((segment) => segment.alias ? `${segment.column} AS ${segment.alias}` : segment.column).join(', ')
          : '*',
        joinCount: ast.joins?.length ?? 0,
        includeWhere: !!ast.where,
        includeGroupBy: !!ast.groupBy,
        includeHaving: !!ast.having,
        includeOrderBy: true,
      }),
      visual: {
        animation: 'sort',
      },
    });
  }

  if (ast.limit !== undefined) {
    descriptors.push({
      phase: 'EXECUTE',
      title: 'Apply Limit',
      description: `Restrict the result to the first ${ast.limit} rows.`,
      operation: 'LIMIT',
      query: buildQuery(ast, {
        select: ast.groupBy
          ? ast.select.map((segment) => segment.alias ? `${segment.column} AS ${segment.alias}` : segment.column).join(', ')
          : '*',
        joinCount: ast.joins?.length ?? 0,
        includeWhere: !!ast.where,
        includeGroupBy: !!ast.groupBy,
        includeHaving: !!ast.having,
        includeOrderBy: !!ast.orderBy,
        includeLimit: true,
      }),
    });
  }

  descriptors.push({
    phase: 'RESULT',
    title: 'Return Final Result',
    description: 'Return the same result set shown in the SQL playground.',
    operation: 'RETURN',
    query: normalizedOriginalQuery,
  });

  const dedupedDescriptors = descriptors.filter(
    (descriptor, index, list) =>
      index === 0 ||
      descriptor.query !== list[index - 1].query ||
      descriptor.title !== list[index - 1].title
  );

  const steps: ExecutionStep[] = [];
  let previousRows: any[] = [];

  for (let index = 0; index < dedupedDescriptors.length; index += 1) {
    const step = await descriptorToStep(dedupedDescriptors[index], ast, previousRows, index + 1);
    steps.push(step);

    if (!step.result.success) {
      break;
    }

    previousRows = step.result.rows;
  }

  return steps;
}
