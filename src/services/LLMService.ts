export interface QuestionAnswer {
  question: string;
  answer: string;
}

export interface LLMService {
  /**
   * Fetch the
   * @param topic The topic under discussion
   * @param conversation The conversation history
   * @param document The type of document to generate
   * @returns The next question to ask
   */
  fetchNextQuestion(
    topic: string,
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string>;

  /**
   * Generate a document based on the conversation
   * @param topic The topic under discussion
   * @param conversation The conversation history
   * @param document The type of document to generate
   * @returns The generated document in Markdown format
   */
  generateDocument(
    topic: string,
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string>;
}
