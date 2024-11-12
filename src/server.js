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
    parameters: z.array(z.lazy(() => InputMap)),
    value: z.record(z.any()).optional()
  }),
  z.object({
    type: z.literal("integer"),
    name: z.string(),
    value: z.number().optional()
  }),
  z.object({
    type: z.literal("boolean"),
    name: z.string(),
    value: z.boolean().optional()
  }),
  z.object({
    type: z.literal("string"),
    name: z.string(),
    value: z.string().optional()
  }),
  z.object({
    type: z.literal("dictionary"),
    name: z.string(),
    value: z.record(z.any()).optional()
  }),
  z.object({
    type: z.literal("array"),
    name: z.string(),
    elementType: z.lazy(() => InputMap),
    value: z.array(z.any()).optional()
  })
]);

const ExecutionStep = z.object({
    name: z.string().describe("The name of the execution step"),
    providedInput: z.array(InputMap).describe("Array of input parameters")
});

const FlowExecution = z.object({
    description: z.string().describe("Description of the flow execution"),
    executionSteps: z.array(ExecutionStep).describe("Array of execution steps")
});

// ... existing code ...

  try {
    const { prompt } = req.body;
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

    console.log(completion.choices[0].message);
    const flowExecution = JSON.parse(completion.choices[0].message.content);

    console.log(flowExecution);

    res.json({ 
      success: true,
      flowExecution: flowExecution
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