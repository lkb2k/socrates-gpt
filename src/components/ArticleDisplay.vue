<template>
  <div class="mb-6">
    <!-- Article summary display -->
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-gunmetal">Generated Article</h2>
      <div class="flex items-center space-x-2">
        <button
          @click="copyMarkdown"
          class="px-2 py-2 bg-khaki text-black rounded flex items-center"
        >
          <font-awesome-icon :icon="['far', 'clipboard']" />
          <span
            v-if="copied"
            class="ml-2 text-gray-800"
            v-bind:class="{ 'animate-pulse': copied }"
          >
            Copied
          </span>
        </button>
      </div>
    </div>
    <div
      class="prose max-w-none border-2 border-gray-300 rounded-lg p-4"
      v-html="renderedMarkdown"
    ></div>

    <!-- Buttons below article -->
    <div class="flex justify-between mt-4">
      <button
        @click="$emit('returnToConversation')"
        class="px-4 py-2 bg-gray-200 text-black rounded hover:bg-gray-300 flex items-center"
      >
        <font-awesome-icon :icon="['far', 'circle-left']" class="mr-2" />
        Return to Conversation
      </button>
      <button
        @click="$emit('startOver')"
        class="px-4 py-2 bg-walnutBrown text-white rounded hover:bg-gunmetal"
      >
        Start Over
      </button>
    </div>
  </div>
</template>

<script>
import { marked } from "marked";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faClipboard } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faClipboard);
export default {
  props: ["articleMarkdown"],
  components: {
    FontAwesomeIcon,
  },
  data() {
    return {
      copied: false,
    };
  },
  computed: {
    renderedMarkdown() {
      return marked(this.articleMarkdown);
    },
  },
  methods: {
    copyMarkdown() {
      navigator.clipboard.writeText(this.articleMarkdown).then(() => {
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 2000);
      });
    },
  },
};
</script>

<style>
.prose img {
  max-width: 100%;
}
</style>
