import React from 'react';
import Editor from '@monaco-editor/react';
import { registerCustomThemes } from '../../lib/monaco-themes.ts';

interface CodeEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  language?: string;
  theme?: string;
  fontSize?: number;
  path?: string;
  readOnly?: boolean;
  problemData?: any;
}

const CodeEditor = ({
  value,
  onChange,
  language = 'java',
  theme = 'orange-juice',
  fontSize = 14,
  readOnly = false,
  path,
  problemData
}: CodeEditorProps) => {
  const [editor, setEditor] = React.useState<any>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Normalize the content before rendering the editor
  const normalizedValue = React.useMemo(() => {
    return (value || "").replace(/\u00A0/g, ' ').replace(/\r\n/g, '\n');
  }, [value]);

  // Explicitly call layout() when container size changes
  // This is more reliable than automaticLayout: true in deep flex-tree layouts
  React.useEffect(() => {
    if (!containerRef.current || !editor) return;

    const observer = new ResizeObserver(() => {
      // Small delay to ensure panel transition finished
      requestAnimationFrame(() => {
        editor.layout();
      });
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [editor]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden">
      <Editor
        key={`${language.toLowerCase()}-${theme}`}
        height="100%"
        width="100%"
        path={path}
        language={language.toLowerCase()}
        theme={theme}
        value={normalizedValue}
        onChange={onChange}
        onMount={(e) => setEditor(e)}
        beforeMount={(monaco) => {
          registerCustomThemes(monaco);
        }}
        options={{
          minimap: { enabled: false },
          fontSize: fontSize,
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 20 },
          scrollbar: {
            vertical: 'visible',
            horizontal: 'visible',
            verticalSliderSize: 6,
            horizontalSliderSize: 6,
            useShadows: false,
          },
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          overviewRulerBorder: false,
          readOnly: readOnly,
          bracketPairColorization: { enabled: false },
          guides: { bracketPairs: false, indentation: true },
          unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
          fixedOverflowWidgets: true,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', 'Monaco', 'Courier New', monospace",
          fontLigatures: true,
        }}
      />
    </div>
  );
};
export default React.memo(CodeEditor);
