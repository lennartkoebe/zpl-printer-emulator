<template>
  <div class="relative max-h-full min-h-0 flex flex-col items-center">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <Icon class="text-7xl" name="eos-icons:loading" />
    </div>
    <div v-for="pageNum in numPages" :key="pageNum" class="mb-2">
      <canvas
        :ref="(el) => setCanvasRef(el as HTMLCanvasElement, pageNum)"
        class="rounded-sm max-w-full shadow-md"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  src: string;
  scale?: number;
}>();

const { loadPdf, renderPdfToCanvas, cancelRenderJobs } = usePdfRenderer();

const loading = ref(true);
const numPages = ref(0);
const canvasRefs = ref<Map<number, HTMLCanvasElement>>(new Map());
const jobKey = `viewer-${crypto.randomUUID()}`;
let isRendering = false;

const setCanvasRef = (el: HTMLCanvasElement, pageNum: number) => {
  if (el) {
    canvasRefs.value.set(pageNum, el);
  }
};

const renderPdf = async () => {
  if (isRendering) {
    return;
  }

  try {
    isRendering = true;
    cancelRenderJobs(jobKey);
    loading.value = true;

    // Load PDF (cached if already loaded)
    const { numPages: pages } = await loadPdf(props.src);
    numPages.value = pages;

    // Wait for canvases to be rendered
    await nextTick();

    // Render all pages
    for (let pageNum = 1; pageNum <= pages; pageNum++) {
      const canvas = canvasRefs.value.get(pageNum);
      if (!canvas) continue;

      await renderPdfToCanvas(
        props.src,
        canvas,
        pageNum,
        props.scale || 1.5,
        jobKey
      );
    }

    loading.value = false;
  } catch (error) {
    console.error("Error rendering PDF:", error);
    loading.value = false;
  } finally {
    isRendering = false;
  }
};

watch(
  () => props.src,
  async (newSrc, oldSrc) => {
    if (newSrc && newSrc !== oldSrc) {
      canvasRefs.value.clear();
      numPages.value = 0;
      await nextTick();
      renderPdf();
    }
  }
);

onMounted(() => {
  if (props.src) {
    renderPdf();
  }
});

onBeforeUnmount(() => {
  cancelRenderJobs(jobKey);
});
</script>
