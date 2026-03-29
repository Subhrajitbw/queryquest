import { QueryAST, ExecutionStep } from './executionEngine';

export interface StepExplanation {
  what: string;
  why: string;
  analogy?: string;
  tip?: string;
}

export function generateExplanation(step: any, ast: QueryAST): StepExplanation {
  const operation = step.operation;
  const metadata = step.metadata || {};

  switch (operation) {
    case "TABLE_SCAN":
      return {
        what: `Reading all rows from table '${metadata.table || ast.from}'`,
        why: "The database needs to access data before filtering or joining",
        analogy: "Like opening a book and scanning all pages",
        tip: "If this table is large, consider adding an index."
      };

    case "INDEX_SCAN":
      return {
        what: `Using an index on '${step.executionContext?.indexColumn || metadata.table || ast.from}' to narrow the search`,
        why: "The database can avoid a full scan when the filter targets an indexed lookup path",
        analogy: "Like jumping to a chapter using the index instead of reading the whole book",
        tip: "Equality checks on id-like columns are common candidates for index access."
      };

    case "JOIN": {
      const leftTable = step.visual?.leftTable || ast.from;
      const rightTable = step.visual?.rightTable || "joined table";
      const joinKeys = step.visual?.matchingKeys?.join(' = ') || "matching columns";
      return {
        what: `Matching rows between ${leftTable} and ${rightTable} using ${joinKeys}`,
        why: "Data is split across tables and needs to be combined",
        analogy: "Like matching students with their marks using roll number"
      };
    }

    case "FILTER": {
      const condition = metadata.condition || "the specified criteria";
      return {
        what: `Filtering rows where ${condition}`,
        why: "Only relevant rows should be included",
        analogy: "Like filtering contacts by location"
      };
    }

    case "SORT": {
      const column = ast.orderBy?.[0]?.column || "the specified column";
      const direction = ast.orderBy?.[0]?.direction === 'DESC' ? "descending" : "ascending";
      return {
        what: `Sorting rows by ${column} in ${direction} order`,
        why: "To display results in a meaningful order",
        analogy: "Like sorting products by price"
      };
    }

    case "GROUP": {
      const column = ast.groupBy?.join(', ') || "the specified column";
      return {
        what: `Grouping rows based on column '${column}'`,
        why: "To perform calculations on each group"
      };
    }

    case "AGGREGATE": {
      const functions = ast.select
        .filter(s => /COUNT|SUM|AVG|MIN|MAX/i.test(s.column))
        .map(s => s.column.split('(')[0].toUpperCase())
        .join(' or ') || "summary values";
      return {
        what: `Calculating ${functions} for each group`,
        why: "To summarize grouped data"
      };
    }

    case "LIMIT":
      return {
        what: `Returning only first ${ast.limit} rows`,
        why: "To reduce output size"
      };

    case "PROJECT": {
      const columns = ast.select.map(s => s.column).join(', ');
      return {
        what: `Selecting specific columns: ${columns}`,
        why: "Only required data should be returned"
      };
    }

    case "SUBQUERY":
      return {
        what: "Executing a nested query first",
        why: "Its result is needed for the main query",
        analogy: "Like solving a smaller problem first"
      };

    case "TRANSACTION":
      return {
        what: "Executing query inside a transaction",
        why: "Ensures data consistency and safety"
      };

    default:
      return {
        what: step.title || "Processing query step",
        why: step.description || "Required step in the execution plan"
      };
  }
}
