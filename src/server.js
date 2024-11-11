const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const OpenAI = require('openai'); // Updated import
const z = require("zod");
const zodResponseFormat = require("openai/helpers/zod");

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is running!' });
});

//Simple query of the assistant
app.post('/api/query', async (req, res) => {
  try {
  // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant helping users navigate a mobile app." 
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });
  } catch {

  }
});

// Process form data
app.post('/api/process-prompt', async (req, res) => {
// ... existing code ...

  const InputMap = z.discriminatedUnion("type", [
    z.object({
      type: z.literal("object"),
      parameters: z.array(z.lazy(() => InputMap))
    }),
    z.object({
      type: z.literal("integer"),
      name: z.string()
    }),
    z.object({
      type: z.literal("boolean"),
      name: z.string()
    }),
    z.object({
      type: z.literal("string"),
      name: z.string()
    }),
    z.object({
      type: z.literal("dictionary"),
      keyType: z.string(),
      valueType: z.lazy(() => InputMap),
      name: z.string()
    }),
    z.object({
      type: z.literal("array"),
      name: z.string(),
      elementType: z.lazy(() => InputMap)
    })
  ]);

// ... existing code ...
  const ExecutionStep = z.object({
      name: z.string(),
      providedInput: z.array(InputMap)
  });

  const FlowExecution = z.object({
      description: z.string(),
      executionSteps: z.array(ExecutionStep)
  });

 
  try {
    const { prompt } = req.body;ß
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-2024-08-06",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant helping users navigate a mobile app." 
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: zodResponseFormat.zodResponseFormat(FlowExecution, "flowExecution")
    });

    const flowExecution = JSON.parse(completion.choices[0].message.content);

    console.log(flowExecution);

    res.json({ 
      success: true,
      processedData: flowExecution
    });

  } catch (error) {
    console.error('Error processing intent:', error);
    res.status(500).json({ 
      error: 'Failed to process form',
      message: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something broke!',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});