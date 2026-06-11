"use client";

import { useState } from "react";
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle, Badge } from "@/shared/ui";
import { useAIProviders, useCreateAIProvider, useDeleteAIProvider } from "@/api/queries";
import { Plus, Trash2, Check, Settings } from "lucide-react";

const providerOptions = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic (Claude)" },
  { value: "gemini", label: "Google Gemini" },
  { value: "ollama", label: "Ollama (Local)" },
  { value: "groq", label: "Groq" },
  { value: "openrouter", label: "OpenRouter" },
];

const modelOptions: Record<string, string[]> = {
  openai: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
  anthropic: ["claude-sonnet-4-20250514", "claude-3-5-haiku-20241022", "claude-3-opus-20240229"],
  gemini: ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash"],
  ollama: ["llama3.1", "mistral", "codellama", "phi3"],
  groq: ["llama-3.1-70b-versatile", "mixtral-8x7b-32768", "gemma2-9b-it"],
  openrouter: ["anthropic/claude-3.5-sonnet", "openai/gpt-4o", "meta-llama/llama-3.1-70b-instruct"],
};

export function AIProviderConfig() {
  const { data: providers, isLoading } = useAIProviders();
  const createProvider = useCreateAIProvider();
  const deleteProvider = useDeleteAIProvider();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("gpt-4o-mini");
  const [apiKey, setApiKey] = useState("");
  const [apiBase, setApiBase] = useState("");

  const handleAdd = async () => {
    if (!name) return;
    await createProvider.mutateAsync({
      name,
      provider: provider as any,
      model_name: model,
      api_key: apiKey,
      api_base_url: apiBase,
      is_default: !providers?.length,
    } as any);
    setShowAdd(false);
    setName("");
    setApiKey("");
    setApiBase("");
  };

  if (isLoading) return <div className="h-48 animate-pulse rounded-xl bg-gray-200" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">AI Providers</h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Provider
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="My OpenAI" />
              <Select label="Provider" options={providerOptions} value={provider} onChange={(e) => { setProvider(e.target.value); setModel(modelOptions[e.target.value]?.[0] || ""); }} />
            </div>
            <Select label="Model" options={(modelOptions[provider] || []).map((m) => ({ value: m, label: m }))} value={model} onChange={(e) => setModel(e.target.value)} />
            {provider !== "ollama" && (
              <Input label="API Key" type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." />
            )}
            {provider === "ollama" && (
              <Input label="API Base URL" value={apiBase} onChange={(e) => setApiBase(e.target.value)} placeholder="http://localhost:11434" />
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAdd} isLoading={createProvider.isPending}>Add</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {providers?.map((p) => (
        <Card key={p.id}>
          <CardContent className="flex items-center gap-4 p-4">
            <Settings className="h-8 w-8 text-gray-400" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">{p.name}</span>
                {p.is_default && <Badge variant="success">Default</Badge>}
                <Badge variant={p.is_active ? "success" : "secondary"}>{p.is_active ? "Active" : "Inactive"}</Badge>
              </div>
              <p className="text-sm text-gray-500">{p.provider} / {p.model_name}</p>
            </div>
            <button onClick={() => deleteProvider.mutateAsync(p.id)} className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 className="h-4 w-4" />
            </button>
          </CardContent>
        </Card>
      ))}

      {!providers?.length && !showAdd && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Settings className="mb-3 h-10 w-10 text-gray-300" />
            <p className="text-sm text-gray-500 mb-3">No AI providers configured.</p>
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Your First Provider
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
