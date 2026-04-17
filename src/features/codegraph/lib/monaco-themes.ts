let themesRegistered = false;

export const registerCustomThemes = (monaco: any) => {
  if (themesRegistered) return;
  
  // 1. Orange Juice (The Hero Theme)
  monaco.editor.defineTheme('orange-juice', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'F97316', fontStyle: 'bold' },
      { token: 'keyword.control', foreground: 'F97316', fontStyle: 'bold' },
      { token: 'keyword.operator', foreground: 'FB923C', fontStyle: 'bold' },
      { token: 'storage', foreground: 'FDBA74' },
      { token: 'storage.type', foreground: 'FDBA74' },
      { token: 'storage.modifier', foreground: 'FDBA74' },
      { token: 'type', foreground: 'FDBA74' },
      { token: 'class', foreground: 'FDBA74' },
      { token: 'struct', foreground: 'FDBA74' },
      { token: 'interface', foreground: 'FDBA74' },
      { token: 'enum', foreground: 'FDBA74' },
      { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      { token: 'string', foreground: 'FFEDD5' },
      { token: 'number', foreground: 'F97316' },
      { token: 'identifier', foreground: 'E2E8F0' },
      { token: 'function', foreground: 'FB923C' },
      { token: 'method', foreground: 'FB923C' },
      { token: 'variable', foreground: 'E2E8F0' },
      { token: 'constant', foreground: 'F97316' },
      { token: 'delimiter', foreground: 'F97316' },
      { token: 'bracket', foreground: 'F97316' },
    ],
    colors: {
      'editor.background': '#0A0A0A',
      'editor.foreground': '#E2E8F0',
      'editorCursor.foreground': '#F97316',
      'editor.lineHighlightBackground': '#18181B',
      'editorLineNumber.foreground': '#3F3F46',
      'editorLineNumber.activeForeground': '#F97316',
      'editorIndentGuide.background': '#18181B',
      'editorIndentGuide.activeBackground': '#27272A',
      'editor.selectionBackground': '#F9731633',
      'editor.inactiveSelectionBackground': '#F9731611',
    }
  });

  // 2. Monokai (The Classic)
  monaco.editor.defineTheme('monokai', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'F92672' },
      { token: 'comment', foreground: '75715E' },
      { token: 'string', foreground: 'E6DB74' },
      { token: 'type', foreground: '66D9EF' },
      { token: 'number', foreground: 'AE81FF' },
      { token: 'function', foreground: 'A6E22E' },
    ],
    colors: {
      'editor.background': '#272822',
      'editor.foreground': '#F8F8F2',
      'editorCursor.foreground': '#F8F8F0',
      'editor.lineHighlightBackground': '#3E3D32',
      'editorLineNumber.foreground': '#90908A',
      'editorLineNumber.activeForeground': '#C2C2BF',
    }
  });

  // 3. Night Owl (The Modern Dark)
  monaco.editor.defineTheme('night-owl', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'C792EA' },
      { token: 'comment', foreground: '637777', fontStyle: 'italic' },
      { token: 'string', foreground: 'ECC48D' },
      { token: 'type', foreground: '82AAFF' },
      { token: 'number', foreground: 'F78C6C' },
      { token: 'function', foreground: '82AAFF' },
      { token: 'variable', foreground: 'D6DEEB' },
    ],
    colors: {
      'editor.background': '#011627',
      'editor.foreground': '#D6DEEB',
      'editorCursor.foreground': '#80A4C2',
      'editor.lineHighlightBackground': '#00000059',
      'editorLineNumber.foreground': '#4B6479',
      'editorLineNumber.activeForeground': '#C5E4FD',
      'editor.selectionBackground': '#1C3448',
    }
  });

  // 4. Light Clean (The Bright Side)
  monaco.editor.defineTheme('light-clean', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '005CC5' },
      { token: 'comment', foreground: '6A737D' },
      { token: 'string', foreground: '032F62' },
      { token: 'variable', foreground: '24292E' },
      { token: 'function', foreground: '6F42C1' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#24292E',
      'editorCursor.foreground': '#24292E',
      'editor.lineHighlightBackground': '#FAFBFC',
      'editorLineNumber.foreground': '#D1D5DA',
      'editorLineNumber.activeForeground': '#24292E',
    }
  });

  themesRegistered = true;
};

export const THEME_OPTIONS = [
  { id: 'vs-dark', label: 'Dark Mode', color: '#1E1E1E' },
  { id: 'orange-juice', label: 'Orange Juice', color: '#F97316' },
  { id: 'monokai', label: 'Monokai', color: '#A6E22E' },
  { id: 'night-owl', label: 'Night Owl', color: '#82AAFF' },
  { id: 'light-clean', label: 'Light Clean', color: '#FFFFFF' }
];
