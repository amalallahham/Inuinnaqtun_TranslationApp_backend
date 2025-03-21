import Log from '../../models/log.js';

const createLog = async ({
  action,
  performedBy,
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
    });

    return logEntry;
  } catch (error) {
    console.error('Failed to write log:', error);
   
  }
};

export default createLog;
