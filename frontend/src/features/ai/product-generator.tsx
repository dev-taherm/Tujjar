"use client";

import { useState } from "react";
import { Button, Input, Select, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { useGenerateAIProductContent } from "@/api/queries";
import { Sparkles, Copy, Check } from "lucide-react";

export function ProductGenerator() {
  const [title, setTitle] = useState("");
  const [productType, setProductType] = useState("physical");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [tone, setTone] = useState("professional");
  const [result, setResult] = useState<{ description: string; seo_title: string; seo_description: string; bullet_points: string[] } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const generate = useGenerateAIProductContent();

  const handleGenerate = async () => {
    if (!title) return;
    const res = await generate.mutateAsync({
      title,
      product_type: productType,
      price: price ? parseFloat(price) : undefined,
      category,
      tone,
    });
    setResult(res);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Product Content Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Product Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Wireless Bluetooth Headphones" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Product Type" options={[{ value: "physical", label: "Physical" }, { value: "digital", label: "Digital" }, { value: "service", label: "Service" }]} value={productType} onChange={(e) => setProductType(e.target.value)} />
              <Input label="Price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="29.99" />
            </div>
            <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g., Electronics" />
            <Select label="Tone" options={[{ value: "professional", label: "Professional" }, { value: "casual", label: "Casual" }, { value: "luxury", label: "Luxury" }, { value: "playful", label: "Playful" }]} value={tone} onChange={(e) => setTone(e.target.value)} />
            <Button onClick={handleGenerate} isLoading={generate.isPending} className="w-full">
              <Sparkles className="me-2 h-4 w-4" /> Generate Content
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {result && (
            <>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Product Description</CardTitle>
                  <button onClick={() => copyToClipboard(result.description, "desc")} className="rounded p-1 hover:bg-gray-100">
                    {copied === "desc" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{result.description}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>SEO Content</CardTitle>
                  <button onClick={() => copyToClipboard(`Title: ${result.seo_title}\nDescription: ${result.seo_description}`, "seo")} className="rounded p-1 hover:bg-gray-100">
                    {copied === "seo" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                  </button>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">SEO Title ({result.seo_title.length}/60)</p>
                    <p className="text-sm font-medium text-gray-900">{result.seo_title}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">Meta Description ({result.seo_description.length}/160)</p>
                    <p className="text-sm text-gray-700">{result.seo_description}</p>
                  </div>
                </CardContent>
              </Card>

              {result.bullet_points?.length > 0 && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Key Features</CardTitle>
                    <button onClick={() => copyToClipboard(result.bullet_points.join("\n"), "bullets")} className="rounded p-1 hover:bg-gray-100">
                      {copied === "bullets" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                    </button>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.bullet_points.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {!result && !generate.isPending && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Sparkles className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-sm text-gray-500">Enter product details and click Generate to create AI-powered content.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
