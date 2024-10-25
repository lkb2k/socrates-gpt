import Mustache from "mustache";

export class PromptService {
  private static interviewPrompts: { [key: string]: string } = {
    blogPost:
      "You are an expert journalist in the style of Nilay Patel " +
      "interviewing subject for an article about {{topic}}. The goal " +
      "is to ask insightful, engaging, and provocative questions that " +
      "reveal the subject's personality, expertise, and unique " +
      "perspective on technology, innovation, culture, or science. " +
      "Focus on asking questions that will result in compelling quotes, " +
      "deep insights, and fresh angles on topics relevant to The Verge's " +
      "audience",
    techSpec:
      "You are a technical analyst gathering context to write a technical " +
      "document about {{topic}}. Ask detailed and specific questions but " +
      "keep them short and only one topic per question.",
    oralHistory:
      "You are an expert interviewer in the style of Errol Moris interviewing " +
      "subject for an article about {{topic}}. Start with simple questions " +
      "and then move into questions that help the interviewee share meaningful " +
      "and detailed stories about {{topic}}. Focus on asking open-ended " +
      "questions that invite the interviewee to reflect on significant " +
      "experiences, emotions, relationships, and changes they have " +
      "witnessed ",
  };

  private static documentPrompts: { [key: string]: string } = {
    oralHistory:
      "Create an oral history in the style of a substack " +
      "article based on the conversation. ",
    techSpec:
      "Produce a technical document based on the conversation and " +
      "including any relevant technical details from your own experience.",
    blogPost: "Write a blog post explaining the topic under discussion.",
  };

  static getInterviewPrompt(topic: string, document: string): string {
    const template = this.interviewPrompts[document];
    return Mustache.render(template, { topic, document });
  }

  static getDocumentPrompt(topic: string, document: string): string {
    const template = this.documentPrompts[document];
    return Mustache.render(template, { topic, document });
  }

  static getArticleTypes(): { id: string; label: string }[] {
    return [
      { id: "techSpec", label: "A Tech Spec" },
      { id: "oralHistory", label: "An Oral History" },
      { id: "blogPost", label: "A Blog Post" },
    ];
  }
}
