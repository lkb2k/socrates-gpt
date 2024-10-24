<template>
  <div class="relative flex flex-col h-full">
    <!-- Scrollable Conversation Area -->
    <div class="flex-grow overflow-y-auto mb-4" ref="conversationContainer">
      <div v-for="(qa, index) in conversation" :key="index" class="mb-6">
        <!-- Question -->
        <div class="flex items-start mb-2">
          <div
            class="bg-gunmetal text-white p-4 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-xl"
          >
            {{ qa.question }}
          </div>
        </div>
        <!-- Answer -->
        <div class="flex items-end justify-end">
          <div
            class="bg-khaki text-black p-4 rounded-tl-lg rounded-tr-lg rounded-bl-lg max-w-xl"
          >
            {{ qa.answer }}
          </div>
        </div>
      </div>

      <!-- Current Question -->
      <div v-if="currentQuestion" class="flex items-start mb-2">
        <div
          class="relative bg-gunmetal text-white p-7 rounded-tr-lg rounded-br-lg rounded-bl-lg max-w-xl"
        >
          {{ currentQuestion }}
          <button
            v-if="!isLoading"
            @click="$emit('getAlternativeQuestion')"
            class="absolute bottom-0 -right-0 bg-almond p-1"
            style="border-top-left-radius: 25%; border-bottom-right-radius: 25%"
          >
            <font-awesome-icon
              :icon="['far', 'circle-xmark']"
              class="text-gray-800"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Fixed Input Area -->
    <div class="sticky bottom-0 bg-almond pt-2">
      <div class="relative">
        <textarea
          ref="answerInput"
          v-model="answerInput"
          @keydown.enter.exact="handleKeyDown"
          @keydown.shift.enter.stop
          :placeholder="getPlaceholder"
          class="w-full mb-2 p-4 border rounded-lg focus:outline-none focus:ring text-black"
          rows="3"
        ></textarea>
        <button
          v-if="voiceMode"
          @click="toggleVoiceInput"
          class="absolute bottom-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          :class="{ 'text-red-500': isRecording }"
        >
          <font-awesome-icon :icon="['fas', 'microphone']" />
        </button>
      </div>
      <div class="flex justify-between">
        <button
          @click="submit"
          class="px-4 py-2 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white"
        >
          Submit Answer
        </button>
        <button
          @click="$emit('finishInterview')"
          class="px-4 py-2 bg-gunmetal text-white rounded hover:bg-black"
        >
          I'm done. Write it Up!
        </button>
      </div>
    </div>
  </div>
</template>

<script>
/* global webkitSpeechRecognition */
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleXmark, faMicrophone);

export default {
  props: {
    conversation: {
      type: Array,
      required: true,
    },
    currentQuestion: {
      type: String,
      required: true,
    },
    isLoading: {
      type: Boolean,
      required: true,
    },
    voiceMode: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      answerInput: "",
      recognition: null,
      isRecording: false,
      speechTimeout: null,
      lastResponseTime: null,
    };
  },
  computed: {
    getPlaceholder() {
      if (this.voiceMode && !this.isLoading) {
        return this.isRecording
          ? "Listening... (will auto-submit after 2.5s pause)"
          : "Click microphone or wait for auto-start after question loads...";
      }
      return "Type your answer here...";
    },
  },
  watch: {
    conversation: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          this.scrollToBottom();
        });
      },
    },
    currentQuestion() {
      this.$nextTick(() => {
        this.scrollToBottom();
      });
    },
    isLoading(newVal, oldVal) {
      // When loading finishes (transitions from true to false)
      if (oldVal && !newVal && this.voiceMode) {
        this.lastResponseTime = Date.now();
        // Small delay to allow for the UI to update and sound to play if implemented
        setTimeout(() => this.startRecording(), 500);
      }
    },
  },
  created() {
    // Initialize speech recognition
    if ("webkitSpeechRecognition" in window) {
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;

      this.recognition.onresult = (event) => {
        this.answerInput = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");

        // Reset the timeout on new speech
        if (this.speechTimeout) {
          clearTimeout(this.speechTimeout);
        }

        // Set new timeout for 2.5 seconds of silence
        this.speechTimeout = setTimeout(() => {
          if (this.isRecording && this.answerInput.trim()) {
            this.submit();
          }
        }, 2500);
      };

      this.recognition.onend = () => {
        // Only restart if we're still supposed to be recording
        if (this.isRecording && this.voiceMode && !this.isLoading) {
          this.recognition.start();
        } else {
          this.isRecording = false;
        }
      };

      this.recognition.onerror = (event) => {
        if (event.error === "no-speech") {
          // If no speech detected for a while, check if we should submit
          if (this.answerInput.trim()) {
            this.submit();
          }
        }
      };
    }
  },
  beforeUnmount() {
    this.cleanupVoiceRecording();
  },
  methods: {
    scrollToBottom() {
      const container = this.$refs.conversationContainer;
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    },
    startRecording() {
      if (!this.recognition || this.isRecording) return;

      this.answerInput = "";
      this.isRecording = true;
      this.recognition.start();
    },
    cleanupVoiceRecording() {
      if (this.speechTimeout) {
        clearTimeout(this.speechTimeout);
      }
      if (this.isRecording) {
        this.recognition.stop();
      }
      this.isRecording = false;
    },
    submit() {
      if (!this.answerInput.trim()) return;
      this.cleanupVoiceRecording();
      this.$emit("submitAnswer", this.answerInput);
      this.answerInput = "";
    },
    handleKeyDown(event) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.submit();
      }
    },
    focus() {
      this.$refs.answerInput.focus();
    },
    toggleVoiceInput() {
      if (!this.recognition) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }

      if (this.isRecording) {
        this.cleanupVoiceRecording();
      } else {
        this.startRecording();
      }
    },
  },
};
</script>
