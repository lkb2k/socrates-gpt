<template>
  <div class="min-h-screen bg-almond">
    <!-- Top buttons container with improved mobile layout -->
    <div
      class="absolute top-0 right-0 flex items-center gap-2 m-2 sm:gap-4 sm:m-4"
    >
      <div v-if="!started">
        <a
          @click.prevent="clearApiKey"
          href="#"
          class="flex items-center text-sm sm:text-base text-yellow-600 hover:text-yellow-700"
        >
          <font-awesome-icon
            :icon="['far', 'trash-alt']"
            class="mr-1 sm:mr-2"
          />
          API Key
        </a>
      </div>
      <div v-if="started">
        <a
          @click.prevent="startOver"
          href="#"
          class="flex items-center text-sm sm:text-base text-yellow-600 hover:text-yellow-700"
        >
          Start Over
        </a>
      </div>
    </div>

    <div class="container mx-auto p-2 sm:p-4 h-screen flex flex-col">
      <h1
        class="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4 text-center text-gunmetal"
      >
        The Socratic LLM
      </h1>

      <div class="flex-grow">
        <!-- API Key Modal -->
        <ApiKeyModal v-if="showApiKeyModal" @save="saveApiKey" />

        <!-- Topic Input Section -->
        <div v-if="!started" class="mb-4 space-y-4">
          <!-- Textarea Container -->
          <div class="relative">
            <textarea
              v-model="topic"
              @keydown.enter.exact="startInterview"
              @keydown.shift.enter.stop
              placeholder="Topic you'd like to discuss..."
              class="w-full p-3 sm:p-4 border rounded-lg focus:outline-none focus:ring bg-white text-black text-sm"
              rows="4"
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

          <!-- Controls Section -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-4">
            <!-- Voice Mode and Article Type Group -->
            <!-- Voice Mode and Article Type Group -->
            <div
              class="flex justify-between sm:justify-start items-center flex-grow gap-4"
            >
              <!-- Voice Mode Toggle -->
              <div class="flex items-center">
                <label
                  for="voice-mode-toggle"
                  class="inline-flex items-center cursor-pointer"
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
                    class="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"
                  ></div>
                  <span class="ml-3 text-sm font-medium text-gunmetal"
                    >Voice Mode</span
                  >
                </label>
              </div>

              <!-- Article Type Selector -->
              <div class="flex items-center gap-2">
                <label
                  for="articleType"
                  class="text-sm font-medium text-gunmetal"
                >
                  What are you writing?
                </label>
                <select
                  id="article-type"
                  v-model="articleType"
                  class="h-9 border rounded text-sm px-2 py-1"
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

            <!-- Start Interview Button -->
            <button
              @click="startInterview"
              class="w-full sm:w-auto h-14 px-8 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white text-sm font-medium transition-colors duration-200 whitespace-nowrap"
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
import { faCircleLeft, faTrashAlt } from "@fortawesome/free-regular-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faTrashAlt, faCircleLeft, faMicrophone);

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
  mounted() {
    this.checkUrlForApiKey();
    this.apiKey = this.localStorage.getApiKey();

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
    checkUrlForApiKey() {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith("sk-")) {
        this.localStorage.setApiKey(hash);
      }
      // Remove the API key from the URL
      history.replaceState(null, "", window.location.pathname);
    },

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
