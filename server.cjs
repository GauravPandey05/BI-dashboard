require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Import Azure SDK
const ModelClient = require("@azure-rest/ai-inference").default;
const { AzureKeyCredential } = require("@azure/core-auth");
const { isUnexpected } = require("@azure-rest/ai-inference");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";
const token = process.env.GITHUB_TOKEN; // Set this in your .env

app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const client = ModelClient(
      endpoint,
      new AzureKeyCredential(token),
    );

    const response = await client.path("/chat/completions").post({
      body: {
        messages,
        temperature: 1,
        top_p: 1,
        model: model
      }
    });

    if (isUnexpected(response)) {
      throw response.body.error;
    }

    res.json(response.body);
  } catch (error) {
    console.error('Azure AI API error:', error);
    res.status(500).json({ error: error.message || error });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));