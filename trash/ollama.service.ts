import ollama from "ollama";

interface IChat {
  role: "user" | "assistant";
  content: string;
}

export class OllamaService {
  private static MODEL_NAME = "llama3";

  static async getChatStream(history: IChat[]) {
    try {
      return await ollama.chat({
        model: this.MODEL_NAME,
        messages: history,
        stream: true,
      });
    } catch (error) {
      console.error("Ollama Stream Error:", error);
      throw new Error("Failed to initiate Ollama stream.");
    }
  }
}
