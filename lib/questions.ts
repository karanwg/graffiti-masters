import { Question } from './types';

// 20 General Trivia Questions
// Easy to update: just add/remove/modify objects in this array
export const QUESTIONS: Question[] = [
  {
    id: 1,
    question: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctIndex: 2,
  },
  {
    id: 2,
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctIndex: 1,
  },
  {
    id: 3,
    question: "Who painted the Mona Lisa?",
    options: ["Van Gogh", "Picasso", "Da Vinci", "Michelangelo"],
    correctIndex: 2,
  },
  {
    id: 4,
    question: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    correctIndex: 3,
  },
  {
    id: 5,
    question: "How many continents are there?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
  },
  {
    id: 6,
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2,
  },
  {
    id: 7,
    question: "Which animal is the largest mammal?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Hippopotamus"],
    correctIndex: 1,
  },
  {
    id: 8,
    question: "What year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    correctIndex: 2,
  },
  {
    id: 9,
    question: "What is the hardest natural substance?",
    options: ["Gold", "Iron", "Diamond", "Platinum"],
    correctIndex: 2,
  },
  {
    id: 10,
    question: "Who wrote 'Romeo and Juliet'?",
    options: ["Dickens", "Shakespeare", "Austen", "Hemingway"],
    correctIndex: 1,
  },
  {
    id: 11,
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correctIndex: 1,
  },
  {
    id: 12,
    question: "How many legs does a spider have?",
    options: ["6", "8", "10", "12"],
    correctIndex: 1,
  },
  {
    id: 13,
    question: "What is the main ingredient in guacamole?",
    options: ["Tomato", "Avocado", "Onion", "Pepper"],
    correctIndex: 1,
  },
  {
    id: 14,
    question: "Which element has the chemical symbol 'O'?",
    options: ["Osmium", "Oxygen", "Oganesson", "Gold"],
    correctIndex: 1,
  },
  {
    id: 15,
    question: "What is the fastest land animal?",
    options: ["Lion", "Cheetah", "Horse", "Greyhound"],
    correctIndex: 1,
  },
  {
    id: 16,
    question: "In which city is the Eiffel Tower located?",
    options: ["Rome", "London", "Paris", "Berlin"],
    correctIndex: 2,
  },
  {
    id: 17,
    question: "What gas do plants absorb from the atmosphere?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    correctIndex: 2,
  },
  {
    id: 18,
    question: "How many colors are in a rainbow?",
    options: ["5", "6", "7", "8"],
    correctIndex: 2,
  },
  {
    id: 19,
    question: "What is the largest planet in our solar system?",
    options: ["Saturn", "Neptune", "Jupiter", "Uranus"],
    correctIndex: 2,
  },
  {
    id: 20,
    question: "Which country gifted the Statue of Liberty to the USA?",
    options: ["England", "France", "Germany", "Spain"],
    correctIndex: 1,
  },
];

// Utility to get shuffled questions for a game
export function getShuffledQuestions(): Question[] {
  const shuffled = [...QUESTIONS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
