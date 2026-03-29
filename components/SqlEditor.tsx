'use client';

import { useRef, useEffect } from 'react';

interface SqlEditorProps {
  value: string;
  onChange: (val: string) => void;
  onRun: () => void;
}

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 
  'DELETE', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'FOREIGN', 'REFERENCES', 
  'ORDER', 'BY', 'LIMIT', 'LIKE', 'GROUP', 'HAVING', 'COUNT', 'SUM', 'AS', 
  'JOIN', 'ON', 'INNER', 'LEFT', 'RIGHT', 'OUTER', 'AND', 'OR', 'NOT', 'NULL', 
  'IS', 'INTEGER', 'TEXT', 'REAL', 'DESC', 'ASC'
];

export default function SqlEditor({ value, onChange, onRun }: SqlEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split('\n').length;
  const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

  const handleScroll = () => {
    if (textareaRef.current) {
      if (preRef.current) {
        preRef.current.scrollTop = textareaRef.current.scrollTop;
        preRef.current.scrollLeft = textareaRef.current.scrollLeft;
      }
      if (linesRef.current) {
        linesRef.current.style.transform = `translateY(-${textareaRef.current.scrollTop}px)`;
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onRun();
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const currentLine = value.substring(0, start).split('\n').pop() || '';
      const match = currentLine.match(/^\s*/);
      const indent = match ? match[0] : '';
      
      const newValue = value.substring(0, start) + '\n' + indent + value.substring(end);
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 1 + indent.length;
        }
      }, 0);
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const highlightSql = (text: string) => {
    // 1. Escape HTML first to prevent injection and handle special characters
    let html = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // 2. Use a single-pass approach to avoid matching inside previously inserted tags
    // We define all patterns and match them in one go
    const stringPattern = "'[^']*'";
    const commentPattern = "--.*";
    const numberPattern = "\\b\\d+(\\.\\d+)?\\b";
    const keywordPattern = `\\b(${SQL_KEYWORDS.join('|')})\\b`;

    const combinedRegex = new RegExp(
      `(${stringPattern})|(${commentPattern})|(${numberPattern})|(${keywordPattern})`,
      'gi'
    );

    return html.replace(combinedRegex, (match) => {
      if (match.startsWith("'")) {
        return `<span class="text-green-400">${match}</span>`;
      }
      if (match.startsWith("--")) {
        return `<span class="text-gray-500 italic">${match}</span>`;
      }
      if (/^\d/.test(match)) {
        return `<span class="text-orange-400">${match}</span>`;
      }
      // Must be a keyword
      return `<span class="text-blue-400 font-bold">${match}</span>`;
    });
  };

  return (
    <div className="relative flex h-full w-full overflow-hidden bg-[#0a0f1c] font-mono text-sm">
      {/* Line Numbers */}
      <div 
        ref={linesRef}
        className="flex w-12 shrink-0 flex-col items-end overflow-hidden border-r border-white/10 bg-white/5 py-4 pr-3 text-gray-500 select-none"
      >
        {lines.map(line => (
          <div key={line} className="h-5 leading-5">{line}</div>
        ))}
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Syntax Highlighted Overlay */}
        <pre
          ref={preRef}
          className="pointer-events-none absolute inset-0 m-0 overflow-hidden whitespace-pre-wrap break-words p-4 text-gray-300"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightSql(value) + '<br/>' }}
          style={{ lineHeight: '1.25rem', font: 'inherit' }}
        />
        
        {/* Actual Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="absolute inset-0 m-0 h-full w-full resize-none whitespace-pre-wrap break-words bg-transparent p-4 caret-white focus:outline-none"
          style={{ 
            lineHeight: '1.25rem', 
            color: 'transparent', 
            WebkitTextFillColor: 'transparent',
            font: 'inherit'
          }}
        />
      </div>
    </div>
  );
}
