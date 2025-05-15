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
    throw error;
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

    res.json({
      currentPage: page,
      totalPages: Math.ceil(totalLogs / limit),
      logs,
    });
  } catch (error) {
    console.error("Error fetching logs:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const get_log_details = async (req, res) => {
  try {
    const log = await Log.findById(req.params.id)
      .populate("performedBy", "username")
      .lean();

    if (!log) {
      return res.status(404).json({ error: "Log entry not found." });
    }

    res.json({ log });
  } catch (error) {
    console.error("Error fetching log details:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
