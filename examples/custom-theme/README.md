# Custom Theme Creation Guide

This example shows how to create a custom theme for Tujjar from scratch or by extending an existing theme.

## Quick Start

### 1. Import via API

```bash
# Import the theme
curl -X POST http://localhost:8000/api/v1/themes/import/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d @theme.json
```

### 2. Import via UI

1. Go to **Dashboard** → **Themes**
2. Click **Import Theme**
3. Select `theme.json` or `theme.zip`
4. Click **Import**

### 3. Create via API

```bash
curl -X POST http://localhost:8000/api/v1/themes/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "My Custom Theme",
    "slug": "my-custom-theme",
    "config": { ... },
    "category": "general"
  }'
```

## Theme Configuration

### Colors

```json
{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "accent": "#f59e0b",
    "background": "#ffffff",
    "surface": "#f8fafc",
    "text": "#0f172a",
    "textSecondary": "#64748b",
    "border": "#e2e8f0",
    "error": "#ef4444",
    "success": "#22c55e",
    "warning": "#f59e0b"
  }
}
```

### Typography

```json
{
  "typography": {
    "headingFont": "Inter",
    "bodyFont": "Inter",
    "baseFontSize": 16,
    "scale": 1.25,
    "lineHeight": 1.6
  }
}
```

### Spacing

```json
{
  "spacing": {
    "sectionPaddingY": 80,
    "sectionPaddingX": 24,
    "containerMaxWidth": 1200,
    "gridGap": 24
  }
}
```

### Border Radius

```json
{
  "borderRadius": {
    "small": 4,
    "medium": 8,
    "large": 16,
    "full": 9999
  }
}
```

### Animations

```json
{
  "animations": {
    "enabled": true,
    "duration": "normal",
    "easing": "ease-in-out"
  }
}
```

### Dark Mode

```json
{
  "darkMode": {
    "enabled": true,
    "default": false,
    "toggle": true
  }
}
```

## Creating Presets

Presets are partial config overrides that can be applied on top of a base theme.

```json
{
  "presets": [
    {
      "name": "Dark",
      "config": {
        "colors": {
          "background": "#0f172a",
          "surface": "#1e293b",
          "text": "#f8fafc",
          "textSecondary": "#94a3b8",
          "border": "#334155"
        }
      }
    },
    {
      "name": "Ocean",
      "config": {
        "colors": {
          "primary": "#0ea5e9",
          "secondary": "#06b6d4",
          "accent": "#8b5cf6"
        }
      }
    }
  ]
}
```

## Theme Inheritance

You can extend an existing theme using `parent_theme`:

```json
{
  "name": "My Minimal Variant",
  "slug": "my-minimal",
  "parent_theme": "minimal",
  "config": {
    "colors": {
      "primary": "#3b82f6"
    }
  }
}
```

Only the fields you specify will override the parent theme. All other values are inherited.

## Applying to a Store

```bash
curl -X POST http://localhost:8000/api/v1/stores/{store_id}/set-theme/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"theme_id": "THEME_UUID"}'
```

## Per-Page Overrides

You can apply theme overrides to individual pages via the Theme Picker in the page builder. This allows different color schemes for different pages while maintaining the base theme.

## Files

- `theme.json` - Complete theme definition
- `presets.json` - Theme presets (Dark, Light, Ocean)
- `homepage.json` - Homepage section layout
- `import.sh` - Shell script to import via API

## Tips

1. **Start from an existing theme** - Use the marketplace to install a system theme, then customize it
2. **Use color tools** - [Coolors](https://coolors.co), [Color Hunt](https://colorhunt.co) for palette inspiration
3. **Test both modes** - Ensure your theme looks good in both light and dark modes
4. **Check accessibility** - Use sufficient color contrast for text readability
5. **Preview before applying** - Use the theme preview feature before applying to your store
