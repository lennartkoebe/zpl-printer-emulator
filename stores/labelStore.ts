type Image = {
  key: string;
  file: string;
  loading: boolean;
  date: Date;
  zpl: string;
};

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (_e) => resolve(reader.result as string);
    reader.onerror = (_e) => reject(reader.error);
    reader.onabort = (_e) => reject(new Error("Read aborted"));
    reader.readAsDataURL(blob);
  });
}

function createImage(width: number, height: number): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  ctx!.fillStyle = "#FFF";
  ctx!.fillRect(0, 0, width, height);

  return canvas.toDataURL();
}

export const useLabelStore = defineStore("labelStore", () => {
  const _settingsStore = useSettingsStore();
  const images = ref<Image[]>([]);

  const latest = computed<Image | undefined>(() => images.value[0]);
  const current = ref<Image | undefined>(images.value[0]);

  let eventSource: EventSource | undefined;

  onMounted(() => {
    eventSource = new EventSource("/sse");
    eventSource.addEventListener("print", handlePrintEvent);
  });

  onBeforeUnmount(() => {
    eventSource?.removeEventListener("print", handlePrintEvent);
  });

  async function handlePrintEvent(event: any) {
    const data = JSON.parse(event.data) as {
      timestamp: string;
      zpl: string;
    }[];

    const dpmm = _settingsStore.settings.dpmm;
    const wMM = _settingsStore.settings.width;
    const hMM = _settingsStore.settings.height;
    const hInch = hMM * 0.0393701;
    const wInch = wMM * 0.0393701;

    const elements = data.map((el) => {
      return {
        date: new Date(el.timestamp),
        file: createImage(dpmm * wMM, dpmm * hMM),
        loading: true,
        zpl: el.zpl,
        key: crypto.randomUUID(),
      };
    });

    elements.forEach((el) => images.value.unshift(el));

    current.value = images.value[0];

    for (let element of elements.toReversed()) {
      const res = await fetch(
        `http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${wInch}x${hInch}/0/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "image/png",
          },
          body: element.zpl,
        }
      );

      if (!res.ok) continue;

      const file = await blobToDataURL(await res.blob());

      const imgInArr = images.value.find((el) => el.key === element.key);

      if (!imgInArr) continue;

      imgInArr.file = file;
      imgInArr.loading = false;

      await new Promise((res) => {
        setTimeout(res, 201);
      });
    }

    // images.value.unshift({
    //   date: new Date(data.timestamp),
    //   file: await blobToDataURL(await res.blob()),
    // });
  }

  return { images, latest, current };
});
