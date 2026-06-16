"use client";

import { useState } from "react";
import { Bot, Sparkles, Wand2, Languages, Image, Search, Loader2 } from "lucide-react";
import { useAIGenerateBlogPost, useAIImproveBlogPost } from "@/api/blog";

interface BlogAIAssistantProps {
  postId?: string;
  postTitle?: string;
  postContent?: string;
  onApplyContent: (content: string) => void;
  onApplyMetadata?: (data: { title?: string; excerpt?: string; seo_title?: string; seo_description?: string }) => void;
}

type AITask = "blog_post" | "seo_optimize" | "improve_content" | "translate" | "suggest_image";

const AI_TASKS: Array<{
  key: AITask;
  label: string;
  description: string;
  icon: typeof Bot;
  requiresPost: boolean;
}> = [
  { key: "blog_post", label: "Generate Post", description: "Generate a new blog post from a topic", icon: Sparkles, requiresPost: false },
  { key: "seo_optimize", label: "SEO Optimize", description: "Optimize your post for search engines", icon: Search, requiresPost: true },
  { key: "improve_content", label: "Improve Content", description: "Improve readability and engagement", icon: Wand2, requiresPost: true },
  { key: "translate", label: "Translate", description: "Translate to Arabic", icon: Languages, requiresPost: true },
  { key: "suggest_image", label: "Suggest Image", description: "Get image suggestions for your post", icon: Image, requiresPost: true },
];

export function BlogAIAssistant({
  postId,
  postTitle,
  postContent,
  onApplyContent,
  onApplyMetadata,
}: BlogAIAssistantProps) {
  const [selectedTask, setSelectedTask] = useState<AITask>("blog_post");
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePost = useAIGenerateBlogPost();
  const improvePost = useAIImproveBlogPost();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setResult("");

    try {
      if (selectedTask === "improve_content" && postId) {
        const response = await improvePost.mutateAsync({
          id: postId,
          type: "readability",
        });
        setResult(response.content);
      } else {
        const context: Record<string, unknown> = {};
        if (selectedTask === "seo_optimize" && postContent) {
          context.content = postContent;
          context.title = postTitle;
        } else if (selectedTask === "translate" && postContent) {
          context.content = postContent;
          context.title = postTitle;
          context.locale = "ar";
        } else if (selectedTask === "suggest_image" && postTitle) {
          context.title = postTitle;
          context.content = postContent;
        }

        const response = await generatePost.mutateAsync({
          task_type: selectedTask,
          prompt,
          context,
          tone,
        });

        if (response.is_success) {
          try {
            const parsed = JSON.parse(response.content);
            if (parsed.title || parsed.excerpt) {
              onApplyMetadata?.(parsed);
            }
            if (parsed.content || parsed.improved_content) {
              setResult(parsed.content || parsed.improved_content);
            } else {
              setResult(response.content);
            }
          } catch {
            setResult(response.content);
          }
        } else {
          setResult(response.content || "Generation failed. Please try again.");
        }
      }
    } catch {
      setResult("An error occurred. Please check your AI provider configuration.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApplyContent(result);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-gray-900">AI Assistant</h3>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {AI_TASKS.map((task) => {
            if (task.requiresPost && !postId) return null;
            return (
              <button
                key={task.key}
                onClick={() => { setSelectedTask(task.key); setResult(""); }}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTask === task.key
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <task.icon className="h-3.5 w-3.5" />
                {task.label}
              </button>
            );
          })}
        </div>

        <p className="mb-3 text-xs text-gray-500">
          {AI_TASKS.find((t) => t.key === selectedTask)?.description}
        </p>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={
            selectedTask === "blog_post"
              ? "Enter a topic for your blog post..."
              : selectedTask === "seo_optimize"
              ? "Enter focus keyword..."
              : "Describe what you want..."
          }
          rows={3}
          className="mb-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />

        <div className="mb-3 flex items-center gap-2">
          <label className="text-xs text-gray-500">Tone:</label>
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
            <option value="formal">Formal</option>
            <option value="humorous">Humorous</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate
            </>
          )}
        </button>

        {result && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700">Generated Content</span>
              <button
                onClick={handleApply}
                className="rounded bg-green-50 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-100"
              >
                Apply to Editor
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
              <div dangerouslySetInnerHTML={{ __html: result }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
