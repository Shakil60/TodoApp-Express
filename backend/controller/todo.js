const fs = require("fs/promises");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data.json");
const BAD_REQUEST = 400;
const NOT_FOUND = 404;
const INTERNAL_ERROR = 500;

async function readTodos() {
  const raw = await fs.readFile(dataPath, "utf-8");
  const data = JSON.parse(raw);
  return Array.isArray(data.todos) ? data.todos : [];
}

async function writeTodos(todos) {
  await fs.writeFile(dataPath, JSON.stringify({ todos }, null, 2), "utf-8");
}

const parseId = (id) => {
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
};

function getTrimmedTitle(title) {
  return typeof title === "string" ? title.trim() : "";
}

function isValidCompleted(completed) {
  return completed === undefined || typeof completed === "boolean";
}

function findTodoOr404(res, todos, id) {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    res.status(NOT_FOUND).json({ error: "Tache introuvable" });
    return null;
  }
  return { index, todo: todos[index] };
}

function withErrorHandling(handler, message) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (error) {
      res.status(INTERNAL_ERROR).json({ error: message });
    }
  };
}

const getAllTodos = withErrorHandling(async (_req, res) => {
    const todos = await readTodos();
    res.status(200).json(todos);
}, "Erreur lors de la lecture des taches");

const getTodoById = withErrorHandling(async (req, res) => {
    const id = parseId(req.params.id);
    if (!id) {
      return res.status(BAD_REQUEST).json({ error: "ID invalide" });
    }

    const todos = await readTodos();
    const found = findTodoOr404(res, todos, id);
    if (!found) return;
    res.status(200).json(found.todo);
}, "Erreur lors de la lecture de la tache");

const createTodo = withErrorHandling(async (req, res) => {
  const { title, completed } = req.body;
  const cleanTitle = getTrimmedTitle(title);

  if (!cleanTitle) {
    return res.status(BAD_REQUEST).json({ error: "Le champ title est requis" });
  }

  if (!isValidCompleted(completed)) {
    return res
      .status(BAD_REQUEST)
      .json({ error: "Le champ completed doit etre un booleen" });
  }

  const todos = await readTodos();
  const nextId = todos.reduce((maxId, todo) => Math.max(maxId, todo.id), 0) + 1;
  const newTodo = { id: nextId, title: cleanTitle, completed: completed ?? false };

  todos.push(newTodo);
  await writeTodos(todos);

  res.status(201).json(newTodo);
}, "Erreur lors de la creation de la tache");

const updateTodo = withErrorHandling(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(BAD_REQUEST).json({ error: "ID invalide" });
  }

  const { title, completed } = req.body;
  const hasTitle = title !== undefined;
  const hasCompleted = completed !== undefined;
  const cleanTitle = getTrimmedTitle(title);

  if (hasTitle && !cleanTitle) {
    return res
      .status(BAD_REQUEST)
      .json({ error: "Le champ title doit etre une chaine non vide" });
  }

  if (!isValidCompleted(completed)) {
    return res
      .status(BAD_REQUEST)
      .json({ error: "Le champ completed doit etre un booleen" });
  }

  if (!hasTitle && !hasCompleted) {
    return res.status(BAD_REQUEST).json({ error: "Aucune donnee a modifier" });
  }

  const todos = await readTodos();
  const found = findTodoOr404(res, todos, id);
  if (!found) return;

  const updatedTodo = {
    ...found.todo,
    ...(hasTitle ? { title: cleanTitle } : {}),
    ...(hasCompleted ? { completed } : {}),
  };
  todos[found.index] = updatedTodo;
  await writeTodos(todos);
  res.status(200).json(updatedTodo);
}, "Erreur lors de la modification de la tache");

const deleteTodo = withErrorHandling(async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) {
    return res.status(BAD_REQUEST).json({ error: "ID invalide" });
  }

  const todos = await readTodos();
  const found = findTodoOr404(res, todos, id);
  if (!found) return;

  const [deletedTodo] = todos.splice(found.index, 1);
  await writeTodos(todos);
  res.status(200).json({ message: "Tache supprimee", todo: deletedTodo });
}, "Erreur lors de la suppression de la tache");

module.exports = {
  getAllTodos,
  getTodoById,
  createTodo,
  updateTodo,
  deleteTodo,
};

