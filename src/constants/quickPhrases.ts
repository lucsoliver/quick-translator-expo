export type PhraseCategory =
  | "Viagem"
  | "Restaurante"
  | "Hotel"
  | "Transporte"
  | "Emergência";

export interface QuickPhrase {
  id: string;
  category: PhraseCategory;
  portuguese: string;
  english: string;
}

export const PHRASE_CATEGORIES: PhraseCategory[] = [
  "Viagem",
  "Restaurante",
  "Hotel",
  "Transporte",
  "Emergência",
];

export const QUICK_PHRASES: QuickPhrase[] = [
  {
    id: "bathroom",
    category: "Viagem",
    portuguese: "Onde fica o banheiro?",
    english: "Where is the bathroom?",
  },
  {
    id: "help",
    category: "Viagem",
    portuguese: "Você pode me ajudar?",
    english: "Can you help me?",
  },
  {
    id: "menu",
    category: "Restaurante",
    portuguese: "Posso ver o cardápio?",
    english: "Can I see the menu?",
  },
  {
    id: "vegetarian",
    category: "Restaurante",
    portuguese: "Tem alguma opção vegetariana?",
    english: "Do you have a vegetarian option?",
  },
  {
    id: "bill",
    category: "Restaurante",
    portuguese: "A conta, por favor.",
    english: "The bill, please.",
  },
  {
    id: "reservation",
    category: "Hotel",
    portuguese: "Tenho uma reserva.",
    english: "I have a reservation.",
  },
  {
    id: "wifi",
    category: "Hotel",
    portuguese: "Qual é a senha do Wi-Fi?",
    english: "What is the Wi-Fi password?",
  },
  {
    id: "checkin",
    category: "Hotel",
    portuguese: "A que horas é o check-in?",
    english: "What time is check-in?",
  },
  {
    id: "station",
    category: "Transporte",
    portuguese: "Onde fica a estação de trem?",
    english: "Where is the train station?",
  },
  {
    id: "airport",
    category: "Transporte",
    portuguese: "Como faço para chegar ao aeroporto?",
    english: "How do I get to the airport?",
  },
  {
    id: "taxi",
    category: "Transporte",
    portuguese: "Pode chamar um táxi, por favor?",
    english: "Could you call a taxi, please?",
  },
  {
    id: "doctor",
    category: "Emergência",
    portuguese: "Preciso de um médico.",
    english: "I need a doctor.",
  },
  {
    id: "police",
    category: "Emergência",
    portuguese: "Chame a polícia, por favor.",
    english: "Please call the police.",
  },
];
