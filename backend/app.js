const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const port = 3000;

const todoRouter = require("./router/todo");
const frontendPath = path.join(__dirname, "..", "frontend");

app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.static(frontendPath));

app.use("/todos", todoRouter);

app.use((req, res) => {
  res.status(404).json({ error: "Route introuvable" });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
