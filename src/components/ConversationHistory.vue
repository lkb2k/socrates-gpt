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

<script lang="ts">
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import { VoiceService, SpeechRecognitionError } from "@/services/VoiceService";
import { defineComponent, ref } from "vue";

library.add(faCircleXmark, faMicrophone);

export default defineComponent({
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
      voiceService: new VoiceService(),
      isRecording: false,
    };
  },
  setup() {
    const answerInputRef = ref<HTMLTextAreaElement>();
    return {
      answerInputRef,
    };
  },
  computed: {
    getPlaceholder(): string {
      if (this.voiceMode && !this.isLoading) {
        return this.isRecording
          ? "Listening... (will auto-submit after 2.5s pause)"
          : "Click microphone or wait for auto-start after question loads...";
      }
      return "Type your answer here...";
    },
  },
  watch: {
    isLoading(newVal, oldVal) {
      // When loading finishes (transitions from true to false)
      if (oldVal && !newVal && this.voiceMode) {
        setTimeout(() => this.startRecording(), 500);
      }
    },
  },
  created() {
    this.voiceService.setOnResult((transcript: string) => {
      this.answerInput = transcript;
    });

    this.voiceService.setOnEnd(() => {
      if (this.isRecording && this.voiceMode && !this.isLoading) {
        this.voiceService.start();
      } else {
        this.isRecording = false;
      }
    });

    this.voiceService.setOnError((event: SpeechRecognitionError) => {
      if (event.error === "no-speech" && this.answerInput.trim()) {
        this.submit();
      }
    });

    this.voiceService.setOnInactivity(() => {
      if (this.answerInput.trim()) {
        this.submit();
      }
    });
  },
  beforeUnmount() {
    this.cleanupVoiceRecording();
  },
  methods: {
    startRecording() {
      if (!this.voiceService.isSupported() || this.isRecording) return;
      this.answerInput = "";
      this.isRecording = true;
      this.voiceService.start();
    },

    cleanupVoiceRecording() {
      this.voiceService.stop();
      this.isRecording = false;
    },

    toggleVoiceInput() {
      if (!this.voiceService.isSupported()) {
        alert("Speech recognition is not supported in your browser.");
        return;
      }

      if (this.isRecording) {
        this.cleanupVoiceRecording();
      } else {
        this.startRecording();
      }
    },
    submit() {
      if (!this.answerInput.trim()) return;
      this.cleanupVoiceRecording();
      this.$emit("submitAnswer", this.answerInput);
      this.answerInput = "";
    },
    handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        this.submit();
      }
    },
    focus() {
      this.answerInputRef?.focus();
    },
  },
});
</script>
