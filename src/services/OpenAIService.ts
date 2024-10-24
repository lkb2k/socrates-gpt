import axios from "axios";
import Mustache from "mustache";

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

  static getArticleTypes(): { id: string; label: string }[] {
    return [
      { id: "oralHistory", label: "Oral History" },
      { id: "blogPost", label: "Blog Post" },
      { id: "techSpec", label: "Technical Specification" },
    ];
  }

  private interviewPrompts: { [key: string]: string } = {
    blogPost: `You are an expert journalist in the style of Nilay Patel interviewing subject for an article about {{topic}}. The goal is to ask insightful, engaging, and provocative questions that reveal the subject’s personality, expertise, and unique perspective on technology, innovation, culture, or science. Focus on asking questions that will result in compelling quotes, deep insights, and fresh angles on topics relevant to The Verge’s audience`,
    techSpec: `You are a technical analyst gathering context to write a technical document about {{topic}}. Ask detailed and specific questions but keep them short and only one topic per question.`,
    oralHistory: `You are an expert interviewer in the style of Errol Moris interviewing subject for an article about {{topic}}. Start with simple questions and then move into questions that help the interviewee share meaningful and detailed stories about {{topic}}. Focus on asking open-ended questions that invite the interviewee to reflect on significant experiences, emotions, relationships, and changes they have witnessed `,
  };

  private documentPrompts: { [key: string]: string } = {
    oralHistory:
      "Create an oral history in the style of a substack article based on the conversation. ",
    techSpec:
      "Produce a technical document based on the conversation and including any relevant technical details from your own experience.",
    blogPost: "Write a blog post explaining the topic under discussion.",
  };

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
    conversation: QuestionAnswer[],
    document: string
  ): Promise<string> {
    const questionTemplate = this.interviewPrompts[document];
    const questionPrompt = Mustache.render(questionTemplate, {
      topic,
      document,
    });

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: questionPrompt,
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
    document: string
  ): Promise<string> {
    const documentTemplate = this.documentPrompts[document];
    const documentPrompt = Mustache.render(documentTemplate, {
      topic,
      document,
    });

    const conversationText = conversation
      .map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`)
      .join("\n\n");

    const messages: ChatMessage[] = [
      {
        role: "user",
        content: documentPrompt,
      },
      {
        role: "user",
        content: `
        Use the following conversation as a guide and return the document in markdown format
        ${conversationText}
      `,
      },
    ];

    return await this.callOpenAI(messages, 1000);
  }
}
