import axios from "axios";

export interface QuestionAnswer {
  question: string;
  answer: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async callOpenAI(
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
    conversation: QuestionAnswer[]
  ): Promise<string> {
    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are an expert journalist interviewing the premiere mind on the topic of ${topic}. Ask probing questions in the style of Nilay Patel to gain as much detail as possible for your article. Keep your questions short and focused and avoid getting rat-holed on a particular topic. Don't be afraid to be combative or jump to interesting tangents..`,
      },
      ...conversation.flatMap((qa) => [
        { role: "assistant" as const, content: qa.question },
        { role: "user" as const, content: qa.answer },
      ]),
      {
        role: "user",
        content: "What is your next question?",
      },
    ];

    const response = await this.callOpenAI(messages, 100);
    return response.trim();
  }

  async generateDocument(
    topic: string,
    conversation: QuestionAnswer[]
  ): Promise<string> {
    const conversationText = conversation
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful assistant that generates formal documentation based on conversations.`,
      },
      {
        role: "user",
        content: `
        Please generate a formal document explaining the topic in markdown format based on the following conversation:

        Topic: ${topic}

        ${conversationText}
      `,
      },
    ];

    return await this.callOpenAI(messages, 1000);
  }
}
