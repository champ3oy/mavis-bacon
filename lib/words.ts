const WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "I",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see", "other",
  "than", "then", "now", "look", "only", "come", "its", "over", "think", "also",
  "back", "after", "use", "two", "how", "our", "work", "first", "well", "way",
  "even", "new", "want", "because", "any", "these", "give", "day", "most", "us",
  "great", "old", "find", "here", "thing", "many", "right", "still", "big", "long",
  "same", "own", "part", "head", "need", "run", "show", "try", "ask", "men",
  "world", "house", "too", "four", "hand", "high", "keep", "last", "let", "life",
  "end", "own", "water", "those", "fish", "since", "sea", "hear", "top", "song",
  "low", "hours", "move", "turn", "play", "next", "close", "night", "real", "put",
  "open", "much", "both", "own", "seem", "start", "never", "under", "read", "few",
  "while", "small", "set", "left", "far", "line", "name", "home", "must", "help",
  "call", "stop", "man", "may", "door", "side", "point", "place", "hard", "light",
  "each", "city", "tree", "cross", "farm", "story", "face", "food", "group", "air",
  "boy", "girl", "once", "book", "car", "state", "more", "down", "should", "been",
];

export function generateWords(count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return result;
}
