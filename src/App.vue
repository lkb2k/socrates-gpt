<template>
  <div class="min-h-screen bg-almond">
    <div v-if="!started" class="absolute top-0 right-0 m-4">
      <a
        @click.prevent="clearApiKey"
        href="#"
        class="flex items-center text-yellow-600 hover:text-yellow-700"
      >
        <font-awesome-icon :icon="['far', 'circle-xmark']" class="mr-2" />
        Clear API Key
      </a>
    </div>
    <div v-if="started" class="absolute top-0 right-0 m-4">
      <a
        @click.prevent="startOver"
        href="#"
        class="flex items-center text-yellow-600 hover:text-yellow-700"
      >
        Start Over
      </a>
    </div>
    <div class="container mx-auto p-4 h-screen flex flex-col">
      <h1 class="text-3xl font-bold mb-4 text-center text-gunmetal">
        Stochastic Socrates
      </h1>
      <div class="flex-grow">
        <!-- API Key Modal -->
        <ApiKeyModal v-if="showApiKeyModal" @save="saveApiKey" />

        <!-- Topic Input -->
        <div v-if="!started" class="mb-4">
          <textarea
            v-model="topic"
            @keydown.enter.exact="startInterview"
            @keydown.shift.enter.stop
            placeholder="Topic you'd like to discuss..."
            class="w-full p-4 border rounded-lg focus:outline-none focus:ring bg-white text-black"
            rows="3"
          ></textarea>
          <button
            @click="startInterview"
            class="mt-2 px-4 py-2 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white"
          >
            Start Interview
          </button>
        </div>

        <!-- Conversation -->
        <ConversationHistory
          ref="conversationHistory"
          v-if="started && !finished"
          :conversation="conversation"
          :currentQuestion="currentQuestion"
          :isLoading="isLoading"
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
import ApiKeyModal from "./components/ApiKeyModal.vue";
import ConversationHistory from "./components/ConversationHistory.vue";
import ArticleDisplay from "./components/ArticleDisplay.vue";
import { OpenAIService } from "./services/OpenAIService";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCircleLeft,
  faCircleXmark,
} from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleXmark, faCircleLeft);

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
    };
  },
  created() {
    this.apiKey = localStorage.getItem("apiKey") || "";
    if (!this.apiKey) {
      this.showApiKeyModal = true;
    } else {
      this.openAIService = new OpenAIService(this.apiKey);
    }
  },
  methods: {
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
          this.conversation
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
        const replacementPrompt = `The previous question was not liked. Please suggest an alternative to the following question: "${this.currentQuestion}"`;
        this.currentQuestion = "Loading new question...";
        this.currentQuestion = await this.openAIService.fetchNextQuestion(
          replacementPrompt,
          []
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
          this.conversation
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

<style>
/* Global styles can be added here if needed */
</style>
