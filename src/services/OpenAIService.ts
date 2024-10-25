import axios from "axios";
import { LLMService, QuestionAnswer } from "./LLMService";
import { PromptService } from "./PromptService";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIService implements LLMService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callOpenAI(
    messages: ChatMessage[],
    maxTokens: number
  ): Promise<string> {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4",
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  }

  async fetchNextQuestion(
    topic: string,
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string> {
    const questionPrompt = PromptService.getInterviewPrompt(topic, document);

    const messages: ChatMessage[] = [
      { role: "system", content: questionPrompt },
      {
        role: "system",
        content:
          "Keep your questions short and focused and avoid getting rat-holed on a particular topic.",
      },
      ...conversation.flatMap((qa) => [
        { role: "assistant" as const, content: qa.question },
        { role: "user" as const, content: qa.answer },
      ]),
      { role: "user", content: "What is your next question?" },
    ];

    return await this.callOpenAI(messages, 100);
  }

  async generateDocument(
    topic: string,
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string> {
    const documentPrompt = PromptService.getDocumentPrompt(topic, document);

    const conversationText = conversation
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    const messages: ChatMessage[] = [
      { role: "user", content: documentPrompt },
      {
        role: "user",
        content: `Use the following conversation as a guide and return the document in markdown format\n${conversationText}`,
      },
    ];

    return await this.callOpenAI(messages, 2500);
  }
}
