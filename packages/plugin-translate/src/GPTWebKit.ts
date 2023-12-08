import OpenAI, { ClientOptions } from 'openai';

export class GPTWebKit {
  #model: string;

  #openai: OpenAI;

  constructor(config: ClientOptions, model: string) {
    this.#openai = new OpenAI({
      ...config,
    });
    this.#model = model;
  }

  async chat(prompt: string) {
    const response = await this.#openai.chat.completions.create({
      model: this.#model,
      messages: [{ role: 'user', content: prompt }],
    });
    return response?.choices?.[0]?.message?.content ?? '';
  }
}
