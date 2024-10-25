<template>
  <div class="min-h-screen bg-almond">
    <div class="absolute top-0 right-0 flex items-center gap-4 m-4">
      <!-- Existing buttons -->
      <div v-if="!started">
        <a
          @click.prevent="clearApiKey"
          href="#"
          class="flex items-center text-yellow-600 hover:text-yellow-700"
        >
          <font-awesome-icon :icon="['far', 'circle-xmark']" class="mr-2" />
          Clear API Key
        </a>
      </div>
      <div v-if="started">
        <a
          @click.prevent="startOver"
          href="#"
          class="flex items-center text-yellow-600 hover:text-yellow-700"
        >
          Start Over
        </a>
      </div>
    </div>

    <div class="container mx-auto p-4 h-screen flex flex-col">
      <h1 class="text-3xl font-bold mb-4 text-center text-gunmetal">
        The Socratic LLM
      </h1>
      <div class="flex-grow">
        <!-- API Key Modal -->
        <ApiKeyModal v-if="showApiKeyModal" @save="saveApiKey" />

        <!-- Topic Input -->
        <div v-if="!started" class="mb-4">
          <div class="relative">
            <textarea
              v-model="topic"
              @keydown.enter.exact="startInterview"
              @keydown.shift.enter.stop
              placeholder="Topic you'd like to discuss..."
              class="w-full p-4 border rounded-lg focus:outline-none focus:ring bg-white text-black"
              rows="3"
            ></textarea>
            <button
              v-if="voiceMode"
              @click="toggleTopicVoiceInput"
              class="absolute bottom-2 right-2 p-2 rounded-full hover:bg-gray-100"
              :class="{ 'text-red-500': isRecordingTopic }"
            >
              <font-awesome-icon :icon="['fas', 'microphone']" />
            </button>
          </div>
          <div class="flex justify-between">
            <!-- Voice Mode Toggle -->
            <div class="flex items-center ml-2">
              <label
                for="voice-mode-toggle"
                class="relative inline-flex items-center cursor-pointer"
              >
                <input
                  id="voice-mode-toggle"
                  type="checkbox"
                  v-model="voiceMode"
                  class="sr-only peer"
                  @change="handleVoiceModeToggle"
                />
                <!--suppress HtmlUnknownTag -->
                <div
                  class="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-yellow-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-600"
                ></div>
                <span class="ml-3 text-sm font-medium text-gunmetal"
                  >Voice Mode</span
                >
              </label>
            </div>
            <div class="flex items-center">
              <div>
                <label for="articleType">What are you writing? </label>
                <select
                  id="article-type"
                  v-model="articleType"
                  class="mt-2 p-2 border rounded"
                >
                  <option
                    v-for="type in articleTypes"
                    :key="type.id"
                    :value="type.id"
                  >
                    {{ type.label }}
                  </option>
                </select>
              </div>
            </div>
            <button
              @click="startInterview"
              class="mt-2 px-4 py-2 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white"
            >
              Start Interview
            </button>
          </div>
        </div>

        <!-- Conversation -->
        <ConversationHistory
          ref="conversationHistory"
          v-if="started && !finished"
          :conversation="conversation"
          :currentQuestion="currentQuestion"
          :isLoading="isLoading"
          :voiceMode="voiceMode"
          @submitAnswer="submitAnswer"
          @getAlternativeQuestion="getAlternativeQuestion"
          @finishInterview="finishInterview"
        />

        <!-- Article Display -->
        <ArticleDisplay
          v-if="finished"
          :articleMarkdown="articleMarkdown"
          @startOver="startOver"
          @returnToConversation="returnToConversation"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import ApiKeyModal from "./components/ApiKeyModal.vue";
import ConversationHistory from "./components/ConversationHistory.vue";
import ArticleDisplay from "./components/ArticleDisplay.vue";
import { OpenAIService } from "./services/OpenAIService";
import { PromptService } from "./services/PromptService";
import { LocalStorageService } from "./services/LocalStorageService";
import { VoiceService } from "./services/VoiceService";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleLeft,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleXmark, faCircleLeft, faMicrophone);

export default defineComponent({
  components: {
    FontAwesomeIcon,
    ApiKeyModal,
    ConversationHistory,
    ArticleDisplay,
  },
  data() {
    return {
      apiKey: "",
      showApiKeyModal: false,
      topic: "",
      started: false,
      finished: false,
      conversation: [] as Array<{ question: string; answer: string }>,
      currentQuestion: "",
      articleMarkdown: "",
      llmService: null as OpenAIService | null,
      articleType: "techSpec",
      articleTypes: PromptService.getArticleTypes(),
      voiceMode: false,
      isRecordingTopic: false,
      localStorage: new LocalStorageService(),
      voiceService: new VoiceService(),
      isLoading: false,
    };
  },
  watch: {
    voiceMode(newVal: boolean) {
      if (newVal && !this.started) {
        this.$nextTick(() => {
          this.toggleTopicVoiceInput();
        });
      }
    },
  },
  created() {
    this.apiKey = this.localStorage.getItem("apiKey") || "";

    if (!this.apiKey) {
      this.showApiKeyModal = true;
    } else {
      this.llmService = new OpenAIService(this.apiKey);
    }

    // Set up voice service
    this.voiceService.setOnResult((transcript: string) => {
      if (this.isRecordingTopic) {
        this.topic = transcript;
      }
    });

    this.voiceService.setOnEnd(() => {
      this.isRecordingTopic = false;
    });
  },
  methods: {
    handleVoiceModeToggle() {
      if (this.voiceMode && !this.voiceService.isSupported()) {
        alert("Speech recognition is not supported in your browser.");
        this.voiceMode = false;
      }
    },
    toggleTopicVoiceInput() {
      if (this.isRecordingTopic) {
        this.voiceService.stop();
        this.isRecordingTopic = false;
      } else {
        this.voiceService.start();
        this.isRecordingTopic = true;
      }
    },
    saveApiKey(key: string) {
      this.apiKey = key;
      this.localStorage.setItem("apiKey", key);
      this.llmService = new OpenAIService(this.apiKey);
      this.showApiKeyModal = false;
    },
    async startInterview() {
      if (!this.topic.trim()) return;
      this.started = true;
      await this.fetchNextQuestion();
    },
    async fetchNextQuestion() {
      if (!this.llmService) return;
      this.isLoading = true;
      this.currentQuestion = "Loading ...";
      try {
        this.currentQuestion = await this.llmService.fetchNextQuestion(
          this.topic,
          this.conversation,
          this.articleType
        );
        (
          this.$refs.conversationHistory as InstanceType<
            typeof ConversationHistory
          >
        )?.focus();
      } catch (error) {
        console.error(error);
        alert("Error fetching the next question.");
      } finally {
        this.isLoading = false;
      }
    },
    async getAlternativeQuestion() {
      if (!this.llmService) return;
      this.isLoading = true;
      try {
        const replacementPrompt = [
          ...this.conversation,
          {
            question: this.currentQuestion,
            answer:
              "This question was discarded, try a new question in a different direction",
          },
        ];

        this.currentQuestion = "Loading new question...";
        this.currentQuestion = await this.llmService.fetchNextQuestion(
          this.topic,
          replacementPrompt,
          this.articleType
        );
        (
          this.$refs.conversationHistory as InstanceType<
            typeof ConversationHistory
          >
        )?.focus();
      } catch (error) {
        console.error(error);
        alert("Error fetching the alternative question.");
      } finally {
        this.isLoading = false;
      }
    },
    async submitAnswer(answer: string) {
      this.conversation.push({
        question: this.currentQuestion,
        answer: answer,
      });
      await this.fetchNextQuestion();
    },
    async finishInterview() {
      if (!this.llmService) return;
      this.finished = true;
      try {
        this.articleMarkdown = "Generating article...";
        this.articleMarkdown = await this.llmService.generateDocument(
          this.topic,
          this.conversation,
          this.articleType
        );
      } catch (error) {
        console.error(error);
        alert("Error generating the article.");
      }
    },
    startOver() {
      this.started = false;
      this.finished = false;
      this.topic = "";
      this.conversation = [];
      this.currentQuestion = "";
      this.articleMarkdown = "";
    },
    clearApiKey() {
      this.localStorage.removeItem("apiKey");
      this.apiKey = "";
      this.llmService = null;
      this.showApiKeyModal = true;
    },
    returnToConversation() {
      this.finished = false;
    },
  },
});
</script>
