import Log from "../../models/log.js";

export const createLog = async ({
  action,
  performedBy,
  type,
  flagId = null,
  wordId = null,
  audioFileId = null,
}) => {
  try {
    const logEntry = await Log.create({
      action,
      performedBy,
      flagId,
      wordId,
      audioFileId,
      type,
    });

    return logEntry;
  } catch (error) {
    console.error("Failed to write log:", error);
  }
};

export const get_logs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const actionFilter = req.query.action || "";
    const typeFilter = req.query.type || "";
    const sortOrder = req.query.order === "asc" ? 1 : -1;

    const filter = {};

    if (actionFilter) filter.action = actionFilter;
    if (typeFilter) filter.type = typeFilter;
    const totalLogs = await Log.countDocuments(filter);
    const logs = await Log.find(filter)
      .sort({ createdAt: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.render("logs", {
      title: "Logs",
      logs,
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      actionFilter,
      typeFilter,
      order: req.query.order || "desc",
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const get_log_details = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id) .populate('performedBy', 'username').lean();

    if (!log) {
      return res.status(404).render("log_details", {
        title: "Log Not Found",
        error: "Log entry not found.",
        log: null,
      });
    }

    res.render("log_details", {
      title: "Log Details",
      log,
      error: "",
    });
  } catch (error) {
    console.error("Error fetching log details:", error);
    res.status(500).render("log_details", {
      title: "Internal Server Error",
      error: "An error occurred while fetching log details.",
      log: null,
    });
  }
};
