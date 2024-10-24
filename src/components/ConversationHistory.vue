<template>
  <div class="relative flex flex-col h-full justify-between">
    <!-- Display Conversation -->
    <div>
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

    <!-- Current Question and Control Panel -->
    <div>
      <textarea
        ref="answerInput"
        v-model="answerInput"
        @keydown.enter.exact="handleKeyDown"
        @keydown.shift.enter.stop
        placeholder="Type your answer here..."
        class="w-full mb-2 p-4 border rounded-lg focus:outline-none focus:ring text-black"
        rows="3"
      ></textarea>
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
import { library } from "@fortawesome/fontawesome-svg-core";
import { faCircleXmark } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faCircleXmark);

export default {
  props: ["conversation", "currentQuestion", "isLoading"],
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      answerInput: "",
    };
  },
  methods: {
    submit() {
      if (!this.answerInput.trim()) return;
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
  },
};
</script>
