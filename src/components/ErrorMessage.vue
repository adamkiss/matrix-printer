<script setup>
const {message} = defineProps({
	message: String
});
</script>

<template>
	<div class=" z-50 bg-red-500/80 dark:bg-red-500/80 backdrop-blur-lg  text-white absolute inset-x-2 top-2 p-2" v-if="message">{{ message }}</div>
</template>
