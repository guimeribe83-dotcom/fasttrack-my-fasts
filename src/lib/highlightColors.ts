export const HIGHLIGHT_COLORS = {
  yellow: 'bg-yellow-200/15 dark:bg-yellow-500/10 border-l-4 border-yellow-400',
  green: 'bg-green-200/15 dark:bg-green-500/10 border-l-4 border-green-400',
  blue: 'bg-blue-200/15 dark:bg-blue-500/10 border-l-4 border-blue-400',
  pink: 'bg-pink-200/15 dark:bg-pink-500/10 border-l-4 border-pink-400',
  purple: 'bg-purple-200/15 dark:bg-purple-500/10 border-l-4 border-purple-400',
} as const;

export const HIGHLIGHT_COLOR_OPTIONS = [
  { name: 'Amarelo', value: 'yellow', color: 'bg-yellow-400' },
  { name: 'Verde', value: 'green', color: 'bg-green-400' },
  { name: 'Azul', value: 'blue', color: 'bg-blue-400' },
  { name: 'Rosa', value: 'pink', color: 'bg-pink-400' },
  { name: 'Roxo', value: 'purple', color: 'bg-purple-400' },
] as const;

export type HighlightColor = keyof typeof HIGHLIGHT_COLORS;
