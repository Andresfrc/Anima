export const CLINICAL_ROUTES = {
  renacer: {
    id: "renacer",
    name: "Renacer",
    color: "#4ADE80",
    description: "Activación conductual para depresión leve o apatía.",
  },
  autocompasion: {
    id: "autocompasion",
    name: "Autocompasión",
    color: "#F472B6",
    description: "Herramientas de autocompasión contra el rechazo y la culpa.",
  },
  balance: {
    id: "balance",
    name: "Balance",
    color: "#60A5FA",
    description: "Prevención de burnout y estrés crónico.",
  },
  descubrimiento: {
    id: "descubrimiento",
    name: "Descubrimiento",
    color: "#FBBF24",
    description: "Tolerancia a la incertidumbre y ansiedad anticipatoria.",
  },
  soledad: {
    id: "soledad",
    name: "Soledad",
    color: "#A78BFA",
    description: "Reestructuración y reconexión social para el aislamiento.",
  },
} as const;

export const CLINICAL_ACTIVITIES = [
  { id: '1', title: 'Respiración Guiada', route: 'all', duration: '5 min' },
  { id: '2', title: 'Diario Estelar', route: 'all', duration: '10 min' },
  { id: '3', title: 'Relajación Progresiva', route: 'all', duration: '8 min' },
  { id: '4', title: 'Conexión 5 Sentidos', route: 'all', duration: '5 min' },
  { id: '5', title: 'Cápsula de Papel', route: 'all', duration: 'Libre' },
  { id: '6', title: 'Pomodoro de Paz', route: 'balance', duration: '25 min' },
  { id: '7', title: 'Diario Ciego', route: 'descubrimiento', duration: 'Libre' },
  { id: '8', title: 'Astillero de Victorias', route: 'renacer', duration: 'Libre' },
  { id: '9', title: 'Abrazo de Mariposa', route: 'autocompasion', duration: 'Libre' },
  { id: '10', title: 'Mensaje en una Botella', route: 'soledad', duration: 'Libre' },
] as const;
