<template>
  <div class="relative h-full w-full flex items-center justify-center">
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center z-10"
    >
      <Icon class="text-4xl" name="eos-icons:loading" />
    </div>
    <div class="relative h-full w-full flex items-center justify-center">
      <!-- Stacked effect with multiple pages -->
      <div
        v-for="pageNum in Math.min(numPages || 1, 3)"
        :key="pageNum"
        class="absolute"
        :class="{ 'opacity-0': loading || numPages === 0 }"
        :style="{
          transform: `translateY(${(pageNum - 1) * 3}px) translateX(${
            (pageNum - 1) * 3
          }px)`,
          zIndex: numPages - pageNum + 1,
        }"
      >
        <canvas
          :ref="(el) => setCanvasRef(el as HTMLCanvasElement, pageNum)"
          class="rounded-sm shadow-md bg-white"
        />
      </div>
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
const jobKey = `thumbnail-${crypto.randomUUID()}`;
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

    // Wait for canvases to be rendered in the DOM
    await nextTick();
    await nextTick(); // Extra tick to ensure DOM is fully ready

    // Render up to 3 pages for thumbnail preview
    const pagesToRender = Math.min(pages, 3);
    for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
      const canvas = canvasRefs.value.get(pageNum);
      if (!canvas) {
        console.warn(`Thumbnail canvas not found for page ${pageNum}`);
        continue;
      }

      await renderPdfToCanvas(
        props.src,
        canvas,
        pageNum,
        props.scale || 0.3,
        jobKey
      );
    }

    loading.value = false;
  } catch (error) {
    console.error("Error rendering PDF thumbnail:", error);
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
