export const addNewTask = async () => {};

export const getAllTasks = async () => {
  const res = await fetch("http://localhost:3000/api");
  return res.json();
};

export const getTaskById = async (id: string) => {};

export const updateTask = async (id: string) => {};

export const deleteTask = async (id: string) => {};
