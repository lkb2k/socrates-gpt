import axios from "axios";

export interface QuestionAnswer {
  question: string;
  answer: string;
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface InterviewStyle {
  id: string;
  label: string;
}

export class OpenAIService {
  private apiKey: string;

  private interviewPrompts: { [key: string]: string } = {
    podcast: `You are an expert journalist interviewing the premiere mind on the topic of {{topic}}. Ask probing questions in the style of Nilay Patel to gain as much detail as possible for your article.  Don't be afraid to be combative or jump to interesting tangents.`,
    technical: `You are a technical analyst gathering context to write about {{topic}}. Ask detailed and specific questions but keep them short and only one topic per question.`,
    friend: `You are a friend having a casual conversation on the topic of {{topic}}.  You are very sympathetic and interested in the details.`,
  };

  private documentPrompts: { [key: string]: string } = {
    podcast:
      "Create a document in the style of a substack article based on the conversation. Include your opinions of the topic and any relevant details from your own experience.",
    technical:
      "Produce a technical document based on the conversation and including any relevant technical details from your own experience.",
    friend: "Write a letter to your friend expressing your thoughts",
  };

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  getInterviewStyles(): InterviewStyle[] {
    return [
      { id: "podcast", label: "Journalist" },
      { id: "technical", label: "Technical Analyst" },
      { id: "friend", label: "Nosy Friend" },
    ];
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
    conversation: QuestionAnswer[],
    interviewStyle: string
  ): Promise<string> {
    const promptTemplate =
      this.interviewPrompts[interviewStyle] || this.interviewPrompts.journalist;
    const prompt = promptTemplate.replace("{{topic}}", topic);

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: prompt,
      },
      {
        role: "system",
        content:
          "Keep your questions short and focused and avoid getting rat-holed on a particular topic.",
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

    return await this.callOpenAI(messages, 100);
  }

  async generateDocument(
    topic: string,
    conversation: QuestionAnswer[],
    interviewStyle: string
  ): Promise<string> {
    const documentInstruction =
      this.documentPrompts[interviewStyle] || this.documentPrompts.journalist;

    const conversationText = conversation
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: `You are a helpful assistant that uses the style to ${documentInstruction}.`,
      },
      {
        role: "user",
        content: `
        Please ${documentInstruction} explaining the topic in markdown format based on the following conversation:

        Topic: ${topic}

        ${conversationText}
      `,
      },
    ];

    return await this.callOpenAI(messages, 1000);
  }
}
