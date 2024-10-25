import axios from "axios";
import { LLMService, QuestionAnswer } from "./LLMService";
import { PromptService } from "./PromptService";

export class AnthropicService implements LLMService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async callAnthropic(
    prompt: string,
    maxTokens: number
  ): Promise<string> {
    const response = await axios.post(
      "https://api.anthropic.com/v1/completions",
      {
        prompt: prompt,
        model: "claude-v1",
        max_tokens_to_sample: maxTokens,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.completion;
  }

  async fetchNextQuestion(
    topic: string,
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string> {
    const questionPrompt = PromptService.getInterviewPrompt(topic, document);
    const conversationText = conversation
      .map((qa) => `Human: ${qa.question}\nAssistant: ${qa.answer}`)
      .join("\n\n");

    const prompt = `${questionPrompt}\n\nConversation so far:\n${conversationText}\n\nHuman: What is your next question?\n\nAssistant:`;

    return await this.callAnthropic(prompt, 100);
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

    const prompt = `${documentPrompt}\n\nUse the following conversation as a guide and return the document in markdown format:\n${conversationText}\n\nAssistant:`;

    return await this.callAnthropic(prompt, 1000);
  }
}
