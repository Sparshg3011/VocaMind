# AI Script Generation Setup

## Quick Setup

1. **Get OpenAI API Key** from [OpenAI Platform](https://platform.openai.com/api-keys)

2. **Add to Environment Variables**
   ```bash
   # Frontend/.env.local
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Restart Server**
   ```bash
   npm run dev
   ```

## Usage

1. Enter agent name (e.g., "Insurance Sales Agent")
2. Click "Generate AI Script" button  
3. Script automatically appears in textarea
4. Customize and save

## Features

- **Single Unique Script**: One AI-generated script per request
- **Direct Population**: No modal, script goes straight to textarea
- **Role-Specific**: Different content for different agent types
- **OpenAI Powered**: Requires API key for high-quality, varied scripts

## Best Practices

- Use specific names: "Real Estate Agent" vs "Sales Agent"
- Include industry context: "Healthcare Support Specialist"
- Generate multiple times for variations
- Always customize the generated content 