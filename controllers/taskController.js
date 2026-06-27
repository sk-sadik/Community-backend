const Task = require("../models/Task");

const createTask = async (
  req,
  res
) => {
  try {
    const task =
      await Task.create({
        title: req.body.title,
        description:
          req.body.description,
        user: req.user._id
      });

    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

const getTasks = async (
  req,
  res
) => {
  const tasks =
    await Task.find({
      user: req.user._id
    });

  res.json(tasks);
};

const getTaskById = async (
  req,
  res
) => {
  const task =
    await Task.findById(
      req.params.id
    );

  if (!task) {
    return res.status(404).json({
      message: "Task Not Found"
    });
  }

  res.json(task);
};

const updateTask = async (
  req,
  res
) => {
  const task =
    await Task.findById(
      req.params.id
    );

  if (!task) {
    return res.status(404).json({
      message: "Task Not Found"
    });
  }

  if (
    task.user.toString() !==
    req.user._id.toString()
  ) {
    return res.status(401).json({
      message: "Not Authorized"
    });
  }

  task.title =
    req.body.title || task.title;

  task.description =
    req.body.description ||
    task.description;

  task.completed =
    req.body.completed ??
    task.completed;

  const updatedTask =
    await task.save();

  res.json(updatedTask);
};

const deleteTask = async (
  req,
  res
) => {
  const task =
    await Task.findById(
      req.params.id
    );

  if (!task) {
    return res.status(404).json({
      message: "Task Not Found"
    });
  }

  await task.deleteOne();

  res.json({
    message: "Task Deleted"
  });
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask
};