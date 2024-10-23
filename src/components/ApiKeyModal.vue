<template>
  <div
    class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="bg-almond p-6 rounded-lg shadow-lg w-11/12 md:w-1/2">
      <h2 class="text-2xl font-bold mb-4 text-gunmetal">
        Enter Your OpenAI API Key
      </h2>
      <input
        v-model="apiKeyInput"
        type="password"
        placeholder="API Key"
        class="w-full p-3 border rounded-lg focus:outline-none focus:ring bg-white text-black"
      />
      <div class="flex justify-end mt-4">
        <button
          @click="$emit('save', apiKeyInput)"
          class="px-4 py-2 bg-khaki text-black rounded hover:bg-walnutBrown hover:text-white"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      apiKeyInput: "",
    };
  },
};
</script>
