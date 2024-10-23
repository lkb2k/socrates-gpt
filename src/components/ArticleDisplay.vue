<template>
  <div>
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-2xl font-bold text-gunmetal">Generated Article</h2>
      <div class="flex items-center space-x-2">
        <button
          @click="copyMarkdown"
          class="px-4 py-2 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white flex items-center"
        >
          Copy Markdown
          <svg
            v-if="copied"
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6 ml-2 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </button>
      </div>
    </div>
    <div class="prose max-w-none" v-html="renderedMarkdown"></div>
    <button
      @click="$emit('startOver')"
      class="mt-4 px-4 py-2 bg-walnutBrown text-white rounded hover:bg-gunmetal"
    >
      Start Over
    </button>
  </div>
</template>

<script>
import { marked } from "marked";

export default {
  props: ["articleMarkdown"],
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
