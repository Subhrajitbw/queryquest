export interface QueryAnalysis {
  hasJoin: boolean;
  hasWhere: boolean;
  hasAggregation: boolean;
  hasGroupBy: boolean;
  hasOrderBy: boolean;
  hasTransaction: boolean;
  hasIndexUsage: boolean;
  isWriteOperation: boolean;
  possibleInjectionRisk: boolean;
}

const ANALYSIS_CACHE = new Map<string, QueryAnalysis>();

function normalizeQuery(query: string) {
  return query.trim().replace(/\s+/g, ' ');
}

function hasPattern(query: string, pattern: RegExp) {
  pattern.lastIndex = 0;
  return pattern.test(query);
}

export function analyzeQuery(query: string): QueryAnalysis {
  const normalized = normalizeQuery(query);
  const cacheKey = normalized.toUpperCase();
  const cached = ANALYSIS_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const upperQuery = normalized.toUpperCase();

  const hasWhere = hasPattern(upperQuery, /\bWHERE\b/);
  const hasOrderBy = hasPattern(upperQuery, /\bORDER\s+BY\b/);
  const hasGroupBy = hasPattern(upperQuery, /\bGROUP\s+BY\b/);
  const hasAggregation = hasPattern(
    upperQuery,
    /\b(COUNT|SUM|AVG|MIN|MAX)\s*\(|\bHAVING\b/
  );
  const hasTransaction = hasPattern(
    upperQuery,
    /\b(BEGIN|START\s+TRANSACTION|COMMIT|ROLLBACK|SAVEPOINT)\b/
  );
  const isWriteOperation = hasPattern(
    upperQuery,
    /^\s*(INSERT|UPDATE|DELETE|UPSERT|MERGE|REPLACE)\b/
  );
  const hasJoin = hasPattern(
    upperQuery,
    /\b(INNER|LEFT|RIGHT|FULL|CROSS)?\s*JOIN\b/
  );

  const indexedLookup = hasPattern(
    upperQuery,
    /\bWHERE\s+[\w.]+(?:_ID|ID)\s*(=|IN)\s*[\w('"-]/
  );
  const indexedOrdering = hasPattern(upperQuery, /\bORDER\s+BY\s+[\w.]+(?:_ID|ID)\b/);
  const explicitIndexHint = hasPattern(upperQuery, /\bINDEX\b|\bUSING\s+INDEX\b/);
  const hasIndexUsage = indexedLookup || indexedOrdering || explicitIndexHint;

  const possibleInjectionRisk = [
    /\bOR\b\s+['"]?1['"]?\s*=\s*['"]?1['"]?/i,
    /--/i,
    /\/\*/i,
    /\bUNION\b\s+\bSELECT\b/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT)\b/i,
    /'\s+OR\s+/i,
    /"\s+OR\s+/i,
  ].some((pattern) => hasPattern(normalized, pattern));

  const analysis = {
    hasJoin,
    hasWhere,
    hasAggregation,
    hasGroupBy,
    hasOrderBy,
    hasTransaction,
    hasIndexUsage,
    isWriteOperation,
    possibleInjectionRisk,
  };

  ANALYSIS_CACHE.set(cacheKey, analysis);
  return analysis;
}
