<template>
  <!--
      This example requires updating your template:
  
      ```
      <html class="h-full bg-gray-50">
      <body class="h-full">
      ```
    -->
  <div class="h-full">
    <!-- Static sidebar for desktop -->
    <div class="flex flex-col inset-y-0 w-72 z-50 fixed">
      <!-- Sidebar component, swap this element with another sidebar if you like -->
      <div
        class="bg-white border-r flex flex-col border-gray-200 px-6 gap-y-5 grow overflow-y-auto"
      >
        <div class="flex items-center mt-5">
          <img src="/logo.svg" class="inline-block h-10 mr-3" />
          <div class="text-2xl flex flex-col shrink-0">
            <p class="font-bold flex items-center gap-2">ZPL Emulator</p>
            <p class="text-xs text-gray-500 text-left">with labelary.com</p>
          </div>
        </div>
        <nav class="flex flex-col flex-1">
          <ul role="list" class="flex flex-col flex-1 gap-y-7">
            <li>
              <ul role="list" class="space-y-5 -mx-2 mt-2">
                <li class="mmb-5">
                  <label
                    for="width"
                    class="font-medium text-sm/6 text-gray-900 block"
                  >
                    Width
                  </label>
                  <div class="rounded-md shadow-sm mt-2 relative">
                    <input
                      v-model.number="settings.width"
                      type="number"
                      name="width"
                      id="width"
                      class="rounded-md border-0 shadow-sm ring-inset w-full py-1.5 ring-1 ring-gray-300 text-gray-900 block placeholder:text-gray-400 sm:text-sm/6 focus:ring-inset focus:ring-2 focus:ring-gray-600"
                      placeholder="25"
                    />
                    <div
                      class="flex pr-3 inset-y-0 right-6 pointer-events-none absolute items-center"
                    >
                      <span
                        class="text-gray-500 sm:text-sm"
                        id="price-currency"
                      >
                        mm
                      </span>
                    </div>
                  </div>
                </li>
                <li class="mmb-5">
                  <label
                    for="height"
                    class="font-medium text-sm/6 text-gray-900 block"
                  >
                    Height
                  </label>
                  <div class="rounded-md shadow-sm mt-2 relative">
                    <input
                      v-model.number="settings.height"
                      type="number"
                      name="height"
                      id="height"
                      class="rounded-md border-0 shadow-sm ring-inset w-full py-1.5 ring-1 ring-gray-300 text-gray-900 block placeholder:text-gray-400 sm:text-sm/6 focus:ring-inset focus:ring-2 focus:ring-gray-600"
                      placeholder="25"
                    />
                    <div
                      class="flex pr-3 inset-y-0 right-6 pointer-events-none absolute items-center"
                    >
                      <span
                        class="text-gray-500 sm:text-sm"
                        id="price-currency"
                      >
                        mm
                      </span>
                    </div>
                  </div>
                </li>
                <li class="mmb-5">
                  <label
                    for="dpmm"
                    class="font-medium text-sm/6 text-gray-900 block"
                    >DPI</label
                  >
                  <select
                    v-model.number="settings.dpmm"
                    id="dpmm"
                    name="dpmm"
                    class="rounded-md border-0 ring-inset mt-2 w-full py-1.5 pr-10 pl-3 ring-1 ring-gray-300 text-gray-900 block sm:text-sm/6 focus:ring-2 focus:ring-gray-600"
                  >
                    <option :value="8">203 dpi</option>
                    <option :value="12">300 dpi</option>
                  </select>
                </li>
              </ul>
            </li>
            <!-- <li class="mt-auto -mx-6">
              <a
                href="#"
                class="flex font-semibold py-3 px-6 text-sm/6 text-gray-900 gap-x-4 items-center hover:bg-gray-50"
              >
                <Icon class="rounded-full size-6" name="mdi:cog" />

                <span aria-hidden="true">Settings</span>
              </a>
            </li> -->
          </ul>
        </nav>
      </div>
    </div>

    <main
      class="flex flex-col bg-gray-100 h-[100vh] max-h-[100vh] pl-72 overflow-hidden"
    >
      <div class="flex h-full flex-1 min-h-0 p-6 items-center justify-center">
        <div
          v-if="labelStore.current"
          class="flex flex-col h-full flex-1 text-center items-center justify-center overflow-hidden"
        >
          <div class="relative max-h-full min-h-0">
            <div
              v-if="labelStore.current.loading"
              class="absolute inset-0 flex items-center justify-center"
            >
              <Icon class="text-7xl" name="eos-icons:loading" />
            </div>
            <img
              :src="labelStore.current.file"
              class="rounded-sm min-h max-w-full max-h-full object-contain shadow-md min-h-0 min-w-0"
            />
          </div>
          <!-- <div class="h-full max-h-full bg-green-300">test</div> -->
          <div class="mt-1 text-gray-600">
            {{ labelStore.current.date.toLocaleString() }}
          </div>
        </div>
        <div
          v-else
          class="rounded-lg bg-white/30 text-center p-12 text-gray-600"
        >
          <p class="font-bold text-xl">No Print yet!</p>
          <p>
            To add the printer go to your settings. Add TCP/IP Printer with
            host:
            <b>localhost</b> and port: <b>9100</b>
          </p>
        </div>
      </div>
      <div
        class="bg-gray-200 max-h-36 gap-2 block overflow-y-hidden overflow-x-scroll"
      >
        <div class="max-h-full px-2 overflow-scroll whitespace-nowrap">
          <div
            v-for="file in labelStore.images"
            :key="file.date.toISOString()"
            class="cursor-pointer rounded hover:bg-gray-700/10 my-2 py-2 bg-green-00 h-32 px-2 mx-1 text-center w-full max-w-36 inline-block overflow-hidden"
            :class="{
              'bg-gray-700/5': labelStore.current?.key === file.key,
            }"
            @click="labelStore.current = file"
          >
            <div
              class="flex flex-col h-full flex-1 text-center items-center justify-center overflow-hidden"
            >
              <div
                class="relative grow flex items-center justify-center max-h-full min-h-0"
              >
                <div
                  v-if="file.loading"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <Icon class="text-4xl" name="eos-icons:loading" />
                </div>
                <img
                  :src="file.file"
                  class="rounded-sm max-w-full max-h-full object-contain shadow-md min-h-0 min-w-0"
                />
              </div>
              <!-- <div class="h-full max-h-full bg-green-300">test</div> -->
              <div
                class="mt-1 text-xs text-gray-600"
                :class="{
                  'font-bold underline text-gray-800':
                    file === labelStore.current,
                }"
              >
                {{ file.date.toLocaleString() }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const labelStore = useLabelStore();

const { settings } = storeToRefs(useSettingsStore());
</script>
