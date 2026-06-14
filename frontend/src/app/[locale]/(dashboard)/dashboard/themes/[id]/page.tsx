"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useTheme, useUpdateTheme } from "@/api/queries";
import { ThemeColorEditor } from "@/features/themes/theme-color-editor";
import { ThemeTypographyEditor } from "@/features/themes/theme-typography-editor";
import { ThemeSpacingEditor } from "@/features/themes/theme-spacing-editor";
import { Button, Card, CardHeader, CardTitle, CardContent, Skeleton } from "@/shared/ui";
import { Save, Eye } from "lucide-react";

export default function ThemeDetailPage() {
  const params = useParams();
  const { data: theme, isLoading } = useTheme(params.id as string);
  const updateTheme = useUpdateTheme();
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);

  if (isLoading) {
    return (
      <div>
        <h1 className="mb-8 text-3xl font-bold text-gray-900">Theme Editor</h1>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!theme) {
    return <div>Theme not found.</div>;
  }

  const activeConfig = (config as any) || theme.config;

  const handleSave = async () => {
    if (!config) return;
    await updateTheme.mutateAsync({
      id: theme.id,
      config: config as any,
    });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{theme.name}</h1>
          <p className="text-sm text-gray-500">v{theme.version} {theme.is_system ? "• System Theme" : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Eye className="me-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} isLoading={updateTheme.isPending} disabled={!config}>
            <Save className="me-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Colors</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeColorEditor
                colors={activeConfig.colors}
                onChange={(colors) => setConfig({ ...activeConfig, colors })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Typography</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeTypographyEditor
                typography={activeConfig.typography}
                onChange={(typography) => setConfig({ ...activeConfig, typography })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Spacing</CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeSpacingEditor
                spacing={activeConfig.spacing}
                onChange={(spacing) => setConfig({ ...activeConfig, spacing })}
              />
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className="rounded-lg p-6"
                  style={{ backgroundColor: activeConfig.colors.background }}
                >
                  <h3
                    className="mb-2 text-lg font-bold"
                    style={{ color: activeConfig.colors.text, fontFamily: activeConfig.typography.headingFont }}
                  >
                    Sample Heading
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: activeConfig.colors.textSecondary, fontFamily: activeConfig.typography.bodyFont }}
                  >
                    This is a preview of how your theme will look with the current settings.
                  </p>
                  <button
                    className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white"
                    style={{ backgroundColor: activeConfig.colors.primary }}
                  >
                    Primary Button
                  </button>
                </div>
                <div className="flex gap-1">
                  {Object.entries(activeConfig.colors).slice(0, 6).map(([key, color]) => (
                    <div
                      key={key}
                      className="h-8 w-8 rounded-full border border-gray-200"
                      style={{ backgroundColor: color as string }}
                      title={key}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
