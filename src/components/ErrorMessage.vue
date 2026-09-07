<script setup>
const {message} = defineProps({
	message: String
});
</script>

<template>
	<div class="bg-red-500 text-white absolute inset-x-4 top-4" v-if="message">{{ message }}</div>
</template>
