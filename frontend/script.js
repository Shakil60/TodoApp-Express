const API_URL = "http://localhost:3000/todos";

const todoForm = document.getElementById("todo-form");
const todoTitleInput = document.getElementById("todo-title");
const todoList = document.getElementById("todo-list");
const messageEl = document.getElementById("message");
const JSON_HEADERS = { "Content-Type": "application/json" };

const setMessage = (text, type = "") => {
  messageEl.textContent = text;
  messageEl.className = type;
};

async function request(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue");
  return data;
}

const updateTodo = (id, payload) =>
  request(`${API_URL}/${id}`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });

async function handleAction(action, successMessage, onSuccess, onError) {
  try {
    const result = await action();
    onSuccess?.(result);
    setMessage(successMessage, "success");
  } catch (error) {
    onError?.();
    setMessage(error.message, "error");
  }
}

function createTodoItem(todo) {
  const row = document.createElement("div");
  row.className = "todo-item";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = todo.completed;

  const label = document.createElement("span");
  label.textContent = todo.title;
  label.className = todo.completed ? "done" : "";
  const renderLabel = (updatedTodo) => {
    label.textContent = updatedTodo.title;
    label.className = updatedTodo.completed ? "done" : "";
  };

  checkbox.addEventListener("change", () =>
    handleAction(
      () => updateTodo(todo.id, { completed: checkbox.checked }),
      "Tache mise a jour",
      renderLabel,
      () => {
        checkbox.checked = !checkbox.checked;
      }
    )
  );

  const editBtn = document.createElement("button");
  editBtn.textContent = "Modifier";
  editBtn.addEventListener("click", () => {
    const newTitle = prompt("Nouveau titre :", todo.title);
    if (newTitle === null) return;
    handleAction(
      () => updateTodo(todo.id, { title: newTitle }),
      "Tache modifiee",
      renderLabel
    );
  });

  const deleteBtn = document.createElement("button");
  deleteBtn.textContent = "Supprimer";
  deleteBtn.addEventListener("click", () =>
    handleAction(
      () => request(`${API_URL}/${todo.id}`, { method: "DELETE" }),
      "Tache supprimee",
      () => row.remove()
    )
  );

  row.append(checkbox, label, editBtn, deleteBtn);
  return row;
}

async function fetchTodos() {
  try {
    const todos = await request(API_URL);
    todoList.innerHTML = "";
    todos.forEach((todo) => {
      todoList.appendChild(createTodoItem(todo));
    });
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const title = todoTitleInput.value.trim();
  if (!title) return setMessage("Le titre est obligatoire", "error");

  await handleAction(
    () =>
      request(API_URL, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ title }),
      }),
    "Tache ajoutee",
    (newTodo) => {
      todoList.appendChild(createTodoItem(newTodo));
      todoTitleInput.value = "";
    }
  );
});

fetchTodos();
