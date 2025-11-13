"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useScrollTo } from "@/hooks/use-scroll-to";
import { Sandpack } from "@codesandbox/sandpack-react";
import { dracula as draculaTheme } from "@codesandbox/sandpack-themes";
import { useMemo, useRef } from "react";
import { CheckIcon } from "@heroicons/react/16/solid";
import {
  ArrowLongRightIcon,
  ChevronDownIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import * as Select from "@radix-ui/react-select";
import * as Tooltip from "@radix-ui/react-tooltip";
import {
  createParser,
  ParsedEvent,
  ReconnectInterval,
} from "eventsource-parser";
import { AnimatePresence, motion } from "framer-motion";
import { FormEvent, useEffect, useState } from "react";
import LoadingDots from "../components/loading-dots";

export default function Home() {
  let [status, setStatus] = useState<
    "initial" | "creating" | "created" | "updating" | "updated"
  >("initial");
  let [generatedCode, setGeneratedCode] = useState("");
  let [modelUsedForInitialCode, setModelUsedForInitialCode] = useState("");
  let [frameworkUsedForInitialCode, setFrameworkUsedForInitialCode] = useState("");
  let [ref, scrollTo] = useScrollTo();
  let [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [],
  );

  // Use ref to accumulate code during streaming without triggering re-renders
  const codeAccumulationRef = useRef("");
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  let loading = status === "creating" || status === "updating";

  // Debounced setGeneratedCode to reduce re-renders
  const debouncedSetCode = (code: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setGeneratedCode(code);
    }, 50); // Adjust delay as needed
  };

  async function generateCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status !== "initial") {
      scrollTo({ delay: 0.5 });
    }
    setStatus("creating");
    setGeneratedCode("");
    codeAccumulationRef.current = ""; // Reset

    let formData = new FormData(e.currentTarget);
    let model = formData.get("model");
    let framework = formData.get("framework");
    let prompt = formData.get("prompt");

    if (
      typeof prompt !== "string" ||
      typeof model !== "string" ||
      typeof framework !== "string"
    ) {
      return;
    }

    setFrameworkUsedForInitialCode(framework);
    let newMessages = [{ role: "user", content: prompt }];

    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model,
        framework,
      }),
    });

    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    const data = chatRes.body;
    if (!data) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          codeAccumulationRef.current += text;
          debouncedSetCode(codeAccumulationRef.current);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    // Final update after stream ends
    setGeneratedCode(codeAccumulationRef.current);

    newMessages = [
      ...newMessages,
      { role: "assistant", content: codeAccumulationRef.current },
    ];
    setModelUsedForInitialCode(model);
    setMessages(newMessages);
    setStatus("created");

    // Only scroll after creation is fully done
    setTimeout(() => scrollTo(), 100);
  }

  async function modifyCode(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("updating");
    codeAccumulationRef.current = ""; // Reset
    setGeneratedCode("");

    let formData = new FormData(e.currentTarget);
    let prompt = formData.get("prompt");
    if (typeof prompt !== "string") {
      return;
    }

    let newMessages = [...messages, { role: "user", content: prompt }];

    const chatRes = await fetch("/api/generateCode", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: newMessages,
        model: modelUsedForInitialCode,
        framework: frameworkUsedForInitialCode,
      }),
    });

    if (!chatRes.ok) {
      throw new Error(chatRes.statusText);
    }

    const data = chatRes.body;
    if (!data) {
      return;
    }

    const onParse = (event: ParsedEvent | ReconnectInterval) => {
      if (event.type === "event") {
        const data = event.data;
        try {
          const text = JSON.parse(data).text ?? "";
          codeAccumulationRef.current += text;
          debouncedSetCode(codeAccumulationRef.current);
        } catch (e) {
          console.error(e);
        }
      }
    };

    const reader = data.getReader();
    const decoder = new TextDecoder();
    const parser = createParser(onParse);
    let done = false;

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);
      parser.feed(chunkValue);
    }

    // Final update
    setGeneratedCode(codeAccumulationRef.current);

    newMessages = [
      ...newMessages,
      { role: "assistant", content: codeAccumulationRef.current },
    ];
    setMessages(newMessages);
    setStatus("updated");

    // Scroll after update
    setTimeout(() => scrollTo(), 100);
  }

  const files = useMemo(() => {
    switch (frameworkUsedForInitialCode) {
      case "react":
        return { "App.tsx": generatedCode };
      case "vue":
        return { "src/App.vue": generatedCode };
      case "angular":
        return { "src/app/app.component.ts": generatedCode };
      case "svelte":
        return { "/App.svelte": generatedCode };
      case "nextjs":
        return { "pages/index.js": generatedCode };
      default:
        return { "index.html": generatedCode };
    }
  }, [frameworkUsedForInitialCode, generatedCode]);

  return (
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center py-2">
      <Header />

      <main className="mt-12 flex w-full flex-1 flex-col items-center px-4 text-center sm:mt-20">
        <a
          className="mb-4 inline-flex h-7 shrink-0 items-center gap-[9px] rounded-[50px] border-[0.5px] border-solid border-[#E6E6E6] bg-[rgba(234,238,255,0.65)] bg-gray-100 px-7 py-5 shadow-[0px_1px_1px_0px_rgba(0,0,0,0.25)]"
          href="https://fireworks.ai/"
          target="_blank"
        >
          <span className="text-center">
            Powered by <span className="font-medium">Fireworks AI</span>
          </span>
        </a>

        <h1 className="my-6 max-w-3xl text-4xl font-bold text-gray-800 sm:text-6xl">
          Turn your <span className="text-blue-600">idea</span>
          <br /> into an <span className="text-blue-600">app</span>
        </h1>

        <form className="w-full max-w-xl" onSubmit={generateCode}>
          <fieldset disabled={loading} className="disabled:opacity-75">
            <div className="relative mt-5">
              <div className="absolute -inset-2 rounded-[32px] bg-gray-300/50" />
              <div className="relative flex rounded-3xl bg-white shadow-sm">
                <div className="relative flex flex-grow items-stretch focus-within:z-10">
                  <input
                    required
                    name="prompt"
                    className="w-full rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                    placeholder="Build me a calculator app..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-blue-500 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:text-gray-900"
                >
                  {status === "creating" ? (
                    <LoadingDots color="black" style="large" />
                  ) : (
                    <ArrowLongRightIcon className="-ml-0.5 size-6" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex justify-between">
              <div className="mt-6 flex items-center justify-center gap-3">
                <p className="text-xs text-gray-500">Model:</p>
                <Select.Root
                  name="model"
                  defaultValue="accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new"
                  disabled={loading}
                >
                  <Select.Trigger
                    className="group flex w-full max-w-xs items-center rounded-2xl border-[6px] border-gray-300 bg-white px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <Select.Value />
                    <Select.Icon className="ml-auto">
                      <ChevronDownIcon
                        className="size-6 text-gray-300 group-focus-visible:text-gray-500 group-enabled:group-hover:text-gray-500"
                      />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md bg-white shadow-lg">
                      <Select.Viewport className="p-2">
                        {[
                          {
                            label: "Dobby Unhinged",
                            value: "accounts/sentientfoundation/models/dobby-unhinged-llama-3-3-70b-new",
                          },
                          {
                            label: "Llama 3.1 405B",
                            value: "accounts/fireworks/models/llama-v3p1-405b-instruct",
                          },
                        ].map((model) => (
                          <Select.Item
                            key={model.value}
                            value={model.value}
                            className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                          >
                            <Select.ItemText asChild>
                              <span className="inline-flex items-center gap-2 text-gray-500">
                                <div className="size-2 rounded-full bg-green-500" />
                                {model.label}
                              </span>
                            </Select.ItemText>
                            <Select.ItemIndicator className="ml-auto">
                              <CheckIcon className="size-5 text-blue-600" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                      <Select.Arrow />
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <p className="text-xs text-gray-500">Framework:</p>
                <Select.Root
                  name="framework"
                  defaultValue={"react"}
                  disabled={loading}
                >
                  <Select.Trigger
                    className="group flex w-full max-w-xs items-center rounded-2xl border-[6px] border-gray-300 bg-white px-4 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                  >
                    <Select.Value />
                    <Select.Icon className="ml-auto">
                      <ChevronDownIcon
                        className="size-6 text-gray-300 group-focus-visible:text-gray-500 group-enabled:group-hover:text-gray-500"
                      />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="overflow-hidden rounded-md bg-white shadow-lg">
                      <Select.Viewport className="p-2">
                        {[
                          { label: "React", value: "react" },
                          { label: "Vue", value: "vue" },
                          { label: "None", value: "static" },
                        ].map((framework) => (
                          <Select.Item
                            key={framework.value}
                            value={framework.value}
                            className="flex cursor-pointer items-center rounded-md px-3 py-2 text-sm data-[highlighted]:bg-gray-100 data-[highlighted]:outline-none"
                          >
                            <Select.ItemText asChild>
                              <span className="inline-flex items-center gap-2 text-gray-500">
                                {framework.label}
                              </span>
                            </Select.ItemText>
                            <Select.ItemIndicator className="ml-auto">
                              <CheckIcon className="size-5 text-blue-600" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                      <Select.ScrollDownButton />
                      <Select.Arrow />
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>
          </fieldset>
        </form>

        <hr className="border-1 mb-20 h-px bg-gray-700 dark:bg-gray-700" />

        {status !== "initial" && (
          <motion.div
            initial={{ height: 0 }}
            animate={{
              height: "auto",
              overflow: "hidden",
              transitionEnd: { overflow: "visible" },
            }}
            transition={{ type: "spring", bounce: 0, duration: 0.5 }}
            className="w-full pb-[25vh] pt-10"
            // Removed onAnimationComplete to prevent side effects during render
            ref={ref}
          >
            <div className="mt-5 flex gap-4">
              <form className="w-full" onSubmit={modifyCode}>
                <fieldset disabled={loading} className="group">
                  <div className="relative">
                    <div className="relative flex rounded-3xl bg-white shadow-sm group-disabled:bg-gray-50">
                      <div className="relative flex flex-grow items-stretch focus-within:z-10">
                        <input
                          required
                          name="prompt"
                          className="w-full rounded-l-3xl bg-transparent px-6 py-5 text-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:cursor-not-allowed"
                          placeholder="Make changes to your app here"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className="relative -ml-px inline-flex items-center gap-x-1.5 rounded-r-3xl px-3 py-2 text-sm font-semibold text-blue-500 hover:text-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500 disabled:text-gray-900"
                      >
                        {loading ? (
                          <LoadingDots color="black" style="large" />
                        ) : (
                          <ArrowLongRightIcon className="-ml-0.5 size-6" />
                        )}
                      </button>
                    </div>
                  </div>
                </fieldset>
              </form>

              <div>
                <Tooltip.Provider>
                  <Tooltip.Root delayDuration={0}>
                    <Tooltip.Trigger asChild>
                      <button
                        onClick={() => {
                          location.reload();
                        }}
                        className="inline-flex size-[68px] items-center justify-center rounded-3xl bg-blue-500"
                      >
                        <PlusIcon className="size-10 text-white" />
                      </button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content
                        className="select-none rounded bg-white px-4 py-2.5 text-sm leading-none shadow-md shadow-black/20"
                        sideOffset={5}
                      >
                        Create a new app
                        <Tooltip.Arrow className="fill-white" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </Tooltip.Provider>
              </div>
            </div>

            <div className="relative mt-8 w-full overflow-hidden">
              <div className="isolate">
                <Sandpack
                  key={frameworkUsedForInitialCode + generatedCode.substring(0, 50)} // Prevent remount loop
                  theme={draculaTheme}
                  options={{
                    externalResources: [
                      "https://unpkg.com/@tailwindcss/ui/dist/tailwind-ui.min.css",
                    ],
                    editorHeight: "80vh",
                    showTabs: false,
                  }}
                  files={files}
                  template={
                    frameworkUsedForInitialCode === "react"
                      ? "react-ts"
                      : frameworkUsedForInitialCode === "nextjs"
                      ? "nextjs"
                      : frameworkUsedForInitialCode === "vue"
                      ? "vue"
                      : frameworkUsedForInitialCode === "svelte"
                      ? "svelte"
                      : "vanilla"
                  }
                />
              </div>

              <AnimatePresence>
                {loading && (
                  <motion.div
                    initial={status === "updating" ? { x: "100%" } : undefined}
                    animate={status === "updating" ? { x: "0%" } : undefined}
                    exit={{ x: "100%" }}
                    transition={{
                      type: "spring",
                      bounce: 0,
                      duration: 0.85,
                      delay: 0.5,
                    }}
                    className="absolute inset-x-0 bottom-0 top-1/2 flex items-center justify-center rounded-r border border-gray-400 bg-gradient-to-br from-gray-100 to-gray-300 md:inset-y-0 md:left-1/2 md:right-0"
                  >
                    <p className="animate-pulse text-3xl font-bold">
                      {status === "creating"
                        ? "Building your app..."
                        : "Updating your app..."}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}