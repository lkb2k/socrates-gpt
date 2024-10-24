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
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  v-model="voiceMode"
                  class="sr-only peer"
                  @change="handleVoiceModeToggle"
                />
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

<script>
/* global webkitSpeechRecognition */
import ApiKeyModal from "./components/ApiKeyModal.vue";
import ConversationHistory from "./components/ConversationHistory.vue";
import ArticleDisplay from "./components/ArticleDisplay.vue";
import { OpenAIService } from "./services/OpenAIService";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleLeft,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleXmark, faCircleLeft, faMicrophone);

export default {
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
      conversation: [],
      currentQuestion: "",
      articleMarkdown: "",
      openAIService: null,
      articleType: "techSpec",
      articleTypes: [],
      voiceMode: false,
      recognition: null,
      isRecordingTopic: false,
    };
  },
  watch: {
    voiceMode(newVal) {
      if (newVal && !this.started) {
        this.$nextTick(() => {
          this.toggleTopicVoiceInput();
        });
      }
    },
  },
  created() {
    this.apiKey = localStorage.getItem("apiKey") || "";
    this.articleTypes = OpenAIService.getArticleTypes();

    if (!this.apiKey) {
      this.showApiKeyModal = true;
    } else {
      this.openAIService = new OpenAIService(this.apiKey);
    }

    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        if (this.isRecordingTopic) {
          this.topic = transcript;
        }
      };

      this.recognition.onend = () => {
        this.isRecordingTopic = false;
      };
    }
  },
  methods: {
    handleVoiceModeToggle() {
      if (this.voiceMode && !this.recognition) {
        alert("Speech recognition is not supported in your browser.");
        this.voiceMode = false;
      }
    },
    toggleTopicVoiceInput() {
      if (this.isRecordingTopic) {
        this.recognition.stop();
      } else {
        this.recognition.start();
        this.isRecordingTopic = true;
      }
    },
    saveApiKey(key) {
      this.apiKey = key;
      localStorage.setItem("apiKey", key);
      this.openAIService = new OpenAIService(this.apiKey);
      this.showApiKeyModal = false;
    },
    async startInterview() {
      if (!this.topic.trim()) return;
      this.started = true;
      await this.fetchNextQuestion();
    },
    async fetchNextQuestion() {
      this.isLoading = true;
      this.currentQuestion = "Loading ...";
      try {
        this.currentQuestion = await this.openAIService.fetchNextQuestion(
          this.topic,
          this.conversation,
          this.articleType
        );
        this.$refs.conversationHistory.focus();
      } catch (error) {
        console.error(error);
        alert("Error fetching the next question.");
      } finally {
        this.isLoading = false;
      }
    },
    async getAlternativeQuestion() {
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
        this.currentQuestion = await this.openAIService.fetchNextQuestion(
          this.topic,
          replacementPrompt,
          this.articleType
        );
        this.$refs.conversationHistory.focus();
      } catch (error) {
        console.error(error);
        alert("Error fetching the alternative question.");
      } finally {
        this.isLoading = false;
      }
    },
    async submitAnswer(answer) {
      this.conversation.push({
        question: this.currentQuestion,
        answer: answer,
      });
      await this.fetchNextQuestion();
    },
    async finishInterview() {
      this.finished = true;
      try {
        this.articleMarkdown = "Generating article...";
        this.articleMarkdown = await this.openAIService.generateDocument(
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
      localStorage.removeItem("apiKey");
      this.apiKey = "";
      this.openAIService = null;
      this.showApiKeyModal = true;
    },
    returnToConversation() {
      this.finished = false;
    },
  },
};
</script>
