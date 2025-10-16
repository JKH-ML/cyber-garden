export const PROFILE_COLORS = [
  '#FFB5C0', // Pastel Pink
  '#C3AED6', // Pastel Purple
  '#A8D8EA', // Pastel Blue
  '#B8E6D5', // Pastel Mint
  '#FFE4B5', // Pastel Peach
  '#F4C2C2', // Pastel Rose
  '#D4A5A5', // Pastel Mauve
  '#B2E8E8', // Pastel Cyan
];

export const getRandomProfileColor = () => {
  return PROFILE_COLORS[Math.floor(Math.random() * PROFILE_COLORS.length)];
};
